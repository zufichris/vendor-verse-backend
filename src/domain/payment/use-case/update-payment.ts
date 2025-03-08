import { TPayment } from "../../../data/entity/payment";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions, validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { UpdatePaymentDTO, UpdatePaymentSchema } from "../../../data/dto/payment";
import { IPaymentRepository } from "../repository";

export class UpdatePaymentUseCase implements BaseUseCase<UpdatePaymentDTO, TPayment, AuthContext> {
    constructor(private readonly paymentRepository: IPaymentRepository) { }

    async execute(input: UpdatePaymentDTO, context: AuthContext): Promise<UseCaseResult<TPayment>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({ title: "Forbidden", error: "Forbidden", status: EStatusCodes.enum.forbidden });
            }
            const REQUIRED_PERMISSION = getPermission("payment", "update");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to update payment.",
                    title: "Update Payment - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const validate = validateData<UpdatePaymentDTO>(input, UpdatePaymentSchema);
            if (!validate.success) {
                return handleUseCaseError({ error: validate.error, title: "Update Payment", status: EStatusCodes.enum.badRequest });
            }

            const existingPayment = await this.paymentRepository.findOne({ orderId: validate.data.orderId });
            if (!existingPayment) {
                return handleUseCaseError({ error: "Payment not found", title: "Update Payment", status: EStatusCodes.enum.notFound });
            }

            const updatedData: Partial<TPayment> = {
                ...validate.data,
            };

            const updatedPayment = await this.paymentRepository.update(existingPayment.id!, updatedData);
            if (!updatedPayment) {
                return handleUseCaseError({ error: "Error updating payment", title: "Update Payment" });
            }

            return {
                data: updatedPayment,
                success: true,
            };

        } catch (error) {
            return handleUseCaseError({ title: "Update Payment", status: 500 });
        }
    }
}