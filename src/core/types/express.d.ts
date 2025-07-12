import * as express from "express";
import { User } from "../../modules/user";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
