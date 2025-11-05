import z from "zod";
import { createPaginatedResponseData, createResponseSchema } from "../../core/dtos";
import { AppError } from "../../core/middleware";
import { ApiHandler } from "../../util/api-handler";
import { CartService } from "./cart.service";
import { CartResponseSchema } from "./cart.dto";

export class CartControler {
    constructor(
        private readonly service: CartService
    ) { }

    getCart = ApiHandler(async (req, res) => {
        const user = req.user

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        const data = await this.service.getCart(user.id);

        const { success, data: response, error } = createResponseSchema(createPaginatedResponseData(CartResponseSchema)).safeParse({
            data: JSON.parse(JSON.stringify(data))
        })

        if (!success) {
            console.log(JSON.stringify(error.format(), undefined, 2))
            throw AppError.internal("Unexpected server error", error.format())
        }

        return res.json(response)
    })

    upserCart = ApiHandler(async (req, res) => {
        const user = req.user

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        const body = req.body;

        const data = await this.service.upsertCart({ ...body, userId: user.id });

        const { success, data: response, error } = createResponseSchema(CartResponseSchema).safeParse({
            data: JSON.parse(JSON.stringify(data))
        })

        if (!success) {
            throw AppError.internal("Unexpected server error", error.format())
        }

        return res.json(response)
    })

    removeFromCart = ApiHandler(async (req, res) => {
        const user = req.user

        if (!user) {
            throw AppError.unauthorized("Please login")
        }

        const productId = req.params.productId || (req?.query?.productId as string | undefined);

        const data = await this.service.removeFromCart({ userId: user.id, variantId: productId?.trim() });

        const { success, data: response, error } = createResponseSchema(z.boolean()).safeParse({ data })

        if (!success) {
            throw AppError.internal("Unexpected server error", error.format())
        }

        return res.json(response)
    })

    clearCart = ApiHandler(async (req, res) => {
        const user = req.user;

        if (!user) {
            throw AppError.unauthorized("Please login");
        }

        const data = await this.service.clearCart(user.id);

        const { success, data: response, error } = createResponseSchema(z.boolean()).safeParse({
            data
        });

        if (!success) {
            throw AppError.internal("Unexpected server error", error.format());
        }

        return res.json(response);
    })
}