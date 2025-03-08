import { BaseUseCase, handleUseCaseError, UseCaseResult, AuthContext } from "../../../shared/use-case";
import { TRole } from "../../../data/entity/role";
import { IRoleRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";
import { logger } from "../../../util/logger";

export interface GetRoleDTO {
    roleId?: string;
    roleName?: string
}

export class GetRoleUseCase implements BaseUseCase<GetRoleDTO, TRole, AuthContext> {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(input: GetRoleDTO, context?: AuthContext): Promise<UseCaseResult<TRole>> {
        try {
            if (!context?.permissions?.length) {
                return handleUseCaseError({
                    error: "Unauthorized: No permissions provided.",
                    title: "Get Role - Authorization",
                    status: EStatusCodes.enum.unauthorized,
                });
            }
            if (!input.roleId || !input.roleName) {
                return handleUseCaseError({
                    error: "Invalid data.",
                    title: "Get Role - Validation",
                    status: EStatusCodes.enum.unauthorized,
                });
            }

            const REQUIRED_PERMISSION = getPermission("role", "view");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to view roles.",
                    title: "Get Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            let role
            if (input.roleName) {
                role = await this.roleRepository.findByName(input.roleName)
            } else {
                role = await this.roleRepository.findById(input.roleId);
            }
            if (!role) {
                return handleUseCaseError({
                    error: "Role not found.",
                    title: "Get Role - Not Found",
                    status: EStatusCodes.enum.notFound,
                });
            }

            return { success: true, data: role };
        } catch (error: any) {
            logger.error(error?.message);
            return handleUseCaseError({
                error: "An unexpected error occurred while retrieving the role.",
                title: "Get Role - Unexpected Error",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}
