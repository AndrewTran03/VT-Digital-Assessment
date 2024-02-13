import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FileImport from "./components/FileImport";
import UserDashboard from "./components/UserDashboard";
import LearningObjectiveMatcher from "./components/LearningObjectiveMatcher";

const AppRouter: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/file_import" element={<FileImport />} />
          <Route path="/learning_obj_match" element={<LearningObjectiveMatcher />} />
        </Routes>
      </Router>
    </>
  );
};

export default AppRouter;
