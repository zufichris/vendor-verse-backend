import { AppError } from "../../core/middleware";
import { BaseRepository } from "../../core/repository";
import { RemoveFromCartDTO, UpsertCartDTO } from "./cart.dto";
import { Cart } from "./cart.types";

type UpsertCart = UpsertCartDTO & { unitPrice: number, productImageurl: string, productName: string, }

export class CartRepository extends BaseRepository<Cart> {
    async upsert(data: UpsertCart) {
        // User cannot add more than 20 products on their cart
        if (await this.count({ userId: data.userId }) >= 20) {
            throw AppError.badRequest("Cannot add more than 20 products in cart. Please checkout first!")
        }

        let found = await this.findOne({
            variantId: data.variantId,
            userId: data.userId
        })

        if (found) {
            if (data.quantity <= 0) {
                await this.deleteById(found.id)

                return found;
            }

            await this.updateById(found.id, {
                ...data
            });

            return {
                ...found,
                ...data
            }
        }

        if (data.quantity <= 0 || data.unitPrice <= 0) {
            throw AppError.badRequest("Quantity or price must be a positive number")
        }

        found = await this.create(data);

        if (!found) {
            throw AppError.internal("Failed to add to cart")
        }

        return found;
    }

    async clear(userId?: string) {
        if (!userId) {
            await this.model.deleteMany()
        } else {
            await this.model.deleteMany({ userId })
        }

        return true;
    }

    async removeFromCart(dto: RemoveFromCartDTO) {
        if (dto.variantId) {
            await this.model.findOneAndDelete({ userId: dto.userId, variantId: dto.variantId })
        } else {
            await this.model.deleteMany({ userId: dto.userId })
        }

        return true
    }
}