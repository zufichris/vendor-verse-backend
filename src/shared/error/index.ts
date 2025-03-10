import { env } from "../../config/env";
import { logger } from "../../util/logger";
import { EStatusCodes } from "../enum";

export type ErrorPayload = {
  message?: string;
  statusCode?: number;
  description?: string
  type?: string
  stack?:any
}

export class AppError extends Error {
  public readonly error: ErrorPayload;

  constructor({
    statusCode = EStatusCodes.enum.internalServerError,
    description = "An Unexpected Error Occurred",
    message = "Internal Server Error",
    type = "Server Error",
    stack
  }: ErrorPayload) {
    super(message);
    this.error = {
      message,
      description,
      statusCode,
      type
    };
    Error.stackTraceLimit = env?.in_prod ? 0 : 1;
    Error.captureStackTrace(this, this.constructor);
    if (!env?.in_prod) {
      logger.error(this.error);
    }
    console.log("\n",description, "\n",statusCode, "\n",type, "\n",this.stack);
  }
}

export const throwError = (payload?: ErrorPayload): AppError => {
  throw new AppError(payload ?? {});
};