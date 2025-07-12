import express from "express";
import cors from "cors";
import {
  errorMiddleware,
  handleUncaughtException,
  handleUnhandledRejection,
  notFoundMiddleware,
} from "./core/middleware/error.middleware";
import { env } from "./config";
import { logger } from "./logger";
import { routesv1 } from "./routes/v1";
import dotenv from "dotenv";
import { DB } from "./database";
dotenv.config();
new DB(env.mongo_uri).connect()

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1", routesv1);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
handleUnhandledRejection();
handleUncaughtException();

app.listen(env.port, () => {
  logger.info(`app running on http://localhost:${env.port}`);
});
