import { NextFunction, Request, Response } from "express";
import { ErrorPayload, throwError } from "../../../shared/error";
import { EStatusCodes } from "../../../shared/enum";
import { IResponseData } from "../../../shared/entity";

export const notFound = (_: Request, __: Response, next: NextFunction) => {
    next(
        throwError({
            statusCode: EStatusCodes.enum.notFound,
            message: "Resource notfound",
            description: "The Requested resource does not exist or temporally unavailable",
            type: "Notfound"
        })
    );
};

export const errorHandler = (
    { error }: { error: ErrorPayload },
    req: Request,
    res: Response,
    _: NextFunction
) => {
    const statusCode = error?.statusCode ?? EStatusCodes.enum.internalServerError;
    const message = error?.message ?? "An unexpected error occurred.";
    const description = error?.description ?? 'An unexpected error occurred.';
    const type = error.type

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
        type: type,
    };
    res.status(statusCode).json(errorResponse);
};