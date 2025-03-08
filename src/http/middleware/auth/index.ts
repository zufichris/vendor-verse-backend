import { NextFunction, Request, Response } from "express";
import { IAuthUseCaseRepository } from "../../../domain/auth/repository";
import RoleUseCase from "../../../domain/role/use-case";
import { AppError } from "../../../shared/error";
import { AuthContext } from "../../../shared/use-case";
import { EStatusCodes } from "../../../shared/enum";
import { EPermissionAction, EPermissionResource, TRolePermission } from "../../../data/entity/role";
import AuthUseCase from "../../../domain/auth/use-case";
import { UserRepositoryImpl } from "../../../data/orm/repository-implementation/user";
import { UserModel } from "../../../data/orm/model/user";
import { CreateUserUseCase } from "../../../domain/user/use-case/create-user";
import { RoleModel } from "../../../data/orm/model/role";
import { RoleRepositoryImpl } from "../../../data/orm/repository-implementation/role";
import { z } from "zod";
import { hasPermission } from "../../../util/functions";

export class AuthMiddleWare {
  constructor(
    private readonly authUseCase: IAuthUseCaseRepository,
    private readonly roleUseCase: RoleUseCase
  ) {
    this.requireAuth = this.requireAuth.bind(this);
    this.requirePermission = this.requirePermission.bind(this);
  }

  async requireAuth(req: Request, _: Response, next: NextFunction) {
    try {
      const token = this.getToken(req, "access_token");
      if (!token || typeof token !== 'string') {
        throw new AppError({
          message: "Access token is required",
          type: "Auth Error",
          statusCode: EStatusCodes.enum.unauthorized,
        });
      }
      let jwtToken;
      if (token.startsWith("Bearer ")) {
        jwtToken = token.split(" ")[1];
      } else {
        jwtToken = token;
      }
      const decoded = this.authUseCase.decodeJWT(jwtToken);
      if (!decoded) {
        throw new AppError({
          message: "Invalid or expired token",
          type: "Auth Error",
          statusCode: EStatusCodes.enum.unauthorized,
        });
      }
      req.user = decoded as AuthContext;
      next();
    } catch (error) {
      next(error);
    }
  }

  requirePermission(resource: z.infer<typeof EPermissionResource>, action: z.infer<typeof EPermissionAction>) {
    return async (req: Request, _: Response, next: NextFunction) => {
      try {
        if (!req.user?.userId || !req.user.roles || req.user.roles.length === 0) {
          throw new AppError({
            message: "Invalid authentication context: missing user ID or roles",
            type: "Auth Error",
            statusCode: EStatusCodes.enum.unauthorized,
          });
        }

        const result = await this.roleUseCase.getPermissions.execute(req.user.roles);
        if (!result.success) {
          throw new AppError({
            message: "Failed to fetch user permissions",
            type: "Server Error",
            statusCode: EStatusCodes.enum.internalServerError,
          });
        }
        const userPermissions: TRolePermission[] = result.data;
        req.user.permissions = userPermissions;

        const permitted = hasPermission({
          resource: { id: resource, ownerId: undefined },
          requestedAction: action,
          userId: req.user.userId,
          userPermissions,
        });

        if (!permitted) {
          throw new AppError({
            message: "Forbidden: insufficient permissions",
            type: "Permission Error",
            statusCode: EStatusCodes.enum.forbidden,
          });
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private getToken(req: Request, tokenName: "access_token" | "refresh_token") {
    return req.cookies[tokenName] || req.headers.authorization;
  }
}


const userRepository = new UserRepositoryImpl(UserModel)
const createUser = new CreateUserUseCase(userRepository)
const authUseCase = new AuthUseCase(userRepository, createUser)
const roleUseCase = new RoleUseCase(new RoleRepositoryImpl(RoleModel))
export const authMiddleware = new AuthMiddleWare(authUseCase, roleUseCase)