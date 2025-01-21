import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../global/error";
import { Role } from "../../../data/enums/user";
import { IAuthRepository } from "../../../domain/auth/repository";
import { AuthUseCase } from "../../../domain/auth/useCases/AuthUseCase";
import { UserRepositoryImpl } from "../../../data/orm/repositoryImpl/user";
import { UserModel } from "../../../data/orm/models/user";
import { CreateUserUseCase } from "../../../domain/users/useCases/CreateUser";

interface DecodedToken {
  userId: string | number;
  roles?: Role[];
}

export class AuthMiddleWare {
  constructor(private readonly authUseCase: IAuthRepository) { }

  async requireAuth(req: Request, _: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization || req.get("cookies");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError({
          message: "Authorization token is missing or invalid",
          type: "Auth Error",
          statusCode: 401,
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = this.authUseCase.decodeJWT(token) as DecodedToken;

      if (!decoded?.userId) {
        throw new AppError({
          message: "Invalid token",
          type: "Auth Error",
          statusCode: 401,
        });
      }
      req.user = {
        userId: decoded.userId,
        roles: decoded.roles || []
      };

      next();
    } catch (error) {
      next(
        new AppError({
          message: "Unauthorized access",
          type: "Auth Error",
          statusCode: 401,
        })
      );
    }
  }

  async authorize(allowedRoles: Role[], req: Request, _: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user || !user.userId || !user.roles) {
        throw new AppError({
          message: "User not authenticated",
          type: "Auth Error",
          statusCode: 403,
        });
      }

      const hasRequiredRole = user.roles.some((role: Role) => allowedRoles.includes(role));

      if (!hasRequiredRole) {
        throw new AppError({
          message: "You do not have permission to access this resource",
          type: "Auth Error",
          statusCode: 403,
        });
      }

      next();
    } catch (error) {
      next(
        new AppError({
          message: "Forbidden",
          type: "Auth Error",
          statusCode: 403,
        })
      );
    }
  }
}

const userRepository = new UserRepositoryImpl(UserModel);
const createUserUseCase = new CreateUserUseCase(userRepository);
const authUseCase = new AuthUseCase(userRepository, createUserUseCase);
export const authMiddleWare = new AuthMiddleWare(authUseCase);