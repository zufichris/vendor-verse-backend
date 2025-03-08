import { env } from "../../config/env";
import { logger } from "../../util/logger";

export type AppErrorPayload = {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
} | Error

export class AppError<T extends AppErrorPayload> extends Error {
  public readonly error: T;

  constructor(err: T) {
    super(err?.message);
    this.error = {
      ...err,
      stack: env?.in_prod ? undefined : this.stack,
    };

    Error.stackTraceLimit = env?.in_prod ? 0 : 2;
    Error.captureStackTrace(this, this.constructor);
    if (!env?.in_prod) {
      logger.error(this.error);
    }
  }
}
