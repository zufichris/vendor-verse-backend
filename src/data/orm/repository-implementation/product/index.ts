import { ID, IQueryFilters, IQueryResult } from "../../../../shared/entity";
import { getQueryMetaData, getUnitId } from "../../../../util/functions";
import { logger } from "../../../../util/logger";
import { ProductDocument, ProductModel } from "../../model/product";
import { TProduct } from "../../../entity/product";
import mongoose from "mongoose";
import { ProductRepository } from "../../../../domain/product/repository";

export class ProductRepositoryImpl implements ProductRepository {
    constructor(private readonly productModel: typeof ProductModel) {
        this.count = this.count.bind(this);
        this.findOne = this.findOne.bind(this);
        this.findById = this.findById.bind(this);
    }

    async create(data: Partial<TProduct>): Promise<TProduct | null> {
        try {
            const sku = await getUnitId<ProductDocument>(this.productModel, 'slug', "PROD", 5)
            const newProduct: ProductDocument = await this.productModel.create({ ...data, sku });
            return newProduct.toJSON() as TProduct | null;
        } catch (error) {
            logger.error("Error Creating Product", { error, data });
            return null;
        }
    }

    async findById(id: ID): Promise<TProduct | null> {
        try {
            const product = await this.productModel.findById(id);
            return product?.toJSON() as TProduct | null;
        } catch (error) {
            logger.error("Error Finding Product by ID", { error, id });
            return null;
        }
    }

    async findOne(filter?: mongoose.RootFilterQuery<TProduct>): Promise<TProduct | null> {
        try {
            const product = await this.productModel.findOne(filter);
            return product?.toJSON() as TProduct | null;
        } catch (error) {
            logger.error("Error Finding Product", { error, filter });
            return null;
        }
    }

    async count(filter?: mongoose.FilterQuery<TProduct>): Promise<number> {
        try {
            const count = await this.productModel.countDocuments(filter);
            return count;
        } catch (error) {
            logger.error("Error Counting Products", { error, filter });
            return 0;
        }
    }

    async update(id: ID, data: Partial<TProduct>): Promise<TProduct | null> {
        try {
            if (Object.keys(data).length === 0) {
                throw new Error("No data provided to update");
            }
            const updatedProduct: ProductDocument | null = await this.productModel.findByIdAndUpdate(id, data, { new: true });
            return updatedProduct?.toJSON() as TProduct | null;
        } catch (error) {
            logger.error("Error Updating Product", { error, id, data });
            return null;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.productModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            logger.error("Error Deleting Product", { error, id });
            return false;
        }
    }

    async query(options?: IQueryFilters<TProduct>): Promise<IQueryResult<TProduct>> {
        try {
            const limit = options?.limit ?? 10;
            const page = options?.page ?? 1;
            const skip = (page - 1) * limit;

            const [data = [], totalCount = 0, filterCount = 0] = await Promise.all([
                this.productModel.find(options?.filter ?? {}, options?.projection, {
                    ...options?.queryOptions,
                    limit,
                    skip
                }),
                this.count(),
                this.count(options?.filter),
            ]);

            const products = data.map(product => product.toJSON() as TProduct);
            const metadata = getQueryMetaData({
                totalCount,
                page,
                limit,
                filterCount
            });

            return {
                data: products,
                ...metadata,
            };
        } catch (error) {
            logger.error("Error Querying Products", { error, options });
            throw error
        }
    }

    // async findBySlug(slug: string): Promise<TProduct | null> {
    //     try {
    //         const product = await this.findOne({ slug });
    //         return product;
    //     } catch (error) {
    //         logger.error("Error Finding Product by Slug", { error, slug });
    //         return null;
    //     }
    // }

    // async findBestSellers(options?: IQueryFilters<TProduct>): Promise<IQueryResult<TProduct> | null> {
    //     try {
    //         const bestSellers = await this.query({ ...options, filter: { ...options?.filter, isBestSeller: true } });
    //         return bestSellers;
    //     } catch (error) {
    //         logger.error("Error Finding Best Sellers", { error, options });
    //         return null;
    //     }
    // }

    // async updateProductStatus(id: ID, status: EProductStatus.Enum): Promise<TProduct | null> {
    //     try {
    //         const updatedProduct = await this.update(id, { status });
    //         return updatedProduct;
    //     } catch (error) {
    //         logger.error("Error Updating Product Status", { error, id, status });
    //         return null;
    //     }
    // }
}
