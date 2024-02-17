import { useEffect, useState } from "react";
import { UserDashboard } from "./index";
import { Navigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const [alertShown, setAlertShown] = useState(false);
  
  useEffect(() => {
    if (!alertShown) {
      alert("Invalid route!");
      setAlertShown(true);
    }
  }, [alertShown]);

  return <Navigate to="/dashboard"/>;
};

export default NotFound;
