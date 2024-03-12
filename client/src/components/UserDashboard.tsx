import { useEffect, useContext, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CanvasCourseAssignmentRubricObjMongoDBEntry,
  CanvasCourseAssociations,
  CanvasQuizStatistic,
  backendUrlBase
} from "../shared/types";
import {
  CanvasQuizQuestionContext,
  QuizLearningObjectiveContext,
  CanvasUserInfoContext,
  CanvasUserCourseNamesArrContext,
  CanvasQuizStatisticContext,
  CanvasAssignmentWithRubricContext,
  AssignmentWithRubricLearningObjectiveContext
} from "../shared/contexts";
import { parseCanvasQuizQuestionMongoDBDCollection } from "../shared/FrontendParser";
import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TypographyPropsVariantOverrides
} from "@mui/material";
import { OverridableStringUnion } from "@mui/types";
import { Variant } from "@mui/material/styles/createTypography";
import "../styles/TableCellStyles.css";

const UserDashboard: React.FC = () => {
  const { canvasQuizDataArr, setCanvasQuizDataArr } = useContext(CanvasQuizQuestionContext);
  const { setCanvasQuizLearningObjectiveData } = useContext(QuizLearningObjectiveContext);
  const { canvasUserInfo } = useContext(CanvasUserInfoContext);
  const [canvasUserId] = useState(
    canvasUserInfo.canvasUserId || parseInt(window.localStorage.getItem("canvasUserId") ?? "0")
  );
  const { setCanvasUserCourseNamesArr } = useContext(CanvasUserCourseNamesArrContext);
  const { canvasQuizQuestionStatisticDataArr, setCanvasQuizQuestionStatisticDataArr } =
    useContext(CanvasQuizStatisticContext);
  const { assignmentWithRubricDataArr, setAssignmentWithRubricDataArr } = useContext(CanvasAssignmentWithRubricContext);
  const { setCanvasAssignmentWithRubricLearningObjectiveData } = useContext(
    AssignmentWithRubricLearningObjectiveContext
  );
  const canvasQuizDataArrGroupBy = Object.groupBy(canvasQuizDataArr, (entry) => entry.canvasCourseInternalId);
  const assignmentWithRubricDataArrGroupBy = Object.groupBy(
    assignmentWithRubricDataArr,
    (entry) => entry.canvasCourseInternalId
  );
  const navigate = useNavigate();
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [quizStatsLoading, setQuizStatsLoading] = useState(false);
  const [assignmentWithRubricDataLoading, setAssignmentWithRubricDataLoading] = useState(false);

  async function fetchData() {
    console.clear();
    await fetchCanvasQuizData();
    await fetchCanvasAssignmentsWithRubricsData();
    await fetchCanvasQuizStatisticsData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log(canvasUserId);
  }, [canvasUserId]);

  useEffect(() => {
    console.log(canvasQuizDataArrGroupBy);
  }, [canvasQuizDataArrGroupBy]);

  useEffect(() => {
    console.log(assignmentWithRubricDataArrGroupBy);
  }, [assignmentWithRubricDataArrGroupBy]);

  async function fetchCanvasQuizData() {
    setCoursesLoading(true);
    await axios.get(`${backendUrlBase}/api/canvas/${canvasUserId}`).then((res) => {
      const parsedResult = parseCanvasQuizQuestionMongoDBDCollection(res.data);
      console.log(parsedResult);
      setCanvasQuizDataArr(parsedResult);
    });
    setCoursesLoading(false);
  }

  async function fetchCanvasQuizStatisticsData() {
    setQuizStatsLoading(true);
    await axios.get(`${backendUrlBase}/api/statistics/quiz/${canvasUserId}`).then((res) => {
      console.log(res.data);
      setCanvasQuizQuestionStatisticDataArr(res.data as CanvasQuizStatistic[]);
    });
    setQuizStatsLoading(false);
  }

  async function fetchCanvasAssignmentsWithRubricsData() {
    setAssignmentWithRubricDataLoading(true);
    await axios.get(`${backendUrlBase}/api/statistics/assignment_rubric/${canvasUserId}`).then((res) => {
      console.log(res.data);
      setAssignmentWithRubricDataArr(res.data as CanvasCourseAssignmentRubricObjMongoDBEntry[]);
    });
    setAssignmentWithRubricDataLoading(false);
  }

  async function handleApiRefreshButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasQuizData();
    await fetchCanvasAssignmentsWithRubricsData();
    await fetchCanvasQuizStatisticsData();
  }

  function handleClickToObjectives(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    if (canvasQuizDataArr && canvasQuizDataArr.length > 0) {
      const canvasQuizDataArrCourseNames = new Set<string>();
      for (const course of canvasQuizDataArr) {
        const currEntry: CanvasCourseAssociations = {
          deptAbbrev: course.canvasCourseDept,
          courseNum: course.canvasCourseNum,
          courseName: course.canvasCourseName
        };
        const serializedCurrEntry = JSON.stringify(currEntry);
        if (!canvasQuizDataArrCourseNames.has(serializedCurrEntry)) {
          canvasQuizDataArrCourseNames.add(serializedCurrEntry);
        }
      }
      // Convert set to an array of serialized strings and store it in local storage
      const serializedArray = Array.from(canvasQuizDataArrCourseNames);
      window.localStorage.setItem("canvasUserCourseAssociations", JSON.stringify(serializedArray));

      // Convert set to an array of CanvasCourseAssociations objects and update state
      const deserializedArray = serializedArray.map((entry) => JSON.parse(entry) as CanvasCourseAssociations);
      setCanvasUserCourseNamesArr(deserializedArray);
    }
    navigate("/file_import");
  }

  function handleClickToMatcherQuiz(
    e: FormEvent<HTMLButtonElement>,
    courseInternalId: number,
    specifiedQuizId: number
  ) {
    e.preventDefault();
    console.clear();
    setCanvasQuizLearningObjectiveData({
      canvasCourseInternalId: courseInternalId,
      quizId: specifiedQuizId
    });
    window.localStorage.setItem("canvasCourseInternalId", courseInternalId.toString());
    window.localStorage.setItem("canvasQuizId", specifiedQuizId.toString());
    window.localStorage.setItem("canvasQuizDataArr", JSON.stringify(canvasQuizDataArr));
    navigate("/quiz_learning_obj_match");
  }

  function handleClickToStatisticsQuiz(
    e: FormEvent<HTMLButtonElement>,
    specifiedCourseInternalId: number,
    specifiedQuizId: number
  ) {
    e.preventDefault();
    console.clear();
    setCanvasQuizLearningObjectiveData({
      canvasCourseInternalId: specifiedCourseInternalId,
      quizId: specifiedQuizId
    });
    window.localStorage.setItem("canvasCourseInternalId", specifiedCourseInternalId.toString());
    window.localStorage.setItem("canvasQuizId", specifiedQuizId.toString());
    window.localStorage.setItem("canvasQuizDataArr", JSON.stringify(canvasQuizDataArr));
    window.localStorage.setItem("canvasStatsArr", JSON.stringify(canvasQuizQuestionStatisticDataArr));
    navigate("/quiz_statistics");
  }

  function handleClicktoMatcherAssignmentWithRubric(
    e: FormEvent<HTMLButtonElement>,
    specifiedCourseInternalId: number,
    specifiedRubricId: number
  ) {
    e.preventDefault();
    console.clear();
    setCanvasAssignmentWithRubricLearningObjectiveData({
      canvasCourseInternalId: specifiedCourseInternalId,
      rubricId: specifiedRubricId
    });
    window.localStorage.setItem("canvasCourseInternalId", specifiedCourseInternalId.toString());
    window.localStorage.setItem("canvasRubricId", specifiedRubricId.toString());
    window.localStorage.setItem("assignmentWithRubricArr", JSON.stringify(assignmentWithRubricDataArr));
    navigate("/assignment_with_rubric_learning_obj_match");
  }

  function handleClicktoStatisticsAssignmentWithRubric(
    e: FormEvent<HTMLButtonElement>,
    specifiedCourseInternalId: number,
    specifiedRubricId: number
  ) {
    e.preventDefault();
    console.clear();
    setCanvasAssignmentWithRubricLearningObjectiveData({
      canvasCourseInternalId: specifiedCourseInternalId,
      rubricId: specifiedRubricId
    });
    window.localStorage.setItem("canvasCourseInternalId", specifiedCourseInternalId.toString());
    window.localStorage.setItem("canvasRubricId", specifiedRubricId.toString());
    window.localStorage.setItem("assignmentWithRubricArr", JSON.stringify(assignmentWithRubricDataArr));
    navigate("/assignment_with_rubric_statistics");
  }

  // Edge-Case: Handles if No Statistics Available for that Quiz (Students have NOT taken quiz yet)
  function checkValidQuizStatsEntryToDisplay(specifiedCourseInternalId: number, specifiedQuizId: number) {
    const specifiedQuizToNavigate = canvasQuizQuestionStatisticDataArr.filter(
      (entry) =>
        entry.url.includes(specifiedCourseInternalId.toString()) && entry.url.includes(specifiedQuizId.toString())
    );
    if (
      specifiedQuizToNavigate &&
      specifiedQuizToNavigate.length === 1 &&
      ((specifiedQuizToNavigate[0].question_statistics &&
        specifiedQuizToNavigate[0].question_statistics.length === 0) ||
        (specifiedQuizToNavigate[0].submission_statistics &&
          specifiedQuizToNavigate[0].submission_statistics.scores &&
          Object.keys(specifiedQuizToNavigate[0].submission_statistics.scores).length === 0 &&
          JSON.stringify(specifiedQuizToNavigate[0].submission_statistics.scores) === "{}"))
    ) {
      return true; // Disable that "Statistics" button
    }
    return false;
  }

  // Edge-Case: Handles if No Statistics Available for that Quiz (Students have NOT taken quiz yet)
  function checkValidAssignmentWithRubricStatsEntryToDisplay(
    specifiedCourseInternalId: number,
    specifiedRubricId: number
  ) {
    const specifiedAssignmentWithRubricToNavigate = assignmentWithRubricDataArr.filter(
      (entry) =>
        entry.canvasCourseInternalId === specifiedCourseInternalId && entry.canvasRubricId === specifiedRubricId
    );
    if (
      specifiedAssignmentWithRubricToNavigate &&
      specifiedAssignmentWithRubricToNavigate.length === 1 &&
      specifiedAssignmentWithRubricToNavigate[0].recentSubmissionData.length === 0
    ) {
      return true; // Disable that "Statistics" button
    }
    return false;
  }

  function handleLogout(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    navigate("/");
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>Canvas Course Dashboard</b>
      </Typography>
      <button type="button" onClick={handleClickToObjectives} disabled={coursesLoading || quizStatsLoading}>
        <Typography>
          <b>+ Add Learning Objectives for Your Course</b>
        </Typography>
      </button>
      <button type="submit" onClick={handleApiRefreshButtonClick} disabled={coursesLoading || quizStatsLoading}>
        <Typography>
          <b>Refresh</b>
        </Typography>
      </button>
      <button type="submit" onClick={handleLogout}>
        <Typography>
          <b>Logout</b>
        </Typography>
      </button>
      {coursesLoading && (
        <>
          <br />
          <Typography>Course Quizzes and Learning Objectives Loading...</Typography>
          <CircularProgress />
        </>
      )}
      {quizStatsLoading && (
        <>
          <br />
          <Typography>Course Quiz Statistics Loading...</Typography>
          <CircularProgress />
        </>
      )}

      <Typography fontSize={20}>
        <b>Your Canvas Course Quiz Entries</b>
      </Typography>
      {canvasQuizDataArrGroupBy &&
        Object.entries(canvasQuizDataArrGroupBy).length > 0 &&
        Object.entries(canvasQuizDataArrGroupBy).map((value, key) => (
          <Paper key={key} style={{ margin: "20px 0", borderRadius: 20, overflow: "hidden" }}>
            {value[1] && value[1].length > 0 && (
              <div key={value[1][0].canvasCourseName}>
                <div
                  style={{
                    border: "1px solid lightgray"
                  }}
                >
                  <TableTitle
                    variant="h6"
                    text={`${value[1][0].canvasCourseName} (${value[1][0].canvasCourseInternalId})`}
                  />
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Canvas Quiz Id</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "30%" }}>
                        <Typography>
                          <b>Quiz Name</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Number of Quiz Questions</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "20%" }}>
                        <Typography>
                          <b>Assign Learning Objectives</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "20%" }}>
                        <Typography>
                          <b>View Statistics</b>
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  {value[1].map((entry) => (
                    <TableBody>
                      <TableRow>
                        <TableCell className="table-cell" style={{ width: "15%" }}>
                          <Typography>{entry.quizId}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "30%" }}>
                          <Typography>{entry.quizName}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "15%" }}>
                          <Typography>{entry.canvasQuizEntries.length}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "20%" }}>
                          <Typography>
                            <button
                              type="submit"
                              onClick={(e) => handleClickToMatcherQuiz(e, entry.canvasCourseInternalId, entry.quizId)}
                              disabled={coursesLoading}
                            >
                              Click to Assign Learning Objectives
                            </button>
                          </Typography>
                        </TableCell>
                        <TableCell style={{ width: "20%" }}>
                          <Typography>
                            <button
                              type="submit"
                              onClick={(e) =>
                                handleClickToStatisticsQuiz(e, entry.canvasCourseInternalId, entry.quizId)
                              }
                              disabled={
                                quizStatsLoading ||
                                checkValidQuizStatsEntryToDisplay(entry.canvasCourseInternalId, entry.quizId)
                              }
                            >
                              Click to View Statistics
                            </button>
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ))}
                </Table>
              </div>
            )}
          </Paper>
        ))}

      <Typography fontSize={20}>
        <b>Your Canvas Course Assignment Entries (With Rubrics)</b>
      </Typography>
      {assignmentWithRubricDataArrGroupBy &&
        Object.entries(assignmentWithRubricDataArrGroupBy).length > 0 &&
        Object.entries(assignmentWithRubricDataArrGroupBy).map((value, key) => (
          <Paper key={key} style={{ margin: "20px 0", borderRadius: 20, overflow: "hidden" }}>
            {value[1] && value[1].length > 0 && (
              <div key={value[1][0].canvasCourseName}>
                <div
                  style={{
                    border: "1px solid lightgray"
                  }}
                >
                  <TableTitle
                    variant="h6"
                    text={`${value[1][0].canvasCourseName} (${value[1][0].canvasCourseInternalId})`}
                  />
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Assignment Id</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "30%" }}>
                        <Typography>
                          <b>Assignment Name</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Rubric Id</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "30%" }}>
                        <Typography>
                          <b>Rubric Name</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Number of Rubric Criterion</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "20%" }}>
                        <Typography>
                          <b>Assign Learning Objectives</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "20%" }}>
                        <Typography>
                          <b>View Statistics</b>
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  {value[1].map((entry) => (
                    <TableBody>
                      <TableRow>
                        <TableCell className="table-cell" style={{ width: "15%" }}>
                          <Typography>{entry.canvasAssignmentId}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "30%" }}>
                          <Typography>{entry.canvasAssignmentName}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "15%" }}>
                          <Typography>{entry.canvasRubricId}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "30%" }}>
                          <Typography>{entry.title}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "15%" }}>
                          <Typography>{entry.canvasMatchedLearningObjectivesArr.length}</Typography>
                        </TableCell>
                        <TableCell className="table-cell" style={{ width: "20%" }}>
                          <Typography>
                            <button
                              type="submit"
                              onClick={(e) =>
                                handleClicktoMatcherAssignmentWithRubric(
                                  e,
                                  entry.canvasCourseInternalId,
                                  entry.canvasRubricId
                                )
                              }
                              disabled={assignmentWithRubricDataLoading}
                            >
                              Click to Assign Learning Objectives
                            </button>
                          </Typography>
                        </TableCell>
                        <TableCell style={{ width: "20%" }}>
                          <Typography>
                            <button
                              type="submit"
                              onClick={(e) =>
                                handleClicktoStatisticsAssignmentWithRubric(
                                  e,
                                  entry.canvasCourseInternalId,
                                  entry.canvasRubricId
                                )
                              }
                              disabled={
                                assignmentWithRubricDataLoading ||
                                checkValidAssignmentWithRubricStatsEntryToDisplay(
                                  entry.canvasCourseInternalId,
                                  entry.canvasRubricId
                                )
                              }
                            >
                              Click to View Statistics
                            </button>
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ))}
                </Table>
              </div>
            )}
          </Paper>
        ))}
    </>
  );
};

type TableTitleProps = {
  text: string;
  variant: OverridableStringUnion<Variant | "inherit", TypographyPropsVariantOverrides> | undefined;
};

const TableTitle: React.FC<TableTitleProps> = (props) => {
  return (
    <Typography
      variant={props.variant}
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      {props.text}
    </Typography>
  );
};

export default UserDashboard;
