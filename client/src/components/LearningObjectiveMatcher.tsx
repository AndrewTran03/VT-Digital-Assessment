import { useState, useEffect, useContext, FormEvent } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Accordion, AccordionSummary } from "@mui/material";
import Typography from "@mui/material/Typography";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { backendUrlBase, multipleChoiceQuestionLetters } from "../assets/types";
import { parseLearningObjectiveMongoDBDCollection } from "../shared/FrontendParser";
import { CanvasQuizQuestionContext, LearningObjectiveContext } from "../shared";

type Props = {
  canvasCourseInternalId?: number;
  quizId?: number;
};

const LearningObjectiveMatcher: React.FC<Props> = (props) => {
  const { canvasQuizDataArr } = useContext(CanvasQuizQuestionContext);
  const { courseLearningObjectiveData, setLearningCourseObjectiveData } = useContext(LearningObjectiveContext);
  const [canvasCourseInternalId, setCanvasCourseInternalId] = useState(props.canvasCourseInternalId || 0);
  const [quizId, setQuizId] = useState(props.quizId || 0);
  const matchingEntry = canvasQuizDataArr.filter(
    (data) => data.canvasCourseInternalId === canvasCourseInternalId && data.quizId === quizId
  );
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const location = useLocation();

  // Link Props: useState() Change and Management
  useEffect(() => {
    if (location.state && !Object.values(location.state).includes(undefined)) {
      const newCanvasCourseInternalId = location.state.canvasCourseInternalId;
      setCanvasCourseInternalId(newCanvasCourseInternalId);
      const quizId = location.state.quizId;
      setQuizId(quizId);
    }
  }, [location.state]);

  useEffect(() => {
    async function fetchData() {
      await fetchCanvasLearningObjectiveData();
      console.log(canvasQuizDataArr);
    }
    fetchData();
  }, []);

  useEffect(() => {
    console.log(courseLearningObjectiveData);
  }, [courseLearningObjectiveData]);

  useEffect(() => {
    console.log("NEW INTERNAL: " + canvasCourseInternalId);
    console.log("NEW QUIZ: " + quizId);
  }, [canvasCourseInternalId, quizId]);

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
      console.log("Before");
      console.log(res.data);
      const parsedResult = parseLearningObjectiveMongoDBDCollection(res.data[0]);
      console.log(parsedResult);
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
                <TableRow key={matchingEntry[0]._id}>
                  <TableCell
                    style={{
                      width: "40%",
                      maxWidth: "40%",
                      overflow: "wrap",
                      textOverflow: "ellipsis",
                      overflowWrap: "break-word",
                      borderRight: "1px solid lightgray",
                      paddingRight: "8px"
                    }}
                  >
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
                          Current Selected Answer:{" "}
                          {!selectedAnswers[idx] ? "No answer selected for this question yet" : selectedAnswers[idx]}
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
                          {courseLearningObjectiveData && courseLearningObjectiveData.canvasObjectives.length > 0 ? (
                            courseLearningObjectiveData.canvasObjectives.map((canvasObj) => (
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
