import { TVendor, VendorSchema } from "../../../data/entities/vendor";
import { BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../global/useCase";
import { validateData } from "../../../utils/functions";
import { EStatusCodes } from "../../../global/enums";
import { IVendorRepository } from "../repository";
import { UpdateVendorDTO } from "../../../data/dto/vendor";
import { UpdateUserSchema } from "../../../data/dto/user";

export class UpdateVendorUseCase implements BaseUseCase<{ id: string, data: Partial<UpdateVendorDTO> }, TVendor> {
    constructor(private readonly vendorRepository: IVendorRepository) { }

    async execute(input: { id: string, data: Partial<UpdateVendorDTO> }, context?: void | undefined): Promise<UseCaseResult<TVendor>> {
        try {
            const { id, data } = input;
            const validate = validateData<UpdateVendorDTO>(data, UpdateUserSchema);
            if (!validate.success) {
                return handleUseCaseError({ error: validate.error, title: "Update Vendor", status: EStatusCodes.enum.badRequest });
            }

            const existingVendor = await this.vendorRepository.findById(id);
            if (!existingVendor) {
                return handleUseCaseError({ error: "Vendor not found", title: "Update Vendor", status: EStatusCodes.enum.notFound });
            }

            const updatedVendor = await this.vendorRepository.update(id, { ...validate.data, updatedAt: new Date() });

            if (!updatedVendor) {
                return handleUseCaseError({ error: "Error updating vendor", title: "Update Vendor" });
            }

            return {
                data: updatedVendor,
                success: true,
            };
        } catch (error) {
            return handleUseCaseError({ title: "Update Vendor", status: 500 });
        }
    }
}
