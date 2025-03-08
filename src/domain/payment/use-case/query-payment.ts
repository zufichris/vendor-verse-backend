import { TPayment } from "../../../data/entity/payment";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";
import { IPaymentRepository } from "../repository";

export class QueryPaymentUseCase implements BaseUseCase<IQueryFilters<TPayment>, IQueryResult<TPayment>, AuthContext> {
    constructor(private readonly paymentRepository: IPaymentRepository) { }

    async execute(options?: IQueryFilters<TPayment>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TPayment>>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({ title: "Forbidden", status: EStatusCodes.enum.forbidden });
            }
            const REQUIRED_PERMISSION = getPermission("payment", "view_own");
            const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
            if (!hasPermission) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to view payments.",
                    title: "View Payments - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const result = await this.paymentRepository.query(options);
            if (!result) {
                return handleUseCaseError({ error: "Error fetching payments", title: "Query Payment" });
            }
            return { data: result, success: true };
        } catch (error) {
            return handleUseCaseError({ title: "Query Payment", status: 500 });
        }
    }
}