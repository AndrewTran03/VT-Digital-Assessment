import { useEffect, useContext, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrlBase } from "../shared/types";
import { CanvasQuizQuestionContext, LearningObjectiveContext } from "../shared";
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
  const canvasQuizDataArrGroupBy = Object.groupBy(canvasQuizDataArr, (entry) => entry.canvasCourseInternalId);
  const sortedCanvasQuizDataArrGroupBy = Object.fromEntries(
    Object.entries(canvasQuizDataArrGroupBy).sort(([keyA], [keyB]) => {
      const canvasCourseInternalIdA = Number(keyA);
      const canvasCourseInternalIdB = Number(keyB);
      return canvasCourseInternalIdB - canvasCourseInternalIdA;
    })
  );
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      await fetchCanvasQuizData();
      console.clear();
    }
    fetchData();
  }, []);

  useEffect(() => {
    console.log(sortedCanvasQuizDataArrGroupBy);
  }, [sortedCanvasQuizDataArrGroupBy]);

  async function fetchCanvasQuizData() {
    await axios.get(`${backendUrlBase}/api/canvas`).then((res) => {
      const parsedResult = parseCanvasQuizQuestionMongoDBDCollection(res.data);
      console.log(parsedResult);
      setCanvasQuizDataArr(parsedResult);
    });
  }

  async function handleAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasQuizData();
  }

  function handleClickToMatcher(e: FormEvent<HTMLButtonElement>, courseInternalId: number, specifiedQuizId: number) {
    e.preventDefault();
    console.clear();
    setCanvasLearningObjectiveData({
      canvasCourseInternalId: courseInternalId,
      quizId: specifiedQuizId,
      formMode: "Insert"
    });
    navigate("/learning_obj_match");
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>Canvas Course Dashboard</b>
        <button type="submit" onClick={handleAPIButtonClick}>
          Refresh
        </button>
      </Typography>
      {sortedCanvasQuizDataArrGroupBy &&
        Object.entries(sortedCanvasQuizDataArrGroupBy).length > 0 &&
        Object.entries(sortedCanvasQuizDataArrGroupBy).map((value, key) => (
          <Paper key={key} style={{ margin: "20px 0" }}>
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
                          <Typography>Click to View Statistics</Typography>
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
