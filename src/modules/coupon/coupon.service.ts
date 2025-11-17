import mongoose from "mongoose";
import { AppError } from "../../core/middleware";
import { CreateCouponDTO, CreateCouponSchema, ValidateCouponDTO, ValidateCouponSchema } from "./coupon.dtos";
import { CouponRepository } from "./coupon.repository";

import { nanoid } from "nanoid";

export class CouponService {
    constructor(
        protected readonly couponRepo: CouponRepository
    ) { }

    async createCouponCode(dto: CreateCouponDTO) {
        const { success, data, error } = CreateCouponSchema.safeParse(dto)

        if (!success) {
            throw AppError.unprocessableEntity("Validation error", error.format())
        }

        let finalCode = (data?.code || `AE-${nanoid(6)}`).toUpperCase();

        // Ensure code is unique in the db


        const created = await this.couponRepo.create({
            ...data,
            userEmail: data.userEmail?.toLowerCase(),
            code: finalCode,
        })


        return created;
    }

    getCoupons({ code, limit: lm, page: pg, userEmail }: { code?: string, userEmail?: string, page?: number, limit?: number }) {
        const filter: Record<string, string> = {}

        if (userEmail) {
            filter.userEmail = userEmail
        }

        if (code) {
            filter.code = code
        }

        const page = Math.max(pg || 1, 1);
        const limit = Math.min(Math.max(lm || 20, 1), 100);

        return this.couponRepo.paginate({
            filter,
            limit,
            page
        })
    }

    getCouponByIdOrCode(idOrCode: string) {
        const filter: Record<string, unknown> = {}

        if (this.couponRepo.isValidId(idOrCode)) {
            filter._id = new mongoose.Schema.Types.ObjectId(idOrCode)
        } else {
            filter.code = idOrCode.toUpperCase()
        }

        return this.couponRepo.findOne(filter)
    }

    async validateCode(dto: ValidateCouponDTO): Promise<{ valid: boolean, discountRate: number, code: string }> {
        const { success, error, data } = ValidateCouponSchema.safeParse(dto)

        if (!success) {
            throw AppError.unprocessableEntity("Validation error", error.format())
        }


        const { code, totalAmount = 0, userEmail = null } = data;



        const coupon = await this.couponRepo.findOne({ code: code.toUpperCase() });

        if (!coupon) throw AppError.badRequest("Invalid coupon code");


        // expiration check
        if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
            throw AppError.badRequest("Expired coupon code");
        }


        // user binding check
        if (coupon.userEmail && userEmail) {
            if (coupon.userEmail.toLowerCase() !== userEmail.toLowerCase()) {
                throw AppError.badRequest("coupon not assigned to this user")
            }
        } else if (coupon.userEmail && !userEmail) {
            throw AppError.badRequest('coupon bound to a user; provide userEmail')
        }


        // usage limits
        if (coupon.maxUses != null && coupon.usesCount >= coupon.maxUses) {
            throw AppError.badRequest('coupon usage limit reached')
        }


        // min order amount
        if (coupon.minOrderAmount != null && (totalAmount || 0) < coupon.minOrderAmount) {
            throw AppError.badRequest('minimum order amount not reached')
        }


        return {
            valid: true,
            discountRate: coupon.discountPercent,
            code: coupon.code
        }
    }

    async getWelcomeCoupon(userEmail: string) {
        const found = await this.couponRepo.findOne({
            userEmail: userEmail.toLowerCase(),
            code: { $regex: 'WELCOME-', $options: 'i' }
        })

        if (!found) {
            throw AppError.badRequest("Coupon not found")
        }

        return await this.validateCode({ code: found.code, userEmail: userEmail })
    }

    async markCouponUsed(id: string) {
        await this.couponRepo.updateById(id, {
            used: true,
        })

        return true
    }

    async incrementUsage(idOrCode: string) {
        const found = this.couponRepo.isValidId(idOrCode) ? await this.couponRepo.findById(idOrCode) : await this.couponRepo.findOne({
            code: idOrCode
        })

        if (!found) {
            throw AppError.notFound('Coupon not found')
        }

        if (found.maxUses && found.usesCount >= found.maxUses) {
            if (!found.used) {
                await this.markCouponUsed(found.id)
            }

            throw AppError.badRequest("Already used")
        }

        const newCount = found.usesCount + 1;

        await this.couponRepo.updateById(found.id, {
            usesCount: newCount,
            used: newCount >= found.maxUses
        })

        return true
    }
}