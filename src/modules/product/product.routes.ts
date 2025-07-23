import { Router } from "express";
import { ProductController } from "./product.controller";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { UserRole } from "../user";

export function createProductRouter(
  productController: ProductController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();
  router
    .route("/")
    .post(
      authMiddleware.requireAuth,
      authMiddleware.authorize(UserRole.ADMIN),
      productController.createProduct,
    )
    .get(productController.getActiveProducts);

  router.get("/shop", productController.filterProducts);

  router.get("/recommended", productController.getRecommendedProducts);

  router.get(
    "/products/:id",
    authMiddleware.requireAuth,
    productController.getProductById,
  );

  router.get("/slug/:slug", productController.getProductBySlug);

  router.get(
    "/products/sku/:sku",
    authMiddleware.requireAuth,
    productController.getProductBySku,
  );

  router.get("/search", productController.searchProductsByNameOrDescription);

  router.get(
    "/products/category/:categoryId",
    authMiddleware.requireAuth,
    productController.getProductsByCategory,
  );

  router.get("/active", productController.getActiveProducts);

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

  router.put(
    "/products/:id",
    authMiddleware.requireAuth,
    authMiddleware.authorize(UserRole.ADMIN),
    productController.updateProduct,
  );

  router.post(
    "/products/:productId/variants",
    authMiddleware.requireAuth,
    authMiddleware.authorize(UserRole.ADMIN),
    productController.addVariant,
  );

  router.put(
    "/products/:productId/variants/:variantId",
    authMiddleware.requireAuth,
    authMiddleware.authorize(UserRole.ADMIN),
    productController.updateVariant,
  );

  router.delete(
    "/products/:productId/variants/:variantId",
    authMiddleware.requireAuth,
    authMiddleware.authorize(UserRole.ADMIN),
    productController.deleteVariant,
  );

  // Category routes
  router.post(
    "/categories",
    authMiddleware.requireAuth,
    authMiddleware.authorize(UserRole.ADMIN),
    productController.createCategory,
  );

  router.put(
    "/categories/:id",
    authMiddleware.requireAuth,
    authMiddleware.authorize(UserRole.ADMIN),
    productController.updateCategory,
  );

  router.get("/categories/:id", authMiddleware.requireAuth);

  router.get(
    "/categories/slug/:slug",
    authMiddleware.requireAuth,
    productController.getCategoryBySlug,
  );

  router.get("/categories", productController.getAllCategories);

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

  router.delete(
    "/categories/:id",
    authMiddleware.requireAuth,
    authMiddleware.authorize(UserRole.ADMIN),
    productController.deleteCategory,
  );

  router
    .route("/banners")
    .post(
      authMiddleware.requireAuth,
      authMiddleware.authorize(UserRole.ADMIN),
      productController.createBanner,
    )
    .get(productController.getBanners);

  router
    .route("/banners/:id")
    .patch(
      authMiddleware.requireAuth,
      authMiddleware.authorize(UserRole.ADMIN),
      productController.updateBanner,
    )
    .delete(
      authMiddleware.requireAuth,
      authMiddleware.authorize(UserRole.ADMIN),
      productController.deleteBanner,
    );

  return router;
}
