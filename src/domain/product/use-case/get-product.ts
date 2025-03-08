import { TProduct } from "../../../data/entity/product";
import { EStatusCodes } from "../../../shared/enum";
import { BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IProductRepository } from "../repository";

export class GetProductUseCase implements BaseUseCase<{ id?: string, slug?: string }, TProduct> {
    constructor(private readonly productRepository: IProductRepository) { }
    async execute({ id, slug }: { id?: string; slug?: string; }): Promise<UseCaseResult<TProduct>> {
        try {
            if (!id && !slug) {
                return handleUseCaseError({
                    title: "Invalid Input",
                    error: "Either ID or Slug must be provided",
                    status: EStatusCodes.enum.badRequest
                });
            }

            let product;
            if (id) {
                product = await this.productRepository.findById(id);
            } else if (slug) {
                product = await this.productRepository.findOne({ slug })
            }

            if (!product) {
                return handleUseCaseError({
                    title: "Product Not Found",
                    error: id ? `Product with ID ${id} not found` : `Product with slug ${slug} not found`,
                    status: EStatusCodes.enum.notFound
                });
            }

            return { data: product, success: true };
        } catch (error: any) {
            return handleUseCaseError({
                title: "Get Product Failed",
                error: "Failed to retrieve product",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}