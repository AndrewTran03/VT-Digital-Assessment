import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { Navigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const [, setAuthenticated] = useState(false);
  const [alertShown, setAlertShown] = useState(false);
  const [cookies] = useCookies(["Authenticated"]);

  useEffect(() => {
    const isAuthenticated = cookies.Authenticated as boolean;
    setAuthenticated(isAuthenticated);

    if (!alertShown && !isAuthenticated) {
      alert("Invalid route!");
      setAlertShown(true);
      window.localStorage.setItem("invalidPath", location.pathname);
    }
  }, [alertShown, cookies.Authenticated]);

  return <Navigate to="/" />;
};

export default NotFound;
