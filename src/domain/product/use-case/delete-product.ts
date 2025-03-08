import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IProductRepository } from "../repository";

export class DeleteProductUseCase implements BaseUseCase<{ id: string }, boolean, AuthContext> {
    constructor(private readonly productRepository: IProductRepository) { }

    async execute(input: { id: string }, context?: AuthContext): Promise<UseCaseResult<boolean>> {
        try {
            if (!context?.userId) {
                return handleUseCaseError({
                    error: "User not authenticated.",
                    title: "Delete Product",
                    status: EStatusCodes.enum.forbidden
                });
            }

            const { id } = input;
            const success = await this.productRepository.delete(id);
            if (!success) {
                return handleUseCaseError({
                    error: `Product with id ${id} not found.`,
                    title: "Delete Product",
                    status: EStatusCodes.enum.notFound
                });
            }

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            return handleUseCaseError({
                error: `Failed to delete product: ${error.message || error}`,
                title: "Delete Product",
                status: EStatusCodes.enum.internalServerError
            });
        }
    }
}