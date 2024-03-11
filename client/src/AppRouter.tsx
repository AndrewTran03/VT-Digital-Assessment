import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import {
  FileImport,
  QuizLearningObjectiveMatcher,
  UserDashboard,
  QuizStatistics,
  NotFound,
  UserLogin,
  AssignmentRubricStatistics,
  AssignmentRubricLearningObjectiveMatcher
} from "./components";
import { useCookies } from "react-cookie";

const AppRouter: React.FC = () => {
  const [cookies] = useCookies(["Authenticated"]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<UserLogin />} />
          <Route path="/dashboard" element={cookies.Authenticated ? <UserDashboard /> : <Navigate to="/" />} />
          <Route path="/file_import" element={cookies.Authenticated ? <FileImport /> : <Navigate to="/" />} />
          <Route
            path="/quiz_learning_obj_match"
            element={cookies.Authenticated ? <QuizLearningObjectiveMatcher /> : <Navigate to="/" />}
          />
          <Route
            path="/assignment_with_rubric_learning_obj_match"
            element={cookies.Authenticated ? <AssignmentRubricLearningObjectiveMatcher /> : <Navigate to="/" />}
          />
          <Route path="/quiz_statistics" element={cookies.Authenticated ? <QuizStatistics /> : <Navigate to="/" />} />
          <Route
            path="/assignment_with_rubric_statistics"
            element={cookies.Authenticated ? <AssignmentRubricStatistics /> : <Navigate to="/" />}
          />
          {/* Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
};

export default AppRouter;
