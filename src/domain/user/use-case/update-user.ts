import { TUser } from "../../../data/entity/user";
import { UpdateUserDTO, UpdateUserSchema } from "../../../data/dto/user";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IUserRepository } from "../repository";
import { hasPermission, validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";

export class UpdateUserUseCase implements BaseUseCase<UpdateUserDTO, TUser, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: UpdateUserDTO, context: AuthContext): Promise<UseCaseResult<TUser>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({ error: "Unauthorized", title: "Update User", status: EStatusCodes.enum.forbidden })
            }
            const isPermitted = hasPermission({
                requestedAction: "update",
                resource: {
                    id: "user",
                    ownerId: input.userId
                },
                userId: context.userId,
                userPermissions: context.permissions
            })
            if (!isPermitted) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to update this user.",
                    title: "Update User- Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const validate = validateData<UpdateUserDTO>(input, UpdateUserSchema);

            if (!validate.success) {
                return handleUseCaseError({ error: validate.error, title: "Update User", status: EStatusCodes.enum.badRequest });
            }

            const exists = await this.userRepository.findById(validate.data.userId)
            if (!exists) {
                return handleUseCaseError({ error: "User Notfound", title: "Update User", status: EStatusCodes.enum.notFound });
            }

            const data = await this.userRepository.update(validate.data.userId, validate.data);
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
