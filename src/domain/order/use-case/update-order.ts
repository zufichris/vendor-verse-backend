import { TOrder } from "../../../data/entity/order";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { UpdateOrderDTO, UpdateOrderSchema } from "../../../data/dto/order";
import { IOrderRepository } from "../repository";

export class UpdateOrderUseCase implements BaseUseCase<UpdateOrderDTO, TOrder, AuthContext> {
    constructor(private readonly orderRepository: IOrderRepository) { }

    async execute(input: UpdateOrderDTO, context: AuthContext): Promise<UseCaseResult<TOrder>> {

        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Forbidden",
                    error: "User not authenticated",
                    status: EStatusCodes.enum.forbidden
                });
            }

            const validation = validateData<UpdateOrderDTO>(input, UpdateOrderSchema);
            if (!validation.success) {
                return handleUseCaseError({
                    error: validation.error,
                    title: "Invalid Input",
                    status: EStatusCodes.enum.badRequest
                });
            }

            const existingOrder = await this.orderRepository.findOne({ id: validation.data.id });
            if (!existingOrder) {
                return handleUseCaseError({
                    error: "Order not found",
                    title: "Order Not Found",
                    status: EStatusCodes.enum.notFound
                });
            }

            const updatedOrder = await this.orderRepository.update(validation.data.id!, validation.data);
            if (!updatedOrder) {
                return handleUseCaseError({
                    error: "Failed to update order in database",
                    title: "Database Error",
                    status: EStatusCodes.enum.internalServerError
                });
            }

            return {
                data: updatedOrder,
                success: true,
            };
        } catch (error) {
            return handleUseCaseError({
                title: "Unexpected Error",
                error: "An unexpected error occurred during order update",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}