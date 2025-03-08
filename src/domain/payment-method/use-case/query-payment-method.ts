import { TPaymentMethod } from "../../../data/entity/payment-method";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IPaymentMethodRepository } from "../repository";

export class QueryPaymentMethodUseCase implements BaseUseCase<IQueryFilters<TPaymentMethod>, IQueryResult<TPaymentMethod>, AuthContext> {
    constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) { }

    async execute(options?: IQueryFilters<TPaymentMethod>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TPaymentMethod>>> {
        try {
            const result = await this.paymentMethodRepository.query(options);
            if (!result) {
                return handleUseCaseError({ error: "Error fetching payment methods", title: "Query Payment Method" });
            }
            return { data: result, success: true };
        } catch (error) {
            return handleUseCaseError({ title: "Query Payment Method", status: 500 });
        }
    }
}