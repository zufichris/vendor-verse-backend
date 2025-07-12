import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;
    public readonly details?: any;
    public readonly timestamp: Date;

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        this.details = details;
        this.timestamp = new Date();

        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static notFound(message = "Resource not found", details?: any): AppError {
        return new AppError(message, 404, details);
    }

    static badRequest(message = "Bad request", details?: any): AppError {
        return new AppError(message, 400, details);
    }

    static unauthorized(message = "Unauthorized", details?: any): AppError {
        return new AppError(message, 401, details);
    }

    static forbidden(message = "Forbidden", details?: any): AppError {
        return new AppError(message, 403, details);
    }

    static conflict(message = "Conflict", details?: any): AppError {
        return new AppError(message, 409, details);
    }

    static unprocessableEntity(
        message = "Unprocessable entity",
        details?: any,
    ): AppError {
        return new AppError(message, 422, details);
    }

    static tooManyRequests(
        message = "Too many requests",
        details?: any,
    ): AppError {
        return new AppError(message, 429, details);
    }

    static internal(message = "Internal server error", details?: any): AppError {
        return new AppError(message, 500, details);
    }

    static notImplemented(message = "Not implemented", details?: any): AppError {
        return new AppError(message, 501, details);
    }

    static badGateway(message = "Bad gateway", details?: any): AppError {
        return new AppError(message, 502, details);
    }

    static serviceUnavailable(
        message = "Service unavailable",
        details?: any,
    ): AppError {
        return new AppError(message, 503, details);
    }

    static custom(message: string, statusCode: number, details?: any): AppError {
        return new AppError(message, statusCode, details);
    }

    toJSON(): object {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            status: this.status,
            timestamp: this.timestamp,
            ...(this.details && { details: this.details }),
        };
    }
}

interface ErrorResponse {
    status: string;
    message: string;
    statusCode?: number;
    details?: any;
    timestamp: Date;
    path?: string;
    stack?: string;
}

export const errorMiddleware = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _: NextFunction,
): void => {
    let error: AppError;

    if (err instanceof AppError) {
        error = err;
    } else if (err.name === "ValidationError") {
        error = AppError.badRequest("Validation failed", err.message);
    } else if (err.name === "MongoServerError" && (err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0];
        error = AppError.conflict(`Duplicate value for field: ${field}`);
    } else if (err.name === "JsonWebTokenError") {
        error = AppError.unauthorized("Invalid token");
    } else if (err.name === "TokenExpiredError") {
        error = AppError.unauthorized("Token expired");
    } else if (err.name === "CastError") {
        error = AppError.badRequest("Invalid ID format");
    } else if (err.name === "MulterError") {
        error = AppError.badRequest(`File upload error: ${err.message}`);
    } else {
        error = AppError.internal("Something went wrong");
    }

    console.error("Error occurred:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date(),
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("user-agent"),
    });

    const errorResponse: ErrorResponse = {
        status: error.status,
        message: error.message,
        timestamp: error.timestamp || new Date(),
        path: req.path,
    };

    if (process.env.NODE_ENV === "development") {
        errorResponse.statusCode = error.statusCode;
        errorResponse.stack = error.stack;
        if (error.details) {
            errorResponse.details = error.details;
        }
    }
    res.status(error.statusCode).json(errorResponse);
};

export const notFoundMiddleware = (
    req: Request,
    _: Response,
    next: NextFunction,
): void => {
    const error = AppError.notFound(`Route ${req.originalUrl} not found`);
    next(error);
};

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const handleUnhandledRejection = (): void => {
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
        console.error("Unhandled Promise Rejection:", reason, promise);
        process.exit(1);
    });
};

export const handleUncaughtException = (): void => {
    process.on("uncaughtException", (error: Error) => {
        console.error("Uncaught Exception:", error);
        process.exit(1);
    });
};
