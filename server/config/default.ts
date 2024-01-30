// Necessary Back-End Configuration Properties (using NPM "config")
export default {
  backendServerPort: `${process.env.BACKEND_PORT}`,
  backendServerUrl: `http://localhost:${process.env.BACKEND_PORT}`,
  canvasPublicApiToken: `${process.env.CANVAS_PUBLIC_API_TOKEN}`,
  logLevel: "trace",
  mongoDatabaseUri: `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.DEPLOYMENT_NAME}.xqbvmpf.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`,
  mongoDatabaseName: `${process.env.MONGO_DB_NAME}`,
  canvasObjectivesMongoCollectionName: `${process.env.CANVAS_OBJECTIVE_COLLECTION_NAME}`
};
