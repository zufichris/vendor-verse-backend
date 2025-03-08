import { TVendor } from "../../../data/entity/vendor";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { EBusinessTypes } from "../../../data/enum/vendor";
import { CreateVendorDTO, CreateVendorSchema } from "../../../data/dto/vendor";
import { IVendorRepository } from "../repository";

export class CreateVendorUseCase implements BaseUseCase<CreateVendorDTO, TVendor, AuthContext> {
    constructor(private readonly vendorRepository: IVendorRepository) { }

    async execute(input: CreateVendorDTO, context: AuthContext): Promise<UseCaseResult<TVendor>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Authentication Required",
                    error: "User ID not found in context. Please ensure the user is authenticated.",
                    status: EStatusCodes.enum.unauthorized
                });
            }
            const validate = validateData<CreateVendorDTO>(input, CreateVendorSchema);
            if (!validate.success) {
                return handleUseCaseError({
                    error: `Invalid input data: ${validate.error}`,
                    title: "Create Vendor",
                    status: EStatusCodes.enum.badRequest
                });
            }

            const existingVendor = await this.vendorRepository.findOne({ userId: validate.data.userId });
            if (existingVendor) {
                return handleUseCaseError({
                    error: "A vendor with this user ID already exists.",
                    title: "Create Vendor",
                    status: EStatusCodes.enum.conflict
                });
            }

            const data: Partial<TVendor> = {
                ...validate.data,
                isVerified: false,
                businessType: validate.data.businessType || EBusinessTypes.enum["SOLE PROPRIETOR"],
                isActive: true,
                verification: {
                    status: "PENDING",
                    documentType: validate.data.verification?.documentType || null,
                    reason: null,
                    documentUrls: [],
                },
                orders: { total: 0, monthlyComparison: { lastMonth: 0, thisMonth: 0 } },
                sales: { total: 0, trend: [], returnRate: 0 },
                followersCount: 0,
                productsCount: 0,
                payoutSchedule: "MONTHLY",
                lastActiveAt: null,
            };

            const createdVendor = await this.vendorRepository.create(data);
            if (!createdVendor) {
                return handleUseCaseError({
                    error: "Failed to create vendor in the database.",
                    title: "Create Vendor",
                    status: EStatusCodes.enum.internalServerError
                });
            }

            return {
                data: createdVendor,
                success: true,
            };
        } catch (error) {
            console.error("Error creating vendor:", error);
            return handleUseCaseError({
                title: "Create Vendor",
                error: "An unexpected error occurred while creating the vendor.",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}