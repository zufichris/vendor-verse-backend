import { FilterQuery } from 'mongoose';
import { ProductRepository } from './product.repository';
import { BaseRepository } from '../../core/repository';
import {
    CreateProductDto,
    CreateProductDtoSchema,
    UpdateProductDto,
    UpdateProductDtoSchema,
    CreateProductCategoryDto,
    CreateProductCategoryDtoSchema,
    UpdateProductCategoryDto,
    UpdateProductCategoryDtoSchema,
} from './product.dtos';
import { Product, ProductCategory, ProductVariant, ProductVariantSchema } from './product.types';
import { AppError } from '../../core/middleware/error.middleware';
import { ProductCategoryDocument, ProductVariantDocumen } from './product.models';
import { seedProducts } from './create-products.dto';
export class ProductService {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly variantRepository: BaseRepository<ProductVariant>,
        private readonly categoryRepository: BaseRepository<ProductCategory>,
    ) {
        this.createCategory = this.createCategory.bind(this)
    }

    async createProduct(dto: CreateProductDto): Promise<Product> {
        const parsedDto = CreateProductDtoSchema.safeParse(dto);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid product data', parsedDto.error.flatten());
        }

        const validatedDto = parsedDto.data;

        const existingProduct = await this.productRepository.findOne({
            $or: [{ slug: validatedDto.slug }, { sku: validatedDto.sku }],
            isDeleted: { $ne: true },
        });
        if (existingProduct) {
            throw AppError.conflict(`Product with slug ${validatedDto.slug} or SKU ${validatedDto.sku} already exists`);
        }

        const category = await this.categoryRepository.findById(validatedDto.categoryId);
        if (!category) {
            throw AppError.notFound(`Category with ID ${validatedDto.categoryId} not found`);
        }

        let variants: ProductVariant[] = [];
        if (validatedDto.type === 'configurable' && validatedDto.variants) {
            const parsedVariants = validatedDto.variants.map(v => ProductVariantSchema.omit({ id: true, productId: true, createdAt: true, updatedAt: true, isInStock: true }).safeParse(v));
            const variantErrors = parsedVariants.filter(result => !result.success);
            if (variantErrors.length > 0) {
                throw AppError.badRequest('Invalid variant data', variantErrors.map(e => e.error.flatten()));
            }

            const validatedVariants = parsedVariants.map(result => result.data);
            for (const variant of validatedVariants) {
                if (variant) {
                    const existingVariant = await this.variantRepository.findOne({ sku: variant.sku });
                    if (existingVariant) {
                        throw AppError.conflict(`Variant with SKU ${variant.sku} already exists`);
                    }
                }
            }

            variants = await Promise.all(
                validatedVariants.map(async variant => {
                    if (variant) {
                        const createdVariant = await this.variantRepository.create({
                            ...variant,
                            productId: validatedDto.id || new Date().toISOString(),
                            isInStock: variant.stockQuantity > 0,
                            createdAt: new Date().toISOString(),
                        });
                        return createdVariant;
                    }
                    throw AppError.badRequest('Invalid variant data');
                }),
            );
        } else if (validatedDto.type === 'simple' && validatedDto.variants && validatedDto.variants.length > 0) {
            throw AppError.badRequest('Simple products cannot have variants');
        } else if (['virtual', 'downloadable'].includes(validatedDto.type) && (validatedDto.weight || validatedDto.dimensions)) {
            throw AppError.badRequest('Virtual or downloadable products cannot have weight or dimensions');
        }

        const product = await this.productRepository.create({
            ...validatedDto,
            variants,
            isInStock: validatedDto.stockQuantity > 0,
            createdAt: new Date().toISOString(),
        });
        return product;
    }

    async bulkCreateProducts(dtos: CreateProductDto[]): Promise<Product[]> {
        if (!dtos || !Array.isArray(dtos) || dtos.length === 0) {
            throw AppError.badRequest('Invalid or empty products array');
        }

        const parsedDtos = dtos.map(dto => CreateProductDtoSchema.safeParse(dto));
        const errors = parsedDtos.filter(result => !result.success);
        if (errors.length > 0) {
            throw AppError.badRequest(
                'Invalid product data',
                errors.map(e => e.error.flatten()),
            );
        }

        const validatedDtos = parsedDtos.map(result => result.data);

        for (const dto of validatedDtos) {
            const existingProduct = await this.productRepository.findOne({
                $or: [{ slug: dto.slug }, { sku: dto.sku }],
                isDeleted: { $ne: true },
            });
            if (existingProduct) {
                throw AppError.conflict(`Product with slug ${dto.slug} or SKU ${dto.sku} already exists`);
            }

            const category = await this.categoryRepository.findById(dto.categoryId);
            if (!category) {
                throw AppError.notFound(`Category with ID ${dto.categoryId} not found`);
            }

            if (dto.type === 'configurable' && (!dto.variants || dto.variants.length === 0)) {
                throw AppError.badRequest('Configurable products must have at least one variant');
            }
            if (dto.type === 'simple' && dto.variants && dto.variants.length > 0) {
                throw AppError.badRequest('Simple products cannot have variants');
            }
            if (['virtual', 'downloadable'].includes(dto.type) && (dto.weight || dto.dimensions)) {
                throw AppError.badRequest('Virtual or downloadable products cannot have weight or dimensions');
            }
        }

        const products = await Promise.all(
            validatedDtos.map(async dto => {
                let variants: ProductVariant[] = [];
                if (dto.type === 'configurable' && dto.variants) {
                    const parsedVariants = dto.variants.map(v => ProductVariantSchema.omit({ id: true, productId: true, createdAt: true, updatedAt: true, isInStock: true }).safeParse(v));
                    const variantErrors = parsedVariants.filter(result => !result.success);
                    if (variantErrors.length > 0) {
                        throw AppError.badRequest('Invalid variant data', variantErrors.map(e => e.error.flatten()));
                    }

                    const validatedVariants = parsedVariants.map(result => result.data);
                    for (const variant of validatedVariants) {
                        if (variant) {
                            const existingVariant = await this.variantRepository.findOne({ sku: variant.sku });
                            if (existingVariant) {
                                throw AppError.conflict(`Variant with SKU ${variant.sku} already exists`);
                            }
                        }
                    }

                    variants = await Promise.all(
                        validatedVariants.map(async variant => {
                            if (variant) {
                                const createdVariant = await this.variantRepository.create({
                                    ...variant,
                                    productId: dto.id || new Date().toISOString(),
                                    isInStock: variant.stockQuantity > 0,
                                    createdAt: new Date().toISOString(),
                                });
                                return createdVariant;
                            }
                            throw AppError.badRequest('Invalid variant data');
                        }),
                    );
                }

                return this.productRepository.create({
                    ...dto,
                    variants,
                    isInStock: dto.stockQuantity > 0,
                    createdAt: new Date().toISOString(),
                });
            }),
        );
        return products;
    }

    async getProductById(id: string): Promise<Product> {
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const product = await this.productRepository.findById(id);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with ID ${id} not found`);
        }
        return product;
    }

    async getProductBySlug(slug: string): Promise<Product> {
        if (!slug || typeof slug !== 'string') {
            throw AppError.badRequest('Invalid product slug');
        }

        const product = await this.productRepository.findBySlug(slug);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with slug ${slug} not found`);
        }
        return product;
    }

    async getProductBySku(sku: string): Promise<Product> {
        if (!sku || typeof sku !== 'string') {
            throw AppError.badRequest('Invalid product SKU');
        }

        const product = await this.productRepository.findBySku(sku);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with SKU ${sku} not found`);
        }
        return product;
    }

    async searchProductsByNameOrDescription(query: string): Promise<Product[]> {
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw AppError.badRequest('Invalid search query');
        }
        const products = await this.productRepository.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ],
            status: 'active',
            isDeleted: { $ne: true },
        });
        if (!products.length) {
            throw AppError.notFound('No active products found matching the search query');
        }
        return products;
    }

    async getProductsByCategory(categoryId: string): Promise<Product[]> {
        if (!categoryId || typeof categoryId !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw AppError.notFound(`Category with ID ${categoryId} not found`);
        }

        const products = await this.productRepository.findByCategory(categoryId);
        if (!products.length) {
            throw AppError.notFound(`No active products found for category ID ${categoryId}`);
        }
        return products;
    }

    async getActiveProducts(filter: FilterQuery<Product> = {}): Promise<Product[]> {
        const products = await this.productRepository.findActive(filter);
        if (!products.length) {
            throw AppError.notFound('No active products found');
        }
        return products;
    }

    async getProductsByTags(tags: string[]): Promise<Product[]> {
        if (!tags || !Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) {
            throw AppError.badRequest('Invalid tags array');
        }

        const products = await this.productRepository.find({
            tags: { $in: tags },
            status: 'active',
            isDeleted: { $ne: true },
        });
        if (!products.length) {
            throw AppError.notFound('No active products found with specified tags');
        }
        return products;
    }

    async checkStockAvailability(productId: string, variantId?: string, quantity: number = 1): Promise<boolean> {
        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (variantId && typeof variantId !== 'string') {
            throw AppError.badRequest('Invalid variant ID');
        }
        if (typeof quantity !== 'number' || quantity < 1) {
            throw AppError.badRequest('Invalid quantity');
        }

        const product = await this.productRepository.findById(productId);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with ID ${productId} not found`);
        }

        if (variantId) {
            if (product.type !== 'configurable') {
                throw AppError.badRequest('Product is not configurable, cannot check variant stock');
            }
            const variant = await this.variantRepository.findById(variantId);
            if (!variant || variant.productId !== productId) {
                throw AppError.notFound(`Variant with ID ${variantId} not found for product ${productId}`);
            }
            return variant.stockQuantity >= quantity;
        }

        return product.stockQuantity >= quantity;
    }

    async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const parsedDto = UpdateProductDtoSchema.safeParse(dto);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid product update data', parsedDto.error.flatten());
        }

        const validatedDto = parsedDto.data;

        const product = await this.productRepository.findById(id);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with ID ${id} not found`);
        }

        if (validatedDto.slug) {
            const existingProduct = await this.productRepository.findOne({
                slug: validatedDto.slug,
                _id: { $ne: id },
                isDeleted: { $ne: true },
            });
            if (existingProduct) {
                throw AppError.conflict(`Product with slug ${validatedDto.slug} already exists`);
            }
        }

        if (validatedDto.sku) {
            const existingProduct = await this.productRepository.findOne({
                sku: validatedDto.sku,
                _id: { $ne: id },
                isDeleted: { $ne: true },
            });
            if (existingProduct) {
                throw AppError.conflict(`Product with SKU ${validatedDto.sku} already exists`);
            }
        }

        if (validatedDto.categoryId) {
            const category = await this.categoryRepository.findById(validatedDto.categoryId);
            if (!category) {
                throw AppError.notFound(`Category with ID ${validatedDto.categoryId} not found`);
            }
        }

        let variants: ProductVariant[] = product.variants || [];
        if (validatedDto.variants) {
            const parsedVariants = validatedDto.variants.map(v => ProductVariantSchema.partial().safeParse(v));
            const variantErrors = parsedVariants.filter(result => !result.success);
            if (variantErrors.length > 0) {
                throw AppError.badRequest('Invalid variant update data', variantErrors.map(e => e.error.flatten()));
            }

            const validatedVariants = parsedVariants.map(result => result.data);
            for (const variant of validatedVariants) {
                if (variant && variant.sku) {
                    const existingVariant = await this.variantRepository.findOne({
                        sku: variant.sku,
                        _id: { $ne: variant.id },
                    });
                    if (existingVariant) {
                        throw AppError.conflict(`Variant with SKU ${variant.sku} already exists`);
                    }
                }
                if (variant && variant.id) {
                    await this.variantRepository.updateById(variant.id, {
                        ...variant,
                        isInStock: variant.stockQuantity !== undefined ? variant.stockQuantity > 0 : undefined,
                        updatedAt: new Date().toISOString(),
                    });
                } else if (variant) {
                    const createdVariant = await this.variantRepository.create({
                        ...variant,
                        productId: id,
                        isInStock: variant.stockQuantity !== undefined ? variant.stockQuantity > 0 : false,
                        createdAt: new Date().toISOString(),
                    });
                    variants.push(createdVariant);
                }
            }
        }

        const updatedProduct = await this.productRepository.updateProduct(id, {
            ...validatedDto,
            variants,
            isInStock: validatedDto.stockQuantity !== undefined ? validatedDto.stockQuantity > 0 : undefined,
            updatedAt: new Date().toISOString(),
        });
        if (!updatedProduct) {
            throw AppError.notFound(`Product with ID ${id} not found`);
        }
        return updatedProduct;
    }

    async softDelete(id: string, deletedById: string): Promise<Product> {
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (!deletedById || typeof deletedById !== 'string') {
            throw AppError.badRequest('Invalid deletedById');
        }

        const product = await this.productRepository.findById(id);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with ID ${id} not found`);
        }

        if (product.variants && product.variants.length > 0) {
            await Promise.all(
                product.variants.map(variant =>
                    this.variantRepository.updateById(variant.id, { $set: { isDeleted: true, deletedAt: new Date().toISOString(), deletedById } }),
                ),
            );
        }

        const deletedProduct = await this.productRepository.softDelete(id, deletedById);
        if (!deletedProduct) {
            throw AppError.notFound(`Product with ID ${id} not found`);
        }
        return deletedProduct;
    }

    async bulkSoftDelete(ids: string[], deletedById: string): Promise<Product[]> {
        if (!ids || !Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
            throw AppError.badRequest('Invalid product IDs array');
        }
        if (!deletedById || typeof deletedById !== 'string') {
            throw AppError.badRequest('Invalid deletedById');
        }

        const products = await this.productRepository.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
        if (!products.length) {
            throw AppError.notFound('No products found for provided IDs');
        }

        const deletedProducts = await Promise.all(
            products.map(async product => {
                if (product.variants && product.variants.length > 0) {
                    await Promise.all(
                        product.variants.map(variant =>
                            this.variantRepository.updateById(variant.id, { $set: { isDeleted: true, deletedAt: new Date().toISOString(), deletedById } }),
                        ),
                    );
                }
                return this.productRepository.softDelete(product.id, deletedById);
            }),
        );
        return deletedProducts.filter((p): p is Product => p !== null);
    }

    async restoreProduct(id: string, restoredById: string): Promise<Product> {
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (!restoredById || typeof restoredById !== 'string') {
            throw AppError.badRequest('Invalid restoredById');
        }

        const product = await this.productRepository.findById(id);
        if (!product) {
            throw AppError.notFound(`Product with ID ${id} not found`);
        }
        if (!product.isDeleted) {
            throw AppError.badRequest(`Product with ID ${id} is not deleted`);
        }

        if (product.variants && product.variants.length > 0) {
            await Promise.all(
                product.variants.map(variant =>
                    this.variantRepository.updateById(variant.id, { $set: { isDeleted: false, deletedAt: null, deletedById: null } }),
                ),
            );
        }

        const restoredProduct = await this.productRepository.updateById(id, {
            $set: { isDeleted: false, deletedAt: null, deletedById: null, updatedById: restoredById },
        });
        if (!restoredProduct) {
            throw AppError.notFound(`Product with ID ${id} not found`);
        }
        return restoredProduct;
    }

    async addVariant(productId: string, variant: Partial<ProductVariant>): Promise<Product> {
        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const parsedVariant = ProductVariantSchema.omit({ id: true, productId: true, createdAt: true, updatedAt: true, isInStock: true }).safeParse(variant);
        if (!parsedVariant.success) {
            throw AppError.badRequest('Invalid variant data', parsedVariant.error.flatten());
        }

        const validatedVariant = parsedVariant.data;

        const product = await this.productRepository.findById(productId);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with ID ${productId} not found`);
        }
        if (product.type !== 'configurable') {
            throw AppError.badRequest('Variants can only be added to configurable products');
        }

        const existingVariant = await this.variantRepository.findOne({ sku: validatedVariant.sku });
        if (existingVariant) {
            throw AppError.conflict(`Variant with SKU ${validatedVariant.sku} already exists`);
        }

        const createdVariant = await this.variantRepository.create({
            ...validatedVariant,
            productId,
            isInStock: validatedVariant.stockQuantity > 0,
            createdAt: new Date().toISOString(),
        });

        const updatedProduct = await this.productRepository.addVariant(productId, createdVariant);
        if (!updatedProduct) {
            await this.variantRepository.deleteById(createdVariant.id);
            throw AppError.notFound(`Product with ID ${productId} not found`);
        }
        return updatedProduct;
    }

    async updateVariant(productId: string, variantId: string, variantUpdate: Partial<ProductVariant>): Promise<Product> {
        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (!variantId || typeof variantId !== 'string') {
            throw AppError.badRequest('Invalid variant ID');
        }

        const parsedVariant = ProductVariantSchema.partial().safeParse(variantUpdate);
        if (!parsedVariant.success) {
            throw AppError.badRequest('Invalid variant update data', parsedVariant.error.flatten());
        }

        const validatedVariant = parsedVariant.data;

        const product = await this.productRepository.findById(productId);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with ID ${productId} not found`);
        }
        if (product.type !== 'configurable') {
            throw AppError.badRequest('Product is not configurable, cannot update variants');
        }

        const variant = await this.variantRepository.findById(variantId);
        if (!variant || variant.productId !== productId) {
            throw AppError.notFound(`Variant with ID ${variantId} not found for product ${productId}`);
        }

        if (validatedVariant.sku) {
            const existingVariant = await this.variantRepository.findOne({
                sku: validatedVariant.sku,
                _id: { $ne: variantId },
            });
            if (existingVariant) {
                throw AppError.conflict(`Variant with SKU ${validatedVariant.sku} already exists`);
            }
        }

        const updatedVariant = await this.variantRepository.updateById(variantId, {
            ...validatedVariant,
            isInStock: validatedVariant.stockQuantity !== undefined ? validatedVariant.stockQuantity > 0 : undefined,
            updatedAt: new Date().toISOString(),
        });
        if (!updatedVariant) {
            throw AppError.notFound(`Variant with ID ${variantId} not found`);
        }

        return product;
    }

    async deleteVariant(productId: string, variantId: string): Promise<Product> {
        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (!variantId || typeof variantId !== 'string') {
            throw AppError.badRequest('Invalid variant ID');
        }

        const product = await this.productRepository.findById(productId);
        if (!product || product.isDeleted) {
            throw AppError.notFound(`Product with ID ${productId} not found`);
        }
        if (product.type !== 'configurable') {
            throw AppError.badRequest('Product is not configurable, cannot delete variants');
        }
        if (!product.variants || !product.variants.some(v => v.id === variantId)) {
            throw AppError.notFound(`Variant with ID ${variantId} not found for product ${productId}`);
        }
        if (product.variants.length <= 1) {
            throw AppError.badRequest('Configurable products must retain at least one variant');
        }

        const variant = await this.variantRepository.findById(variantId);
        if (!variant || variant.productId !== productId) {
            throw AppError.notFound(`Variant with ID ${variantId} not found for product ${productId}`);
        }

        const deleted = await this.variantRepository.deleteById(variantId);
        if (!deleted) {
            throw AppError.notFound(`Variant with ID ${variantId} not found`);
        }

        const updatedProduct = await this.productRepository.deleteVariant(productId, variantId);
        if (!updatedProduct) {
            throw AppError.notFound(`Product with ID ${productId} not found`);
        }
        return updatedProduct;
    }

    async createCategory(dto: CreateProductCategoryDto): Promise<ProductCategory> {
        const parsedDto = CreateProductCategoryDtoSchema.safeParse(dto);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid category data', parsedDto.error.flatten());
        }

        const validatedDto = parsedDto.data;
        console.log(validatedDto)
        const existingCategory = await this.categoryRepository.findOne({
            slug: validatedDto.slug,
        });
        if (existingCategory) {
            throw AppError.conflict(`Category with slug ${validatedDto.slug} already exists`);
        }

        if (validatedDto.parentId) {
            const parentCategory = await this.categoryRepository.findById(validatedDto.parentId);
            if (!parentCategory) {
                throw AppError.notFound(`Parent category with ID ${validatedDto.parentId} not found`);
            }
        }

        const category = await this.categoryRepository.create({
            ...validatedDto,
            createdAt: new Date().toISOString(),
        });
        return category;
    }

    async updateCategory(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        const parsedDto = UpdateProductCategoryDtoSchema.safeParse(dto);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid category update data', parsedDto.error.flatten());
        }

        const validatedDto = parsedDto.data;

        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw AppError.notFound(`Category with ID ${id} not found`);
        }

        if (validatedDto.slug) {
            const existingCategory = await this.categoryRepository.findOne({
                slug: validatedDto.slug,
                _id: { $ne: id },
            });
            if (existingCategory) {
                throw AppError.conflict(`Category with slug ${validatedDto.slug} already exists`);
            }
        }

        if (validatedDto.parentId) {
            const parentCategory = await this.categoryRepository.findById(validatedDto.parentId);
            if (!parentCategory) {
                throw AppError.notFound(`Parent category with ID ${validatedDto.parentId} not found`);
            }
            if (validatedDto.parentId === id) {
                throw AppError.badRequest('Category cannot be its own parent');
            }
        }

        const updatedCategory = await this.categoryRepository.updateById(id, {
            ...validatedDto,
            updatedAt: new Date().toISOString(),
        });
        if (!updatedCategory) {
            throw AppError.notFound(`Category with ID ${id} not found`);
        }
        return updatedCategory;
    }

    async getCategoryById(id: string): Promise<ProductCategory> {
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw AppError.notFound(`Category with ID ${id} not found`);
        }
        return category;
    }

    async getCategoryBySlug(slug: string): Promise<ProductCategory> {
        if (!slug || typeof slug !== 'string') {
            throw AppError.badRequest('Invalid category slug');
        }

        const category = await this.categoryRepository.findOne({ slug });
        if (!category) {
            throw AppError.notFound(`Category with slug ${slug} not found`);
        }
        return category;
    }

    async getAllCategories(): Promise<ProductCategory[]> {
        const categories = await this.categoryRepository.find();
        if (!categories.length) {
            throw AppError.notFound('No categories found');
        }
        return categories;
    }

    async getParentCategories(): Promise<ProductCategory[]> {
        const categories = await this.categoryRepository.find({ parentId: null });
        if (!categories.length) {
            throw AppError.notFound('No parent categories found');
        }
        return categories;
    }

    async getSubcategories(parentId: string): Promise<ProductCategory[]> {
        if (!parentId || typeof parentId !== 'string') {
            throw AppError.badRequest('Invalid parent category ID');
        }

        const parentCategory = await this.categoryRepository.findById(parentId);
        if (!parentCategory) {
            throw AppError.notFound(`Parent category with ID ${parentId} not found`);
        }

        const subcategories = await this.categoryRepository.find({ parentId });
        if (!subcategories.length) {
            throw AppError.notFound(`No subcategories found for parent category ID ${parentId}`);
        }
        return subcategories;
    }

    async deleteCategory(id: string): Promise<void> {
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw AppError.notFound(`Category with ID ${id} not found`);
        }

        const childCategories = await this.categoryRepository.find({ parentId: id });
        if (childCategories.length > 0) {
            throw AppError.badRequest('Cannot delete category with subcategories');
        }

        const products = await this.productRepository.findByCategory(id);
        if (products.length > 0) {
            throw AppError.badRequest('Cannot delete category with associated products');
        }

        const deleted = await this.categoryRepository.deleteById(id);
        if (!deleted) {
            throw AppError.notFound(`Category with ID ${id} not found`);
        }
    }
}
