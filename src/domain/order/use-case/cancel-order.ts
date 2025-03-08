import { TOrder } from "../../../data/entity/order";
import { EStatusCodes } from "../../../shared/enum";
import { CancelOrderDTO, CancelOrderSchema } from "../../../data/dto/order";
import { IOrderRepository } from "../repository";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions, validateData } from "../../../util/functions";

export class CancelOrderUseCase implements BaseUseCase<CancelOrderDTO, TOrder, AuthContext> {
    constructor(private readonly orderRepository: IOrderRepository) { }

    async execute(input: CancelOrderDTO, context: AuthContext): Promise<UseCaseResult<TOrder>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Authentication Required",
                    error: "User must be authenticated to cancel the order.",
                    status: EStatusCodes.enum.unauthorized,
                });
            }

            const REQUIRED_PERMISSION = getPermission("order", "manage_own");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to create roles.",
                    title: "Create Role - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const validation = validateData<CancelOrderDTO>(input, CancelOrderSchema);
            if (!validation.success) {
                return handleUseCaseError({
                    title: "Invalid Input",
                    error: `Invalid order cancellation data provided.`,
                    status: EStatusCodes.enum.badRequest,
                });
            }

            const orderId = validation.data.id;
            const order = await this.orderRepository.findById(orderId);

            if (!order) {
                return handleUseCaseError({
                    title: "Order Not Found",
                    error: `Order with id ${orderId} not found.`,
                    status: EStatusCodes.enum.notFound,
                });
            }

            if (order.userId !== context.userId.toString()) {
                return handleUseCaseError({
                    title: "Unauthorized Action",
                    error: "You are not authorized to cancel this order.",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            if (order.status !== "PENDING") {
                return handleUseCaseError({
                    title: "Invalid Order State",
                    error: "Order can only be cancelled if it's in PENDING state.",
                    status: EStatusCodes.enum.badRequest,
                });
            }

            const updatedOrder = await this.orderRepository.update(orderId, { status: "CANCELLED" });
            if (!updatedOrder) {
                return handleUseCaseError({
                    title: "Order Cancellation Failed",
                    error: "Failed to cancel the order due to an unexpected error.",
                    status: EStatusCodes.enum.internalServerError,
                });
            }

            return {
                success: true,
                data: updatedOrder,
            };
        } catch (error) {
            return handleUseCaseError({
                title: "Internal Server Error",
                error: "An unexpected error occurred while processing your request.",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}