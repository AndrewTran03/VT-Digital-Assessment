import { XYPlot, XAxis, YAxis, HorizontalBarSeries } from "react-vis";
import { useState, useEffect, useContext, FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Paper, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import Typography from "@mui/material/Typography";
import {
  backendUrlBase,
  multipleChoiceQuestionLetters,
  CanvasLearningObjectives,
  CanvasCourseQuizMongoDBEntry,
  CanvasQuizStatistic
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
  const [canvasStatData] = useState(
    canvasQuizQuestionStatisticDataArr.length === 0
      ? JSON.parse(window.localStorage.getItem("canvasStatsArr") ?? "[]")
      : canvasQuizQuestionStatisticDataArr
  );
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
  const matchingStatEntries = canvasStatData.filter(
    (data: CanvasQuizStatistic) =>
      data.url.includes(canvasCourseInternalId.toString()) && data.url.includes(canvasQuizId.toString())
  );
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

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
      });
    setStatsLoading(false);
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

  const data = [
    { x: 10, y: 1 },
    { x: 15, y: 2 },
    { x: 20, y: 3 },
    { x: 25, y: 4 },
    { x: 30, y: 5 }
  ];

  return (
    <>
      <Typography fontSize={24}>
        <b>
          Match Learning-Objectives for{" "}
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
      <Paper style={{ borderRadius: 20, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                style={{
                  border: "1px solid lightgray",
                  width: "50%"
                }}
              >
                <Typography>
                  <b>Canvas Quiz Question</b>
                </Typography>
              </TableCell>
              <TableCell style={{ border: "1px solid lightgray" }}>
                <Typography>
                  <b>Learning Objective</b>
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
                    <XYPlot width={300} height={200} yType="ordinal">
                      <XAxis />
                      <YAxis />
                      <HorizontalBarSeries data={data} barWidth={0.5} />
                    </XYPlot>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
};

export default QuizStatistics;
