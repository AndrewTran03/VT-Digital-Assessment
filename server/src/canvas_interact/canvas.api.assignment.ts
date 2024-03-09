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
  CanvasUserAssignmentWithRubricEntryBase,
  CanvasCourseAssignmentRubricObjBase,
  AssignmentRubricCriteriaBase,
  AssignmentRubricRatingBase,
  CanvasLinkPaginationHeaders,
  CanvasAssignmentSubmissionWorkflowState,
  CanvasCourseAssignmentRubricSubmissionEntry,
  CanvasCourseAssignmentRubricCategorySubmissionScore
} from "../shared/types";
import fs from "fs/promises";

// Returns a Map (described below) of the Canvas user's available Quiz IDs
async function fetchCanvasUserAssignmentData(
  canvasUserId: number,
  axiosHeaders: AxiosAuthHeaders,
  courseArr: readonly CanvasCourseInfo[]
): Promise<CanvasUserAssignmentWithRubricEntryBase[]> {
  const assignmentsWithRubricsArr: CanvasUserAssignmentWithRubricEntryBase[] = [];
  // Get every available Assignment of every Canvas course where the user is a TA or Course Instructor
  for (let j = 0; j < courseArr.length; j++) {
    const { courseId, courseName, courseDept, courseNum } = courseArr[j];
    const assignmentRes = await axios.get(`${canvasUrl}/v1/courses/${courseId}/assignments?per_page=100`, {
      headers: axiosHeaders
    });

    assignmentRes.data.forEach((assignmentData: any) => {
      const use_rubric_for_grading: booleanLike = assignmentData.use_rubric_for_grading ?? null;
      if (use_rubric_for_grading !== null) {
        // log.warn(assignmentData);
        const canvasCourseAssignmentRubricUsedForGrading = use_rubric_for_grading as boolean;
        const assignmentId = assignmentData.id as number;
        // log.warn("USED RUBRIC FOR GRADING");
        // log.error(assignmentId);
        const rubricCriteriaIdsForAssignment: string[] = [];
        assignmentData.rubric.forEach((rubric: any) => {
          const newRubricId = rubric.id as string;
          // const description = rubric.description as string;
          // log.error(`Rubric ${rubricIdsForAssignment.length}: ${newRubricId}`);
          // log.error(`Description: ${description}`);
          rubricCriteriaIdsForAssignment.push(newRubricId);
        });
        const rubricId = assignmentData.rubric_settings.id as number;
        const rubricTitle = assignmentData.rubric_settings.title as string;

        assignmentsWithRubricsArr.push({
          canvasUserId: canvasUserId,
          deptAbbrev: courseDept,
          courseNum: courseNum,
          canvasCourseName: courseName,
          canvasCourseInternalId: courseId,
          canvasCourseAssignmentId: assignmentId,
          canvasCourseAssignmentRubricId: rubricId,
          canvasCourseAssignmentRubricTitle: rubricTitle,
          canvasCourseAssignmentRubricUsedForGrading: canvasCourseAssignmentRubricUsedForGrading,
          canvasCourseAssignmentRubricCategoryIds: rubricCriteriaIdsForAssignment,
          canvasCourseAssignmentRubricObjArr: [],
          canvasCourseAssignmentRubricSubmissionArr: []
        });
      }
    });
    log.warn(`Assignment Index ${j}: ---------------------------------`);
  }
  return assignmentsWithRubricsArr;
}

