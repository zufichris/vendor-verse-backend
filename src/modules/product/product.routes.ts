import { Router } from "express";
import { ProductController } from "./product.controller";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { UserRole } from "../user";

function createCustomerProductRoutes(
    productController: ProductController,
    authMiddleware: AuthMiddleware,
): Router {
    const router = Router();

    // Public
    router.get("/", productController.getActiveProducts);
    router.get("/shop", productController.filterProducts);
    router.get("/recommended", productController.getRecommendedProducts);
    router.get("/slug/:slug", productController.getProductBySlug);
    router.get("/search", productController.searchProductsByNameOrDescription);
    router.get("/active", productController.getActiveProducts);
    router.get("/categories", productController.getAllCategories);
    router.get("/banners", productController.getBanners);

    // Customer
    router.get(
        "/:id",
        authMiddleware.requireAuth,
        productController.getProductById,
    );
    router.get(
        "/products/sku/:sku",
        authMiddleware.requireAuth,
        productController.getProductBySku,
    );
    router.get(
        "/products/category/:categoryId",
        authMiddleware.requireAuth,
        productController.getProductsByCategory,
    );
    router.get(
        "/products/tags",
        authMiddleware.requireAuth,
        productController.getProductsByTags,
    );
    router.get(
        "/products/:productId/stock",
        authMiddleware.requireAuth,
        productController.checkStockAvailability,
    );
    router.get(
        "/products/:productId/variants/:variantId/stock",
        authMiddleware.requireAuth,
        productController.checkStockAvailability,
    );
    router.get("/categories/:id", authMiddleware.requireAuth);
    router.get(
        "/categories/slug/:slug",
        authMiddleware.requireAuth,
        productController.getCategoryBySlug,
    );
    router.get(
        "/categories/parents",
        authMiddleware.requireAuth,
        productController.getParentCategories,
    );
    router.get(
        "/categories/:parentId/subcategories",
        authMiddleware.requireAuth,
        productController.getSubcategories,
    );

    router.get('/banners/analytics', productController.getBannersAnalytics)

    return router;
}

function createAdminProductRoutes(
    productController: ProductController,
    authMiddleware: AuthMiddleware,
): Router {
    const router = Router();
    router.use(authMiddleware.requireAuth);
    router.use(authMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPPORT, UserRole.VENDOR]));

    // Product management
    router.post("/", productController.createProduct);
    router.patch("/:id", productController.updateProduct);
    router.put("/products/:id", productController.updateProduct);
    router.delete("/:id", productController.deleteProduct);
    // Analytics
    router.get('/analytics', productController.getAnalytics)

    // Product variant management
    router.post("/:productId/variants", productController.addVariant);
    router.put(
        "/products/:productId/variants/:variantId",
        productController.updateVariant,
    );
    router.delete(
        "/products/:productId/variants/:variantId",
        productController.deleteVariant,
    );

    // Category management
    router.post("/categories", productController.createCategory);
    router.get('/categories', productController.getAllCategories)
    router
        .route("/categories/:id")
        .patch(productController.updateCategory)
        .delete(productController.deleteCategory);

    // Banner management
    router.post("/banners", productController.createBanner);
    router.patch("/banners/:id", productController.updateBanner);
    router.delete("/banners/:id", productController.deleteBanner);

    return router;
}

export function createProductRouter(
    productController: ProductController,
    authMiddleware: AuthMiddleware,
): Router {
    const mainRouter = Router();

    const customerRoutes = createCustomerProductRoutes(
        productController,
        authMiddleware,
    );

    mainRouter.use("/", customerRoutes);

    const adminRoutes = createAdminProductRoutes(
        productController,
        authMiddleware,
    );
    mainRouter.use("/admin", adminRoutes);

    return mainRouter;
}
