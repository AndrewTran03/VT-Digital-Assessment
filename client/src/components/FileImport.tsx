import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { backendUrlBase, CourseObjective, APIErrorResponse } from "../assets/types";
import { APIRequestError } from "../assets/APIRequestError";

enum Season {
  Fall = "Fall",
  Spring = "Spring",
  Summer = "Summer",
  Winter = "Winter"
}
type ValidSeason = keyof typeof Season;
const seasonValues = ["Fall", "Spring", "Summer", "Winter"] as const;

const learningObjSchema = z.object({
  deptAbbrev: z.string().min(2).max(4),
  courseNum: z.number().min(1000).max(9999),
  semester: z.enum(seasonValues),
  year: z.number().gte(0).lte(9999),
  canvasObjective: z.string().min(1)
});

const FileImport: React.FC = () => {
  const [learningObjArr, setLearningObjArr] = useState<CourseObjective[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(learningObjArr);
  }, [learningObjArr]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files![0];
    console.log(file.name);
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const fileContents = e.target?.result as string;
      const lines = fileContents.split("\n"); // Line Delimited
      lines.forEach((line, idx) => {
        if (idx == 0) {
          // Skip first line (descriptive headers)
          return;
        }
        const entries = line.split(","); // Since this is a CSV file
        const [deptAbbrev, courseNumStr, semesterStr, yearStr, canvasObjectiveUnparsed] = entries;

        const courseNum = parseInt(courseNumStr);
        const semester = semesterStr as ValidSeason;
        const year = parseInt(yearStr);
        const canvasObjective = canvasObjectiveUnparsed.replace('"', "").replace(".", "");

        const newLearningObjective: CourseObjective = { deptAbbrev, courseNum, semester, year, canvasObjective };
        const validResult = learningObjSchema.safeParse(newLearningObjective);
        if (validResult.success) {
          setLearningObjArr((prevArr) => prevArr.concat(newLearningObjective));
        } else {
          console.error(fromZodError(validResult.error));
        }
      });
    };
    reader.readAsText(file);
  }

  function handleButtonSubmit(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Hit submitted!");

    axios.post(`${backendUrlBase}/api/objective`, learningObjArr)
      .then((res) => console.log(res))
      .catch((err: AxiosError) => {
        const errorConfig = err.response?.data as APIErrorResponse;
        const error = new APIRequestError("Failed to INSERT course objectives to backend", errorConfig);
        console.error(error.toString());
    });
  }

  function handleBackButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("Refresh button pressed!");
    navigate("/");
  }

  return (
    <div>
      <button type="reset" onClick={handleBackButtonClick}>
        Back
      </button>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button type="submit" onClick={handleButtonSubmit}>
        Submit
      </button>
    </div>
  );
};

export default FileImport;