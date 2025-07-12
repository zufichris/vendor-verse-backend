import mongoose, { FilterQuery, QueryOptions, ProjectionType } from "mongoose";
import { BaseRepository } from "../../core/repository";
import { CreateProductDto, UpdateProductDto } from "./product.dtos";
import { Product } from "./product.types";
import { ProductCategoryModel, ProductDocument, ProductModel } from "./product.models";

export class ProductRepository extends BaseRepository<Product> {
    constructor(protected readonly model: mongoose.Model<ProductDocument>) {
        super(model);
    }

    async findBySlug(
        slug: string,
        projection?: ProjectionType<Product>,
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.findOne({ slug }, projection, options);
    }

    async findBySku(
        sku: string,
        projection?: ProjectionType<Product>,
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.findOne({ sku }, projection, options);
    }

    async findByCategory(
        categoryId: string,
        projection?: ProjectionType<Product>,
        options?: QueryOptions<Product>,
    ): Promise<Product[]> {
        return this.find(
            { categoryId, isDeleted: { $ne: true } },
            projection,
            options,
        );
    }

    async findActive(
        filter: FilterQuery<Product> = {},
        projection?: ProjectionType<Product>,
        options?: QueryOptions<Product>,
    ): Promise<Product[]> {
        return this.find(
            { ...filter, status: "active", isDeleted: { $ne: true } },
            projection,
            options,
        );
    }

    async updateProduct(
        id: string,
        dto: UpdateProductDto,
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.updateById(id, dto, options);
    }

    async softDelete(
        id: string,
        deletedById: string,
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.updateById(
            id,
            {
                $set: { isDeleted: true, deletedAt: new Date(), deletedById },
            },
            options,
        );
    }

    async findVariantById(
        productId: string,
        variantId: string,
        projection?: ProjectionType<Product>,
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.findOne(
            { _id: productId, "variants._id": variantId },
            projection,
            options,
        );
    }

    async addVariant(
        productId: string,
        variant: Product["variants"],
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.updateById(
            productId,
            { $push: { variants: variant } },
            options,
        );
    }

    async updateVariant(
        productId: string,
        variantId: string,
        variantUpdate: Partial<Product["variants"]>,
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.updateOne(
            { _id: productId, "variants._id": variantId },
            { $set: { "variants.$": variantUpdate } },
            options,
        );
    }

    async deleteVariant(
        productId: string,
        variantId: string,
        options?: QueryOptions<Product>,
    ): Promise<Product | null> {
        return this.updateById(
            productId,
            { $pull: { variants: { _id: variantId } } },
            options,
        );
    }
}
