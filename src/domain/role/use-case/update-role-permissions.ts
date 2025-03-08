import { UpdateRoleDTO, UpdateRoleSchema } from "../../../data/dto/role";
import { TRole } from "../../../data/entity/role";
import { BaseUseCase, handleUseCaseError, UseCaseResult, AuthContext } from "../../../shared/use-case";
import { IRoleRepository } from "../repository";
import { getPermission, hasRequiredPermissions, validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { logger } from "../../../util/logger";

export class UpdateRolePermissionsUseCase implements BaseUseCase<UpdateRoleDTO, TRole, AuthContext> {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(input: UpdateRoleDTO, context?: AuthContext): Promise<UseCaseResult<TRole>> {
        try {
            if (!context?.permissions?.length) {
                return handleUseCaseError({
                    error: "Unauthorized: No permissions provided.",
                    title: "Update Role - Authorization",
                    status: EStatusCodes.enum.unauthorized,
                });
            }

            const REQUIRED_PERMISSION = getPermission("role", "update");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to update roles.",
                    title: "Update Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const validationResult = validateData<UpdateRoleDTO>(input, UpdateRoleSchema);
            if (!validationResult.success) {
                return handleUseCaseError({
                    error: validationResult.error,
                    title: "Update Role - Validation",
                    status: EStatusCodes.enum.badRequest,
                });
            }

            const updatedRole = await this.roleRepository.update(
                validationResult.data.roleId,
                {
                    permissions: validationResult.data.permissions
                }
            );
            if (!updatedRole) {
                return handleUseCaseError({
                    error: "Failed to update role permissions in the database.",
                    title: "Update Role - Database Error",
                    status: EStatusCodes.enum.internalServerError,
                });
            }

            return { success: true, data: updatedRole };
        } catch (error: any) {
            logger.error(error?.message);
            return handleUseCaseError({
                error: "An unexpected error occurred during role update.",
                title: "Update Role - Unexpected Error",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}
