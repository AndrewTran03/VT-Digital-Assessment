import { useNavigate } from "react-router-dom";
import { FormEvent } from "react";

const Home: React.FC = () => {
  const navigate = useNavigate();

  function handleClickToObjectives(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    navigate("/file_import");
  }

  function handldClickToDashboard(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    navigate("/dashboard");
  }

  return (
    <>
      <button type="button" onClick={handleClickToObjectives}>
        + Add Learning Objectives for Your Course
      </button>
      <button type="button" onClick={handldClickToDashboard}>
        Click Here to Go to Dashboard
      </button>
    </>
  );
};

export default Home;
