import * as express from "express";
import { User } from "../../modules/user";
import { Locale } from "../../core/middleware/";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      locale: Locale;
    }
  }
}
