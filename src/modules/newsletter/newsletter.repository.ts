import { BaseRepository } from "../../core/repository";
import { CreateNewsLetterDto } from "./newsletter.dtos";
import { NewsletterModel } from "./newsletter.model";
import { NewsLetter } from "./newsletter.types";

export class NewsletterRepository extends BaseRepository<NewsLetter> {
    constructor(protected readonly model: typeof NewsletterModel) {
        super(model);
    }

    async findByEmail(email: string) {
        return this.findOne({ email: email.toLowerCase() });
    }

    async upsert(dto: CreateNewsLetterDto): Promise<NewsLetter> {
        const found = await this.findByEmail(dto.email)

        if (found) {
            if (dto.firstName?.toLowerCase() !== found.firstName?.toLowerCase() || dto.lastName !== found.lastName?.toLowerCase() || !found.isSubscribed) {
                await this.updateById(found.id, {
                    firstName: dto.firstName || found.firstName,
                    lastName: dto.lastName || found.lastName,
                    isSubscribed: true
                })
            }
            return found;
        }

        return await this.create({ ...dto, isSubscribed: true })
    }

    unsubscribe(email: string) {
        return this.updateOne({
            email: email.toLowerCase(),
            isSubscribed: true
        }, {
            isSubscribed: false
        }, {
            new: true
        })
    }

    unsubscribeBulk(emails: string[]) {
        return this.model.updateMany({
            email: {
                $in: emails.map(m => m.toLowerCase())
            }
        }, {
            isSubscribed: false
        })
    }
}
