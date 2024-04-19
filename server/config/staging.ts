// Necessary Back-End Configuration Properties (using NPM "config")
export default {
  frontendClientPort: `${process.env.FRONTEND_PORT}`,
  frontendClientUrl: `https://vt-digital-assessment.localhost.devcom.vt.edu/`,
  backendServerPort: `${process.env.BACKEND_PORT}`,
  backendServerUrl: `https://vt-digital-assessment-server.localhost.devcom.vt.edu/`,
  canvasPublicApiToken: `${process.env.CANVAS_PUBLIC_API_TOKEN}`,
  logLevel: "trace",
  mongoDatabaseUri: `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.DEPLOYMENT_NAME}.xqbvmpf.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`,
  mongoDatabaseName: `${process.env.MONGO_DB_NAME}`,
  canvasObjectivesMongoCollectionName: `${process.env.CANVAS_OBJECTIVE_COLLECTION_NAME}`,
  canvasQuizzesMongoCollectionName: `${process.env.CANVAS_QUIZZES_COLLECTION_NAME}`,
  canvasUserApiCollectionName: `${process.env.CANVAS_USER_API_COLLECTION_NAME}`,
  canvasAssignmentWithRubricMongoCollectionName: `${process.env.CANVAS_ASSIGNMENT_RUBRIC_COLLECTION_NAME}`
};
