import { TShipping } from "../../../data/entity/shipping";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { UpdateShippingDTO, UpdateShippingSchema } from "../../../data/dto/shipping";
import { IShippingRepository } from "../repository";

export class UpdateShippingUseCase implements BaseUseCase<UpdateShippingDTO, TShipping, AuthContext> {
    constructor(private readonly shippingRepository: IShippingRepository) { }

    async execute(input: UpdateShippingDTO, context: AuthContext): Promise<UseCaseResult<TShipping>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Update Shipping",
                    error: "Forbidden: User is not authorized to update shipping.",
                    status: EStatusCodes.enum.forbidden
                });
            }

            const validation = validateData<UpdateShippingDTO>(input, UpdateShippingSchema);
            if (!validation.success) {
                return handleUseCaseError({
                    error: validation.error,
                    title: "Update Shipping",
                    status: EStatusCodes.enum.badRequest
                });
            }

            const existingShipping = await this.shippingRepository.findOne({
                id: validation.data.id,
                userId: context.userId
            });
            if (!existingShipping) {
                return handleUseCaseError({
                    error: "Shipping record not found or unauthorized.",
                    title: "Update Shipping",
                    status: EStatusCodes.enum.notFound
                });
            }

            const updatedShipping = await this.shippingRepository.update(existingShipping.id!, validation.data);
            if (!updatedShipping) {
                return handleUseCaseError({
                    error: "Error updating shipping record.",
                    title: "Update Shipping"
                });
            }

            return {
                data: updatedShipping,
                success: true
            };
        } catch (error) {
            return handleUseCaseError({
                title: "Update Shipping",
                status: 500
            });
        }
    }
}