import { FilterQuery, QueryOptions, ProjectionType } from "mongoose";
import { BaseRepository } from "../../core/repository";
import { UpdateProductDto } from "./product.dtos";
import { Product, ProductVariant } from "./product.types";
import { ProductModel, ProductVariantModel } from "./product.models";

export class ProductRepository extends BaseRepository<Product> {
  constructor(protected readonly model: typeof ProductModel) {
    super(model);
  }

  private readonly variantsRepo: BaseRepository<ProductVariant> = new BaseRepository(ProductVariantModel)

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

  getVariant(variantId: string, withVariant: boolean = false) {
    return this.variantsRepo.findById(variantId, undefined, {
      populate: withVariant ? ['variantId'] : []
    })
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
