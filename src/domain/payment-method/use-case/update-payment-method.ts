import { TPaymentMethod } from "../../../data/entity/payment-method";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions, validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { UpdatePaymentMethodDTO, UpdatePaymentMethodSchema } from "../../../data/dto/payment-method";
import { IPaymentMethodRepository } from "../repository";

export class UpdatePaymentMethodUseCase implements BaseUseCase<UpdatePaymentMethodDTO, TPaymentMethod, AuthContext> {
    constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) { }

    async execute(input: UpdatePaymentMethodDTO, context: AuthContext): Promise<UseCaseResult<TPaymentMethod>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Forbidden",
                    error: "Forbidden",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const REQUIRED_PERMISSION = getPermission("payment-method", "update");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to update payment methods.",
                    title: "Update payment method - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const validate = validateData<UpdatePaymentMethodDTO>(input, UpdatePaymentMethodSchema);
            if (!validate.success) {
                return handleUseCaseError({
                    error: validate.error,
                    title: "Update Payment Method",
                    status: EStatusCodes.enum.badRequest
                });
            }

            const existingPaymentMethod = await this.paymentMethodRepository.findOne({ id: validate.data.pmtId! });
            if (!existingPaymentMethod) {
                return handleUseCaseError({
                    error: "Payment method not found",
                    title: "Update Payment Method",
                    status: EStatusCodes.enum.notFound
                });
            }

            const updatedPaymentMethod = await this.paymentMethodRepository.update(existingPaymentMethod.id!, validate.data);
            if (!updatedPaymentMethod) {
                return handleUseCaseError({
                    error: "Error updating payment method",
                    title: "Update Payment Method"
                });
            }

            return {
                data: updatedPaymentMethod,
                success: true,
            };
        } catch (error) {
            return handleUseCaseError({ title: "Update Payment Method", status: 500 });
        }
    }
}