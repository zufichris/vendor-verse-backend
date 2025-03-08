import { TOrder } from "../../../data/entity/order";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";
import { IOrderRepository } from "../repository";

export class QueryOrdersUseCase implements BaseUseCase<IQueryFilters<TOrder>, IQueryResult<TOrder>, AuthContext> {
    constructor(private readonly orderRepository: IOrderRepository) { }

    async execute(options?: IQueryFilters<TOrder>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TOrder>>> {
        try {
            const REQUIRED_PERMISSION = getPermission("order", "view_own");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context?.permissions ?? []);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to view orders.",
                    title: "view Orders- Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            const result = await this.orderRepository.query(options);

            if (!result) {
                return handleUseCaseError({
                    title: "Get Orders",
                    error: "Failed to retrieve orders from the database.",
                    status: EStatusCodes.enum.notFound
                });
            }

            return { data: result, success: true };
        } catch (error) {
            console.error("Error querying orders:", error);
            return handleUseCaseError({
                title: "Get Orders",
                error: "An unexpected error occurred while querying orders.",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}