import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import FileImport from "./components/FileImport";
// import Test from "./components/Test";

function AppRouter() {
  return (
    <>
      <>
        <Router>
          <Routes>
            {/* <Route path="/" element={<Test num={2} name={"Andrew"} />} /> */}
            <Route path="/" element={<Home />} />
            <Route path="/file_import" element={<FileImport />} />
          </Routes>
        </Router>
      </>
    </>
  );
}

export default AppRouter;
