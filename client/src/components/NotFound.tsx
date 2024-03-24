import { Navigate } from "react-router-dom";

const NotFound: React.FC = () => {
  window.alert("Invalid route!");
  window.localStorage.setItem("invalidPath", window.location.pathname);
  return <Navigate to="/" />;
};

export default NotFound;
