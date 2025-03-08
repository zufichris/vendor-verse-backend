import { TShipping } from "../../../data/entity/shipping";
import { BaseUseCase, UseCaseResult, handleUseCaseError, AuthContext } from "../../../shared/use-case";
import { IShippingRepository } from "../repository";
import { EStatusCodes } from "../../../shared/enum";

export interface GetShippingInput {
    shippingId: string;
}

export class GetShippingUseCase implements BaseUseCase<GetShippingInput, TShipping, AuthContext> {
    constructor(private readonly shippingRepository: IShippingRepository) { }

    async execute(input: GetShippingInput, context?: AuthContext): Promise<UseCaseResult<TShipping>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({
                    error: "Unauthorized access: User authentication is required to retrieve shipping information.",
                    title: "Get Shipping",
                    status: EStatusCodes.enum.forbidden,
                });
            }

            if (!input.shippingId) {
                return handleUseCaseError({
                    error: "Invalid request: A shippingId or trackingNumber must be provided.",
                    title: "Get Shipping",
                    status: EStatusCodes.enum.badRequest,
                });
            }

            const shipping = await this.shippingRepository.findById(input.shippingId);

            if (!shipping) {
                return handleUseCaseError({
                    error: "Shipping record not found for the provided identifier.",
                    title: "Get Shipping",
                    status: EStatusCodes.enum.notFound,
                });
            }

            return {
                success: true,
                data: shipping,
            };
        } catch (error) {
            return handleUseCaseError({
                error: "An unexpected error occurred while retrieving the shipping record.",
                title: "Get Shipping",
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}