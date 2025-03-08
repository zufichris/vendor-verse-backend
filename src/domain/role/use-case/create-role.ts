import { CreateRoleDTO, CreateRoleSchema } from "../../../data/dto/role";
import { TRole } from "../../../data/entity/role";
import { BaseUseCase, handleUseCaseError, UseCaseResult, AuthContext } from "../../../shared/use-case";
import { IRoleRepository } from "../repository";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { logger } from "../../../util/logger";

export class CreateRoleUseCase implements BaseUseCase<CreateRoleDTO, TRole, AuthContext> {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(input: CreateRoleDTO, context?: AuthContext): Promise<UseCaseResult<TRole>> {
        try {
            if (!context?.permissions?.length) {
                return handleUseCaseError({
                    error: "Unauthorized: No permissions provided.",
                    title: "Create Role - Authorization",
                    status: EStatusCodes.enum.unauthorized,
                });
            }

            const REQUIRED_PERMISSION = getPermission("role", "create");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to create roles.",
                    title: "Create Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const validationResult = validateData<CreateRoleDTO>(input, CreateRoleSchema);
            if (!validationResult.success) {
                return handleUseCaseError({
                    error: validationResult.error,
                    title: "Create Role - Validation",
                    status: EStatusCodes.enum.badRequest,
                });
            }

            const createdRole = await this.roleRepository.create(validationResult.data);
            if (!createdRole) {
                return handleUseCaseError({
                    error: "Failed to create role in the database.",
                    title: "Create Role - Database Error",
                    status: EStatusCodes.enum.internalServerError,
                });
            }

            return { success: true, data: createdRole };
        } catch (error: any) {
            logger.error(error?.message);
            return handleUseCaseError({
                error: "An unexpected error occurred during role creation.",
                title: "Create Role - Unexpected Error",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}
