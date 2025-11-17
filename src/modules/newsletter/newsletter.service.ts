import { nanoid } from "nanoid";
import { MailJetEmailService } from "../../core/shared/email-service/mail-jet";
import { TemplatesEngine } from "../../core/shared/templates-engine";
import { CreateNewsLetterDto, QueryNewsLetterDto } from "./newsletter.dtos";
import { NewsletterRepository } from "./newsletter.repository";
import { CouponService } from "../coupon";

export class NewsletterService {
    constructor(private readonly repo: NewsletterRepository, private readonly couponSvc: CouponService) { }

    async subscribe(dto: CreateNewsLetterDto) {
        const found = await this.repo.findByEmail(dto.email.toLowerCase())

        if (found) {
            return found
        }

        const created = await this.repo.upsert(dto)

        const couponCode = `MOVEMENT-${nanoid(4)}`.toUpperCase()

        await this.couponSvc.createCouponCode({
            discountPercent: 10,
            maxUses: 1,
            code: couponCode,
            userEmail: dto.email
        })


        const html = TemplatesEngine.compile('join-movement.hbs', { code: couponCode })

        MailJetEmailService.sendEmail({
            to: {
                name: `${dto.firstName} ${dto.lastName}`,
                email: dto.email
            },
            subject: 'Welcome to the Movement',
            html
        })

        return created;
    }

    unsubscribe(email: string) {
        return this.repo.unsubscribe(email)
    }

    unsubscribeBulk(emails: string[]) {
        return this.repo.unsubscribeBulk(emails)
    }

    query(dto: Partial<QueryNewsLetterDto>) {
        let { page, limit, sortBy, sortOrder: sortorder, ...filters } = dto;

        page = Math.max(page || 1, 1);
        limit = Math.min(Math.max(limit || 20, 1), 100);

        const sortField = sortBy || 'createdAt';
        const sortOrder = sortorder === 'desc' ? -1 : 1;

        return this.repo.paginate({
            filter: filters,
            projection: {},
            page,
            limit,
            options: {
                sort: { [sortField]: sortOrder }
            }
        });
    }
}