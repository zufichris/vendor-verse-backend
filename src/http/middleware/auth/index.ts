import { NextFunction, Request, Response } from "express";
import { IAuthUseCaseRepository } from "../../../domain/auth/repository";
import RoleUseCase from "../../../domain/role/use-case";
import { throwError } from "../../../shared/error";
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
        throwError({
          message: "Unauthorized",
          type: "Auth",
          statusCode: EStatusCodes.enum.unauthorized,
          description: "Missing access token",
        });
        return;
      }
      let jwtToken;
      if (token.startsWith("Bearer ")) {
        jwtToken = token.split(" ")[1];
      } else {
        jwtToken = token;
      }
      const decoded = this.authUseCase.decodeJWT(jwtToken);
      if (!decoded) {
        throwError({
          message: "Unauthorized",
          type: "Auth",
          statusCode: EStatusCodes.enum.unauthorized,
          description: "Invalid or expired access token",
        });
        return;
      }
      if (!decoded.id || !decoded.roles) {
        throwError({
          message: "Unauthorized",
          type: "Auth",
          statusCode: EStatusCodes.enum.unauthorized,
          description: "Invalid authentication context: missing user ID or roles",
        });
        return;
      }

      req.user = { ...decoded, userId: decoded.id } as AuthContext;
      next();
    } catch (error) {
      next(error);
    }
  }

  requirePermission(resource: z.infer<typeof EPermissionResource>, action: z.infer<typeof EPermissionAction>) {
    return async (req: Request, _: Response, next: NextFunction) => {
      try {
        if (!req.user?.userId || !req.user.roles || req.user.roles.length === 0) {
          throwError({
            message: "Unauthorized",
            type: "Auth",
            statusCode: EStatusCodes.enum.unauthorized,
            description: "Invalid authentication context: missing user ID or roles",
          });
          return;
        }

        const result = await this.roleUseCase.getPermissions.execute(req.user.roles);
        if (!result.success) {
          throwError({
            message: "Unauthorized",
            type: "Auth",
            statusCode: EStatusCodes.enum.unauthorized,
            description: "Failed to fetch user permissions",
          });
          return;
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
          throwError({
            message: "Unauthorized",
            type: "Auth",
            statusCode: EStatusCodes.enum.unauthorized,
            description: "Insufficient permissions for requested action",
          });
          return;
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