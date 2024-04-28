import { Box, CircularProgress, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import axios, { AxiosError } from "axios";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { APIErrorResponse, backendUrlBase } from "../shared/types";
import { APIRequestError } from "../shared/APIRequestError";
import { CanvasUserInfoContext } from "../shared/contexts";
import useSystemColorThemeDetector from "../shared/hooks/useSystemColorThemeDetector";
import "../styles/UserLoginMessage.css";

const FAILURE_TIMER_COUNT = 10;
const TRANSITION_LOADING_TIMER_COUNT = 3;
const SSE_TIMER_INTERVAL = 20000; // Timer interval of 15 seconds (in milliseconds)

const UserLogin: React.FC = () => {
  const { setCanvasUserInfo } = useContext(CanvasUserInfoContext);
  const [authCookie, setAuthCookie, removeCookies] = useCookies(["Authenticated"]);
  const [loading, setLoading] = useState(false);
  const [userSubmitError, setUserSubmitError] = useState(false);
  const [userSubmitInfoComplete, setUserSubmitInfoComplete] = useState(false);
  const [countdown, setCountdown] = useState(TRANSITION_LOADING_TIMER_COUNT);
  const canvasUsernameInputRef = useRef<HTMLInputElement>(null);
  const canvasApiKeyInputRef = useRef<HTMLInputElement>(null);
  const [canvasApiKeyEncrpytedState, setCanvasApiKeyEncryptedState] = useState(true);
  const [progressMsg, setProgressMsg] = useState("");
  const systemColorTheme = useSystemColorThemeDetector();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear local storage for fresh login
    window.localStorage.clear();
  }, []);

  // Implements Server-Sent Event (SSE) logging (for longer API calls)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let timerId: NodeJS.Timeout | null = null;

    function startTimer() {
      timerId = setInterval(() => {
        console.log("Server inactive. Reconnecting...");
        handleReconnection();
      }, SSE_TIMER_INTERVAL);
    }

    function resetTimer() {
      if (timerId) {
        clearInterval(timerId);
      }
      startTimer();
    }

    function handleReconnection() {
      console.log("Attempting to reconnect...");
      if (eventSource) {
        eventSource.close();
      }
      if (timerId) {
        clearTimeout(timerId);
      }
      // Reopen EventSource and start the timer again
      setupSSEHelper();
      startTimer();
    }

    function setupSSEHelper() {
      eventSource = new EventSource(`${backendUrlBase}/api/canvas/retrieveCanvasId/progress`);

      eventSource.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        // Update state or UI based on the progress data received from the server
        console.log("Progress Update:", data.progress);
        setProgressMsg(data.progress);
        resetTimer(); // Reset the timer on receiving data from the server
      };

      eventSource.onerror = (error: Event) => {
        console.error("EventSource error:", error);
        handleReconnection();
      };
    }

    setupSSEHelper();
    startTimer();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, []);

  useEffect(() => {
    // Clear "Authenticated cookie" everytime we hit this page
    removeCookies("Authenticated", { path: window.localStorage.getItem("invalidPath")! });
    setAuthCookie("Authenticated", false, { path: "/" });
    // Clear invalid path stored in local storage
    window.localStorage.removeItem("invalidPath");
  }, [removeCookies, setAuthCookie]);

  useEffect(() => {
    // Set the "Authenticated" cookie to false if it doesn't exist (undefined or null)
    if (!authCookie.Authenticated) {
      setAuthCookie("Authenticated", false, { path: "/" });
    }
  }, [authCookie.Authenticated, setAuthCookie]);

  useEffect(() => {
    if (userSubmitInfoComplete) {
      const intervalId = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
      }, 1000); // Countdown every second

      // Clear countdown and navigate to dashboard after 3 seconds
      setTimeout(() => {
        setUserSubmitInfoComplete(false);
        navigate("/dashboard");
      }, TRANSITION_LOADING_TIMER_COUNT * 1000);

      return () => clearInterval(intervalId);
    }
  }, [userSubmitInfoComplete, navigate]);

  function handleCanvasUserInputChange(e: FormEvent<HTMLInputElement>) {
    e.preventDefault();
    if (
      canvasUsernameInputRef.current &&
      canvasApiKeyInputRef.current &&
      canvasUsernameInputRef.current.value.length <= 0 &&
      canvasApiKeyInputRef.current.value.length <= 0
    ) {
      setUserSubmitInfoComplete(false);
    }
  }

  async function handleApiInputSubmitClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (canvasUsernameInputRef.current && canvasApiKeyInputRef.current) {
      if (canvasUsernameInputRef.current.value.length <= 0 || canvasApiKeyInputRef.current.value.length <= 0) {
        window.alert(
          "Either the Canvas Username or Canvas User API Key has been left empty! Please fix that before proceeding further."
        );
        setUserSubmitInfoComplete(false);
      } else {
        const canvasAccountId = 54;
        const canvasUsername = canvasUsernameInputRef.current.value.toString().trim();
        setLoading(true);
        await axios
          .put(`${backendUrlBase}/api/canvas/retrieveCanvasId/${canvasAccountId}/${canvasUsername}`, {
            canvasUserApiKey: `${canvasApiKeyInputRef.current.value.toString().trim()}`
          })
          .then((res) => {
            console.log(res.data);
            if (res.status.toString().startsWith("2")) {
              setUserSubmitInfoComplete(true);
              console.log("USER ID (API CALL):", parseInt(res.data.UserId));
              setCanvasUserInfo({ canvasUserId: parseInt(res.data.UserId) });
              window.localStorage.setItem("canvasUserId", res.data.UserId as string);
              setAuthCookie("Authenticated", true);
            } else if (res.status.toString().startsWith("5")) {
              setProgressMsg("Reloading window...API call took too long. Please try again!");
              window.location.reload();
            }
          })
          .catch((err: AxiosError) => {
            if (err.status && err.status > 500) {
              setProgressMsg("Reloading window...API call took too long. Please try again!");
              window.location.reload();
            }
            setUserSubmitInfoComplete(false);
            const errorConfig = err.response?.data as APIErrorResponse;
            const error = new APIRequestError("Failed to retrieve Canvas User ID", errorConfig);
            console.error(error.toString());

            // Clear invalid user-typed input submissions
            canvasUsernameInputRef.current!.value = "";
            canvasApiKeyInputRef.current!.value = "";

            // Display "Failure" submission message for only 10 seconds
            setUserSubmitError(true);
            setTimeout(() => {
              setUserSubmitError(false);
            }, FAILURE_TIMER_COUNT * 1000);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }

  return (
    <>
      <Typography variant="body1" fontSize={20}>
        <b>Welcome to the Virginia Tech Digital Assessment Application!</b>
      </Typography>
      <Table
        style={{
          marginTop: "20px",
          borderCollapse: "collapse",
          width: "auto",
          margin: "0 auto"
        }}
      >
        <TableBody>
          <TableRow>
            <TableCell style={{ border: "none", textAlign: "right", paddingRight: "10px" }}>
              <Typography variant="body1" style={{ color: systemColorTheme === "dark" ? "white" : "black" }}>
                Enter your Canvas Username:
              </Typography>
            </TableCell>
            <TableCell style={{ border: "none" }}>
              <input
                ref={canvasUsernameInputRef}
                type="text"
                style={{ width: "100%", padding: "8px" }}
                onChange={handleCanvasUserInputChange}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell style={{ border: "none", textAlign: "right", paddingRight: "10px" }}>
              <Typography variant="body1" style={{ color: systemColorTheme === "dark" ? "white" : "black" }}>
                Enter your Canvas User API Key:
              </Typography>
            </TableCell>
            <TableCell style={{ border: "none" }}>
              <input
                ref={canvasApiKeyInputRef}
                type={canvasApiKeyEncrpytedState ? "password" : "text"}
                style={{ width: "100%", padding: "8px" }}
                onChange={handleCanvasUserInputChange}
              />
            </TableCell>
            <TableCell style={{ border: "none" }}>
              <button type="submit" onClick={() => setCanvasApiKeyEncryptedState((prevState) => !prevState)}>
                <Typography style={{ fontSize: "12px" }}>{canvasApiKeyEncrpytedState ? "Show " : "Hide "}</Typography>
              </button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <button type="submit" onClick={handleApiInputSubmitClick} disabled={loading}>
        Submit User Info
      </button>
      {/* Loading Iconography */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography variant="body1" style={{ marginTop: "10px", marginBottom: "10px" }}>
            Loading...Please wait as your Canvas user information is being processed and Canvas entries are being
            loaded.
          </Typography>
          <br />
          <CircularProgress />
        </Box>
      )}
      {/* Success Message */}
      {userSubmitInfoComplete && (
        <Typography className="success-message" variant="body1" style={{ color: "green", marginTop: "10px" }}>
          Successful submission! Please wait as we move over to the User Dashboard. [{countdown}]
          <br />
          <CircularProgress />
        </Typography>
      )}
      {/* Failure Message */}
      {userSubmitError && (
        <Typography className="failure-message" variant="body1" style={{ color: "red", marginTop: "10px" }}>
          Error! Invalid Canvas credentials. Please try again.
        </Typography>
      )}
      {/* Progress Message */}
      {progressMsg && progressMsg.length > 0 && (
        <Typography className="progress-message" variant="body1" style={{ color: "orange", marginTop: "10px" }}>
          In-Progress: {progressMsg}
        </Typography>
      )}
    </>
  );
};

export default UserLogin;
