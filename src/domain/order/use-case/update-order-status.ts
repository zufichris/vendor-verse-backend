import { TOrder } from "../../../data/entity/order";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { UpdateOrderStatusDTO, UpdateOrderStatusSchema } from "../../../data/dto/order";
import { IOrderRepository } from "../repository";

export class UpdateOrderStatusUseCase implements BaseUseCase<UpdateOrderStatusDTO, TOrder, AuthContext> {
    constructor(private readonly orderRepository: IOrderRepository) { }

    async execute(input: UpdateOrderStatusDTO, context: AuthContext): Promise<UseCaseResult<TOrder>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({
                    title: "Authentication Required",
                    error: "User must be authenticated to perform this action.",
                    status: EStatusCodes.enum.unauthorized
                });
            }

            const validationResult = validateData<UpdateOrderStatusDTO>(input, UpdateOrderStatusSchema);
            if (!validationResult.success) {
                return handleUseCaseError({
                    title: "Invalid Input",
                    error: `Invalid order data provided: ${validationResult.error}`,
                    status: EStatusCodes.enum.badRequest
                });
            }

            const updatedOrder = await this.orderRepository.update(
                validationResult.data.id!,
                { status: validationResult.data.status, }
            );
            if (!updatedOrder) {
                return handleUseCaseError({
                    title: "Order Not Found",
                    error: `Order with id '${validationResult.data.id}' not found or could not be updated.`,
                    status: EStatusCodes.enum.notFound
                });
            }

            return {
                data: updatedOrder,
                success: true,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while updating the order status.";
            return handleUseCaseError({
                title: "Internal Server Error",
                error: `Failed to update order status: ${errorMessage}`,
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}