import { TUser } from "../../../data/entity/user";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IUserRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";
import { ID } from "../../../shared/entity";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";

export class ChangeUserStatusUseCase implements BaseUseCase<{ userId: string, isActive: boolean }, TUser, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: { userId: ID, isActive: boolean }, context: AuthContext): Promise<UseCaseResult<TUser>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({ error: "Unauthorized", title: "Change User Status", status: EStatusCodes.enum.forbidden });
            }
            const REQUIRED_PERMISSION = getPermission("user", "manage");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to change user status.",
                    title: "Change Status - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const data = await this.userRepository.update(input.userId, {
                isActive: input.isActive
            });
            if (!data) {
                return handleUseCaseError({ error: "Error Changing User Status", title: "Change User Status" });
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return handleUseCaseError({ title: "Change User Status" });
        }
    }
}
