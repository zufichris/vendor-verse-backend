import { TProduct } from "../../../data/entity/product";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IProductRepository } from "../repository";

export class UpdateProductUseCase implements BaseUseCase<{ id: string; data: Partial<TProduct> }, TProduct | null, AuthContext> {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(input: { id: string; data: Partial<TProduct> }, context?: AuthContext): Promise<UseCaseResult<TProduct>> {
        try {
            const { id, data } = input;
            const updatedProduct = await this.productRepository.update(id, data);

            if (!updatedProduct) {
                return handleUseCaseError({
                    title: "Update Product",
                    error: `Product with id ${id} not found.`,
                    status: EStatusCodes.enum.notFound,
                });
            }

            return {
                success: true,
                data: updatedProduct,
            };
        } catch (error: any) {
            return handleUseCaseError({
                title: "Update Product",
                error: `Failed to update product: ${error.message || 'Unknown error'}`,
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}