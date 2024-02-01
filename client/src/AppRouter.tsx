import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import FileImport from "./components/FileImport";
import UserDashboard from "./components/UserDashboard";
import LearningObjectiveMatcher from "./components/LearningObjectiveMatcher";

const AppRouter: React.FC = () => {
  return (
    <>
      <>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/file_import" element={<FileImport />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/learning_obj_match" element={<LearningObjectiveMatcher />} />
          </Routes>
        </Router>
      </>
    </>
  );
};

export default AppRouter;
