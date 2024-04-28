import axios from "axios";
import log from "../utils/logger";
import { extractTextFromHTMLHelper } from "../utils/html.extracter";
import {
  canvasUrl,
  stringLike,
  numberLike,
  booleanLike,
  AxiosAuthHeaders,
  CanvasCourseInfo,
  CanvasUserAssignmentWithRubricBase,
  CanvasCourseAssignmentRubricObjBaseProperties,
  AssignmentRubricCriteriaMongoDBEntry,
  AssignmentRubricRatingMongoDBEntry,
  CanvasLinkPaginationHeaders,
  CanvasAssignmentSubmissionWorkflowState,
  CanvasCourseAssignmentRubricSubmissionMongoDBEntry,
  CanvasCourseAssignmentRubricCategorySubmissionScore,
  CanvasAssignmentPaginationLinkHeaders,
  SeasonTypeEnumValues
} from "../shared/types";

// Returns a Map (described below) of the Canvas user's available Quiz IDs
async function fetchCanvasUserAssignmentData(
  axiosHeaders: AxiosAuthHeaders,
  courseArr: readonly CanvasCourseInfo[],
  academicSemesterFilter: SeasonTypeEnumValues,
  academicYearFilter: number
): Promise<CanvasUserAssignmentWithRubricBase[]> {
  const assignmentsWithRubricsArr: CanvasUserAssignmentWithRubricBase[] = [];
  // Get every available Assignment of every Canvas course where the user is a TA or Course Instructor
  for (let j = 0; j < courseArr.length; j++) {
    const { courseId, courseName, courseDept, courseNum } = courseArr[j];
    const assignmentRes = await axios.get(`${canvasUrl}/v1/courses/${courseId}/assignments?per_page=100`, {
      headers: axiosHeaders
    });

    assignmentRes.data.forEach((assignmentData: any) => {
      const use_rubric_for_grading: booleanLike = assignmentData.use_rubric_for_grading ?? null;

      if (use_rubric_for_grading !== null) {
        const canvasCourseAssignmentRubricUsedForGrading = use_rubric_for_grading as boolean;
        const assignmentName = assignmentData.name as string;
        const assignmentId = assignmentData.id as number;
        const rubricId = assignmentData.rubric_settings.id as number;
        const rubricTitle = assignmentData.rubric_settings.title as string;

        const rubricCriteriaIdsForAssignment: string[] = [];
        assignmentData.rubric.forEach((rubric: any) => {
          const newRubricId = rubric.id as string;
          rubricCriteriaIdsForAssignment.push(newRubricId);
        });

        assignmentsWithRubricsArr.push({
          canvasDeptAbbrev: courseDept,
          canvasCourseNum: courseNum,
          canvasCourseName: courseName,
          canvasCourseInternalId: courseId,
          canvasCourseAcademicSemesterOffered: academicSemesterFilter,
          canvasCourseAcademicYearOffered: academicYearFilter,
          canvasCourseAssignmentId: assignmentId,
          canvasCourseAssignmentName: assignmentName,
          canvasCourseAssignmentRubricId: rubricId,
          canvasCourseAssignmentRubricTitle: rubricTitle,
          canvasCourseAssignmentRubricUsedForGrading: canvasCourseAssignmentRubricUsedForGrading,
          canvasCourseAssignmentRubricCategoryIds: rubricCriteriaIdsForAssignment,
          canvasCourseAssignmentRubricObjArr: [],
          canvasCourseAssignmentRubricSubmissionArr: []
        });
      }
    });
    log.warn(`Finished Assignment Course Parsing Index ${j}: ---------------------------------`);
  }
  return assignmentsWithRubricsArr;
}

