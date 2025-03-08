import { TVendor } from "../../../data/entity/vendor";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IVendorRepository } from "../repository";

export class VerifyVendorUseCase implements BaseUseCase<{ id: string, status: "APPROVED" | "REJECTED", reason?: string }, TVendor, AuthContext> {
    constructor(private readonly vendorRepository: IVendorRepository) { }

    async execute(input: { id: string, status: "APPROVED" | "REJECTED", reason?: string }, context?: AuthContext): Promise<UseCaseResult<TVendor>> {
        try {
            const { id, status, reason } = input;
            const existingVendor = await this.vendorRepository.findById(id);
            if (!existingVendor) {
                return handleUseCaseError({
                    error: "Vendor not found",
                    title: "Verify Vendor",
                    status: EStatusCodes.enum.notFound
                });
            }

            const updatedVendor = await this.vendorRepository.update(id, {
                isVerified: status === "APPROVED",
                verification: { status, reason: status === "REJECTED" ? reason : null, documentUrls: [] },
            });

            if (!updatedVendor) {
                return handleUseCaseError({
                    error: "Failed to update vendor verification status.",
                    title: "Verify Vendor",
                    status: EStatusCodes.enum.internalServerError
                });
            }

            return { data: updatedVendor, success: true };
        } catch (error) {
            console.error("Error verifying vendor:", error);
            return handleUseCaseError({
                title: "Verify Vendor",
                error: "An unexpected error occurred while verifying the vendor.",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}