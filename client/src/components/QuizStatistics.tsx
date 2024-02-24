import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalBarSeries,
  HorizontalGridLines,
  VerticalGridLines,
  VerticalBarSeries,
  LabelSeries
} from "react-vis";
import { useState, useEffect, useContext, FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Accordion, AccordionSummary } from "@mui/material";
import Typography from "@mui/material/Typography";
import {
  backendUrlBase,
  multipleChoiceQuestionLetters,
  CanvasLearningObjectives,
  CanvasCourseQuizMongoDBEntry,
  CanvasQuizStatistic,
  CanvasQuizStatisticsResultObj,
  CanvasQuizQuestionAnswerFrequencyArrEntry,
  CanvasQuizQuestionAnswerSetFrequencyArrEntry
} from "../shared/types";
import { parseLearningObjectiveMongoDBDCollection } from "../shared/FrontendParser";
import {
  CanvasQuizQuestionContext,
  CanvasQuizStatisticContext,
  CanvasUserInfoContext,
  LearningObjectiveContext
} from "../shared/contexts";
import "../styles/TableCellStyles.css";

const QuizStatistics: React.FC = () => {
  const PERCENTAGE_CATEGORIES = ["Exceeds", "Meets", "Below", "None"] as const;
  const { canvasQuizDataArr } = useContext(CanvasQuizQuestionContext);
  const { canvasLearningObjectiveData } = useContext(LearningObjectiveContext);
  const { canvasUserInfo } = useContext(CanvasUserInfoContext);
  const { canvasQuizQuestionStatisticDataArr } = useContext(CanvasQuizStatisticContext);
  const canvasQuizData: CanvasCourseQuizMongoDBEntry[] =
    canvasQuizDataArr.length === 0
      ? JSON.parse(window.localStorage.getItem("canvasQuizDataArr") ?? "[]")
      : canvasQuizDataArr;
  const [canvasCourseInternalId] = useState(
    canvasLearningObjectiveData.canvasCourseInternalId ||
      parseInt(window.localStorage.getItem("canvasCourseInternalId") ?? "0")
  );
  const [canvasQuizId] = useState(
    canvasLearningObjectiveData.quizId || parseInt(window.localStorage.getItem("canvasQuizId") ?? "0")
  );
  const [canvasUserId] = useState(
    canvasUserInfo.canvasUserId || parseInt(window.localStorage.getItem("canvasUserId") ?? "0")
  );
  const canvasStatData: CanvasQuizStatistic[] =
    canvasQuizQuestionStatisticDataArr.length === 0
      ? JSON.parse(window.localStorage.getItem("canvasStatsArr") ?? "[]")
      : canvasQuizQuestionStatisticDataArr;
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, setLearningCourseObjectiveData] = useState<CanvasLearningObjectives>({
    _id: "",
    __v: 0,
    createdDate: "",
    updatedDate: "",
    deptAbbrev: "",
    courseNum: 0,
    semester: "Summer",
    year: 0,
    canvasCourseInternalId: 0,
    canvasObjectives: []
  });
  const matchingCourseEntries = canvasQuizData.filter(
    (data: CanvasCourseQuizMongoDBEntry) =>
      data.canvasCourseInternalId === canvasCourseInternalId && data.quizId === canvasQuizId
  );
  const [quizStatsResultsObj, setQuizStatsResultsObj] = useState<CanvasQuizStatisticsResultObj>({
    quizAveragePointsEarned: 0,
    quizMedianPointsEarned: 0,
    quizPercentageCategories: [],
    perQuestionItemDifficulty: [],
    perQuestionAveragePointsEarned: [],
    perQuestionAnswerFrequencies: [],
    perLearningObjPercentageCategories: []
  });
  const matchingStatEntries = canvasStatData.filter(
    (data: CanvasQuizStatistic) =>
      data.url.includes(canvasCourseInternalId.toString()) && data.url.includes(canvasQuizId.toString())
  );
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isOverallQuizStatisticsAccordionOpen, setIsOverallQuizStatisticsAccordionOpen] = useState(false);
  const [isLearningObjStatisticsAccordionOpen, setIsLearningObjStatisticsAccordionOpen] = useState(false);

  async function fetchData() {
    await fetchCanvasLearningObjectiveData();
    await fetchCanvasStatisticsData();
    console.clear();
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.assert(matchingCourseEntries.length === 1);
    console.log(matchingCourseEntries.length);
    if (matchingCourseEntries.length === 1) {
      console.log("LENGTH IS 1: COURSE FILTERING IS A SUCCESS!");
      console.log(matchingCourseEntries[0]);
    }
  }, [matchingCourseEntries]);

  useEffect(() => {
    console.assert(matchingStatEntries.length === 1);
    console.log(matchingStatEntries.length);
    if (matchingStatEntries.length === 1) {
      console.log("LENGTH IS 1: STATS FILTERING IS A SUCCESS!");
      console.log(matchingStatEntries[0]);
    }
  }, [matchingStatEntries]);

  async function fetchCanvasLearningObjectiveData() {
    setCoursesLoading(true);
    await axios.get(`${backendUrlBase}/api/objective/${canvasCourseInternalId}`).then((res) => {
      const parsedResult = parseLearningObjectiveMongoDBDCollection(res.data[0]);
      setLearningCourseObjectiveData(parsedResult);
    });
    setCoursesLoading(false);
  }

  async function fetchCanvasStatisticsData() {
    setStatsLoading(true);
    await axios
      .post(
        `${backendUrlBase}/api/statistics/${canvasUserId}/${canvasCourseInternalId}/${canvasQuizId}`,
        matchingStatEntries[0]
      )
      .then((res) => {
        console.log(res.data);
        setQuizStatsResultsObj(res.data);
      });
    setStatsLoading(false);
  }

  function handleOverallQuizStatisticsAccordionToggle() {
    setIsOverallQuizStatisticsAccordionOpen((prevState) => !prevState);
  }

  function handleLearningObjStatisticsAccordionToggle() {
    setIsLearningObjStatisticsAccordionOpen((prevState) => !prevState);
  }

  function handleAdjustmentTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.rows = 1;
      textareaRef.current.rows = Math.ceil(textareaRef.current.scrollHeight / 10);
    }
  }

  async function handleCourseObjectiveAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasLearningObjectiveData();
  }

  async function handleCourseStatisticsAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasStatisticsData();
  }

  function handleBackButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Back button pressed!");
    window.localStorage.removeItem("canvasQuizDataArr");
    window.localStorage.removeItem("canvasStatsArr");
    window.localStorage.removeItem("canvasCourseInternalId");
    window.localStorage.removeItem("canvasQuizId");
    navigate(-1);
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>
          Canvas Quiz Statistics for{" "}
          <i>
            "{matchingCourseEntries[0].quizName}" (ID: {matchingCourseEntries[0].quizId})
          </i>
        </b>
      </Typography>
      <button type="reset" onClick={handleBackButtonClick}>
        Back
      </button>
      <button type="submit" onClick={handleCourseObjectiveAPIButtonClick} disabled={coursesLoading}>
        Get Course Objective Data
      </button>
      <button type="submit" onClick={handleCourseStatisticsAPIButtonClick} disabled={statsLoading}>
        Get Course Statistics Data
      </button>

      <br />

      <Accordion
        style={{ borderRadius: 20, overflow: "hidden", marginLeft: "20%", marginRight: "20%" }}
        expanded={isOverallQuizStatisticsAccordionOpen}
        onChange={handleOverallQuizStatisticsAccordionToggle}
      >
        <AccordionSummary
          style={{
            border: "1px solid lightgray"
          }}
        >
          <div style={{ textAlign: "center", width: "100%" }}>
            <Typography>
              <b>
                {!isOverallQuizStatisticsAccordionOpen
                  ? "Click Here to See Overall Quiz Statistics"
                  : "Overall Canvas Quiz Statistics"}
              </b>
            </Typography>
          </div>
        </AccordionSummary>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography>
                  <b>Quiz Average:</b> {quizStatsResultsObj.quizAveragePointsEarned ?? "Quiz Average Not Defined"}
                </Typography>
              </TableCell>
              {quizStatsResultsObj.quizAveragePointsEarned && (
                <TableCell
                  style={{
                    border: "2px solid lightgray",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <XYPlot width={300} height={200} xDomain={[0, 1]} yType="ordinal" margin={{ left: 100 }}>
                    <XAxis />
                    <YAxis tickTotal={1} />
                    <HorizontalBarSeries
                      data={[{ y: "Quiz Average", x: quizStatsResultsObj.quizAveragePointsEarned }]}
                      barWidth={0.1}
                    />
                  </XYPlot>
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell>
                <Typography>
                  <b>Quiz Median:</b> {quizStatsResultsObj.quizMedianPointsEarned ?? "Quiz Median Not Defined"}
                </Typography>
              </TableCell>
              {quizStatsResultsObj.quizMedianPointsEarned && (
                <TableCell
                  style={{
                    border: "2px solid lightgray",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <XYPlot width={300} height={200} xDomain={[0, 1]} yType="ordinal" margin={{ left: 100 }}>
                    <XAxis />
                    <YAxis tickTotal={1} />
                    <HorizontalBarSeries
                      data={[{ y: "Quiz Median", x: quizStatsResultsObj.quizMedianPointsEarned }]}
                      barWidth={0.1}
                    />
                  </XYPlot>
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell>
                <Typography>
                  <b>Quiz Percentage Categories:</b> {quizStatsResultsObj.quizPercentageCategories.toString() ?? "[]"}
                </Typography>
              </TableCell>
              {quizStatsResultsObj.quizPercentageCategories && (
                <TableCell
                  style={{
                    border: "2px solid lightgray",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <XYPlot width={300} height={300} xDomain={[0, 1]} yType="ordinal" margin={{ left: 100 }}>
                    <XAxis />
                    <YAxis tickTotal={quizStatsResultsObj.quizPercentageCategories.length} />
                    <HorizontalBarSeries
                      data={quizStatsResultsObj.quizPercentageCategories.map((category, idx) => ({
                        y: PERCENTAGE_CATEGORIES[idx],
                        x: category
                      }))}
                      barWidth={0.1}
                    />
                  </XYPlot>
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </Accordion>

      <br />

      <Accordion
        style={{ borderRadius: 20, overflow: "hidden", marginLeft: "15%", marginRight: "15%" }}
        expanded={isLearningObjStatisticsAccordionOpen}
        onChange={handleLearningObjStatisticsAccordionToggle}
      >
        <AccordionSummary
          style={{
            border: "1px solid lightgray"
          }}
        >
          <div style={{ textAlign: "center", width: "100%" }}>
            <Typography>
              <b>
                {!isLearningObjStatisticsAccordionOpen
                  ? "Click Here to See This Quiz's Learning-Objective-Based Statistics"
                  : "Overall Learning-Objective-Based Statistics"}
              </b>
            </Typography>
          </div>
        </AccordionSummary>
        <Table>
          <TableBody>
            <TableRow>
              {quizStatsResultsObj.perLearningObjPercentageCategories &&
                quizStatsResultsObj.perLearningObjPercentageCategories.length > 0 &&
                quizStatsResultsObj.perLearningObjPercentageCategories.map((learningObjectiveArr, objIdx: number) => (
                  <Table>
                    <TableRow key={learningObjectiveArr[0]} style={{ height: "100%" }}>
                      <TableCell
                        style={{
                          border: "2px solid lightgray",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          flexGrow: 1,
                          height: "100%"
                        }}
                      >
                        <Typography>
                          Course Learning Objective {objIdx + 1}: {learningObjectiveArr[0]}
                        </Typography>
                      </TableCell>
                      <TableCell
                        style={{
                          border: "2px solid lightgray",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center"
                        }}
                      >
                        <XYPlot
                          width={600}
                          height={200}
                          xDomain={[-0.1, quizStatsResultsObj.perQuestionAveragePointsEarned.length * 1.1]}
                          margin={{ left: 80 }}
                        >
                          <XAxis />
                          <YAxis
                            tickTotal={4}
                            tickFormat={(tickIdx: number) => {
                              const answerText = PERCENTAGE_CATEGORIES[tickIdx];
                              return answerText.length > 10 ? answerText.slice(0, 10) + "..." : answerText; // Truncate long labels
                            }}
                          />
                          <HorizontalGridLines />
                          <VerticalGridLines />
                          <HorizontalBarSeries
                            data={learningObjectiveArr[1].map((category: number, innerIdx: number) => ({
                              y: innerIdx,
                              x: category
                            }))}
                            barWidth={0.1}
                          />
                        </XYPlot>
                      </TableCell>
                    </TableRow>
                  </Table>
                ))}
            </TableRow>
          </TableBody>
        </Table>
      </Accordion>

      <br />

      <Paper style={{ borderRadius: 20, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                style={{
                  border: "1px solid lightgray",
                  width: "50%",
                  textAlign: "center"
                }}
              >
                <Typography>
                  <b>Canvas Quiz Question</b>
                </Typography>
              </TableCell>
              <TableCell
                style={{
                  border: "1px solid lightgray",
                  width: "50%",
                  textAlign: "center"
                }}
              >
                <Typography>
                  <b>Individual Quiz Question Statistics</b>
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matchingCourseEntries[0] &&
              matchingCourseEntries[0].canvasQuizEntries.map((quizQuestion, idx) => (
                <TableRow key={`${matchingCourseEntries[0]._id}_${idx}`}>
                  <TableCell className="table-cell" style={{ maxWidth: "50%", border: "1px solid lightgray" }}>
                    <Typography style={{ maxWidth: "100%" }}>
                      <b>Question {idx + 1}:</b>
                    </Typography>
                    <div
                      style={{
                        border: "1px solid lightgray",
                        maxHeight: "300px",
                        overflow: "auto"
                      }}
                    >
                      <Typography>
                        <div
                          style={{
                            fontFamily: "inherit",
                            fontSize: "inherit",
                            overflow: "wrap",
                            maxWidth: "100%",
                            textOverflow: "ellipsis",
                            overflowWrap: "break-word",
                            marginBottom: "5px"
                          }}
                          dangerouslySetInnerHTML={{ __html: quizQuestion.questionText }}
                        />
                      </Typography>
                    </div>
                    <div style={{ padding: "10px 0" }}>
                      <Typography>
                        <b>Answer(s):</b>
                      </Typography>
                    </div>
                    {(quizQuestion.questionType === "multiple_choice_question" ||
                      quizQuestion.questionType === "multiple_answers_question" ||
                      quizQuestion.questionType === "multiple_dropdowns_question" ||
                      quizQuestion.questionType === "true_false_question") &&
                      quizQuestion.answers!.map((answer, idx) => (
                        <Typography>
                          {answer.weight > 0 ? (
                            <b>{`(${multipleChoiceQuestionLetters[idx]}) ${answer.text}`}</b>
                          ) : (
                            `(${multipleChoiceQuestionLetters[idx]}) ${answer.text}`
                          )}
                        </Typography>
                      ))}
                    {quizQuestion.questionType === "fill_in_multiple_blanks_question" &&
                      quizQuestion.answers!.map((answer) => (
                        <Typography>
                          {answer.weight > 0 ? (
                            <b>
                              <li>{`${answer.text}`}</li>
                            </b>
                          ) : (
                            <li>{`${answer.text}`}</li>
                          )}
                        </Typography>
                      ))}
                    {(quizQuestion.questionType === "numerical_question" ||
                      quizQuestion.questionType === "short_answer_question" ||
                      quizQuestion.questionType === "essay_question") && (
                      <textarea
                        readOnly={true}
                        style={{
                          width: "100%",
                          backgroundColor: "white",
                          fontFamily: "inherit",
                          fontSize: "inherit",
                          color: "black",
                          resize: "none",
                          overflowY: "hidden"
                        }}
                        placeholder={
                          quizQuestion.answers &&
                          quizQuestion.answers[0] &&
                          quizQuestion.answers[0] &&
                          quizQuestion.answers[0].text
                            ? `Default Answer Provided: "${quizQuestion.answers[0].text}"`
                            : "No Default Answer Provided: This is a default placeholder answer text"
                        }
                        onChange={handleAdjustmentTextareaHeight}
                      ></textarea>
                    )}
                  </TableCell>
                  <TableCell style={{ border: "2px solid lightgray" }}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell
                            style={{
                              border: "1px solid lightgray",
                              overflowX: "auto",
                              wordBreak: "break-all",
                              flex: "1 1 50%"
                            }}
                          >
                            <Typography>
                              <b>Average Points Earned</b>
                            </Typography>
                          </TableCell>
                          <TableCell style={{ border: "1px solid lightgray" }}>
                            <Typography>
                              {quizStatsResultsObj.perQuestionAveragePointsEarned[idx]
                                ? `${quizStatsResultsObj.perQuestionAveragePointsEarned[idx]?.toFixed(3).toString()} / 1.000`
                                : "No data to report"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            style={{
                              border: "1px solid lightgray",
                              overflowX: "auto",
                              wordBreak: "break-all",
                              flex: "1 1 50%"
                            }}
                          >
                            <Typography style={{ width: "50%" }}>
                              <b>Item Difficulty Index</b>
                            </Typography>
                          </TableCell>
                          <TableCell style={{ border: "1px solid lightgray" }}>
                            <Typography>
                              {quizStatsResultsObj.perQuestionItemDifficulty[idx]
                                ? `${quizStatsResultsObj.perQuestionItemDifficulty[idx]?.toFixed(3).toString()}`
                                : "No data to report"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        {quizStatsResultsObj.perQuestionAnswerFrequencies[idx] &&
                          (quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type ===
                            "multiple_choice_question" ||
                            quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type ===
                              "multiple_answers_question" ||
                            quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type ===
                              "true_false_question" ||
                            quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type === "essay_question" ||
                            quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type ===
                              "numerical_question" ||
                            quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type ===
                              "short_answer_question") &&
                          (quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_frequencies.length > 0 ? (
                            <>
                              <XYPlot
                                width={600}
                                height={
                                  quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_frequencies.length * 50
                                }
                                xDomain={[
                                  -0.1,
                                  Math.max(
                                    ...quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_frequencies.map(
                                      (value: CanvasQuizQuestionAnswerFrequencyArrEntry) => value.frequency_count
                                    )
                                  ) * 1.1
                                ]}
                                yDomain={[
                                  -0.1,
                                  quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_frequencies.length - 1
                                ]}
                                margin={{ left: 100 }}
                              >
                                <XAxis />
                                <YAxis
                                  tickTotal={
                                    quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_frequencies.length
                                  }
                                  hideLine
                                  tickFormat={(tickIdx: number) => {
                                    if (!Number.isInteger(tickIdx)) {
                                      return ""; // Return empty string for ticks beyond the available data
                                    }
                                    const answerText =
                                      quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_frequencies[tickIdx]
                                        .answer_text;
                                    if (answerText === "bottom") {
                                      return "No-Credit";
                                    } else if (answerText === "middle") {
                                      return "Half-Credit";
                                    } else if (answerText === "top") {
                                      return "Full-Credit";
                                    }
                                    return answerText.length > 10 ? answerText.slice(0, 10) + "..." : answerText; // Truncate long labels
                                  }}
                                />
                                <HorizontalGridLines />
                                <VerticalGridLines />
                                <HorizontalBarSeries
                                  data={quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_frequencies.map(
                                    (value: CanvasQuizQuestionAnswerFrequencyArrEntry, innerIdx: number) => ({
                                      y: innerIdx,
                                      x: value.frequency_count
                                    })
                                  )}
                                  barWidth={0.1}
                                />
                              </XYPlot>
                            </>
                          ) : (
                            <>No Answer Frequency Data found at this time.</>
                          ))}
                        {quizStatsResultsObj.perQuestionAnswerFrequencies[idx] &&
                          (quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type ==
                            "fill_in_multiple_blanks_question" ||
                            quizStatsResultsObj.perQuestionAnswerFrequencies[idx].question_type ===
                              "multiple_dropdowns_question") &&
                          (quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_set_frequencies.length > 0 ? (
                            <>
                              {quizStatsResultsObj.perQuestionAnswerFrequencies[idx].answer_set_frequencies.map(
                                (answer_set: CanvasQuizQuestionAnswerSetFrequencyArrEntry) => (
                                  <>
                                    <Table>
                                      <TableHead>
                                        <TableRow>
                                          <Typography style={{ marginTop: 10 }}>
                                            --- "{answer_set.answer_set_text}" Section ---
                                          </Typography>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        <TableRow>
                                          <XYPlot
                                            width={600}
                                            height={answer_set.answer_frequencies.length * 50}
                                            xDomain={[
                                              -0.1,
                                              Math.max(
                                                ...answer_set.answer_frequencies.map(
                                                  (value: CanvasQuizQuestionAnswerFrequencyArrEntry) =>
                                                    value.frequency_count
                                                )
                                              ) * 1.1
                                            ]}
                                            yDomain={[-0.1, answer_set.answer_frequencies.length - 1]}
                                            margin={{ left: 100 }}
                                          >
                                            <XAxis />
                                            <YAxis
                                              tickTotal={answer_set.answer_frequencies.length}
                                              hideLine
                                              tickFormat={(tickIdx: number) => {
                                                const answerText = answer_set.answer_frequencies[tickIdx].answer_text;
                                                return answerText.length > 10
                                                  ? answerText.slice(0, 10) + "..."
                                                  : answerText; // Truncate long labels
                                              }}
                                            />
                                            <HorizontalGridLines />
                                            <VerticalGridLines />
                                            <HorizontalBarSeries
                                              data={answer_set.answer_frequencies.map(
                                                (
                                                  value: CanvasQuizQuestionAnswerFrequencyArrEntry,
                                                  innerIdx: number
                                                ) => ({
                                                  y: innerIdx,
                                                  x: value.frequency_count
                                                })
                                              )}
                                              barWidth={0.1}
                                            />
                                          </XYPlot>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </>
                                )
                              )}
                            </>
                          ) : (
                            <>No Answer Frequency Data found at this time.</>
                          ))}
                      </TableBody>
                    </Table>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
      <button type="reset" onClick={handleBackButtonClick}>
        Click Here to Go Back
      </button>
    </>
  );
};

export default QuizStatistics;
