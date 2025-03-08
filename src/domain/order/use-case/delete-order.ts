import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { EStatusCodes } from "../../../shared/enum";
import { IOrderRepository } from "../repository";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";

export class DeleteOrderUseCase implements BaseUseCase<string, boolean, AuthContext> {
    constructor(private readonly orderRepository: IOrderRepository) { }

    async execute(id: string, context: AuthContext): Promise<UseCaseResult<boolean>> {
        try {
            const REQUIRED_PERMISSION = getPermission("order", "manage_own")
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to delete orders.",
                    title: "Delete Order - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const order = await this.orderRepository.findOne({ id, userId: context.userId });
            if (!order) {
                return handleUseCaseError({
                    title: "Order Not Found",
                    error: `Order with id ${id} not found for user`,
                    status: EStatusCodes.enum.notFound
                });
            }

            const deletedOrder = await this.orderRepository.delete(id);
            if (!deletedOrder) {
                return handleUseCaseError({
                    title: "Order Deletion Failed",
                    error: `Failed to delete order with id ${id}`,
                    status: EStatusCodes.enum.internalServerError
                });
            }

            return {
                success: true,
                data: deletedOrder,
            };
        } catch (error: any) {
            return handleUseCaseError({
                title: "Unexpected Error",
                error: "An unexpected error occurred during order deletion",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}