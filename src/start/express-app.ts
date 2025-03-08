import express from "express"
import cors from "cors"
import { loggerMiddleware } from "../http/middleware/logger";
import cookieParser from "cookie-parser";
import router from "../http/routes/route_v1";
import { errorHandler, notFound } from "../http/middleware/error";

export function setupApp(): express.Application {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(loggerMiddleware);
    app.use("/api/v1", router);
    app.use(notFound);
    app.use(errorHandler);
    return app;
}