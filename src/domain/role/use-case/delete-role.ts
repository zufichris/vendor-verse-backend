import { BaseUseCase, handleUseCaseError, UseCaseResult, AuthContext } from "../../../shared/use-case";
import { IRoleRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";
import { logger } from "../../../util/logger";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";

export interface DeleteRoleDTO {
    roleId: string;
}

export class DeleteRoleUseCase implements BaseUseCase<DeleteRoleDTO, boolean, AuthContext> {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(input: DeleteRoleDTO, context?: AuthContext): Promise<UseCaseResult<boolean>> {
        try {
            if (!context?.permissions?.length) {
                return handleUseCaseError({
                    error: "Unauthorized: No permissions provided.",
                    title: "Delete Role - Authorization",
                    status: EStatusCodes.enum.unauthorized,
                });
            }

            const REQUIRED_PERMISSION = getPermission("role", "delete");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to delete roles.",
                    title: "Delete Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const deleted = await this.roleRepository.delete(input.roleId);
            if (!deleted) {
                return handleUseCaseError({
                    error: "Failed to delete role from the database.",
                    title: "Delete Role - Database Error",
                    status: EStatusCodes.enum.internalServerError,
                });
            }

            return { success: true, data: true };
        } catch (error: any) {
            logger.error(error?.message);
            return handleUseCaseError({
                error: "An unexpected error occurred during role deletion.",
                title: "Delete Role - Unexpected Error",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}
