import { useState, useEffect } from "react";
import { CanvasQuizMap, backendUrlBase } from "../assets/types";
import axios from "axios";
import { mapReplacer, mapReviver } from "../assets/JSONHelper";

type Props = {};

const UserDashboard: React.FC<Props> = (props) => {
  const [data, setData] = useState<CanvasQuizMap | null>(null);

  async function fetchCanvasQuizData() {
    await axios.get(`${backendUrlBase}/api/canvas`).then((res) => {
      const jsonStr = JSON.stringify(res.data, mapReplacer);
      const parsedData: CanvasQuizMap = JSON.parse(jsonStr, mapReviver);
      setData(parsedData);
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
