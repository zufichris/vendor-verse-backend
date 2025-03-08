import { Request, Response, NextFunction } from "express";
import { validateData } from "../../../util/functions";
import { IResponseData, IResponseDataPaginated, IQueryFilters } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import {
    CreateRoleDTO,
    CreateRoleSchema,
    UpdateRoleDTO,
    UpdateRoleSchema,
} from "../../../data/dto/role";
import { TRole } from "../../../data/entity/role";
import RoleUseCase from "../../../domain/role/use-case";
import { RoleRepositoryImpl } from "../../../data/orm/repository-implementation/role";
import { RoleModel } from "../../../data/orm/model/role";

export class RoleControllers {
    constructor(
        private readonly roleUseCase: RoleUseCase
    ) {
        this.createRole = this.createRole.bind(this);
        this.getRole = this.getRole.bind(this);
        this.queryRoles = this.queryRoles.bind(this);
        this.updateRole = this.updateRole.bind(this);
        this.deleteRole = this.deleteRole.bind(this);
    }

    async createRole(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = validateData<CreateRoleDTO>(req.body, CreateRoleSchema);
            if (!validation.success) {
                return res.status(EStatusCodes.enum.badRequest).json({
                    ...this.generateMetadata(req, "Validation Failed", "Role"),
                    success: false,
                    description: validation.error,
                });
            }

            const result = await this.roleUseCase.create.execute(validation.data, {
                userId: req.user?.id!,
                roles: req.user?.roles!,
                permissions: req.user?.permissions!,
            });
            if (!result.success) {
                return res.status(result.status ?? EStatusCodes.enum.badRequest).json({
                    ...this.generateMetadata(req, result.error ?? "Role creation failed", "Role"),
                    success: false,
                    description: result.error,
                });
            }

            const data: IResponseData<TRole> = {
                ...this.generateMetadata(req, "Role created successfully", "Role"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async getRole(req: Request, res: Response, next: NextFunction) {
        try {
            const roleId = req.params.roleId;
            const result = await this.roleUseCase.get.execute({ roleId }, {
                userId: req.user?.id!,
                roles: req.user?.roles!,
                permissions: req.user?.permissions!,
            });
            if (!result.success) {
                return res.status(result.status ?? EStatusCodes.enum.notFound).json({
                    ...this.generateMetadata(req, result.error ?? "Role not found", "Role"),
                    success: false,
                });
            }
            const data: IResponseData<TRole> = {
                ...this.generateMetadata(req, "Role retrieved successfully", "Role"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async queryRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const queryOptions = this.generateRoleQuery(req.query);
            const result = await this.roleUseCase.query.execute(queryOptions, {
                userId: req.user?.id!,
                roles: req.user?.roles!,
                permissions: req.user?.permissions!,
            });
            if (!result.success) {
                return res.status(result.status ?? EStatusCodes.enum.badGateway).json({
                    ...this.generateMetadata(req, result.error ?? "Failed to query roles", "Role"),
                    success: false,
                });
            }
            const data: IResponseDataPaginated<TRole> = {
                ...this.generateMetadata(req, "Roles retrieved successfully", "Role"),
                status: EStatusCodes.enum.ok,
                success: true,
                ...result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async updateRole(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = validateData<UpdateRoleDTO>(req.body, UpdateRoleSchema);
            if (!validation.success) {
                return res.status(EStatusCodes.enum.badRequest).json({
                    ...this.generateMetadata(req, "Validation Failed", "Role"),
                    success: false,
                    description: validation.error,
                });
            }

            const result = await this.roleUseCase.update.execute(validation.data, {
                userId: req.user?.id!,
                roles: req.user?.roles!,
                permissions: req.user?.permissions!,
            });
            if (!result.success) {
                return res.status(result.status ?? EStatusCodes.enum.conflict).json({
                    ...this.generateMetadata(req, result.error ?? "Role update failed", "Role"),
                    success: false,
                });
            }
            const data: IResponseData<TRole> = {
                ...this.generateMetadata(req, "Role updated successfully", "Role"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async deleteRole(req: Request, res: Response, next: NextFunction) {
        try {
            const roleId = req.params.roleId;
            const result = await this.roleUseCase.delete.execute({ roleId }, {
                userId: req.user?.id!,
                roles: req.user?.roles!,
                permissions: req.user?.permissions!,
            });
            if (!result.success) {
                return res.status(result.status ?? EStatusCodes.enum.badGateway).json({
                    ...this.generateMetadata(req, result.error ?? "Role deletion failed", "Role"),
                    success: false,
                });
            }
            const data: IResponseData<boolean> = {
                ...this.generateMetadata(req, "Role deleted successfully", "Role"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data,
            };
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    private generateMetadata(req: Request, message: string, type: string = "Role") {
        return {
            url: req.url,
            path: req.path,
            type,
            message,
            error: { message },
        };
    }

    private generateRoleQuery(query: any): IQueryFilters<TRole> {
        const { page = 1, limit = 10, sort_order = "asc", sort_by = "createdAt", search } = query;
        const sort = { [String(sort_by)]: sort_order === "desc" ? -1 : 1 };
        const filter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { permissions: { $regex: search, $options: "i" } },
                ],
            }
            : {};
        const projection = {
            name: true,
            weight: true,
            permissions: true,
            createdAt: true,
            updatedAt: true,
            id: true,
        };

        return {
            filter,
            limit: Number(limit),
            page: Number(page),
            projection,
            queryOptions: { sort },
        };
    }
}

export const roleControllers = new RoleControllers(new RoleUseCase(new RoleRepositoryImpl(RoleModel)));
