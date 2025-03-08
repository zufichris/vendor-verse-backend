import { TUser } from "../../../data/entity/user";
import { UpdateUserDTO, UpdateUserSchema } from "../../../data/dto/user";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IUserRepository } from "../repository";
import { getPermission, hasRequiredPermissions, validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";

export class UpdateUserUseCase implements BaseUseCase<UpdateUserDTO, TUser, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: UpdateUserDTO, context: AuthContext): Promise<UseCaseResult<TUser>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({ error: "Unauthorized", title: "Update User", status: EStatusCodes.enum.forbidden })
            }
            const REQUIRED_PERMISSION = getPermission("user", "manage_own");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to create roles.",
                    title: "Create Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const validate = validateData<UpdateUserDTO>(input, UpdateUserSchema);
            if (!validate.success) {
                return handleUseCaseError({ error: validate.error, title: "Update User", status: EStatusCodes.enum.badRequest });
            }
            const data = await this.userRepository.update(input.userId, validate.data);
            if (!data) {
                return handleUseCaseError({ error: "Error Updating User", title: "Update User" });
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return handleUseCaseError({ title: "Update User" });
        }
    }
}
