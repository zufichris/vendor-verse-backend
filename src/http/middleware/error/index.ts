import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/error";
import { EStatusCodes } from "../../../shared/enum";
import { IResponseData } from "../../../shared/entity";
import { env } from "../../../config/env";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    next(
        new AppError({
            message: "Resource Not Found",
            status: EStatusCodes.enum.notFound,
            type: "Invalid Request",
            description: 'The requested resource could not be found.',
        })
    );
};

export const errorHandler = (
    err: AppError<any>,
    req: Request,
    res: Response,
    _: NextFunction
) => {
    const statusCode = err?.error?.statusCode ?? EStatusCodes.enum.internalServerError;
    const message = err?.message ?? "An unexpected error occurred.";
    const description = err?.error?.description ?? 'An unexpected error occurred.';
    const type = err.error?.type ?? "Error";

    const errorResponse: IResponseData<undefined> = {
        success: false,
        message: message,
        status: statusCode,
        description: description,
        error: {
            message: message,
        },
        path: req.path,
        url: req.url,
        stack: env.in_prod ? undefined : err.stack,
        type: type,
    };

    res.status(statusCode).json(errorResponse);
};