import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { FileImport, LearningObjectiveMatcher, UserDashboard, QuizStatistics } from "./components";

const AppRouter: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/file_import" element={<FileImport />} />
          <Route path="/learning_obj_match" element={<LearningObjectiveMatcher />} />
          <Route path="/statistics" element={<QuizStatistics />} />
        </Routes>
      </Router>
    </>
  );
};

export default AppRouter;
