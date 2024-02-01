import { useState, useEffect } from "react";
import axios from "axios";
import { backendUrlBase } from "../assets/types";
import { useLocation } from "react-router-dom";

type Props = {
  canvasCourseInternalCode?: number;
};

const LearningObjectiveMatch: React.FC<Props> = (props) => {
  const [canvasCourseInternalCode, setCanvasCourseInternalCode] = useState(props.canvasCourseInternalCode || 0);
  const location = useLocation();

  useEffect(() => {
    console.log("NEW: " + canvasCourseInternalCode);
  }, [canvasCourseInternalCode]);

  // Link Props: useState() Change and Management
  useEffect(() => {
    if (location.state && !Object.values(location.state).includes(undefined)) {
      const newCanvasCourseInternalCode = location.state.canvasCourseInternalCode;
      setCanvasCourseInternalCode(newCanvasCourseInternalCode);
    }
  }, [location.state]);

  async function handleAPIButtonClick() {
    console.clear();
    await fetchCourseObjectiveData();
  }

  async function fetchCourseObjectiveData() {
    await axios.get(`${backendUrlBase}/api/objective/${canvasCourseInternalCode}`).then((res) => {
      console.log(res.data);
    });
  }

  return (
    <>
      Got to the Learning-Objective-Match component
      <p>Hi</p>
      <button type="submit" onClick={handleAPIButtonClick}>
        Get Course Objective Data
      </button>
    </>
  );
};

export default LearningObjectiveMatch;
