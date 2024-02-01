import { useState, useEffect, useContext, FormEvent } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { backendUrlBase } from "../assets/types";
import { parseLearningObjectiveMongoDBDCollection } from "../shared/FrontendParser";
import { LearningObjectiveContext } from "../shared";

type Props = {
  canvasCourseInternalId?: number;
};

const LearningObjectiveMatcher: React.FC<Props> = (props) => {
  const [canvasCourseInternalId, setCanvasCourseInternalId] = useState(props.canvasCourseInternalId || 0);
  const { courseLearningObjectiveData, setLearningCourseObjectiveData } = useContext(LearningObjectiveContext);
  const location = useLocation();

  // Link Props: useState() Change and Management
  useEffect(() => {
    if (location.state && !Object.values(location.state).includes(undefined)) {
      const newCanvasCourseInternalId = location.state.canvasCourseInternalId;
      setCanvasCourseInternalId(newCanvasCourseInternalId);
    }
  }, [location.state]);

  useEffect(() => {
    console.log("NEW: " + canvasCourseInternalId);
    fetchCanvasLearningObjectiveData();
  }, [canvasCourseInternalId]);

  async function fetchCanvasLearningObjectiveData() {
    await axios.get(`${backendUrlBase}/api/objective/${canvasCourseInternalId}`).then((res) => {
      const parsedResult = parseLearningObjectiveMongoDBDCollection(res.data[0]);
      console.log(parsedResult);
      setLearningCourseObjectiveData(parsedResult);
    });
  }

  async function handleAPIButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    await fetchCanvasLearningObjectiveData();
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

export default LearningObjectiveMatcher;
