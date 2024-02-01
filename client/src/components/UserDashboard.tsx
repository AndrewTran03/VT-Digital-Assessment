import { useState, useEffect } from "react";
import { CanvasQuizMap, backendUrlBase } from "../assets/types";
import axios from "axios";

const UserDashboard: React.FC = () => {
  const [data, setData] = useState<CanvasQuizMap | null>(null);

  async function fetchCanvasQuizData() {
    await axios.get(`${backendUrlBase}/api/canvas`).then((res) => {
      console.log(res);
    });
  }

  async function handleSubmit() {
    console.clear();
    await fetchCanvasQuizData();
  }

  useEffect(() => {
    fetchCanvasQuizData();
  }, []);

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <>
      <p>Table Goes Here</p>
      <button type="submit" onClick={handleSubmit}>
        Refresh
      </button>
    </>
  );
};

export default UserDashboard;
