import { useState, useEffect, useContext, FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Accordion,
  AccordionSummary,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  FormControl
} from "@mui/material";
import {
  backendUrlBase,
  multipleChoiceQuestionLetters,
  CanvasLearningObjectives,
  CanvasCourseQuizMongoDBEntry
} from "../shared/types";
import { parseLearningObjectiveMongoDBDCollection } from "../shared/FrontendParser";
import { CanvasQuizQuestionContext, LearningObjectiveContext } from "../shared/contexts";
import "../styles/TableCellStyles.css";

const LearningObjectiveMatcher: React.FC = () => {
  const { canvasQuizDataArr } = useContext(CanvasQuizQuestionContext);
  const { canvasLearningObjectiveData } = useContext(LearningObjectiveContext);
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
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [learningCourseObjectiveData, setLearningCourseObjectiveData] = useState<CanvasLearningObjectives>({
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
  const matchingEntries = canvasQuizData.filter(
    (data: CanvasCourseQuizMongoDBEntry) =>
      data.canvasCourseInternalId === canvasCourseInternalId && data.quizId === canvasQuizId
  );
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    matchingEntries.length === 1 ? matchingEntries[0].canvasMatchedLearningObjectivesArr : []
  );
  const [coursesLoading, setCoursesLoading] = useState(false);

  async function fetchData() {
    await fetchCanvasLearningObjectiveData();
    console.clear();
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.assert(matchingEntries.length === 1);
    console.log(matchingEntries.length);
    if (matchingEntries.length === 1) {
      console.log("LENGTH IS 1: FILTERING IS A SUCCESS!");
      console.log(matchingEntries[0]);
    }
  }, [matchingEntries]);

  async function fetchCanvasLearningObjectiveData() {
    setCoursesLoading(true);
    await axios.get(`${backendUrlBase}/api/objective/${canvasCourseInternalId}`).then((res) => {
      const parsedResult = parseLearningObjectiveMongoDBDCollection(res.data[0]);
      setLearningCourseObjectiveData(parsedResult);
    });
    setCoursesLoading(false);
  }

  function handleAdjustmentTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.rows = 1;
      textareaRef.current.rows = Math.ceil(textareaRef.current.scrollHeight / 10);
    }
  }

  async function handleAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasLearningObjectiveData();
  }

  function handleBackButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Back button pressed!");
    window.localStorage.removeItem("canvasQuizDataArr");
    window.localStorage.removeItem("canvasCourseInternalId");
    window.localStorage.removeItem("canvasQuizId");
    navigate(-1);
  }

  async function handleSubmit(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    console.log("Pressed submit button successfully!");
    console.assert(matchingEntries.length === 1);
    console.log(`${matchingEntries[0]._id}`);
    await axios
      .put(`${backendUrlBase}/api/canvas/update_objectives/${matchingEntries[0]._id}`, selectedAnswers)
      .then((res) => console.log(res));
    window.localStorage.removeItem("canvasQuizDataArr");
    window.localStorage.removeItem("canvasCourseInternalId");
    window.localStorage.removeItem("canvasQuizId");
    navigate(-1);
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>
          Match Learning-Objectives for{" "}
          <i>
            "{matchingEntries[0].quizName}" (ID: {matchingEntries[0].quizId})
          </i>
        </b>
      </Typography>
      <button type="reset" onClick={handleBackButtonClick}>
        Back
      </button>
      <button type="submit" onClick={handleAPIButtonClick} disabled={coursesLoading}>
        Get Course Objective Data
      </button>
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
                  <b>Learning Objective Matching</b>
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matchingEntries[0] &&
              matchingEntries[0].canvasQuizEntries.map((quizQuestion, idx) => (
                <TableRow key={`${matchingEntries[0]._id}_${idx}`}>
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
                    <FormLabel id="demo-radio-buttons-group-label" style={{ marginBottom: "10px" }}>
                      Current Selected Learning-Objective:
                      {!selectedAnswers[idx] ? " No answer selected yet" : ` ${selectedAnswers[idx]}`}
                    </FormLabel>
                    <Accordion style={{ borderRadius: 20, overflow: "hidden" }} >
                      <AccordionSummary>
                        <Typography>Click Here to Select Additional Learning Objectives</Typography>
                      </AccordionSummary>
                      <FormControl>
                        <RadioGroup
                          aria-labelledby="demo-radio-buttons-group-label"
                          name="radio-buttons-group"
                          defaultValue={selectedAnswers[idx] ? selectedAnswers[idx] : ""}
                          onChange={(e) => {
                            const updatedAnswers = [...selectedAnswers];
                            updatedAnswers[idx] = e.target.value;
                            setSelectedAnswers(updatedAnswers);
                          }}
                        >
                          {learningCourseObjectiveData && learningCourseObjectiveData.canvasObjectives.length > 0 ? (
                            learningCourseObjectiveData.canvasObjectives.map((canvasObj) => (
                              <FormControlLabel
                                key={canvasObj.toString()}
                                value={canvasObj.toString()}
                                control={<Radio style={{ fontSize: "0.8rem" }} />}
                                label={canvasObj.toString()}
                              />
                            ))
                          ) : (
                            <p>No items found.</p>
                          )}
                        </RadioGroup>
                      </FormControl>
                    </Accordion>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
      <button type="submit" disabled={matchingEntries.length !== 1 || coursesLoading} onClick={handleSubmit}>
        Submit Results
      </button>
    </>
  );
};

export default LearningObjectiveMatcher;
