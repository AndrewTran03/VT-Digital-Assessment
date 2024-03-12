import { useState, useEffect, useContext, FormEvent } from "react";
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
import { backendUrlBase, CanvasLearningObjectives, CanvasCourseAssignmentRubricObjMongoDBEntry } from "../shared/types";
import { parseLearningObjectiveMongoDBDCollection } from "../shared/FrontendParser";
import { CanvasAssignmentWithRubricContext, AssignmentWithRubricLearningObjectiveContext } from "../shared/contexts";
import "../styles/TableCellStyles.css";

const AssignmentRubricLearningObjectiveMatcher: React.FC = () => {
  const { assignmentWithRubricDataArr } = useContext(CanvasAssignmentWithRubricContext);
  const { canvasAssignmentWithRubricLearningObjectiveData } = useContext(AssignmentWithRubricLearningObjectiveContext);
  const assignmentWithRubricData: CanvasCourseAssignmentRubricObjMongoDBEntry[] =
    assignmentWithRubricDataArr.length === 0
      ? JSON.parse(window.localStorage.getItem("assignmentWithRubricArr") ?? "[]")
      : assignmentWithRubricDataArr;
  const [canvasCourseInternalId] = useState(
    canvasAssignmentWithRubricLearningObjectiveData.canvasCourseInternalId ||
      parseInt(window.localStorage.getItem("canvasCourseInternalId") ?? "0")
  );
  const [canvasRubricId] = useState(
    canvasAssignmentWithRubricLearningObjectiveData.rubricId ||
      parseInt(window.localStorage.getItem("canvasRubricId") ?? "0")
  );
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
  const matchingEntries = assignmentWithRubricData.filter(
    (data: CanvasCourseAssignmentRubricObjMongoDBEntry) =>
      data.canvasCourseInternalId === canvasCourseInternalId && data.canvasRubricId === canvasRubricId
  );
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    matchingEntries.length === 1 ? matchingEntries[0].canvasMatchedLearningObjectivesArr : []
  );
  const [coursesLoading, setCoursesLoading] = useState(false);

  async function fetchData() {
    console.clear();
    await fetchCanvasLearningObjectiveData();
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

  async function handleAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasLearningObjectiveData();
  }

  function handleBackButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Back button pressed!");
    window.localStorage.removeItem("assignmentWithRubricArr");
    window.localStorage.removeItem("canvasCourseInternalId");
    window.localStorage.removeItem("canvasRubricId");
    navigate(-1);
  }

  async function handleSubmit(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    console.log("Pressed submit button successfully!");
    console.assert(matchingEntries.length === 1);
    console.log(`${matchingEntries[0]._id}`);
    await axios
      .put(
        `${backendUrlBase}/api/canvas/assignment_rubric/update_objectives/${matchingEntries[0]._id}`,
        selectedAnswers
      )
      .then((res) => console.log(res));
    window.localStorage.removeItem("assignmentWithRubricArr");
    window.localStorage.removeItem("canvasCourseInternalId");
    window.localStorage.removeItem("canvasRubricId");
    navigate(-1);
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>
          Match Learning-Objectives for{" "}
          <i>
            "{matchingEntries[0].canvasAssignmentName}" (ID: {matchingEntries[0].canvasAssignmentId})
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
                  <b>Canvas Assignment and Rubric Description</b>
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matchingEntries[0] &&
              matchingEntries[0].rubricData.map((rubricCategory, idx) => (
                <TableRow key={`${matchingEntries[0]._id}_${idx}`}>
                  <TableCell className="table-cell" style={{ maxWidth: "50%", border: "1px solid lightgray" }}>
                    <Typography style={{ maxWidth: "100%" }}>
                      <b>Criteria {idx + 1}:</b> {rubricCategory.description}
                    </Typography>
                    <Table
                      style={{
                        border: "1px solid lightgray",
                        maxHeight: "300px",
                        overflow: "auto"
                      }}
                    >
                      <TableHead>
                        <TableCell
                          style={{
                            border: "1px solid lightgray",
                            maxHeight: "300px",
                            overflow: "auto"
                          }}
                        >
                          <Typography>Description</Typography>
                        </TableCell>
                        <TableCell
                          style={{
                            border: "1px solid lightgray",
                            maxHeight: "300px",
                            overflow: "auto"
                          }}
                        >
                          <Typography>Category Rating Points</Typography>
                        </TableCell>
                      </TableHead>
                      {rubricCategory.ratings &&
                        rubricCategory.ratings.length > 0 &&
                        rubricCategory.ratings.map((rating) => (
                          <TableBody>
                            <TableCell
                              style={{
                                border: "1px solid lightgray",
                                maxHeight: "300px",
                                overflow: "auto"
                              }}
                            >
                              <Typography>{rating.description}</Typography>
                            </TableCell>
                            <TableCell
                              style={{
                                border: "1px solid lightgray",
                                maxHeight: "300px",
                                overflow: "auto"
                              }}
                            >
                              <Typography>{rating.ratingPoints}</Typography>
                            </TableCell>
                          </TableBody>
                        ))}
                    </Table>
                  </TableCell>
                  <TableCell style={{ border: "2px solid lightgray" }}>
                    <FormLabel id="demo-radio-buttons-group-label" style={{ marginBottom: "10px" }}>
                      Current Selected Learning-Objective:
                      {!selectedAnswers[idx] ? " No answer selected yet" : ` ${selectedAnswers[idx]}`}
                    </FormLabel>
                    <Accordion style={{ borderRadius: 20, overflow: "hidden" }}>
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

export default AssignmentRubricLearningObjectiveMatcher;
