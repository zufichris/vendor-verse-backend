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
import { TemplatesEngine } from "./core/shared/templates-engine";
import { SendgridEmailService } from "./core/shared/email-service/sengrid";
import { MailJetEmailService } from "./core/shared/email-service/mail-jet";
import mongoose from "mongoose";
import { ProductCategoryModel, ProductModel, ProductVariantModel } from "./modules/product";
import { CartModel } from "./modules/cart/cart.model";
import { OrderModel } from "./modules/order";

dotenv.config();
new DB(env.mongo_uri).connect();

// Initialise hbs partials
TemplatesEngine.init()
SendgridEmailService.init();
MailJetEmailService.init()

const app = express();
app.use(cors());

// Only use express.json() for non-Stripe routes
app.use((req, res, next) => {
    if (req.originalUrl === "/api/v1/orders/webhooks/stripe") {
        next(); // Skip express.json() for this route
    } else {
        express.json()(req, res, next); // Apply normally
    }
});

// app.use(express.json());
app.use(localizationMiddleware);
app.get("/favicon.ico ", function (_, res) {
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
