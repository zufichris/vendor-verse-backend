import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";

import { EStatusCodes } from "../../../shared/enum";
import { IShippingRepository } from "../repository";

export class DeleteShippingUseCase implements BaseUseCase<string, boolean, AuthContext> {
    constructor(private readonly shippingRepository: IShippingRepository) { }

    async execute(id: string, context: AuthContext): Promise<UseCaseResult<boolean>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Forbidden",
                    error: "User authentication required",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const shipping = await this.shippingRepository.findOne({ id, userId: context.userId });
            if (!shipping) {
                return handleUseCaseError({
                    title: "Delete Shipping",
                    error: "Shipping record not found",
                    status: EStatusCodes.enum.notFound,
                });
            }

            const deletedShipping = await this.shippingRepository.delete(id);
            if (!deletedShipping) {
                return handleUseCaseError({
                    title: "Delete Shipping",
                    error: "Failed to delete shipping record",
                });
            }

            return {
                data: deletedShipping,
                success: true,
            };
        } catch (error) {
            return handleUseCaseError({
                title: "Delete Shipping",
                error: "Internal server error",
                status: 500,
            });
        }
    }
}