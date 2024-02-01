import { useEffect, useContext, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrlBase } from "../shared/types";
import { CanvasQuizQuestionContext } from "../shared";
import { parseCanvasQuizQuestionMongoDBDCollection } from "../shared/FrontendParser";

const UserDashboard: React.FC = () => {
  const { canvasQuizDataArr, setCanvasQuizDataArr } = useContext(CanvasQuizQuestionContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCanvasQuizData();
  }, []);

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

  function handleClickToMatcher(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.clear();
    // Hard-coded for now (will change later)
    navigate("/learning_obj_match", { state: { canvasCourseInternalId: 185413, quizId: 490583 } });
  }

  return (
    <>
      <p>Table Goes Here</p>
      <button type="submit" onClick={handleAPIButtonClick}>
        Refresh
      </button>
      <button type="submit" onClick={handleClickToMatcher}>
        Click here to go Learning Objective Matcher
      </button>
    </>
  );
};

export default UserDashboard;
