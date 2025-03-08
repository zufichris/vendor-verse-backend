import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { EStatusCodes } from "../../../shared/enum";
import { IPaymentMethodRepository } from "../repository";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";

export class DeletePaymentMethodUseCase implements BaseUseCase<string, boolean, AuthContext> {
    constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) { }

    async execute(id: string, context: AuthContext): Promise<UseCaseResult<boolean>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({ title: "Forbidden", error: "Forbidden", status: EStatusCodes.enum.forbidden });
            }
            const REQUIRED_PERMISSION = getPermission("payment-method", "delete");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to delete payment method.",
                    title: "Delete Payment- Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const paymentMethod = await this.paymentMethodRepository.findOne({
                id
            });
            if (!paymentMethod) {
                return handleUseCaseError({
                    error: "Payment method not found",
                    title: "Delete Payment Method",
                    status: EStatusCodes.enum.notFound,
                });
            }

            const deletedPaymentMethod = await this.paymentMethodRepository.delete(id);
            if (!deletedPaymentMethod) {
                return handleUseCaseError({
                    error: "Error deleting payment method",
                    title: "Delete Payment Method",
                });
            }

            return {
                success: true,
                data: deletedPaymentMethod,
            };
        } catch (error) {
            return handleUseCaseError({ title: "Delete Payment Method", status: 500 });
        }
    }
}