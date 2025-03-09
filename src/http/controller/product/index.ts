import { Request, Response, NextFunction } from "express";
import { ProductRepositoryImpl } from "../../../data/orm/repository-implementation/product";
import { ProductModel } from "../../../data/orm/model/product";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { TProduct } from "../../../data/entity/product";
import { IQueryFilters, IResponseData, IResponseDataPaginated } from "../../../shared/entity";
import { CreateProductDTO, UpdateProductDTO, CreateProductSchema, UpdateProductSchema } from "../../../data/dto/product";
import ProductUseCase from "../../../domain/product/use-case";
import qs from 'qs';
import { throwError } from "../../../shared/error";
import { logger } from "../../../util/logger";

export class ProductControllers {
    constructor(
        private readonly productUseCase: ProductUseCase
    ) {
        this.createProduct = this.createProduct.bind(this);
        this.getProduct = this.getProduct.bind(this);
        this.updateProduct = this.updateProduct.bind(this);
        this.queryProducts = this.queryProducts.bind(this);
        this.updateProductStatus = this.updateProductStatus.bind(this);
        this.deleteProduct = this.deleteProduct.bind(this);
    }

    async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<CreateProductDTO>(req.body, CreateProductSchema);
            if (!validate.success) {
                throwError({
                    message: "Validation failed",
                    description: validate.error,
                    statusCode: EStatusCodes.enum.badRequest,
                    type: "Validation"
                });
                return;
            }

            const result = await this.productUseCase.create.execute(validate.data, req.user);
            if (!result.success) {
                throwError({
                    message: "Product creation failed",
                    description: result.error,
                    statusCode: EStatusCodes.enum.conflict,
                    type: "Conflict"
                });
                return;
            }

            const data: IResponseData<TProduct> = {
                ...this.generateMetadata(req, "Product created successfully"),
                status: EStatusCodes.enum.created,
                success: true,
                data: result.data
            };
            res.status(data.status).json(data);
        } catch (error) {
            logger.error(`Error in createProduct:`, error);
            next(error);
        }
    }

    async getProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params.productId;
            if (!productId) {
                throwError({
                    message: "Invalid product ID",
                    description: "Product ID is required",
                    statusCode: EStatusCodes.enum.badRequest,
                    type: "Validation"
                });
                return;
            }

            const result = await this.productUseCase.get.execute({ id: productId });
            if (!result.success) {
                throwError({
                    message: "Product not found",
                    description: result.error ?? "Product Not Found",
                    statusCode: EStatusCodes.enum.notFound,
                    type: "NotFound"
                });
                return;
            }

            const data: IResponseData<TProduct> = {
                ...this.generateMetadata(req, "Product retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data
            };
            res.status(data.status).json(data);
        } catch (error) {
            logger.error(`Error in getProduct:`, error);
            next(error);
        }
    }

    async queryProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const query = this.generateProductQuery(req.query);
            const result = await this.productUseCase.query.execute(query);
            if (!result.success) {
                throwError({
                    message: "Failed to retrieve products",
                    description: result.error ?? "Failed to retrieve products",
                    statusCode: EStatusCodes.enum.badGateway,
                    type: "Server"
                });
                return;
            }

            const data: IResponseDataPaginated<TProduct> = {
                ...this.generateMetadata(req, "Products retrieved successfully"),
                ...result.data,
                status: EStatusCodes.enum.ok,
                success: true
            };
            res.status(data.status).json(data);
        } catch (error) {
            logger.error(`Error in queryProducts:`, error);
            next(error);
        }
    }

    async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<UpdateProductDTO>(req.body, UpdateProductSchema);
            if (!validate.success) {
                throwError({
                    message: "Validation failed",
                    description: validate.error,
                    statusCode: EStatusCodes.enum.badRequest,
                    type: "Validation"
                });
                return;
            }

            const result = await this.productUseCase.update.execute({
                data: req.body,
                id: req.body.id
            }, req.user);
            if (!result.success) {
                throwError({
                    message: "Product update failed",
                    description: result.error ?? "Failed to update product",
                    statusCode: EStatusCodes.enum.conflict,
                    type: "Conflict"
                });
                return;
            }

            const data: IResponseData<TProduct> = {
                ...this.generateMetadata(req, "Product updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data
            };
            res.status(data.status).json(data);
        } catch (error) {
            logger.error(`Error in updateProduct:`, error);
            next(error);
        }
    }

    async updateProductStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params.productId;
            const status = req.body.status;
            const result = await this.productUseCase.updateStatus.execute({ id: productId, status });
            if (!result.success) {
                throwError({
                    message: "Failed to change product status",
                    description: result.error ?? "Failed to change product status",
                    statusCode: result.status ?? EStatusCodes.enum.badGateway,
                    type: "Server"
                });
                return;
            }

            const data: IResponseData<TProduct> = {
                ...this.generateMetadata(req, "Product status updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data
            };
            res.status(data.status).json(data);
        } catch (error) {
            logger.error(`Error in updateProductStatus:`, error);
            next(error);
        }
    }

    async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params.productId;
            const result = await this.productUseCase.delete.execute({ id: productId }, req.user);
            if (!result.success) {
                throwError({
                    message: "Failed to delete product",
                    description: result.error ?? "Failed to delete product",
                    statusCode: EStatusCodes.enum.conflict,
                    type: "Conflict"
                });
                return;
            }

            const data = {
                ...this.generateMetadata(req, "Product deleted successfully"),
                status: EStatusCodes.enum.ok,
                success: true
            };
            res.status(data.status).json(data);
        } catch (error) {
            logger.error(`Error in deleteProduct:`, error);
            next(error);
        }
    }

    private generateMetadata(req: Request, message: string, type?: string) {
        return {
            url: req.url,
            path: req.path,
            type: type ?? "Product",
            message
        };
    }

    private generateProductQuery(query: qs.ParsedQs) {
        let {
            page = 1,
            limit = 10,
            sort_order = "asc",
            sort_by = "createdAt"
        } = query;

        const sortByStr = typeof sort_by === 'object' ? 'createdAt' : String(sort_by);
        const sortOrderStr = typeof sort_order === 'object' ? 'asc' : String(sort_order);
        const sort = { [sortByStr]: sortOrderStr === 'desc' ? -1 : 1 };
        const searchTerm = typeof query.search === 'string' ? query.search : '';
        const search = searchTerm ? {
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
            ]
        } : undefined;
        const filter = search ?? {};

        const queryOptions = {
            sort
        };
        const projection = {
            id: true,
            defaultCurrency: true,
            inventory: true,
            isBestSeller: true,
            isFeatured: true,
            defaultPrice: true,
            isLimitedEdition: true,
            reviewCount: true,
            mainImage: true,
            name: true,
            isPromoted: true,
            isNewProduct: true,
            slug: true,
            sku: true,
            updatedAt: true,
            createdAt: true,
        };

        const options: IQueryFilters<TProduct> = {
            filter,
            limit: Number(limit ?? 20),
            page: Number(page ?? 1),
            projection,
            queryOptions
        };
        return options;
    }
}

export const productControllers = new ProductControllers(new ProductUseCase(new ProductRepositoryImpl(ProductModel)));