import { useState, useEffect, useContext, FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Accordion, AccordionSummary } from "@mui/material";
import Typography from "@mui/material/Typography";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { backendUrlBase, multipleChoiceQuestionLetters, CanvasLearningObjectives } from "../shared/types";
import { parseLearningObjectiveMongoDBDCollection } from "../shared/FrontendParser";
import { CanvasQuizQuestionContext, LearningObjectiveContext } from "../shared";
import "../styles/TableCellStyles.css";

const LearningObjectiveMatcher: React.FC = () => {
  const { canvasQuizDataArr } = useContext(CanvasQuizQuestionContext);
  const { canvasLearningObjectiveData } = useContext(LearningObjectiveContext);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
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
  const matchingEntries = canvasQuizDataArr.filter(
    (data) =>
      data.canvasCourseInternalId === canvasLearningObjectiveData.canvasCourseInternalId &&
      data.quizId === canvasLearningObjectiveData.quizId
  );
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    matchingEntries.length === 1 ? matchingEntries[0].canvasMatchedLearningObjectivesArr : []
  );

  useEffect(() => {
    async function fetchData() {
      await fetchCanvasLearningObjectiveData();
      console.clear();
    }
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
    await axios
      .get(`${backendUrlBase}/api/objective/${canvasLearningObjectiveData.canvasCourseInternalId}`)
      .then((res) => {
        const parsedResult = parseLearningObjectiveMongoDBDCollection(res.data[0]);
        setLearningCourseObjectiveData(parsedResult);
      });
  }

  function extractTextFromHTML(htmlStr: string) {
    const htmlParser = new DOMParser();
    const document = htmlParser.parseFromString(htmlStr, "text/html");
    return document.body.textContent || "";
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

  async function handleSubmit(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    console.log("Pressed submit button successfully!");
    console.assert(matchingEntries.length === 1);
    console.log(`${matchingEntries[0]._id}`);
    await axios
      .put(`${backendUrlBase}/api/canvas/update_objectives/${matchingEntries[0]._id}`, selectedAnswers)
      .then((res) => console.log(res));
    navigate(-1);
  }

  return (
    <>
      Got to the Learning-Objective-Match component
      <button type="submit" onClick={handleAPIButtonClick}>
        Get Course Objective Data
      </button>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                style={{
                  border: "1px solid lightgray",
                  width: "50%"
                }}
              >
                Canvas Quiz Question
              </TableCell>
              <TableCell style={{ border: "1px solid lightgray" }}>Learning Objective</TableCell>
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
                    <Accordion>
                      <AccordionSummary>
                        <Typography>Click Here to Select the Learning Objective</Typography>
                      </AccordionSummary>
                      <FormControl>
                        <FormLabel id="demo-radio-buttons-group-label" style={{ marginBottom: "10px" }}>
                          Current Selected Learning-Objective:
                          {!selectedAnswers[idx] ? " No answer selected yet" : ` ${selectedAnswers[idx]}`}
                        </FormLabel>
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
      <button type="submit" disabled={matchingEntries.length !== 1} onClick={handleSubmit}>
        Submit Results
      </button>
    </>
  );
};

export default LearningObjectiveMatcher;
