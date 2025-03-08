import { TProduct } from "../../../data/entity/product";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IProductRepository } from "../repository";

export class CreateProductUseCase implements BaseUseCase<Partial<TProduct>, TProduct, AuthContext> {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(input: Partial<TProduct>, context?: AuthContext): Promise<UseCaseResult<TProduct>> {
        try {

            const newProduct = await this.productRepository.create(input);
            if (!newProduct) {
                return handleUseCaseError({
                    error: "Failed to create product in the database.",
                    title: "Create Product",
                    status: EStatusCodes.enum.internalServerError
                });
            }

            return {
                success: true,
                data: newProduct,
            };
        } catch (error: any) {
            // Log the error for debugging purposes.  Consider using a logging service.
            console.error("Error creating product:", error);
            return handleUseCaseError({
                title: "Create Product",
                error: "An unexpected error occurred while creating the product.",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}