import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FileImport, LearningObjectiveMatcher, UserDashboard, QuizStatistics, NotFound, UserLogin } from "./components";
import { useCookies } from "react-cookie";

const AppRouter: React.FC = () => {
  const [cookies] = useCookies(["Authenticated"]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<UserLogin />} />
          <Route path="/sign_in" element={<UserLogin />} />
          <Route path="/dashboard" element={cookies.Authenticated ? <UserDashboard /> : <Navigate to="/" />} />
          <Route path="/file_import" element={cookies.Authenticated ? <FileImport /> : <Navigate to="/" />} />
          <Route
            path="/learning_obj_match"
            element={cookies.Authenticated ? <LearningObjectiveMatcher /> : <Navigate to="/" />}
          />
          <Route path="/statistics" element={cookies.Authenticated ? <QuizStatistics /> : <Navigate to="/" />} />
          {/* Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
};

export default AppRouter;
