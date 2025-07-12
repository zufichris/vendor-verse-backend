import { Request, Response } from 'express';
import { ProductService } from './product.service';
import {
    CreateProductDtoSchema,
    UpdateProductDtoSchema,
    CreateProductCategoryDtoSchema,
    UpdateProductCategoryDtoSchema,
} from './product.dtos';
import { ProductVariantSchema } from "./product.types"
import { ApiHandler } from '../../util/api-handler';
import { AppError } from '../../core/middleware/error.middleware';
import { seedProductCategories } from './create-categories.dto';
import { logger } from '../../logger';
import { ProductCategoryModel } from './product.models';
import { create } from 'domain';
import { seedProducts } from './create-products.dto';

export class ProductController {
    constructor(private readonly productService: ProductService) { }

    public createProduct = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const parsedDto = CreateProductDtoSchema.safeParse(req.body);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid product data', parsedDto.error.flatten());
        }

        const product = await this.productService.createProduct({
            ...parsedDto.data,
            createdById: userId,
        });

        res.json({
            success: true,
            message: 'Product created successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public bulkCreateProducts = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const dtos = Array.isArray(req.body) ? req.body : [req.body];
        const products = await this.productService.bulkCreateProducts(
            dtos.map(dto => ({ ...dto, createdById: userId })),
        );

        res.json({
            success: true,
            message: 'Products created successfully',
            data: products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            })),
        });
    });

    public getProductById = ApiHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const product = await this.productService.getProductById(id);

        res.json({
            success: true,
            message: 'Product retrieved successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public getProductBySlug = ApiHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        if (!slug || typeof slug !== 'string') {
            throw AppError.badRequest('Invalid product slug');
        }

        const product = await this.productService.getProductBySlug(slug);

        res.json({
            success: true,
            message: 'Product retrieved successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public getProductBySku = ApiHandler(async (req: Request, res: Response) => {
        const { sku } = req.params;
        if (!sku || typeof sku !== 'string') {
            throw AppError.badRequest('Invalid product SKU');
        }

        const product = await this.productService.getProductBySku(sku);

        res.json({
            success: true,
            message: 'Product retrieved successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public searchProductsByNameOrDescription = ApiHandler(async (req: Request, res: Response) => {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            throw AppError.badRequest('Invalid search query');
        }

        const products = await this.productService.searchProductsByNameOrDescription(query);

        res.json({
            success: true,
            message: 'Products retrieved successfully',
            data: products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            })),
        });
    });

    public getProductsByCategory = ApiHandler(async (req: Request, res: Response) => {
        const { categoryId } = req.params;
        if (!categoryId || typeof categoryId !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        const products = await this.productService.getProductsByCategory(categoryId);

        res.json({
            success: true,
            message: 'Products retrieved successfully',
            data: products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            })),
        });
    });

    public getActiveProducts = ApiHandler(async (req: Request, res: Response) => {
        const filter: any = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.type) {
            filter.type = req.query.type;
        }

        const products = await this.productService.getActiveProducts(filter);

        res.json({
            success: true,
            message: 'Active products retrieved successfully',
            data: products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            })),
        });
    });

    public getProductsByTags = ApiHandler(async (req: Request, res: Response) => {
        const { tags } = req.query;
        if (!tags || (typeof tags !== 'string' && !Array.isArray(tags))) {
            throw AppError.badRequest('Invalid tags parameter');
        }

        const tagsArray = Array.isArray(tags) ? tags.map(String) : tags.split(',');
        if (tagsArray.some(tag => typeof tag !== 'string')) {
            throw AppError.badRequest('Invalid tags array');
        }

        const products = await this.productService.getProductsByTags(tagsArray);

        res.json({
            success: true,
            message: 'Products retrieved successfully',
            data: products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            })),
        });
    });

    public checkStockAvailability = ApiHandler(async (req: Request, res: Response) => {
        const { productId, variantId } = req.params;
        const { quantity } = req.query;
        const parsedQuantity = quantity ? parseInt(quantity as string, 10) : 1;

        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (variantId && typeof variantId !== 'string') {
            throw AppError.badRequest('Invalid variant ID');
        }
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            throw AppError.badRequest('Invalid quantity');
        }

        const isAvailable = await this.productService.checkStockAvailability(productId, variantId, parsedQuantity);

        res.json({
            success: true,
            message: 'Stock availability checked successfully',
            data: { isAvailable },
        });
    });

    public updateProduct = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const parsedDto = UpdateProductDtoSchema.safeParse(req.body);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid product update data', parsedDto.error.flatten());
        }

        const product = await this.productService.updateProduct(id, {
            ...parsedDto.data,
            updatedById: userId,
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public softDelete = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const product = await this.productService.softDelete(id, userId);

        res.json({
            success: true,
            message: 'Product soft deleted successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                isDeleted: product.isDeleted,
                deletedAt: product.deletedAt,
                deletedById: product.deletedById,
            },
        });
    });

    public bulkSoftDelete = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.some((id: any) => typeof id !== 'string')) {
            throw AppError.badRequest('Invalid product IDs array');
        }

        const products = await this.productService.bulkSoftDelete(ids, userId);

        res.json({
            success: true,
            message: 'Products soft deleted successfully',
            data: products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                isDeleted: product.isDeleted,
                deletedAt: product.deletedAt,
                deletedById: product.deletedById,
            })),
        });
    });
    public restoreProduct = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const product = await this.productService.restoreProduct(id, userId);

        res.json({
            success: true,
            message: 'Product restored successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public addVariant = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const { productId } = req.params;
        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }

        const parsedVariant = ProductVariantSchema.omit({ id: true, productId: true, createdAt: true, updatedAt: true, isInStock: true }).safeParse(req.body);
        if (!parsedVariant.success) {
            throw AppError.badRequest('Invalid variant data', parsedVariant.error.flatten());
        }

        const product = await this.productService.addVariant(productId, parsedVariant.data);
        res.json({
            success: true,
            message: 'Variant added successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public updateVariant = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const { productId, variantId } = req.params;
        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (!variantId || typeof variantId !== 'string') {
            throw AppError.badRequest('Invalid variant ID');
        }

        const parsedVariant = ProductVariantSchema.partial().safeParse(req.body);
        if (!parsedVariant.success) {
            throw AppError.badRequest('Invalid variant update data', parsedVariant.error.flatten());
        }

        const product = await this.productService.updateVariant(productId, variantId, parsedVariant.data);

        res.json({
            success: true,
            message: 'Variant updated successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public deleteVariant = ApiHandler(async (req: Request, res: Response) => {
        const { productId, variantId } = req.params;
        if (!productId || typeof productId !== 'string') {
            throw AppError.badRequest('Invalid product ID');
        }
        if (!variantId || typeof variantId !== 'string') {
            throw AppError.badRequest('Invalid variant ID');
        }

        const product = await this.productService.deleteVariant(productId, variantId);

        res.json({
            success: true,
            message: 'Variant deleted successfully',
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                currency: product.currency,
                discountPercentage: product.discountPercentage,
                discountFixedAmount: product.discountFixedAmount,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                categoryId: product.categoryId,
                brand: product.brand,
                tags: product.tags,
                images: product.images,
                thumbnail: product.thumbnail,
                type: product.type,
                status: product.status,
                visibility: product.visibility,
                condition: product.condition,
                featured: product.featured,
                stockQuantity: product.stockQuantity,
                isInStock: product.isInStock,
                variants: product.variants,
                weight: product.weight,
                weightUnit: product.weightUnit,
                dimensions: product.dimensions,
                seo: product.seo,
                createdById: product.createdById,
                updatedById: product.updatedById,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        });
    });

    public createCategory = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const parsedDto = CreateProductCategoryDtoSchema.safeParse(req.body);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid category data', parsedDto.error.flatten());
        }

        const category = await this.productService.createCategory(parsedDto.data);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                image: category.image,
                seo: category.seo,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    });

    public updateCategory = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        const parsedDto = UpdateProductCategoryDtoSchema.safeParse(req.body);
        if (!parsedDto.success) {
            throw AppError.badRequest('Invalid category update data', parsedDto.error.flatten());
        }

        const category = await this.productService.updateCategory(id, parsedDto.data);

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                image: category.image,
                seo: category.seo,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    });

    public getCategoryById = ApiHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        const category = await this.productService.getCategoryById(id);

        res.json({
            success: true,
            message: 'Category retrieved successfully',
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                image: category.image,
                seo: category.seo,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    });

    public getCategoryBySlug = ApiHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        if (!slug || typeof slug !== 'string') {
            throw AppError.badRequest('Invalid category slug');
        }

        const category = await this.productService.getCategoryBySlug(slug);

        res.json({
            success: true,
            message: 'Category retrieved successfully',
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                image: category.image,
                seo: category.seo,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    });

    public getAllCategories = ApiHandler(async (_req: Request, res: Response) => {
        const categories = await this.productService.getAllCategories();

        res.json({
            success: true,
            message: 'Categories retrieved successfully',
            data: categories.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                image: category.image,
                seo: category.seo,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            })),
        });
    });

    public getParentCategories = ApiHandler(async (_req: Request, res: Response) => {
        const categories = await this.productService.getParentCategories();

        res.json({
            success: true,
            message: 'Parent categories retrieved successfully',
            data: categories.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                image: category.image,
                seo: category.seo,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            })),
        });
    });

    public getSubcategories = ApiHandler(async (req: Request, res: Response) => {
        const { parentId } = req.params;
        if (!parentId || typeof parentId !== 'string') {
            throw AppError.badRequest('Invalid parent category ID');
        }

        const subcategories = await this.productService.getSubcategories(parentId);

        res.json({
            success: true,
            message: 'Subcategories retrieved successfully',
            data: subcategories.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                image: category.image,
                seo: category.seo,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            })),
        });
    });

    public deleteCategory = ApiHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw AppError.badRequest('Invalid category ID');
        }

        await this.productService.deleteCategory(id);

        res.json({
            success: true,
            message: 'Category deleted successfully',
            data: null,
        });
    });
}
