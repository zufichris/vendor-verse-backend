import { TUser } from "../../../data/entity/user";
import { BaseUseCase, UseCaseResult, handleUseCaseError, AuthContext } from "../../../shared/use-case";
import { IUserRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";
import { hasPermission } from "../../../util/functions";

export class GetUserUseCase implements BaseUseCase<{ userId?: string, email?: string, custId?: string }, TUser, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: { userId?: string, email?: string, custId?: string }, context?: AuthContext): Promise<UseCaseResult<TUser>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({
                    error: "Authentication required. Please log in.",
                    title: "Get User",
                    status: EStatusCodes.enum.unauthorized
                });
            }
            if (!input.userId) {
                return handleUseCaseError({
                    error: "userId is required to view user.",
                    title: "Get User",
                    status: EStatusCodes.enum.badRequest
                });
            }

            const isPermitted = hasPermission({
                requestedAction: "view",
                resource: {
                    id: "user",
                    ownerId: input.userId
                },
                userId: context.userId,
                userPermissions: context.permissions
            })
            if (!isPermitted) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to create roles.",
                    title: "Create Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            let data = await this.userRepository.findById(input.userId);

            if (!data) {
                return handleUseCaseError({
                    error: "User not found.",
                    title: "Get User",
                    status: EStatusCodes.enum.notFound
                });
            }

            // Never expose password or other sensitive information
            delete data?.password

            return {
                success: true,
                data,
            };
        } catch (error: any) {
            return handleUseCaseError({
                title: "Get User",
                error: "An unexpected error occurred while retrieving user data.",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}