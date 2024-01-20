// Necessary Back-End Configuration Properties (using NPM "config")
export default {
  backendServerPort: `${process.env.BACKEND_PORT}`,
  backendServerUrl: `http://localhost:${process.env.BACKEND_PORT}`,
  canvasPublicApiToken: `${process.env.CANVAS_PUBLIC_API_TOKEN}`,
  logLevel: "trace"
};
