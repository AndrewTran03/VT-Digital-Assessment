import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction } from "express";
import bodyParser from "body-parser";
import config from "config";
import cors from "cors";
// import log from "./utils/logger";
// import router from "./routes";
import { Server } from "socket.io";
import http from "http";
import { Db } from "mongodb";

// Link: https://medium.com/swlh/typescript-with-mongoose-and-node-express-24073d51d2eed
const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ credentials: true }));
// app.use(router);
app.use((_, res, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Request-Method", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const backendServerPort = 3000;
const backendServerUrl = "http://localhost:3000/";

app.listen(backendServerPort, async () => {
    console.log(`App started on ${backendServerUrl}`);
});
