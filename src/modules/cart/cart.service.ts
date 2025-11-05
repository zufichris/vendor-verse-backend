import { AppError } from "../../core/middleware";
import { ProductRepository, ProductStatusSchema } from "../product";
import { UserRepository, UserStatus } from "../user";
import { RemoveFromCartDTO, RemoveFromCartSchema, UpsertCartDTO, UpsertCartSchema } from "./cart.dto";
import { CartRepository } from "./cart.repository";

export class CartService {
    constructor(
        private readonly repo: CartRepository,
        private readonly productsRepo: ProductRepository,
        private readonly userRepo: UserRepository
    ) { }

    getCart(userId: string) {
        return this.repo.paginate({
            filter: { userId },
            options: {
                sort: { createdAt: -1 },
                limit: 20,
                skip: 0,
                populate: ['variantId']
            }
        })
    }

    async upsertCart(dto: UpsertCartDTO) {
        const { data, success, error } = UpsertCartSchema.safeParse(dto);

        if (!success) {
            throw AppError.unprocessableEntity("Invalid data", error.format())
        }

        const productVariant = await this.productsRepo.getVariant(data.variantId);


        if (!productVariant) {
            throw AppError.badRequest("Invalid product identifier, product not found.")
        }

        const product = await this.productsRepo.findById(productVariant.productId)

        if (!product) {
            throw AppError.badRequest("Invalid product identifier, product not found.")
        }

        // Ensure product is in an active status
        if (ProductStatusSchema.Enum.active !== product.status) {
            throw AppError.badRequest("Selected product cannot be added to  cart")
        }

        // For safety, also ensure user exists and is active
        const user = await this.userRepo.findById(dto.userId)

        if (!user) {
            throw AppError.badRequest("Invalid user identifier, user not found")
        }

        if (![UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION].includes(user.status)) {
            throw AppError.badRequest("User not active")
        }

        if (data.quantity <= 0) {
            return await this.removeFromCart(data)
        }

        const upserted = await this.repo.upsert({
            ...data,
            unitPrice: productVariant?.price || product.price,
            productImageurl: productVariant.thumbnail.url || productVariant.images[0].url || product.thumbnail.url || product.images[0].url,
            productName: `${product.name} | ${productVariant?.name}`,
        })

        return upserted;
    }

    clearCart(userId: string) {
        return this.repo.clear(userId)
    }

    async removeFromCart(dto: RemoveFromCartDTO) {
        const { data, success, error } = RemoveFromCartSchema.safeParse(dto)
        if (!success) {
            throw AppError.unprocessableEntity("Invalid request", error.format())
        }
        const deleted = await this.repo.removeFromCart(data)

        return deleted;
    }
}