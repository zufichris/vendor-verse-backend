import { env } from "../../../config";
import { MailJetEmailService } from "../../../core/shared/email-service/mail-jet";
import { TemplatesEngine } from "../../../core/shared/templates-engine";

export class ContactService {
    constructor() { }
    async sendContactUsMessage(data: Record<string, string>) {
        const html = TemplatesEngine.compile('contact-us.hbs', data)

        const res = await MailJetEmailService.sendEmail({
            to: env.email.defaultSender,
            html,
            subject: data?.subject || "New Contact us email"
        })

        return res
    }
}