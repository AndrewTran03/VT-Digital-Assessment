import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { FileImport, LearningObjectiveMatcher, UserDashboard, QuizStatistics, NotFound } from "./components";

const AppRouter: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/file_import" element={<FileImport />} />
          <Route path="/learning_obj_match" element={<LearningObjectiveMatcher />} />
          <Route path="/statistics" element={<QuizStatistics />} />
          {/* Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
};

export default AppRouter;
