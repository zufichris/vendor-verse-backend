import { TVendor } from "../../../data/entity/vendor";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IVendorRepository } from "../repository";

export class QueryVendorsUseCase implements BaseUseCase<IQueryFilters<TVendor>, IQueryResult<TVendor>, AuthContext> {
    constructor(private readonly vendorRepository: IVendorRepository) { }

    async execute(options?: IQueryFilters<TVendor>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TVendor>>> {
        try {
            const result = await this.vendorRepository.query(options);
            if (!result) {
                return handleUseCaseError({ error: "Error fetching vendors", title: "Get Vendors" });
            }

            return { data: result, success: true };
        } catch (error) {
            return handleUseCaseError({ title: "Get Vendors", status: 500 });
        }
    }
}
