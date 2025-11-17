import { Request, Response } from "express";
import { ApiHandler } from "../../util/api-handler";
import { AppError } from "../../core/middleware";
import { createErrorResponse, createResponseSchema } from "../../core/dtos";
import z from "zod";
import { CouponService } from "./coupon.service";
import { CouponSchema } from "./coupon.types";

export class CouponController {
    constructor(private readonly svc: CouponService) { }

    public creatCoupon = ApiHandler(async (req: Request, res: Response) => {
        let user = req.user;

        if (!user) {
            throw AppError.unauthorized("Unauthrised")
        }

        const coupon = await this.svc.createCouponCode({
            ...req.body,
            code: null
        });

        const { data: response, success, error } = createResponseSchema(CouponSchema).safeParse({ data: JSON.parse(JSON.stringify(coupon)) })

        if (!success) {
            throw AppError.internal("Insernal server error", error.format())
        }

        return res.json(response)
    });

    getFirstOrderCoupon = ApiHandler(async (req, res) => {
        const user = req.user;

        if (!user) {
            throw AppError.unauthorized()
        }

        const coupon = await this.svc.getWelcomeCoupon(user.email)

        const { data: response, success, error } = createResponseSchema(z.object({ valid: z.boolean(), discountRate: z.number().positive(), code: z.string() })).safeParse({ data: coupon })

        if (!success) {
            throw AppError.internal('Internal server error', error.format())
        }

        res.json(response)
    })

    validateCoupon = ApiHandler(async (req, res) => {
        const user = req.user;
        const code = req.query?.code?.toString() || req?.body?.code
        const totalAmount = req?.query?.totalAmount?.toString() || req?.body?.totalAmount

        if (!user) {
            throw AppError.unauthorized()
        }

        const isValid = await this.svc.validateCode({ userEmail: user.email, code, totalAmount })

        const { data: response, success, error } = createResponseSchema(z.object({ valid: z.boolean(), discountRate: z.number().positive() })).safeParse(isValid)

        if (!success) {
            throw AppError.internal('Internal server error', error.format())
        }

        res.json(response)
    })

    getCoupons = ApiHandler(async (req: Request, res: Response) => {
        const user = req.user;

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        const coupons = await this.svc.getCoupons(req.query);

        res.json(coupons);
    });

    getCoupon = ApiHandler(async (req, res) => {
        const user = req?.user;

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        const data = await this.svc.getCouponByIdOrCode(req.params.id)

        const { success, error, data: response } = createResponseSchema(CouponSchema).safeParse({
            data: JSON.parse(JSON.stringify(data))
        })

        if (!success) {
            res.json(createErrorResponse({ error: error.format() }))
        }

        return res.json(response)
    })
}
