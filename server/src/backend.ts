import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction } from "express";
import bodyParser from "body-parser";
import config from "config";
import cors from "cors";
import http from "http";
import fs from "fs/promises";
import { Server } from "socket.io";
import log from "./utils/logger";
import router from "./routes";
import { ensureConnectionToCanvasApi, getCanvasApiAuthHeaders } from "./utils/canvas.connection";
import { ensureConnectionToMongoDatabase } from "./utils/mongo.connection";
import { fetchCanvasUserCourseData } from "./canvas_interact/canvas.api.course";
import {
  fetchCanvasUserAssignmentData,
  fetchCanvasUserAssignmentRubricData,
  fetchCanvasUserAssignmentSubmissionData
} from "./canvas_interact/canvas.api.assignment.rubric";
import { CanvasAssignmentWithRubricStats } from "./canvas_stats/canvas.assignment.rubric.stats";

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

const backendServerPort = config.get<number>("backendServerPort");
const backendServerUrl = config.get<string>("backendServerUrl");

// Socket.io Setup (Server):
const server = http.createServer(app);
const ioSocket = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]
  }
});

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
