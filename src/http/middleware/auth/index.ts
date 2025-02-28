import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../global/error";
import { Role } from "../../../data/enum/user";
import AuthUseCase from "../../../domain/auth/use-case";
import { UserRepositoryImpl } from "../../../data/orm/repository-implementation/user";
import { UserModel } from "../../../data/orm/model/user";
import { CreateUserUseCase } from "../../../domain/user/use-case/create-user";
import { IAuthUseCaseRepository } from "../../../domain/auth/repository";

export class AuthMiddleWare {
  constructor(private readonly authUseCase: IAuthUseCaseRepository) {
    this.requireAuth = this.requireAuth.bind(this);
    this.authorize = this.authorize.bind(this);
  }

  async requireAuth(req: Request, _: Response, next: NextFunction) {
    try {
      const token = this.getToken(req, "access_token")
      if (!token) {
        throw new AppError({
          message: "Authentication required",
          type: "Auth Error",
          statusCode: 401,
        });
      }
      if (!token!.startsWith("Bearer")) {
        throw new AppError({
          message: "Invalid authentication format",
          type: "Auth Error",
          statusCode: 401,
        });
      }
      const decoded = this.authUseCase.decodeJWT(token.split(" ")[1]);
      if (!decoded) {
        throw new AppError({
          message: "Invalid token",
          type: "Auth Error",
          statusCode: 401,
        });
      }
      req.user = decoded
      next();
    } catch (error) {
      next(
        new AppError({
          message: "Authentication failed",
          type: "Auth Error",
          statusCode: 401,
        })
      );
    }
  }

  async authorize(allowedRoles: Role[], req: Request, _: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.id || !user?.roles) {
        throw new AppError({
          message: "Unauthorized",
          type: "Auth Error",
          statusCode: 403,
        });
      }

      const hasRequiredRole = user.roles.some((role: Role) => allowedRoles.includes(role));

      if (!hasRequiredRole) {
        throw new AppError({
          message: "Insufficient permissions",
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

  private getToken(req: Request, tokenName: "access_token" | "refresh_token") {
    const token = req.cookies[tokenName] || req.headers.authorization
    return token;
  }
}

const userRepository = new UserRepositoryImpl(UserModel);
const createUserUseCase = new CreateUserUseCase(userRepository);
const authUseCase = new AuthUseCase(userRepository, createUserUseCase);
export const authMiddleWare = new AuthMiddleWare(authUseCase);