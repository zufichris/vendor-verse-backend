import { TShipping } from "../../../data/entity/shipping";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { CreateShippingDTO, CreateShippingSchema } from "../../../data/dto/shipping";
import { IShippingRepository } from "../repository";

export class CreateShippingUseCase implements BaseUseCase<CreateShippingDTO, TShipping, AuthContext> {
    constructor(private readonly shippingRepository: IShippingRepository) { }

    async execute(input: CreateShippingDTO, context: AuthContext): Promise<UseCaseResult<TShipping>> {
        try {
            if (!context.userId) {
                return handleUseCaseError({
                    title: "Forbidden",
                    error: "Forbidden",
                    status: EStatusCodes.enum.forbidden
                });
            }

            const validate = validateData<CreateShippingDTO>(input, CreateShippingSchema);
            if (!validate.success) {
                return handleUseCaseError({
                    error: validate.error,
                    title: "Create Shipping",
                    status: EStatusCodes.enum.badRequest
                });
            }

            const existingShipping = await this.shippingRepository.findOne({ orderId: validate.data.orderId });
            if (existingShipping) {
                return handleUseCaseError({
                    error: "Shipping record for this order already exists",
                    title: "Create Shipping"
                });
            }

            const data: Partial<TShipping> = {
                ...validate.data,
                status: "PENDING",
            };

            const createdShipping = await this.shippingRepository.create(data);
            if (!createdShipping) {
                return handleUseCaseError({
                    error: "Error creating shipping",
                    title: "Create Shipping"
                });
            }

            return {
                data: createdShipping,
                success: true,
            };
        } catch (error) {
            return handleUseCaseError({ title: "Create Shipping", status: 500 });
        }
    }
}