import { CreateNewsLetterDto, QueryNewsLetterDto } from "./newsletter.dtos";
import { NewsletterRepository } from "./newsletter.repository";

export class NewsletterService {
    constructor(private readonly repo: NewsletterRepository) { }

    subscribe(dto: CreateNewsLetterDto) {
        return this.repo.upsert(dto);
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