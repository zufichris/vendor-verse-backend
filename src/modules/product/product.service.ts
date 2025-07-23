import { ClientSession } from "mongoose";
import { ProductRepository } from "./product.repository";
import { BaseRepository, PaginationResult } from "../../core/repository";
import {
  CreateProductDto,
  CreateProductDtoSchema,
  UpdateProductDto,
  UpdateProductDtoSchema,
  CreateProductCategoryDto,
  CreateProductCategoryDtoSchema,
  UpdateProductCategoryDto,
  UpdateProductCategoryDtoSchema,
} from "./product.dtos";
import {
  Banner,
  BannerSchema,
  Product,
  ProductCategory,
  ProductVariant,
} from "./product.types";
import { AppError } from "../../core/middleware/error.middleware";
import { z } from "zod";

export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: BaseRepository<ProductVariant>,
    private readonly categoryRepository: BaseRepository<ProductCategory>,
    private readonly bannersRepository: BaseRepository<Banner>,
  ) {
    this.getBanners = this.getBanners.bind(this);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const validated = CreateProductDtoSchema.parse(dto);
    const session = await this.startTransaction();

    try {
      const exists = await this.productRepository.findOne(
        {
          $or: [{ slug: validated.slug }, { sku: validated.sku }],
          isDeleted: { $ne: true },
        },
        {},
        { session },
      );
      if (exists) throw AppError.conflict("Slug or SKU already exists");

      const category = await this.categoryRepository.findById(
        validated.categoryId,
      );
      if (!category) throw AppError.notFound("Category not found");

      if (validated.type === "simple" && validated.variants?.length)
        throw AppError.badRequest("Simple products cannot have variants");
      if (
        ["virtual", "downloadable"].includes(validated.type) &&
        (validated.weight || validated.dimensions)
      )
        throw AppError.badRequest(
          "Virtual/downloadable products cannot have physical properties",
        );

      const product = await this.productRepository.create({
        ...validated,
        isInStock: validated.stockQuantity > 0,
        variants: [],
      });

      if (validated.variants?.length && validated.type === "configurable") {
        let variantIds: string[] = [];

        const skus = validated.variants.map((v, i) =>
          this.generateSku(v.name || product.name, category.slug, i + 2),
        );

        const duplicates = await this.variantRepository.findOne({
          sku: { $in: skus },
        });
        if (duplicates) throw AppError.conflict("Variant SKU already exists");

        const variants = await Promise.all(
          validated.variants.map(async (v, i) => {
            const created = await this.variantRepository.create({
              ...v,
              isInStock: v.stockQuantity > 0,
              productId: product.id,
              sku: skus[i],
            });
            return created;
          }),
        );
        variantIds = variants.map((v) => v.id);

        await this.productRepository.updateById(
          product.id,
          { $set: { variantIds: variantIds } },
          { session },
        );
      }

      return product;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const validated = UpdateProductDtoSchema.parse(dto);
    const session = await this.startTransaction();
    try {
      const product = await this.productRepository.findById(
        id,
        {},
        { session },
      );
      if (!product || product.isDeleted)
        throw AppError.notFound("Product not found");

      if (validated.slug) {
        const dup = await this.productRepository.findOne({
          slug: validated.slug,
          _id: { $ne: id },
          isDeleted: { $ne: true },
        });
        if (dup) throw AppError.conflict("Slug already exists");
      }

      if (validated.categoryId) {
        const cat = await this.categoryRepository.findById(
          validated.categoryId,
        );
        if (!cat) throw AppError.notFound("Category not found");
      }

      const patch: any = { ...validated };
      if (validated.stockQuantity !== undefined)
        patch.isInStock = validated.stockQuantity > 0;
      await this.productRepository.updateById(id, { $set: patch }, { session });

      if (validated.variants) {
        const incoming = validated.variants;
        const existing = await this.variantRepository.find({ productId: id });
        const toUpdate: any[] = [];
        const toCreate: any[] = [];

        incoming.forEach((v) => {
          if (v.id) {
            toUpdate.push(v);
          } else {
            toCreate.push({
              ...v,
              productId: id,
              sku: this.generateSku(v.name || product.name, "CAT", Date.now()),
              isInStock: (v.stockQuantity || 0) > 0,
            });
          }
        });

        for (const v of toUpdate) {
          if (v.sku) {
            const dup = await this.variantRepository.findOne({
              sku: v.sku,
              _id: { $ne: v.id },
            });
            if (dup) throw AppError.conflict("SKU already exists");
          }
          await this.variantRepository.updateById(v.id, v, { session });
        }

        if (toCreate.length) {
          const created = await Promise.all(
            toCreate.map(async (v) => {
              const variant = await this.variantRepository.create(v);
              return variant;
            }),
          );
          const newIds = created.map((c) => c.id);
          await this.productRepository.updateById(id, {
            $addToSet: { variants: { $each: newIds } },
          });
        }
      }
      return product;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    }
  }

  async getProductById(id: string): Promise<Product> {
    const p = await this.productRepository.findById(id, undefined, {
      populate: ["variants"],
    });
    if (!p || p.isDeleted) throw AppError.notFound("Product not found");
    return p;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const p = await this.productRepository.findOne(
      { slug, isDeleted: { $ne: true } },
      undefined,
      {
        populate: ["variants", "category"],
      },
    );
    if (!p) throw AppError.notFound("Product not found");
    return p;
  }

  async getProductBySku(sku: string): Promise<Product> {
    const p = await this.productRepository.findOne(
      { sku, isDeleted: { $ne: true } },
      undefined,
      {
        populate: ["variants"],
      },
    );
    if (!p) throw AppError.notFound("Product not found");
    return p;
  }

  async getRecommendedProducts(
    query: Record<string, string>,
  ): Promise<PaginationResult<Product>> {
    const categorySlug = query.category;
    const minPrice = Number(query.min_price ?? 0);
    const maxPrice = Number(query.max_price ?? Infinity);
    const sortDir = query.sort === "asc" ? 1 : -1;
    const search =
      typeof query.search === "string" ? query.search.trim() : undefined;
    const limit = Math.max(1, Number(query.limit) || 20);
    const page = Math.max(1, Number(query.page) || 1);
    const shuffle = query.shuffle === "true";

    const filter: any = { isDeleted: { $ne: true } };
    filter.price = { $gte: minPrice, $lte: maxPrice };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (categorySlug && typeof categorySlug === "string") {
      const category = await this.categoryRepository.findOne({
        slug: { $regex: categorySlug, $options: "i" },
      });
      if (category) {
        filter.categoryId = category.id;
      }
    }

    const result = await this.productRepository.paginate({
      filter,
      limit,
      page,
      projection: {
        seo: 0,
      },
      options: {
        sort: { name: sortDir },
        populate: ["variants", "category"],
      },
    });

    if (shuffle) {
      result.data = this.shuffle(result.data);
    }

    return result;
  }
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async filterProducts(
    query: Record<string, string>,
  ): Promise<PaginationResult<Product>> {
    const categorySlug = query.category;
    const minPrice = Number(query.min_price ?? 0);
    const maxPrice = Number(query.max_price ?? Infinity);
    const sortDir = query.sort === "asc" ? 1 : -1;
    const search =
      typeof query.search === "string" ? query.search.trim() : undefined;
    const limit = Math.max(1, Number(query.limit) || 20);
    const page = Math.max(1, Number(query.page) || 1);

    const filter: any = { isDeleted: { $ne: true } };
    filter.price = { $gte: minPrice, $lte: maxPrice };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (categorySlug && typeof categorySlug === "string") {
      const category = await this.categoryRepository.findOne({
        slug: { $regex: categorySlug, $options: "i" },
      });
      if (category) {
        filter.categoryId = category.id;
      }
    }

    const result = await this.productRepository.paginate({
      filter,
      limit,
      page,
      projection: {
        seo: 0,
      },
      options: {
        sort: { name: sortDir },
        populate: ["variants", "category"],
      },
    });

    return result;
  }

  async searchProductsByNameOrDescription(q: string): Promise<Product[]> {
    if (!q?.trim()) throw AppError.badRequest("Invalid query");
    return this.productRepository.find(
      {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
        status: "active",
        isDeleted: { $ne: true },
      },
      undefined,
      { limit: 50 },
    );
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return this.productRepository.find({
      categoryId,
      isDeleted: { $ne: true },
    });
  }

  async getActiveProducts(filter = {}): Promise<PaginationResult<Product>> {
    const result = this.filterProducts(filter);
    return result;
  }

  async getProductsByTags(tags: string[]): Promise<PaginationResult<Product>> {
    if (!Array.isArray(tags)) throw AppError.badRequest("Invalid tags");
    const result = this.productRepository.paginate({
      filter: {
        tags: { $in: tags },
        status: "active",
        isDeleted: { $ne: true },
      },
    });
    return result;
  }

  async checkStockAvailability(
    productId: string,
    variantId?: string,
    quantity = 1,
  ) {
    if (quantity < 1) throw AppError.badRequest("Invalid quantity");

    if (!variantId) {
      const product = await this.getProductById(productId);
      return product.stockQuantity >= quantity;
    }
    const variant = await this.variantRepository.findById(variantId);
    if (!variant || variant.productId !== productId)
      throw AppError.notFound("Variant not found");
    return variant.stockQuantity >= quantity;
  }

  async decrementStock(
    productId: string,
    variantId?: string,
    quantity = 1,
  ): Promise<void> {
    if (variantId) {
      await this.variantRepository.updateById(variantId, {
        $inc: { stockQuantity: -quantity },
      });
      return;
    }
    await this.productRepository.updateById(productId, {
      $inc: { stockQuantity: -quantity },
    });
  }

  async addVariant(productId: string, dto: Omit<ProductVariant, "id">) {
    const product = await this.getProductById(productId);
    if (product.type !== "configurable")
      throw AppError.badRequest("Not configurable");

    const exists = await this.variantRepository.findOne({ sku: dto.sku });
    if (exists) throw AppError.conflict("SKU already exists");

    const variant = await this.variantRepository.create({
      ...dto,
      productId,
      isInStock: dto.stockQuantity > 0,
    });

    await this.productRepository.updateById(productId, {
      $addToSet: { variants: variant.id },
    });
    return this.getProductById(productId);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    update: Partial<ProductVariant>,
  ) {
    const product = await this.getProductById(productId);
    if (product.type !== "configurable")
      throw AppError.badRequest("Not configurable");

    const variant = await this.variantRepository.findById(variantId);
    if (!variant || variant.productId !== productId)
      throw AppError.notFound("Variant not found");

    if (update.sku) {
      const dup = await this.variantRepository.findOne({
        sku: update.sku,
        _id: { $ne: variantId },
      });
      if (dup) throw AppError.conflict("SKU already exists");
    }

    await this.variantRepository.updateById(variantId, {
      ...update,
      ...(update.stockQuantity !== undefined && {
        isInStock: update.stockQuantity > 0,
      }),
    });
    return this.getProductById(productId);
  }

  async deleteVariant(productId: string, variantId: string): Promise<Product> {
    const product = await this.getProductById(productId);
    if (product.type !== "configurable")
      throw AppError.badRequest("Not configurable");

    const variant = await this.variantRepository.findById(variantId);
    if (!variant || variant.productId !== productId)
      throw AppError.notFound("Variant not found");

    const remaining = await this.variantRepository.count({ productId });
    if (remaining <= 1) throw AppError.badRequest("Need at least one variant");

    await this.variantRepository.deleteById(variantId);
    await this.productRepository.updateById(productId, {
      $pull: { variants: variantId },
    });
    return this.getProductById(productId);
  }

  async createCategory(
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    const validated = CreateProductCategoryDtoSchema.parse(dto);
    const exists = await this.categoryRepository.findOne({
      slug: validated.slug,
    });
    if (exists) throw AppError.conflict("Slug already exists");
    if (validated.parentId) {
      const parent = await this.categoryRepository.findById(validated.parentId);
      if (!parent) throw AppError.notFound("Parent category not found");
    }
    return this.categoryRepository.create(validated);
  }

  async updateCategory(
    id: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    const validated = UpdateProductCategoryDtoSchema.parse(dto);
    const category = await this.categoryRepository.findById(id);
    if (!category) throw AppError.notFound("Category not found");

    if (validated.slug) {
      const dup = await this.categoryRepository.findOne({
        slug: validated.slug,
        _id: { $ne: id },
      });
      if (dup) throw AppError.conflict("Slug already exists");
    }
    if (validated.parentId) {
      if (validated.parentId === id)
        throw AppError.badRequest("Cannot be own parent");
      const parent = await this.categoryRepository.findById(validated.parentId);
      if (!parent) throw AppError.notFound("Parent category not found");
    }
    const updatedCategory = await this.categoryRepository.updateById(
      id,
      validated,
    );
    if (!updatedCategory) {
      throw AppError.badGateway("error updating category");
    }
    return updatedCategory;
  }

  async getCategoryById(id: string) {
    const c = await this.categoryRepository.findById(id);
    if (!c) throw AppError.notFound("Category not found");
    return c;
  }

  async getCategoryBySlug(slug: string) {
    const c = await this.categoryRepository.findOne({ slug });
    if (!c) throw AppError.notFound("Category not found");
    return c;
  }

  async getAllCategories(): Promise<PaginationResult<ProductCategory>> {
    const result = this.categoryRepository.paginate();
    return result;
  }

  async getParentCategories() {}

  async getSubcategories(parentId: string) {
    return this.categoryRepository.paginate({ filter: { parentId } });
  }

  async deleteCategory(id: string): Promise<void> {
    const children = await this.categoryRepository.find({ parentId: id });
    if (children.length) throw AppError.badRequest("Has sub-categories");

    const products = await this.productRepository.find({ categoryId: id });
    if (products.length) throw AppError.badRequest("Has products");

    await this.categoryRepository.deleteById(id);
  }
  async addBanner(data: unknown) {
    const banner = BannerSchema.omit({ slug: true, id: true }).parse(data);
    const slug = banner.title
      .replace("/[^a-z0-9]+/g", "-")
      .replace("/^-+|-+$/g", "")
      .replace("&", "and")
      .split(" ")
      .join("-");
    const newBanner = await this.bannersRepository.create({ ...banner, slug });
    return newBanner;
  }
  async deleteBanner(id: string) {
    return await this.bannersRepository.deleteById(id);
  }
  async updateBanner(id: string, data: Partial<Banner>) {
    const updated = await this.bannersRepository.updateById(id, data);
    return updated;
  }
  async getBanners() {
    const result = await this.bannersRepository.paginate();
    return result;
  }

  private async startTransaction(): Promise<ClientSession> {
    const conn =
      (this.productRepository as any).model?.db ||
      (this.productRepository as any).collection.conn;
    const session = await conn.startSession();
    session.startTransaction();
    return session;
  }

  private generateSku(name: string, category: string, num: number): string {
    const clean = (s: string) =>
      s
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3);
    return `SKU-${clean(category)}-${clean(name)}-${num}`;
  }
}
