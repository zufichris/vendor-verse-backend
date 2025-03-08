import { TUser } from "../../../data/entity/user";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IUserRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";
import { Role } from "../../../data/enum/user";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";

export class ChangeUserRoleUseCase implements BaseUseCase<{ userId: string, roles: Role[] }, TUser, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: { userId: string, roles: Role[] }, context: AuthContext): Promise<UseCaseResult<TUser>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({ error: "Unauthorized", title: "Change User Role", status: EStatusCodes.enum.forbidden });
            }
            const REQUIRED_PERMISSION = getPermission("user", "manage");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to change user roles.",
                    title: "Change Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const data = await this.userRepository.update(input.userId, {
                roles: input.roles
            });
            if (!data) {
                return handleUseCaseError({ error: "Error Changing User Role", title: "Change User Role" });
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return handleUseCaseError({ title: "Change User Role" });
        }
    }
}
