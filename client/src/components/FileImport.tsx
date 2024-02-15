import { useState, useEffect, FormEvent, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { FileUploader } from "react-drag-drop-files";
import {
  backendUrlBase,
  SeasonEnumValues,
  SingleCanvasLearningObjective,
  CanvasLearningObjectives,
  CanvasCourseAssociations
} from "../shared/types";
import "../styles/DragDropFileImport.css";
import { CanvasUserCourseNamesArrContext } from "../shared/contexts";
import { parseLearningObjectiveMongoDBDCollection } from "../shared/FrontendParser";
import {
  Accordion,
  AccordionSummary,
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from "@mui/material";

const seasonValues = ["Fall", "Spring", "Summer", "Winter"] as const;
const learningObjSchema = z.object({
  deptAbbrev: z.string().min(2).max(4),
  courseNum: z.number().min(1000).max(9999),
  semester: z.enum(seasonValues),
  year: z.number().gte(0).lte(9999),
  canvasCourseInternalId: z.number().gte(100000),
  canvasObjective: z.string().min(1)
});

/*
Two Step Import:
(1) Select Course from Dropdown
(2) Second Screen will show the existing course objectives
  - Have import button (take in a CSV file) to add more
*/
// function FileImport(): ReturnType<React.FC> { // Another way to return React FC components
const FileImport: React.FC = () => {
  const [learningObjArr, setLearningObjArr] = useState<SingleCanvasLearningObjective[]>([]);
  // const { canvasUserCourseNamesArr } = useContext(CanvasUserCourseNamesArrContext);
  // const canvasUserCourseNames: CanvasCourseAssociations[] =
  //   canvasUserCourseNamesArr && canvasUserCourseNamesArr.length > 0
  //     ? canvasUserCourseNamesArr
  //     : (JSON.parse(window.localStorage.getItem("canvasUserCourseAssociations") ?? "[]") as string[]).map((entry) =>
  //         JSON.parse(entry)
  //       );
  const [allUserlearningCourseObjectiveData, setAllUserLearningCourseObjectiveData] = useState<
    CanvasLearningObjectives[]
  >([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [revealStep2, setRevealStep2] = useState(false);
  const [allowedToSubmit, setAllowedToSubmit] = useState(false);
  const navigate = useNavigate();
  const acceptableFileTypes = ["CSV"];

  useEffect(() => {
    async function fetchData() {
      await fetchAllCanvasUserLearningObjectiveData();
      // console.clear();
    }
    fetchData();
  }, []);

  // useEffect(() => {
  //   console.log("Canvas Course Names:");
  //   console.log(canvasUserCourseNames);
  // }, [canvasUserCourseNames]);

  useEffect(() => {
    console.log("All User Learning Objective Arr:");
    console.log(allUserlearningCourseObjectiveData);
  }, [allUserlearningCourseObjectiveData]);

  async function fetchAllCanvasUserLearningObjectiveData() {
    const allCourseObjectiveData: CanvasLearningObjectives[] = [];
    const result = await axios.get(`${backendUrlBase}/api/objective`);
    for (let j = 0; j < result.data.length; j++) {
      const parsedResult = parseLearningObjectiveMongoDBDCollection(result.data[j]);
      allCourseObjectiveData.push(parsedResult);
    }

    const uniqueCourseObjectiveData = removeDuplicateCanvasUserLearningObjectiveData(allCourseObjectiveData);
    setAllUserLearningCourseObjectiveData(uniqueCourseObjectiveData);
  }

  // Consideration: User Security (Only courses that appear on User's Dashboard)
  // async function fetchAllCanvasUserLearningObjectiveData() {
  //   const allCourseObjectiveData: CanvasLearningObjectives[] = [];
  //   for (let i = 0; i < canvasUserCourseNames.length; i++) {
  //     const { deptAbbrev, courseNum } = canvasUserCourseNames[i];
  //     const result = await axios.get(`${backendUrlBase}/api/objective/course/${deptAbbrev}/${courseNum}`);
  //     for (let j = 0; j < result.data.length; j++) {
  //       const parsedResult = parseLearningObjectiveMongoDBDCollection(result.data[j]);
  //       allCourseObjectiveData.push(parsedResult);
  //     }
  //   }
  //   const uniqueCourseObjectiveData = removeDuplicateCanvasUserLearningObjectiveData(allCourseObjectiveData);
  //   setAllUserLearningCourseObjectiveData(uniqueCourseObjectiveData);
  // }

  function removeDuplicateCanvasUserLearningObjectiveData(learningObjectiveData: CanvasLearningObjectives[]) {
    const uniqueCanvasUserLearningObjectiveData: CanvasLearningObjectives[] = [];
    const uniqueSet = new Set<string>();

    learningObjectiveData.forEach((data) => {
      const stringifyData = JSON.stringify(data).trim();

      if (!uniqueSet.has(stringifyData)) {
        uniqueCanvasUserLearningObjectiveData.push(data);
        uniqueSet.add(stringifyData);
      }
    });

    return uniqueCanvasUserLearningObjectiveData;
  }

  useEffect(() => {
    console.log("Learning Objective Arr:");
    console.log(learningObjArr);
  }, [learningObjArr]);

  useEffect(() => {
    console.log("Selected Course:");
    if (selectedCourseId.length === 0) {
      console.log("No course selected...");
    } else {
      console.log(selectedCourseId);
    }
  }, [selectedCourseId]);

  function handleFileChange(file: File) {
    console.log(file.name);
    const reader = new FileReader();
    // Reset the array back to avoid learning-objective upload mismatch
    // with consecutive submissions
    setLearningObjArr([]);

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const fileContents = e.target?.result as string;
      const lines = fileContents.split("\n"); // Line Delimited
      const potentialMatchingCourseLearningObj = allUserlearningCourseObjectiveData.filter(
        (entry) => entry._id === selectedCourseId
      );
      // (If Any...) Pre-populate with existing Canvas Learning Objectives
      if (lines.length > 1 && potentialMatchingCourseLearningObj.length === 1) {
        const entries = lines[1].split(","); // Since this is a CSV file
        const [deptAbbrev, courseNumStr, semesterStr, yearStr, canvasCourseInternalIdStr, ...rest] = entries;

        const courseNum = parseInt(courseNumStr);
        const semester = semesterStr as SeasonEnumValues;
        const year = parseInt(yearStr);
        const canvasCourseInternalId = parseInt(canvasCourseInternalIdStr);

        const match = potentialMatchingCourseLearningObj[0];
        if (
          match.deptAbbrev === deptAbbrev &&
          match.courseNum === courseNum &&
          (match.semester as SeasonEnumValues) === semester &&
          match.year === year
        ) {
          match.canvasObjectives.forEach((canvasObjective) => {
            const newLearningObjective: SingleCanvasLearningObjective = {
              deptAbbrev,
              courseNum,
              semester,
              year,
              canvasCourseInternalId,
              canvasObjective
            };
            const validResult = learningObjSchema.safeParse(newLearningObjective);
            if (validResult.success) {
              setLearningObjArr((prevArr) => prevArr.concat(newLearningObjective));
              setAllowedToSubmit(true);
            } else {
              console.error(fromZodError(validResult.error));
              setAllowedToSubmit(false);
            }
          });
        }
      }
      // Adds new Canvas Learning Objectives
      lines.forEach((line, idx) => {
        if (idx == 0) {
          // Skip first line (descriptive headers)
          return;
        }
        const entries = line.split(","); // Since this is a CSV file
        const [deptAbbrev, courseNumStr, semesterStr, yearStr, canvasCourseInternalIdStr, ...canvasObjectiveUnparsed] =
          entries;

        const courseNum = parseInt(courseNumStr);
        const semester = semesterStr as SeasonEnumValues;
        const year = parseInt(yearStr);
        const canvasCourseInternalId = parseInt(canvasCourseInternalIdStr);
        const canvasObjective = canvasObjectiveUnparsed.join(",").replace(/"|\r/g, "");

        const newLearningObjective: SingleCanvasLearningObjective = {
          deptAbbrev,
          courseNum,
          semester,
          year,
          canvasCourseInternalId,
          canvasObjective
        };
        const validResult = learningObjSchema.safeParse(newLearningObjective);

        if (!validResult.success) {
          console.error(fromZodError(validResult.error));
          setAllowedToSubmit(false);
        } else {
          setLearningObjArr((prevArr) => {
            for (let i = 0; i < prevArr.length; i++) {
              if (prevArr[i].canvasObjective == newLearningObjective.canvasObjective) {
                console.info("Duplicate entry found. Not adding it to current Learning Objective array.");
                return prevArr;
              }
            }
            return [...prevArr, newLearningObjective];
          });
          setAllowedToSubmit(true);
        }
      });
    };
    reader.readAsText(file);
  }

  async function handleButtonSubmit(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Pressed submit button successfully!");
    const potentialMatchingCourseLearningObj = allUserlearningCourseObjectiveData.filter(
      (entry) => entry._id === selectedCourseId
    );
    if (potentialMatchingCourseLearningObj.length !== 1) {
      // (A) new entry(ies) of Canvas Course Learning Objectives exists (no existing ones)
      console.log("POST HERE");
      await axios.post(`${backendUrlBase}/api/objective`, learningObjArr).then((res) => console.log(res));
    } else if (learningObjArr.length > potentialMatchingCourseLearningObj[0].canvasObjectives.length) {
      // (A) new entry(ies) of Canvas Course Learning Objectives exists (with existing ones)
      await axios
        .put(`${backendUrlBase}/api/objective/${potentialMatchingCourseLearningObj[0]._id}`, learningObjArr)
        .then((res) => console.log(res));
    } else {
      console.warn("NO NEW ENTRIES EXIST...");
    }

    window.localStorage.removeItem("canvasUserCourseAssociations");
    navigate(-1);
  }

  function handleBackButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Back button pressed!");
    window.localStorage.removeItem("canvasUserCourseAssociations");
    navigate(-1);
  }

  return (
    <>
      <Typography fontSize={24}>
        <b>Learning Objective File Uploader</b>
      </Typography>
      <button type="reset" onClick={handleBackButtonClick}>
        Back
      </button>
      <button type="submit" disabled={!allowedToSubmit} onClick={handleButtonSubmit}>
        Submit
      </button>
      <Paper style={{ display: "flex", justifyContent: "center" }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell style={{ width: revealStep2 ? "40%" : "100%" }}>
                <Typography>Select the Course You Wish to Insert / Update its Learning Objectives</Typography>
                <FormControl>
                  <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    name="radio-buttons-group"
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setRevealStep2(true);
                    }}
                  >
                    {allUserlearningCourseObjectiveData && allUserlearningCourseObjectiveData.length > 0 ? (
                      allUserlearningCourseObjectiveData.map((currUserLearningCourseObj, idx) => (
                        <FormControlLabel
                          key={`${currUserLearningCourseObj._id}_${idx}`}
                          value={currUserLearningCourseObj._id}
                          control={<Radio style={{ fontSize: "0.8rem" }} />}
                          label={`${currUserLearningCourseObj.deptAbbrev} ${currUserLearningCourseObj.courseNum}: ${currUserLearningCourseObj.semester} ${currUserLearningCourseObj.year}`}
                        />
                      ))
                    ) : (
                      <p>No items found.</p>
                    )}
                    {/* Add an "Other" Option (for Non-Listed Courses)*/}
                    <FormControlLabel
                      value={"Other"}
                      control={<Radio style={{ fontSize: "0.8rem" }} />}
                      label={"Other (Add Another Course Not on the Current List)"}
                    />
                  </RadioGroup>
                </FormControl>
              </TableCell>
              <TableCell>
                {/* Reference: https://www.npmjs.com/package/react-drag-drop-files?activeTab=readme */}
                {revealStep2 ? (
                  <>
                    <Accordion style={{ marginBottom: "10px" }}>
                      <AccordionSummary>
                        <Typography>Current Learning Objectives for This Course</Typography>
                      </AccordionSummary>
                      <ul>
                        {allUserlearningCourseObjectiveData.length === 0 || selectedCourseId === "Other" ? (
                          <Typography>
                            <li key={"0"}>No learning objectives found for this course currently.</li>
                          </Typography>
                        ) : (
                          allUserlearningCourseObjectiveData.map((entry, index) => {
                            if (entry._id === selectedCourseId) {
                              return entry.canvasObjectives.map((objective, idx) => (
                                <Typography key={`${index}_${idx}`}>
                                  <li>{objective}</li>
                                </Typography>
                              ));
                            }
                          })
                        )}
                      </ul>
                    </Accordion>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <FileUploader /* See reference (above) for more details. */
                        multiple={false}
                        label={`Upload ${selectedCourseId === "" || selectedCourseId === "Other" ? "New" : "Additional"} Learning Objectives Here`}
                        required={true}
                        types={acceptableFileTypes}
                        hoverTitle={"Drop here"}
                        handleChange={handleFileChange}
                        classes={"file-uploader"}
                        onDraggingStateChange={(dragging: boolean) => console.log(dragging)}
                        dropMessageStyle={{ backgroundColor: "green", color: "black" }}
                        onDrop={(file: File) => console.log(`FILE DROPPED: ${file.name}`)}
                        onTypeError={(err: Error) => console.error(err.message)}
                      />
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </>
  );
};

export default FileImport;
