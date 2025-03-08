import { EStatusCodes } from "../../../shared/enum";
import { BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IVendorRepository } from "../repository";

export class GetVendorStatsUseCase implements BaseUseCase<string, { totalSales: number, returnRate: number, orders: number }> {
    constructor(private readonly vendorRepository: IVendorRepository) { }

    async execute(id: string, context?: void | undefined): Promise<UseCaseResult<{ totalSales: number, returnRate: number, orders: number }>> {
        try {
            const vendor = await this.vendorRepository.findById(id);
            if (!vendor) {
                return handleUseCaseError({ error: "Vendor not found", title: "Get Vendor Stats", status: EStatusCodes.enum.notFound });
            }

            return {
                data: {
                    totalSales: vendor.sales.total,
                    returnRate: vendor.sales.returnRate,
                    orders: vendor.orders.total
                },
                success: true
            };
        } catch (error) {
            return handleUseCaseError({ title: "Get Vendor Stats", status: 500 });
        }
    }
}
