import { TRole } from "../../../data/entity/role";
import { BaseUseCase, handleUseCaseError, UseCaseResult, AuthContext } from "../../../shared/use-case";
import { IRoleRepository } from "../repository";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { logger } from "../../../util/logger";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";

export class QueryRolesUseCase implements BaseUseCase<IQueryFilters<TRole>, IQueryResult<TRole>, AuthContext> {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(queryFilters: IQueryFilters<TRole>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TRole>>> {
        try {
            if (!context?.permissions?.length) {
                return handleUseCaseError({
                    error: "Unauthorized: No permissions provided.",
                    title: "Query Roles - Authorization",
                    status: EStatusCodes.enum.unauthorized,
                });
            }

            const REQUIRED_PERMISSION = getPermission("role", "view");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to query roles.",
                    title: "Query Roles - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const rolesData = await this.roleRepository.query(queryFilters);
            if (!rolesData) {
                return handleUseCaseError({
                    error: "Failed to retrieve roles from the database.",
                    title: "Query Roles - Database Error",
                    status: EStatusCodes.enum.internalServerError,
                });
            }

            return ({
                success: true,
                data: rolesData
            });
        } catch (error: any) {
            logger.error(error?.message);
            return handleUseCaseError({
                error: "An unexpected error occurred while querying roles.",
                title: "Query Roles - Unexpected Error",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}
