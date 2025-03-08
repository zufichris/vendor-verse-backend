import { EProductStatus, TProduct } from "../../../data/entity/product";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IProductRepository } from "../repository";

export class UpdateProductStatusUseCase implements BaseUseCase<{ id: string; status: string }, TProduct | null, AuthContext> {
    constructor(private readonly productRepository: IProductRepository) { }
    async execute(input: { id: string; status: typeof EProductStatus._type }, context?: AuthContext): Promise<UseCaseResult<TProduct>> {
        try {
            const { id, status } = input;
            const updatedProduct = await this.productRepository.update(id, { status });
            if (!updatedProduct) {
                return handleUseCaseError({ error: `Product with id ${id} not found.`, title: "Update Product Status", status: EStatusCodes.enum.notFound });
            }

            return {
                success: true,
                data: updatedProduct,
            };
        } catch (error) {
            console.error("Error updating product status:", error);
            return handleUseCaseError({ title: "Update Product Status", error: "Failed to update product status.", status: EStatusCodes.enum.internalServerError });
        }
    }
}