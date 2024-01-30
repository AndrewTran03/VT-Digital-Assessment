import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import FileImport from "./components/FileImport";
import UserDashboard from "./components/UserDashboard";
import LearningObjectiveMatch from "./components/LearningObjectiveMatch";

function AppRouter() {
  return (
    <>
      <>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/file_import" element={<FileImport />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/learning_obj_match" element={<LearningObjectiveMatch />} />
          </Routes>
        </Router>
      </>
    </>
  );
}

export default AppRouter;
