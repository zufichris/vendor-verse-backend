import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiHandler } from "../../util/api-handler";
import { AppError } from "./error.middleware";
import { env } from "../../config";
import { User, UserRepository, UserRole } from "../../modules/user";

export class AuthMiddleware {
    constructor(private readonly userRepository: UserRepository) { }
    private static getToken(req: Request): string | null {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            return authHeader.split(" ")[1];
        }
        if (req.cookies && req.cookies.token) {
            return req.cookies.token;
        }

        if (req.query && typeof req.query.token === "string") {
            return req.query.token;
        }

        return null;
    }
    public requireAuth = ApiHandler(
        async (req: Request, _res: Response, next: NextFunction) => {
            const token = AuthMiddleware.getToken(req);
            if (!token) {
                throw AppError.unauthorized("Authentication token required.");
            }

            try {
                const decoded = jwt.verify(token, env.jwt_secret);

                const decodedPayload = decoded as User & { userId: string };

                const exists = await this.userRepository.findById(
                    decodedPayload.userId,
                );

                if (!exists) {
                    throw AppError.unauthorized("account not found");
                }

                const user = {
                    id: exists.id,
                    email: exists.email,
                    firstName: exists.firstName,
                    lastName: exists.lastName,
                    status: exists.status,
                    isEmailVerified: exists.isEmailVerified,
                    role: exists.role,
                } as User;
                req.user = user;
                next();
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    throw AppError.unauthorized("Authentication token expired.");
                } else if (error instanceof jwt.JsonWebTokenError) {
                    throw AppError.unauthorized("Invalid authentication token.");
                } else {
                    throw AppError.unauthorized("Authentication failed.", error);
                }
            }
        },
    );

    public authorize(allowedRole: UserRole) {
        return ApiHandler(
            async (req: Request, _res: Response, next: NextFunction) => {
                const user = req.user;
                if (!user) {
                    throw AppError.unauthorized(
                        "User not authenticated for authorization check.",
                    );
                }
                if (user.role !== allowedRole) {
                    throw AppError.forbidden(
                        `Access denied. Requires ${allowedRole} role.`,
                    );
                }
                next();
            },
        );
    }
}