async function fetchCanvasUserAssignmentRubricData(
  axiosHeaders: AxiosAuthHeaders,
  assignmentsWithRubricsArr: CanvasUserAssignmentWithRubricEntryBase[]
) {
  // log.info("LENGTH" + assignmentsWithRubricsArr.length);
  for (const assignmentEntry of assignmentsWithRubricsArr) {
    const {
      canvasCourseInternalId,
      canvasCourseAssignmentId,
      canvasCourseAssignmentRubricId,
      canvasCourseAssignmentRubricTitle,
      canvasCourseAssignmentRubricCategoryIds
    } = assignmentEntry;

    const rubricRes = await axios.get(`${canvasUrl}/v1/courses/${canvasCourseInternalId}/rubrics?per_page=100`, {
      headers: axiosHeaders
    });

    rubricRes.data.forEach((assignmentRubricGroup: any) => {
      // log.error(assignmentRubricGroup.id as number);
      // log.error(assignmentRubricGroup.title as string);
      // log.error(assignmentRubricGroup.points_possible as number);
      const id = assignmentRubricGroup.id as number;
      const descriptionTitle = assignmentRubricGroup.title as string;
      // Only add the current rubric if fit is associated with that respective assignment
      if (canvasCourseAssignmentRubricId === id && canvasCourseAssignmentRubricTitle === descriptionTitle) {
        const maxPoints = assignmentRubricGroup.points_possible as number;
        const rubricCategoryData: AssignmentRubricCriteriaBase[] = [];
        if (assignmentRubricGroup.data && assignmentRubricGroup.data.length > 0) {
          // log.error("Criteria: -----");
          assignmentRubricGroup.data.forEach((rubric: any) => {
            // log.warn("Entry:");
            // log.error(rubric.id as string);
            // log.error(rubric.points as number);
            // log.error(rubric.description as string);
            // log.error(rubric.long_description ?? ("No Rubric Long Description" as string));
            const categoryId = rubric.id as string;
            // Additional Check with ID: Only add the current rubric if it is associated with that respective assignment
            if (canvasCourseAssignmentRubricCategoryIds.includes(categoryId)) {
              const maxCategoryPoints = rubric.points as number;
              const description = `${rubric.description as string}${rubric.long_description ? `: ${extractTextFromHTMLHelper(rubric.long_description as string)}` : ""}`;
              const rubricRatings: AssignmentRubricRatingBase[] = [];
              if (rubric.ratings && rubric.ratings.length > 0) {
                // log.error("Ratings: -----");
                rubric.ratings.forEach((rating: any) => {
                  // log.warn("Inner Entry:");
                  // log.error(rating.points as number);
                  // log.error(rating.description as string);
                  // log.error(rating.long_description ?? ("No Rating Long Description" as string));
                  const ratingPoints = rating.points as number;
                  const description = `${rating.description as string}${rating.long_description ? `: ${extractTextFromHTMLHelper(rating.long_description as string)}` : ""}`;
                  const newRatingEntry: AssignmentRubricRatingBase = {
                    description: description,
                    ratingPoints: ratingPoints
                  };
                  rubricRatings.push(newRatingEntry);
                });
              }
              const newRubricCategoryEntry: AssignmentRubricCriteriaBase = {
                id: categoryId,
                maxCategoryPoints: maxCategoryPoints,
                description: description,
                ratings: rubricRatings
              };
              rubricCategoryData.push(newRubricCategoryEntry);
            }
          });
        }
        const newRubricEntry: CanvasCourseAssignmentRubricObjBase = {
          id: id,
          title: descriptionTitle,
          maxPoints: maxPoints,
          data: rubricCategoryData
        };
        assignmentEntry.canvasCourseAssignmentRubricObjArr.push(newRubricEntry);
      }
    });
    log.trace(JSON.stringify(assignmentEntry.canvasCourseAssignmentRubricObjArr, null, 2));
    assignmentEntry.canvasCourseAssignmentRubricObjArr = assignmentEntry.canvasCourseAssignmentRubricObjArr.filter(
      (entry) => entry.data.length !== 0
    );
    console.assert(assignmentEntry.canvasCourseAssignmentRubricObjArr.length === 1, "Length is not 1");
    // Write the fetched data to a JSON file
    try {
      await fs.writeFile(
        `assignments_new_${canvasCourseInternalId}_${canvasCourseAssignmentId}.json`,
        JSON.stringify(assignmentEntry, null, 2)
      );
      console.log("Data written to data.json");
    } catch (error) {
      console.error("Error writing data to file:", error);
    }
  }
}

async function fetchCanvasUserAssignmentSubmissionData(
  axiosHeaders: AxiosAuthHeaders,
  assignmentsWithRubricsArr: CanvasUserAssignmentWithRubricEntryBase[]
) {
  for (const assignmentEntry of assignmentsWithRubricsArr) {
    const { canvasCourseInternalId, canvasCourseAssignmentId } = assignmentEntry;
    let nextPageUrl = `${canvasUrl}/v1/courses/${canvasCourseInternalId}/assignments/${canvasCourseAssignmentId}/submissions?include[]=rubric_assessment&grouped=true&per_page=100`;
    let hasNextPage = true;
    const submissionArr: any[] = [];

    while (hasNextPage) {
      try {
        // Fetch data from the current page
        const submissionRes = await axios.get(nextPageUrl, {
          // Add any necessary headers here
          headers: axiosHeaders
        });

        // Extract the data from the response
        // const responseData = submissionRes.data;

        // Append the data to the dataSet array
        // submissionArr.push(...responseData);
        // log.trace(responseData);
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
              const points = value.points as number;
              const newRubricCategoryScore: CanvasCourseAssignmentRubricCategorySubmissionScore = {
                id: categoryId,
                points: points
              };
              rubricCategoryScoreArr.push(newRubricCategoryScore);
            }
            const newRubricSubmissionEntry: CanvasCourseAssignmentRubricSubmissionEntry = {
              canvasAssignmentScore: numericScore,
              rubricCategoryScores: rubricCategoryScoreArr
            };
            assignmentEntry.canvasCourseAssignmentRubricSubmissionArr.push(newRubricSubmissionEntry);
          }
        });
        hasNextPage = false;

        // Check if there is a next page
        if (submissionRes.headers["link"]) {
          // log.warn(submissionRes.headers["link"]);
          const links = parseLinkHeader(submissionRes.headers["link"]);
          // console.log(JSON.stringify(links, null, 2));
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
    log.warn(`${canvasCourseInternalId}_${canvasCourseAssignmentId}`);
    const len = assignmentEntry.canvasCourseAssignmentRubricSubmissionArr.length;
    log.info(len);
    if (len === 0) {
      log.error("Careful! Empty here!");
    }

    // Write the fetched data to a JSON file
    try {
      await fs.writeFile(
        `assignments_new_2_${canvasCourseInternalId}_${canvasCourseAssignmentId}.json`,
        JSON.stringify(assignmentEntry, null, 2)
      );
      console.log("Data written to data.json");
    } catch (error) {
      console.error("Error writing data to file:", error);
    }
  }
}

// Helper Function to parse the Link header and extract relevant URLs
function parseLinkHeader(header: string) {
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
      const relValue = relMatch[1].toLowerCase() as "current" | "next" | "prev" | "first" | "last";
      links[relValue] = url.slice(1, -1); // Remove < and >
    }
  });
  return links;
}

export { fetchCanvasUserAssignmentData, fetchCanvasUserAssignmentRubricData, fetchCanvasUserAssignmentSubmissionData };
