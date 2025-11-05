import { Request, Response } from "express";
import { ApiHandler } from "../../util/api-handler";
import { NewsletterService } from "./newsletter.service";
import { CreateNewsLetterDtoSchema, QueryNewsLetterDtoSchema } from "./newsletter.dtos";
import z from "zod";
import { AppError } from "../../core/middleware";

export class NewsletterController {
    constructor(private readonly service: NewsletterService) { }

    subscribe = ApiHandler(async (req: Request, res: Response) => {
        const dto = CreateNewsLetterDtoSchema.parse(req.body)

        const result = await this.service.subscribe(dto)

        res.json({
            success: true,
            status: 201,
            message: "Subscribed successfully",
            data: result,
        });
    })

    unsubscribe = ApiHandler(async (req: Request, res: Response) => {
        const email = req?.body?.email || req.query?.email
        const isValid = z.string().email().parse(email)

        const result = await this.service.unsubscribe(isValid)

        res.json({
            success: true,
            status: 201,
            message: "Unsubscribed successfully",
            data: result,
        });
    })

    unsubscribeBulk = ApiHandler(async (req: Request, res: Response) => {
        const emails = req.body?.emails || req.query?.emails

        if (!Array.isArray(emails)) {
            throw AppError.badRequest("Data must be a list of string")
        }

        if (emails.some(str => typeof str !== 'string')) {
            throw AppError.badRequest("Data must be a list of strings")
        }

        const result = await this.service.unsubscribeBulk(emails)

        return res.json({
            success: true,
            status: 201,
            message: "Unsubscribed successfully",
            data: {
                count: result.matchedCount
            },
        })
    })

    getSubs = ApiHandler(async (req: Request, res: Response) => {

        const query = QueryNewsLetterDtoSchema.safeParse(req.query || {})

        if (!query.success) {
            throw AppError.badRequest("Invalid query parameters", query.error.format())
        }

        const result = await this.service.query(query.data)

        return res.json({
            success: true,
            status: 200,
            message: "Newsletter subscriptions fetched successfully",
            data: result,
        })
    })
}