import { TOrder } from "../../../data/entity/order";
import { BaseUseCase, UseCaseResult, handleUseCaseError, AuthContext } from "../../../shared/use-case";
import { IOrderRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";

export class GetOrderUseCase implements BaseUseCase<{ orderId: string; }, TOrder, AuthContext> {
    constructor(private readonly orderRepository: IOrderRepository) { }

    async execute(input: { orderId: string; }, context?: AuthContext): Promise<UseCaseResult<TOrder>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({
                    error: "Unauthorized access: missing user credentials",
                    title: "Get Order",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const REQUIRED_PERMISSION = getPermission("order", "view_own");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission view order.",
                    title: "View order - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }


            if (!input.orderId) {
                return handleUseCaseError({
                    error: "Order identifier not provided",
                    title: "Get Order",
                    status: EStatusCodes.enum.badRequest,
                });
            }

            let order: TOrder | null = null;

            if (input.orderId) {
                order = await this.orderRepository.findById(input.orderId);
            }
            if (!order) {
                return handleUseCaseError({
                    error: "Order not found",
                    title: "Get Order",
                    status: EStatusCodes.enum.notFound,
                });
            }


            return {
                success: true,
                data: order,
            };
        } catch (error) {
            return handleUseCaseError({
                error: "An error occurred while fetching the order",
                title: "Get Order",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}