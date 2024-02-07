import { useState, useEffect, useContext, FormEvent } from "react";
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
  const [canvasCourseInternalId] = useState(canvasLearningObjectiveData.canvasCourseInternalId);
  const [quizId] = useState(canvasLearningObjectiveData.quizId);
  const [formMode] = useState(canvasLearningObjectiveData.formMode);
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
  const matchingEntry = canvasQuizDataArr.filter(
    (data) => data.canvasCourseInternalId === canvasCourseInternalId && data.quizId === quizId
  );
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      await fetchCanvasLearningObjectiveData();
      console.clear();
    }
    fetchData();
  }, []);

  useEffect(() => {
    console.assert(matchingEntry.length === 1);
    console.log(matchingEntry.length);
    if (matchingEntry.length === 1) {
      console.log("LENGTH IS 1: FILTERING IS A SUCCESS!");
      console.log(matchingEntry[0]);
    }
  }, [matchingEntry]);

  async function fetchCanvasLearningObjectiveData() {
    await axios.get(`${backendUrlBase}/api/objective/${canvasCourseInternalId}`).then((res) => {
      const parsedResult = parseLearningObjectiveMongoDBDCollection(res.data[0]);
      setLearningCourseObjectiveData(parsedResult);
    });
    console.log(canvasQuizDataArr);
  }

  function extractTextFromHTML(htmlStr: string) {
    const htmlParser = new DOMParser();
    const document = htmlParser.parseFromString(htmlStr, "text/html");
    return document.body.textContent || "";
  }

  async function handleAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasLearningObjectiveData();
  }

  function handleSubmit(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    console.log("Pressed submit button successfully!");
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
                  borderRight: "1px solid lightgray",
                  paddingRight: "8px"
                }}
              >
                Canvas Quiz Question
              </TableCell>
              <TableCell>Learning Objective</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matchingEntry[0] &&
              matchingEntry[0].canvasQuizEntries.map((quizQuestion, idx) => (
                <TableRow key={`${matchingEntry[0]._id}_${idx}`}>
                  <TableCell className="table-cell">
                    <Typography>
                      <b>Question {idx + 1}:</b> {extractTextFromHTML(quizQuestion.questionText)}
                    </Typography>
                    {quizQuestion.questionType.includes("multiple") &&
                      quizQuestion.answers!.map((answer, idx) => (
                        <Typography>
                          ({multipleChoiceQuestionLetters[idx]}) {answer.text}
                        </Typography>
                      ))}
                  </TableCell>
                  <TableCell>
                    <Accordion>
                      <AccordionSummary>
                        <Typography>Click Here to Select the Learning Objective</Typography>
                      </AccordionSummary>
                      <FormControl>
                        <FormLabel id="demo-radio-buttons-group-label">
                          Current Selected Learning-Objective:
                          {!selectedAnswers[idx] ? "No answer selected yet" : selectedAnswers[idx]}
                        </FormLabel>
                        <RadioGroup
                          aria-labelledby="demo-radio-buttons-group-label"
                          name="radio-buttons-group"
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
      <button type="submit" onClick={handleSubmit}>
        Submit Results
      </button>
    </>
  );
};

export default LearningObjectiveMatcher;
