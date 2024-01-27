import { useNavigate } from "react-router-dom";
import { FormEvent } from "react";

const Home: React.FC = () => {
  const navigate = useNavigate();

  function handleClickToObjectives(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    navigate("/file_import");
  }

  return (
    <>
      <button type="button" onClick={handleClickToObjectives}>
        + Add Learning Objectives for Your Course
      </button>
    </>
  );
};

export default Home;