async function fetchCanvasUserAssignmentRubricData(
  axiosHeaders: AxiosAuthHeaders,
  assignmentsWithRubricsArr: CanvasUserAssignmentWithRubricBase[]
) {
  for (const assignmentEntry of assignmentsWithRubricsArr) {
    const {
      canvasCourseInternalId,
      canvasCourseAssignmentId,
      canvasCourseAssignmentName,
      canvasCourseAssignmentRubricId,
      canvasCourseAssignmentRubricTitle,
      canvasCourseAssignmentRubricCategoryIds
    } = assignmentEntry;

    const rubricRes = await axios.get(`${canvasUrl}/v1/courses/${canvasCourseInternalId}/rubrics?per_page=100`, {
      headers: axiosHeaders
    });

    rubricRes.data.forEach((assignmentRubricGroup: any) => {
      const id = assignmentRubricGroup.id as number;
      const descriptionTitle = assignmentRubricGroup.title as string;
      // Only add the current rubric if fit is associated with that respective assignment
      if (canvasCourseAssignmentRubricId === id && canvasCourseAssignmentRubricTitle === descriptionTitle) {
        const maxPoints = assignmentRubricGroup.points_possible as number;
        const rubricCategoryData: AssignmentRubricCriteriaMongoDBEntry[] = [];

        if (assignmentRubricGroup.data && assignmentRubricGroup.data.length > 0) {
          assignmentRubricGroup.data.forEach((rubric: any) => {
            const categoryId = rubric.id as string;

            // Additional Check with ID: Only add the current rubric if it is associated with that respective assignment
            if (canvasCourseAssignmentRubricCategoryIds.includes(categoryId)) {
              const maxCategoryPoints = rubric.points as number;
              const description = `${rubric.description as string}${rubric.long_description ? `: ${extractTextFromHTMLHelper(rubric.long_description as string)}` : ""}`;

              const rubricRatings: AssignmentRubricRatingMongoDBEntry[] = [];
              if (rubric.ratings && rubric.ratings.length > 0) {
                rubric.ratings.forEach((rating: any) => {
                  const ratingPoints = rating.points as number;
                  const description = `${rating.description as string}${rating.long_description ? `: ${extractTextFromHTMLHelper(rating.long_description as string)}` : ""}`;
                  const newRatingEntry: AssignmentRubricRatingMongoDBEntry = {
                    description: description,
                    ratingPoints: ratingPoints
                  };
                  rubricRatings.push(newRatingEntry);
                });
              }

              const newRubricCategoryEntry: AssignmentRubricCriteriaMongoDBEntry = {
                id: categoryId,
                maxCategoryPoints: maxCategoryPoints,
                description: description,
                ratings: rubricRatings
              };
              rubricCategoryData.push(newRubricCategoryEntry);
            }
          });
        }
        const newRubricEntry: CanvasCourseAssignmentRubricObjBaseProperties = {
          canvasAssignmentId: canvasCourseAssignmentId,
          canvasAssignmentName: canvasCourseAssignmentName,
          canvasRubricId: id,
          title: descriptionTitle,
          maxPoints: maxPoints,
          rubricData: rubricCategoryData
        };
        assignmentEntry.canvasCourseAssignmentRubricObjArr.push(newRubricEntry);
      }
    });

    assignmentEntry.canvasCourseAssignmentRubricObjArr = assignmentEntry.canvasCourseAssignmentRubricObjArr.filter(
      (entry) => entry.rubricData.length !== 0
    );
    console.assert(assignmentEntry.canvasCourseAssignmentRubricObjArr.length === 1);
  }
}

async function fetchCanvasUserAssignmentSubmissionData(
  axiosHeaders: AxiosAuthHeaders,
  assignmentsWithRubricsArr: CanvasUserAssignmentWithRubricBase[]
) {
  for (const assignmentEntry of assignmentsWithRubricsArr) {
    const { canvasCourseInternalId, canvasCourseAssignmentId } = assignmentEntry;
    let nextPageUrl = `${canvasUrl}/v1/courses/${canvasCourseInternalId}/assignments/${canvasCourseAssignmentId}/submissions?include[]=rubric_assessment&grouped=true&per_page=100`;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const submissionRes = await axios.get(nextPageUrl, {
          headers: axiosHeaders
        });
        submissionRes.data.forEach((submission: any) => {
          const workflowState = submission.workflow_state as CanvasAssignmentSubmissionWorkflowState;
          const grade: stringLike = submission.grade ?? null;
          const score: numberLike = submission.score ?? null;
          if (grade && score && submission.rubric_assessment && workflowState === "graded") {
            const numericScore = score as number;
            const rubricCategoryScoreArr: CanvasCourseAssignmentRubricCategorySubmissionScore[] = [];
            for (const category in submission.rubric_assessment) {
              const value = submission.rubric_assessment[category];
              const categoryId = category as string;
              const points = (value.points ?? 0) as number; // Could be undefined (safe to assume 0 points for category)
              const newRubricCategoryScore: CanvasCourseAssignmentRubricCategorySubmissionScore = {
                id: categoryId,
                points: points
              };
              rubricCategoryScoreArr.push(newRubricCategoryScore);
            }
            const newRubricSubmissionEntry: CanvasCourseAssignmentRubricSubmissionMongoDBEntry = {
              canvasAssignmentScore: numericScore,
              rubricCategoryScores: rubricCategoryScoreArr
            };
            assignmentEntry.canvasCourseAssignmentRubricSubmissionArr.push(newRubricSubmissionEntry);
          }
        });
        hasNextPage = false;

        // Check if there is a next page
        if (submissionRes.headers["link"]) {
          const links = parseLinkHeaderHelper(submissionRes.headers["link"]);
          if (Object.keys(links).includes("next")) {
            nextPageUrl = links["next"];
          } else {
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        hasNextPage = false; // Stop pagination on error
      }
    }
    if (assignmentEntry.canvasCourseAssignmentRubricSubmissionArr.length === 0) {
      log.error("Warning: No submission data yet for this assignment");
    }
  }
}

// Helper function to parse the Link header and extract relevant URLs
function parseLinkHeaderHelper(header: string) {
  const links: CanvasLinkPaginationHeaders = {
    current: "",
    next: "",
    prev: "",
    first: "",
    last: ""
  };
  const linkHeaders = header.split(",");
  linkHeaders.forEach((link) => {
    const [url, rel] = link.split(";").map((s) => s.trim());
    const relMatch = rel.match(/rel="([^"]+)"/);
    if (relMatch) {
      const relValue = relMatch[1].toLowerCase() as CanvasAssignmentPaginationLinkHeaders;
      links[relValue] = url.slice(1, -1); // Remove "<" and ">" from link header
    }
  });
  return links;
}

export { fetchCanvasUserAssignmentData, fetchCanvasUserAssignmentRubricData, fetchCanvasUserAssignmentSubmissionData };
