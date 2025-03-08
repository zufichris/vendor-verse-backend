import { TVendor } from "../../../data/entity/vendor";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IVendorRepository } from "../repository";

export class GetVendorUseCase implements BaseUseCase<{ id?: string, vendId: string }, TVendor, AuthContext> {
    constructor(private readonly vendorRepository: IVendorRepository) { }

    async execute({ vendId, id }: { id?: string, vendId: string }, context?: AuthContext): Promise<UseCaseResult<TVendor>> {
        try {
            if (!vendId || !id) {
                return handleUseCaseError({ title: "invalid ID", status: EStatusCodes.enum.badRequest })
            }

            let vendor;
            if (id) {
                vendor = await this.vendorRepository.findById(id);
            } else if (vendId) {
                vendor = await this.vendorRepository.findOne({ vendId })
            }
            if (!vendor) {
                return handleUseCaseError({ error: "Vendor not found", title: "Get Vendor", status: EStatusCodes.enum.notFound });
            }

            return { data: vendor, success: true };
        } catch (error) {
            return handleUseCaseError({ title: "Get Vendor", status: 500 });
        }
    }
}
