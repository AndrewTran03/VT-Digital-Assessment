import { useEffect, useContext, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CanvasCourseAssociations, backendUrlBase } from "../shared/types";
import {
  CanvasQuizQuestionContext,
  LearningObjectiveContext,
  CanvasUserInfoContext,
  CanvasUserCourseNamesArrContext
} from "../shared/contexts";
import { parseCanvasQuizQuestionMongoDBDCollection } from "../shared/FrontendParser";
import {
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
  const { setCanvasLearningObjectiveData } = useContext(LearningObjectiveContext);
  const { canvasUserInfo } = useContext(CanvasUserInfoContext);
  const [canvasUserId] = useState(
    canvasUserInfo.canvasUserId || parseInt(window.localStorage.getItem("canvasUserId") ?? "0")
  );
  const { setCanvasUserCourseNamesArr } = useContext(CanvasUserCourseNamesArrContext);
  const canvasQuizDataArrGroupBy = Object.groupBy(canvasQuizDataArr, (entry) => entry.canvasCourseInternalId);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      await fetchCanvasQuizData();
      console.clear();
    }
    fetchData();
  }, []);

  useEffect(() => {
    console.log(canvasUserId);
  }, [canvasUserId]);

  useEffect(() => {
    console.log(canvasQuizDataArrGroupBy);
  }, [canvasQuizDataArrGroupBy]);

  async function fetchCanvasQuizData() {
    // const usedCanvasUserId = canvasUserId === 0 ? parseInt(window.localStorage.getItem("canvasUserId")!) : canvasUserId;
    await axios.get(`${backendUrlBase}/api/canvas/${canvasUserId}`).then((res) => {
      const parsedResult = parseCanvasQuizQuestionMongoDBDCollection(res.data);
      console.log(parsedResult);
      setCanvasQuizDataArr(parsedResult);
    });
  }

  async function handleApiRefreshButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasQuizData();
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

  function handleClickToMatcher(e: FormEvent<HTMLButtonElement>, courseInternalId: number, specifiedQuizId: number) {
    e.preventDefault();
    console.clear();
    setCanvasLearningObjectiveData({
      canvasCourseInternalId: courseInternalId,
      quizId: specifiedQuizId
    });
    window.localStorage.setItem("canvasCourseInternalId", courseInternalId.toString());
    window.localStorage.setItem("canvasQuizId", specifiedQuizId.toString());
    window.localStorage.setItem("canvasQuizDataArr", JSON.stringify(canvasQuizDataArr));
    navigate("/learning_obj_match");
  }

  function handleClickToStatistics(e: FormEvent<HTMLButtonElement>, courseInternalId: number, specifiedQuizId: number) {
    e.preventDefault();
    console.clear();
    setCanvasLearningObjectiveData({
      canvasCourseInternalId: courseInternalId,
      quizId: specifiedQuizId
    });
    window.localStorage.setItem("canvasCourseInternalId", courseInternalId.toString());
    window.localStorage.setItem("canvasQuizId", specifiedQuizId.toString());
    window.localStorage.setItem("canvasQuizDataArr", JSON.stringify(canvasQuizDataArr));
    navigate("/statistics");
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>Canvas Course Dashboard</b>
      </Typography>
      <button type="button" onClick={handleClickToObjectives}>
        <Typography>
          <b>+ Add Learning Objectives for Your Course</b>
        </Typography>
      </button>
      <button type="submit" onClick={handleApiRefreshButtonClick}>
        <Typography>
          <b>Refresh</b>
        </Typography>
      </button>
      {/* <Table
        style={{
          marginTop: "20px",
          borderCollapse: "collapse",
          width: "auto",
          margin: "0 auto"
        }}
      >
        <TableRow>
          <TableCell style={{ border: "none", textAlign: "right", paddingRight: "10px" }}>
            <Typography variant="body1">Enter your Canvas Username:</Typography>
          </TableCell>
          <TableCell style={{ border: "none" }}>
            <input
              ref={canvasUsernameInputRef}
              type="text"
              style={{ width: "100%", padding: "8px" }}
              onChange={handleCanvasUserInputChange}
            />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ border: "none", textAlign: "right", paddingRight: "10px" }}>
            <Typography variant="body1">Enter your Canvas User API Key:</Typography>
          </TableCell>
          <TableCell style={{ border: "none" }}>
            <input
              ref={canvasApiKeyInputRef}
              type="text"
              style={{ width: "100%", padding: "8px" }}
              onChange={handleCanvasUserInputChange}
            />
          </TableCell>
        </TableRow>
      </Table>
      <button type="submit" onClick={handleApiInputSubmitClick}>
        Submit User Info
      </button> */}
      {/* Success Message */}
      {/* {userSubmitInfoComplete && (
        <Typography variant="body1" style={{ color: "green", marginTop: "10px" }}>
          Successful submission. Click the "Refresh" button to update data.
        </Typography>
      )} */}
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
                              onClick={(e) => handleClickToMatcher(e, entry.canvasCourseInternalId, entry.quizId)}
                            >
                              Click to Assign Learning Objectives
                            </button>
                          </Typography>
                        </TableCell>
                        <TableCell style={{ width: "20%" }}>
                          <Typography>
                            <button
                              type="submit"
                              onClick={(e) => handleClickToStatistics(e, entry.canvasCourseInternalId, entry.quizId)}
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
