import path from "path";
import dotenv from "dotenv";

let ENV_FILE_PATH = "";
if (process.env["NODE_ENV"] === "development") {
  ENV_FILE_PATH = "../.env";
} else if (process.env["NODE_ENV"] === "production") {
  ENV_FILE_PATH = "../../.env";
}
dotenv.config({
  debug: true,
  encoding: "utf8",
  override: true,
  path: path.resolve(__dirname, ENV_FILE_PATH)
});

import express, { NextFunction } from "express";
import bodyParser from "body-parser";
import config from "config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import log from "./utils/logger";
import router from "./routes";
import { ensureConnectionToCanvasApi } from "./utils/canvas.connection";
import { ensureConnectionToMongoDatabase } from "./utils/mongo.connection";

// Link: https://medium.com/swlh/typescript-with-mongoose-and-node-express-24073d51d2eed
const app = express();
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ limit: "1mb", extended: true }));
app.use(cors({ credentials: true }));
app.use(router);
app.use((_, res, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Request-Method", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, TRACE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const frontendClientPort = config.get<number>("frontendClientPort");
const frontendClientUrl = config.get<string>("frontendClientUrl");

// Socket.io Setup (Server):
const server = http.createServer(app);
const ioSocket = new Server(server, {
  cors: {
    origin: [frontendClientUrl],
    methods: ["GET, POST, PUT, PATCH, DELETE, HEAD, TRACE, OPTIONS"]
  }
});

const backendServerPort = config.get<number>("backendServerPort");
const backendServerUrl = config.get<string>("backendServerUrl");

// Check if backend port has been properly identified before starting Express backend server
// Quit starting the server if not properly defined (AKA "undefined")
if (!backendServerPort || backendServerPort.toString() === "undefined" || !parseInt(backendServerPort.toString())) {
  log.error(`BACKEND SERVER PORT is not defined: ${backendServerPort}`);
  process.exit(1);
}
log.warn(`BACKEND SERVER PORT is...${backendServerPort}`);

// Tracks incoming connections to SocketIO server connection
ioSocket.on("connection", (socket) => {
  log.debug(`User sucessfully connected to Socket.io!\nSERVER-SIDE #ID: ${socket.id}`);

  socket.conn.on("close", (reason) => {
    log.debug(`A user disconnected. REASON: ${reason}`);
  });
});

server.listen(backendServerPort, async () => {
  log.info(`Server started on ${backendServerUrl}`);
  await ensureConnectionToCanvasApi();
  await ensureConnectionToMongoDatabase();
});
