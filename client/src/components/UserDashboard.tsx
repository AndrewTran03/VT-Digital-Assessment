import { useEffect, useContext, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import {
  Accordion,
  AccordionSummary,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
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
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import _ from "lodash";
import {
  CanvasCourseAssignmentRubricObjMongoDBEntry,
  CanvasCourseAssociations,
  CanvasCourseQuizMongoDBEntry,
  CanvasQuizStatistic,
  seasonValues,
  SeasonEnumValues,
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
import "../styles/TableCellStyles.css";
import { APIRequestError } from "../shared/APIRequestError";
import useSystemColorThemeDetector from "../shared/hooks/useSystemColorThemeDetector";

const SSE_TIMER_INTERVAL = 20000; // Timer interval of 15 seconds (in milliseconds)

const UserDashboard: React.FC = () => {
  const { canvasQuizDataArr, setCanvasQuizDataArr } = useContext(CanvasQuizQuestionContext);
  const canvasQuizDataArrIsEmpty = canvasQuizDataArr.length === 0;
  const { setCanvasQuizLearningObjectiveData } = useContext(QuizLearningObjectiveContext);
  const { canvasUserInfo } = useContext(CanvasUserInfoContext);
  const [canvasUserId] = useState(
    canvasUserInfo.canvasUserId || parseInt(window.localStorage.getItem("canvasUserId") ?? "0")
  );
  const { setCanvasUserCourseNamesArr } = useContext(CanvasUserCourseNamesArrContext);
  const { canvasQuizQuestionStatisticDataArr, setCanvasQuizQuestionStatisticDataArr } =
    useContext(CanvasQuizStatisticContext);
  const canvasQuizQuestionStatisticDataArrIsEmpty = canvasQuizQuestionStatisticDataArr.length === 0;
  const { assignmentWithRubricDataArr, setAssignmentWithRubricDataArr } = useContext(CanvasAssignmentWithRubricContext);
  const assignmentWithRubricDataArrIsEmpty = assignmentWithRubricDataArr.length === 0;
  const { setCanvasAssignmentWithRubricLearningObjectiveData } = useContext(
    AssignmentWithRubricLearningObjectiveContext
  );
  // const canvasQuizDataArrGroupBy = Object.groupBy<any, CanvasCourseQuizMongoDBEntry>(
  //   canvasQuizDataArr,
  //   (entry: CanvasCourseQuizMongoDBEntry) => entry.canvasCourseInternalId
  // );
  // const assignmentWithRubricDataArrGroupBy = Object.groupBy<any, CanvasCourseAssignmentRubricObjMongoDBEntry>(
  //   assignmentWithRubricDataArr,
  //   (entry: CanvasCourseAssignmentRubricObjMongoDBEntry) => entry.canvasCourseInternalId
  // );
  const canvasQuizDataArrGroupBy = _.groupBy(
    canvasQuizDataArr,
    (entry: CanvasCourseQuizMongoDBEntry) => entry.canvasCourseInternalId
  );
  const assignmentWithRubricDataArrGroupBy = _.groupBy(
    assignmentWithRubricDataArr,
    (entry: CanvasCourseAssignmentRubricObjMongoDBEntry) => entry.canvasCourseInternalId
  );
  const navigate = useNavigate();
  const [progressMsg, setProgressMsg] = useState("");
  const systemColorTheme = useSystemColorThemeDetector();
  const [seasonStr, setSeasonStr] = useState<SeasonEnumValues>(determineDefaultSemesterByMonthHelper());
  const academicYearSelectRangeArr = use200YearArrGenerator();
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const selectedSemester = `${seasonStr} ${academicYear}`;
  const [canvasAPISemesterDataLoading, setCanvasAPISemesterDataLoading] = useState(false);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizStatsLoading, setQuizStatsLoading] = useState(false);
  const [assignmentWithRubricDataLoading, setAssignmentWithRubricDataLoading] = useState(false);
  const [filterButtonSubmitted, setFilterButtonSubmitted] = useState(false);

  async function fetchData() {
    console.clear();
    await fetchCanvasQuizData();
    await fetchCanvasAssignmentsWithRubricsData();
    await fetchCanvasQuizStatisticsData();
  }

  // useEffect(() => {
  //   fetchData();
  // }, []);

  // Implements Server-Sent Event (SSE) logging (for longer API calls)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let timerId: NodeJS.Timeout | null = null;

    function startTimer() {
      timerId = setInterval(() => {
        console.log("Server inactive. Reconnecting...");
        handleReconnection();
      }, SSE_TIMER_INTERVAL);
    }

    function resetTimer() {
      if (timerId) {
        clearInterval(timerId);
      }
      startTimer();
    }

    function handleReconnection() {
      console.log("Attempting to reconnect...");
      if (eventSource) {
        eventSource?.close();
      }
      if (timerId) {
        clearTimeout(timerId);
      }
      // Reopen EventSource and start the timer again
      setupSSEHelper();
      startTimer();
    }

    function setupSSEHelper() {
      eventSource = new EventSource(`${backendUrlBase}/api/canvas/retrieveCanvasData/progress`);

      eventSource.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        // Update state or UI based on the progress data received from the server
        console.log("Progress Update:", data.progress);
        setProgressMsg(data.progress);
        resetTimer(); // Reset the timer on receiving data from the server
      };

      eventSource.onerror = (error: Event) => {
        console.error("EventSource error:", error);
        handleReconnection();
      };
    }

    setupSSEHelper();
    startTimer();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, []);

  useEffect(() => {
    console.log(canvasQuizDataArrIsEmpty);
    console.log(canvasQuizQuestionStatisticDataArrIsEmpty);
    console.log(assignmentWithRubricDataArrIsEmpty);
  }, [
    canvasQuizQuestionStatisticDataArrIsEmpty,
    canvasQuizQuestionStatisticDataArrIsEmpty,
    assignmentWithRubricDataArrIsEmpty
  ]);

  useEffect(() => {
    console.log(canvasUserId);
  }, [canvasUserId]);

  useEffect(() => {
    console.log(canvasQuizDataArrGroupBy);
  }, [canvasQuizDataArrGroupBy]);

  useEffect(() => {
    console.log(assignmentWithRubricDataArrGroupBy);
  }, [assignmentWithRubricDataArrGroupBy]);

  useEffect(() => {
    console.log(`Selected Semester: ${selectedSemester}`);
  }, [selectedSemester]);

  function determineDefaultSemesterByMonthHelper() {
    const month = new Date().getMonth();
    let semester: SeasonEnumValues = "Spring";
    switch (month) {
      case 1:
      case 12: {
        semester = "Winter";
        break;
      }
      case 2:
      case 3:
      case 4:
      case 5: {
        semester = "Spring";
        break;
      }
      case 6:
      case 7: {
        semester = "Summer";
        break;
      }
      case 8:
      case 9:
      case 10:
      case 11: {
        semester = "Fall";
        break;
      }
    }
    return semester;
  }

  function use200YearArrGenerator() {
    const currentYear = new Date().getFullYear();
    const floorCenturyYear = Math.floor(currentYear / 100) * 100;
    const startYear = floorCenturyYear - 100;
    const endYear = floorCenturyYear + 99;

    const yearRange = Array.from({ length: endYear - startYear + 1 }, (_, index) => Math.ceil(startYear + index));
    return yearRange;
  }

  async function fetchCanvasQuizData() {
    setQuizzesLoading(true);
    try {
      const res = await axios.get(`${backendUrlBase}/api/canvas/quiz/${canvasUserId}/${seasonStr}/${academicYear}`);
      const parsedResult = parseCanvasQuizQuestionMongoDBDCollection(res.data);
      console.log(parsedResult);
      setCanvasQuizDataArr(parsedResult);
    } catch (e: any) {
      if (
        e instanceof APIRequestError ||
        (e instanceof AxiosError && (e as AxiosError).status && (e as AxiosError).status! > 500)
      ) {
        window.location.reload();
      }
    } finally {
      setQuizzesLoading(false);
    }
  }

  async function fetchCanvasQuizStatisticsData() {
    setQuizStatsLoading(true);
    try {
      const res = await axios.get(`${backendUrlBase}/api/statistics/quiz/${canvasUserId}/${seasonStr}/${academicYear}`);
      console.log(res.data);
      setCanvasQuizQuestionStatisticDataArr(res.data as CanvasQuizStatistic[]);
    } catch (e: any) {
      if (
        e instanceof APIRequestError ||
        (e instanceof AxiosError && (e as AxiosError).status && (e as AxiosError).status! > 500)
      ) {
        window.location.reload();
      }
    } finally {
      setQuizStatsLoading(false);
    }
  }

  async function fetchCanvasAssignmentsWithRubricsData() {
    setAssignmentWithRubricDataLoading(true);
    try {
      const res = await axios.get(
        `${backendUrlBase}/api/statistics/assignment_rubric/${canvasUserId}/${seasonStr}/${academicYear}`
      );
      console.log(res.data);
      setAssignmentWithRubricDataArr(res.data as CanvasCourseAssignmentRubricObjMongoDBEntry[]);
    } catch (e: any) {
      if (
        e instanceof APIRequestError ||
        (e instanceof AxiosError && (e as AxiosError).status && (e as AxiosError).status! > 500)
      ) {
        window.location.reload();
      }
    } finally {
      setAssignmentWithRubricDataLoading(false);
    }
  }

  async function handleApiRefreshButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    await fetchData();
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

  function handleSeasonSelectChange(e: SelectChangeEvent) {
    e.preventDefault();
    setSeasonStr(e.target.value as SeasonEnumValues);
  }

  function handleAcademicYearCalendarChange(e: SelectChangeEvent) {
    e.preventDefault();
    setAcademicYear(parseInt(e.target.value.toString()));
  }

  async function handleAcademicSemesterYearButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    setCanvasAPISemesterDataLoading(true);
    setFilterButtonSubmitted(true);
    try {
      const res = await axios.patch(`${backendUrlBase}/api/canvas/${canvasUserId}/${seasonStr}/${academicYear}`);
      if (!res.status.toString().startsWith("2")) {
        throw new Error(`[ERROR] Status: ${res.status.toString()}`);
      }
    } catch (e: any) {
      if (
        e instanceof APIRequestError ||
        (e instanceof AxiosError && (e as AxiosError).status && (e as AxiosError).status! > 500)
      ) {
        window.location.reload();
      }
    } finally {
      setCanvasAPISemesterDataLoading(false);
    }
    await fetchData();
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
      <button
        type="button"
        onClick={handleClickToObjectives}
        disabled={quizzesLoading || assignmentWithRubricDataLoading || quizStatsLoading || canvasAPISemesterDataLoading}
      >
        <Typography>
          <b>+ Add Learning Objectives for Your Course</b>
        </Typography>
      </button>
      <button
        type="submit"
        onClick={handleApiRefreshButtonClick}
        disabled={quizzesLoading || assignmentWithRubricDataLoading || quizStatsLoading || canvasAPISemesterDataLoading}
      >
        <Typography>
          <b>Refresh User Dashboard</b>
        </Typography>
      </button>
      <button type="submit" onClick={handleLogout}>
        <Typography>
          <b>Logout</b>
        </Typography>
      </button>
      {canvasAPISemesterDataLoading && (
        <>
          <br />
          <Typography>Canvas API Selected Semester Course Parser Loading...</Typography>
          <CircularProgress />
        </>
      )}
      {quizzesLoading && (
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
      {assignmentWithRubricDataLoading && (
        <>
          <br />
          <Typography>
            Course Assignment With Rubric Submissions, Learning Objective, and Statistics Loading...
          </Typography>
          <CircularProgress />
        </>
      )}
      {/* Progress Message */}
      {progressMsg && progressMsg.length > 0 && (
        <>
          <br />
          <Typography className="progress-message" variant="body1" style={{ color: "orange", marginTop: "10px" }}>
            In-Progress: {progressMsg}
          </Typography>
        </>
      )}

      <br />
      <br />

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Box sx={{ minWidth: 120, maxWidth: 150 }}>
          <FormControl fullWidth>
            <InputLabel id="simple-select-label">
              <Typography variant="body1" style={{ color: systemColorTheme === "dark" ? "white" : "black" }}>
                Season
              </Typography>
            </InputLabel>
            <Select
              labelId="season-select-label"
              id="season-select"
              value={seasonStr}
              label="SeasonStr"
              style={{ color: systemColorTheme === "dark" ? "white" : "black" }}
              onChange={handleSeasonSelectChange}
            >
              {seasonValues.map((season) => (
                <MenuItem value={season}>
                  <Typography variant="body1">{season}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ minWidth: 120, maxWidth: 150 }}>
          <FormControl fullWidth>
            <InputLabel id="simple-select-label">
              <Typography variant="body1" style={{ color: systemColorTheme === "dark" ? "white" : "black" }}>
                Academic Year
              </Typography>
            </InputLabel>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Select
                labelId="academic-year-select-label"
                id="academic-year-select"
                defaultValue=""
                value={academicYear.toString()}
                label="AcademicYearStr"
                style={{ color: systemColorTheme === "dark" ? "white" : "black" }}
                onChange={handleAcademicYearCalendarChange}
              >
                {academicYearSelectRangeArr.map((year) => (
                  <MenuItem key={year} value={year}>
                    <Typography variant="body1">{year}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </LocalizationProvider>
          </FormControl>
        </Box>
        <button type="button" onClick={handleAcademicSemesterYearButtonClick}>
          <Typography variant="body1">
            <b>Search</b>
          </Typography>
        </button>
      </div>

      <br />

      <Typography variant="body1" fontSize={20}>
        {canvasQuizDataArrIsEmpty && canvasQuizQuestionStatisticDataArrIsEmpty && !filterButtonSubmitted && (
          <b>No Canvas Quiz Data has been loaded yet.</b>
        )}
        {canvasQuizDataArrIsEmpty && canvasQuizQuestionStatisticDataArrIsEmpty && filterButtonSubmitted && (
          <b>No Canvas Quiz Data found.</b>
        )}
        {!canvasQuizDataArrIsEmpty && !canvasQuizQuestionStatisticDataArrIsEmpty && (
          <b>Your Canvas Course Quiz Entries</b>
        )}
      </Typography>
      {canvasQuizDataArrGroupBy &&
        Object.entries(canvasQuizDataArrGroupBy).length > 0 &&
        Object.entries(canvasQuizDataArrGroupBy).map((value, key) => (
          <Paper key={key} style={{ margin: "20px 0", borderRadius: 20, overflow: "hidden" }}>
            {value[1] && value[1].length > 0 && (
              <>
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
                          <b>Canvas Quiz ID</b>
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
                      <TableCell className="table-cell" style={{ width: "25%" }}>
                        <Typography>
                          <b>Learning Objectives</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Statistics</b>
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
                              disabled={quizzesLoading}
                            >
                              {canvasQuizDataArr.filter(
                                (currEntry) =>
                                  currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                  currEntry.quizId === entry.quizId
                              ).length === 1 &&
                              canvasQuizDataArr
                                .filter(
                                  (currEntry) =>
                                    currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                    currEntry.quizId === entry.quizId
                                )[0]
                                .canvasMatchedLearningObjectivesArr.some(
                                  (learningObj) => JSON.stringify(learningObj) === "[]"
                                )
                                ? "Assign "
                                : "Change "}
                              Learning Objectives
                            </button>
                            <br />
                            {canvasQuizDataArr.filter(
                              (currEntry) =>
                                currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                currEntry.quizId === entry.quizId
                            ).length === 1 &&
                              !canvasQuizDataArr
                                .filter(
                                  (currEntry) =>
                                    currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                    currEntry.quizId === entry.quizId
                                )[0]
                                .canvasMatchedLearningObjectivesArr.some(
                                  (learningObj) => JSON.stringify(learningObj) === "[]"
                                ) && (
                                <Accordion style={{ borderRadius: 20, overflow: "hidden" }}>
                                  <AccordionSummary>
                                    <Typography>View Quiz Question's Canvas Learning Objectives</Typography>
                                  </AccordionSummary>
                                  {canvasQuizDataArr
                                    .filter(
                                      (currEntry) =>
                                        currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                        currEntry.quizId === entry.quizId
                                    )[0]
                                    .canvasMatchedLearningObjectivesArr.map((learningObjArr, learningObjIdx) => (
                                      <Typography>
                                        <b>{`Ques. ${learningObjIdx + 1}: `}</b>
                                        {learningObjArr.map((learningObj) => (
                                          <li>{learningObj}</li>
                                        ))}
                                      </Typography>
                                    ))}
                                </Accordion>
                              )}
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
                              Show Statistics
                            </button>
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ))}
                </Table>
              </>
            )}
          </Paper>
        ))}

      <Typography fontSize={20}>
        {assignmentWithRubricDataArrIsEmpty && !filterButtonSubmitted && (
          <b>No Canvas Course Assignment (with Rubric) Data has been loaded yet.</b>
        )}
        {assignmentWithRubricDataArrIsEmpty && filterButtonSubmitted && (
          <b>No Canvas Course Assignment (with Rubric) Data found.</b>
        )}
        {!assignmentWithRubricDataArrIsEmpty && <b>Your Canvas Course Assignment Entries (With Rubrics)</b>}
      </Typography>
      {assignmentWithRubricDataArrGroupBy &&
        Object.entries(assignmentWithRubricDataArrGroupBy).length > 0 &&
        Object.entries(assignmentWithRubricDataArrGroupBy).map((value, key) => (
          <Paper key={key} style={{ margin: "20px 0", borderRadius: 20, overflow: "hidden" }}>
            {value[1] && value[1].length > 0 && (
              <>
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
                          <b>Canvas Assignment ID</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "30%" }}>
                        <Typography>
                          <b>Assignment Name</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Canvas Rubric ID</b>
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
                      <TableCell className="table-cell" style={{ width: "25%" }}>
                        <Typography>
                          <b>Learning Objectives</b>
                        </Typography>
                      </TableCell>
                      <TableCell className="table-cell" style={{ width: "15%" }}>
                        <Typography>
                          <b>Statistics</b>
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
                              {assignmentWithRubricDataArr.filter(
                                (currEntry) =>
                                  currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                  currEntry.canvasRubricId === entry.canvasRubricId
                              ).length === 1 &&
                              assignmentWithRubricDataArr
                                .filter(
                                  (currEntry) =>
                                    currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                    currEntry.canvasRubricId === entry.canvasRubricId
                                )[0]
                                .canvasMatchedLearningObjectivesArr.some(
                                  (learningObj) => JSON.stringify(learningObj) === "[]"
                                )
                                ? "Assign "
                                : "Change "}
                              Learning Objectives
                            </button>
                            <br />
                            {assignmentWithRubricDataArr.filter(
                              (currEntry) =>
                                currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                currEntry.canvasRubricId === entry.canvasRubricId
                            ).length === 1 &&
                              !assignmentWithRubricDataArr
                                .filter(
                                  (currEntry) =>
                                    currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                    currEntry.canvasRubricId === entry.canvasRubricId
                                )[0]
                                .canvasMatchedLearningObjectivesArr.some(
                                  (learningObj) => JSON.stringify(learningObj) === "[]"
                                ) && (
                                <Accordion style={{ borderRadius: 20, overflow: "hidden" }}>
                                  <AccordionSummary>
                                    <Typography>View Assign's Canvas Learning Objectives</Typography>
                                  </AccordionSummary>
                                  {assignmentWithRubricDataArr
                                    .filter(
                                      (currEntry) =>
                                        currEntry.canvasCourseInternalId === entry.canvasCourseInternalId &&
                                        currEntry.canvasRubricId === entry.canvasRubricId
                                    )[0]
                                    .canvasMatchedLearningObjectivesArr.map((learningObjArr, learningObjIdx) => (
                                      <Typography>
                                        <b>{`Criteria ${learningObjIdx + 1}: `}</b>
                                        {learningObjArr.map((learningObj) => (
                                          <li>{learningObj}</li>
                                        ))}
                                      </Typography>
                                    ))}
                                </Accordion>
                              )}
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
                              Show Statistics
                            </button>
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ))}
                </Table>
              </>
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
