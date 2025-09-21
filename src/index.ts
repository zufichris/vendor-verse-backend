import express from "express";
import cors from "cors";
import {
    errorMiddleware,
    handleUncaughtException,
    handleUnhandledRejection,
    notFoundMiddleware,
    localizationMiddleware,
} from "./core/middleware/";
import { env } from "./config";
import { logger } from "./logger";
import { routesv1 } from "./routes/v1";
import dotenv from "dotenv";
import { DB } from "./database";

dotenv.config();
new DB(env.mongo_uri).connect();

const app = express();
app.use(cors());
app.use(express.json());
app.use(localizationMiddleware);
app.get("/favicon.ico ", function(_, res) {
    res.send("")
})

app.get("/", (_, res) => {
    res.send("API is running...");
});
app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/v1", routesv1);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
handleUnhandledRejection();
handleUncaughtException();

app.listen(env.port, () => {
    logger.info(`app running on http://localhost:${env.port}`);
});
