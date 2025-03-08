import { TShipping } from "../../../data/entity/shipping";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IShippingRepository } from "../repository";

export class QueryShippingsUseCase implements BaseUseCase<IQueryFilters<TShipping>, IQueryResult<TShipping>, AuthContext> {
    constructor(private readonly shippingRepository: IShippingRepository) { }

    async execute(options?: IQueryFilters<TShipping>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TShipping>>> {
        try {
            const result = await this.shippingRepository.query(options);
            if (!result) {
                return handleUseCaseError({ error: "Error fetching shippings", title: "Query Shippings" });
            }

            return { data: result, success: true };
        } catch (error) {
            return handleUseCaseError({ title: "Query Shippings", status: 500 });
        }
    }
}