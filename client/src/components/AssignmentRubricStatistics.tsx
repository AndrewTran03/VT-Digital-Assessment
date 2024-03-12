import { XYPlot, XAxis, YAxis, HorizontalBarSeries, HorizontalGridLines, VerticalGridLines } from "react-vis";
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
  Typography
} from "@mui/material";
import {
  backendUrlBase,
  CanvasCourseAssignmentRubricObjMongoDBEntry,
  CanvasAssignmentWithRubricStatisticsResultObj,
  RubricRatingSubmissionScore
} from "../shared/types";
import { AssignmentWithRubricLearningObjectiveContext, CanvasAssignmentWithRubricContext } from "../shared/contexts";
import "../styles/TableCellStyles.css";

const AssignmentRubricStatistics: React.FC = () => {
  const PERCENTAGE_CATEGORIES = ["Exceeds", "Meets", "Below", "None"] as const;
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
  const matchingAssignmentEntries = assignmentWithRubricData.filter(
    (data: CanvasCourseAssignmentRubricObjMongoDBEntry) =>
      data.canvasCourseInternalId === canvasCourseInternalId && data.canvasRubricId === canvasRubricId
  );
  const [assignmentWithRubricStatsResultsObj, setAssignmentWithRubricStatsResultsObj] =
    useState<CanvasAssignmentWithRubricStatisticsResultObj>({
      assignmentAveragePointsEarned: 0,
      assignmentMedianPointsEarned: 0,
      assignmentPercentageCategories: [],
      perLearningObjPercentageCategories: [],
      perRubricCritieriaAveragePointsEarned: [],
      perRubricCritieriaMedianPointsEarned: [],
      perRubricCriteriaAnswerFrequencies: []
    });
  const [statsLoading, setStatsLoading] = useState(false);
  const [
    isOverallAssignmentWithRubricStatisticsAccordionOpen,
    setIsOverallAssignmentWithRubricStatisticsAccordionOpen
  ] = useState(false);
  const [isLearningObjStatisticsAccordionOpen, setIsLearningObjStatisticsAccordionOpen] = useState(false);

  async function fetchData() {
    console.clear();
    await fetchCanvasStatisticsData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.assert(matchingAssignmentEntries.length === 1);
    console.log(matchingAssignmentEntries.length);
    if (matchingAssignmentEntries.length === 1) {
      console.log("LENGTH IS 1: ASSIGNMENT FILTERING IS A SUCCESS!");
      console.log(matchingAssignmentEntries[0]);
    }
  }, [matchingAssignmentEntries]);

  useEffect(() => {
    console.log("ANSWER FREQ STUFF:");
    if (assignmentWithRubricStatsResultsObj) {
      assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies.forEach((answerFreq) => {
        console.log(answerFreq.ratingsSubArr);
      });
    }
  }, [assignmentWithRubricStatsResultsObj]);

  async function fetchCanvasStatisticsData() {
    setStatsLoading(true);
    await axios.post(`${backendUrlBase}/api/statistics/assignment_rubric`, matchingAssignmentEntries[0]).then((res) => {
      console.log(res.data);
      setAssignmentWithRubricStatsResultsObj(res.data as CanvasAssignmentWithRubricStatisticsResultObj);
    });
    setStatsLoading(false);
  }

  function handleOverallAssignmentWithRubricStatisticsAccordionToggle() {
    setIsOverallAssignmentWithRubricStatisticsAccordionOpen((prevState) => !prevState);
  }

  function handleLearningObjStatisticsAccordionToggle() {
    setIsLearningObjStatisticsAccordionOpen((prevState) => !prevState);
  }

  async function handleCourseStatisticsAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasStatisticsData();
  }

  function handleBackButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Back button pressed!");
    window.localStorage.removeItem("assignmentWithRubricArr");
    window.localStorage.removeItem("canvasCourseInternalId");
    window.localStorage.removeItem("canvasRubricId");
    navigate(-1);
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>
          Canvas Assignment Statistics for{" "}
          <i>
            "{matchingAssignmentEntries[0].canvasAssignmentName}" (ID: {matchingAssignmentEntries[0].canvasAssignmentId}
            )
          </i>
        </b>
      </Typography>
      <button type="reset" onClick={handleBackButtonClick}>
        Back
      </button>
      <button type="submit" onClick={handleCourseStatisticsAPIButtonClick} disabled={statsLoading}>
        Get Assignment Statistics Data
      </button>

      <br />

      <Accordion
        style={{ borderRadius: 20, overflow: "hidden", marginLeft: "20%", marginRight: "20%" }}
        expanded={isOverallAssignmentWithRubricStatisticsAccordionOpen}
        onChange={handleOverallAssignmentWithRubricStatisticsAccordionToggle}
      >
        <AccordionSummary
          style={{
            border: "1px solid lightgray"
          }}
        >
          <div style={{ textAlign: "center", width: "100%" }}>
            <Typography>
              <b>
                {!isOverallAssignmentWithRubricStatisticsAccordionOpen
                  ? "Click Here to See Overall Assignment Statistics"
                  : "Overall Canvas Assignment Statistics"}
              </b>
            </Typography>
          </div>
        </AccordionSummary>
        <Table>
          <TableBody>
            <TableRow>
              <Table>
                <TableRow>
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
                      <b>Assign. Avg:</b>{" "}
                      {assignmentWithRubricStatsResultsObj.assignmentAveragePointsEarned.toFixed(3) ??
                        "Assignment Average Not Defined"}
                    </Typography>
                  </TableCell>
                  {assignmentWithRubricStatsResultsObj.assignmentAveragePointsEarned && (
                    <TableCell
                      style={{
                        border: "2px solid lightgray",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <XYPlot width={600} height={300} xDomain={[0, 1]} yType="ordinal" margin={{ left: 100 }}>
                        <XAxis />
                        <YAxis tickTotal={1} />
                        <HorizontalBarSeries
                          data={[
                            { y: "Assign. Avg", x: assignmentWithRubricStatsResultsObj.assignmentAveragePointsEarned }
                          ]}
                          barWidth={0.05}
                        />
                      </XYPlot>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
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
                      <b>Assign. Med:</b>{" "}
                      {assignmentWithRubricStatsResultsObj.assignmentMedianPointsEarned.toFixed(3) ??
                        "Assignment Median Not Defined"}
                    </Typography>
                  </TableCell>
                  {assignmentWithRubricStatsResultsObj.assignmentMedianPointsEarned && (
                    <TableCell
                      style={{
                        border: "2px solid lightgray",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <XYPlot width={600} height={300} xDomain={[0, 1]} yType="ordinal" margin={{ left: 100 }}>
                        <XAxis />
                        <YAxis tickTotal={1} />
                        <HorizontalBarSeries
                          data={[
                            { y: "Assign. Med:", x: assignmentWithRubricStatsResultsObj.assignmentMedianPointsEarned }
                          ]}
                          barWidth={0.05}
                        />
                      </XYPlot>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
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
                      <b>Assignment Percentage Categories:</b>
                      <ul>
                        {assignmentWithRubricStatsResultsObj.assignmentPercentageCategories &&
                          assignmentWithRubricStatsResultsObj.assignmentPercentageCategories.length > 0 &&
                          assignmentWithRubricStatsResultsObj.assignmentPercentageCategories.map(
                            (percentageCategory, idx: number) => (
                              <li>
                                {PERCENTAGE_CATEGORIES[idx]}: {percentageCategory.toString()}
                              </li>
                            )
                          )}
                      </ul>
                    </Typography>
                  </TableCell>
                  {assignmentWithRubricStatsResultsObj.assignmentPercentageCategories && (
                    <TableCell
                      style={{
                        border: "2px solid lightgray",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <XYPlot width={600} height={300} xDomain={[0, 1]} yType="ordinal" margin={{ left: 100 }}>
                        <XAxis />
                        <YAxis tickTotal={assignmentWithRubricStatsResultsObj.assignmentPercentageCategories.length} />
                        <HorizontalBarSeries
                          data={assignmentWithRubricStatsResultsObj.assignmentPercentageCategories.map(
                            (percentageCategory, idx: number) => ({
                              y: PERCENTAGE_CATEGORIES[idx],
                              x: percentageCategory.toString()
                            })
                          )}
                          barWidth={0.1}
                        />
                      </XYPlot>
                    </TableCell>
                  )}
                </TableRow>
              </Table>
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
                  ? "Click Here to See This Assignment's Learning-Objective-Based Statistics"
                  : "Overall Assignment Learning-Objective-Based Statistics"}
              </b>
            </Typography>
          </div>
        </AccordionSummary>
        <Table>
          <TableBody>
            <TableRow>
              {assignmentWithRubricStatsResultsObj.perLearningObjPercentageCategories &&
              assignmentWithRubricStatsResultsObj.perLearningObjPercentageCategories.length > 0 ? (
                assignmentWithRubricStatsResultsObj.perLearningObjPercentageCategories.map(
                  (learningObjectiveArr, objIdx: number) => (
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
                          <Typography
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              flexGrow: 1,
                              height: "100%"
                            }}
                          >
                            Course Learning Objective {objIdx + 1}: {learningObjectiveArr[0]}
                            <ul>
                              {learningObjectiveArr[1].map((category: number, innerIdx: number) => (
                                <li>
                                  {PERCENTAGE_CATEGORIES[innerIdx]}: {category}
                                </li>
                              ))}
                            </ul>
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
                          <XYPlot width={600} height={200} xDomain={[-0.01, 1]} margin={{ left: 80 }}>
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
                  )
                )
              ) : (
                <Typography
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    flexGrow: 1,
                    height: "100%"
                  }}
                >
                  No Learning-Objective-Based Statistics can be reported. <br /> Please check if you have assigned
                  Canvas Learning Objectives for this assignment yet prior to opening this modal!
                </Typography>
              )}
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
                  <b>Canvas Assignment Rubric Category</b>
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
                  <b>Individual Assignment Rubric Category Statistics</b>
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matchingAssignmentEntries[0] &&
              matchingAssignmentEntries[0].rubricData &&
              matchingAssignmentEntries[0].rubricData.length > 0 &&
              matchingAssignmentEntries[0].rubricData.map((rubricCategory, idx) => (
                <TableRow key={`${matchingAssignmentEntries[0]._id}_${idx}`}>
                  <TableCell className="table-cell" style={{ maxWidth: "50%", border: "1px solid lightgray" }}>
                    <Typography style={{ maxWidth: "100%" }}>
                      <b>Criteria {idx + 1}:</b> {rubricCategory.description}
                    </Typography>
                    <Table>
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
                  <TableCell>
                    {assignmentWithRubricStatsResultsObj &&
                      assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies &&
                      assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies.length > 0 && (
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <Typography>
                                  <b>Average Points Earned for Rubric Criteria:</b>{" "}
                                  {assignmentWithRubricStatsResultsObj.perRubricCritieriaAveragePointsEarned[idx].toFixed(3)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <Typography>
                                  <b>Median Points Earned for Rubric Criteria:</b>{" "}
                                  {assignmentWithRubricStatsResultsObj.perRubricCritieriaMedianPointsEarned[idx].toFixed(3)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              {assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies[idx]
                                .ratingsSubArr && (
                                <>
                                  <XYPlot
                                    width={600}
                                    height={
                                      assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies[idx]
                                        .ratingsSubArr.length * 50
                                    }
                                    xDomain={[
                                      -0.1,
                                      Math.max(
                                        ...assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies[
                                          idx
                                        ].ratingsSubArr.map((value: RubricRatingSubmissionScore) => value.ratingCount)
                                      ) * 1.1
                                    ]}
                                    yDomain={[
                                      -0.1,
                                      assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies[idx]
                                        .ratingsSubArr.length - 1
                                    ]}
                                    margin={{ left: 90 }}
                                  >
                                    <XAxis />
                                    <YAxis
                                      tickTotal={
                                        assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies[idx]
                                          .ratingsSubArr.length
                                      }
                                      tickFormat={(tickIdx: number) => {
                                        if (!Number.isInteger(tickIdx)) {
                                          return ""; // Return empty string for ticks beyond the available data
                                        }
                                        const answerText =
                                          assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies[idx]
                                            .ratingsSubArr[tickIdx].description;
                                        return answerText.length > 10
                                          ? `${answerText.slice(0, 3)}...${answerText.slice(answerText.length - 5, answerText.length)}`
                                          : answerText; // Truncate long labels
                                      }}
                                    />
                                    <HorizontalGridLines />
                                    <VerticalGridLines />
                                    <HorizontalBarSeries
                                      data={assignmentWithRubricStatsResultsObj.perRubricCriteriaAnswerFrequencies[
                                        idx
                                      ].ratingsSubArr.map((value: RubricRatingSubmissionScore, innerIdx: number) => ({
                                        y: innerIdx,
                                        x: value.ratingCount
                                      }))}
                                      barWidth={0.1}
                                    />
                                  </XYPlot>
                                </>
                              )}
                            </TableRow>
                          </TableBody>
                        </Table>
                      )}
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

export default AssignmentRubricStatistics;
