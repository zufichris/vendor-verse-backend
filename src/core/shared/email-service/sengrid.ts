import sg, { MailService } from '@sendgrid/mail'
import { env } from "../../../config";
import z from 'zod';

const emailAddressSchema = z.union([z.string().email(), z.object({ name: z.string(), email: z.string().email() })]);

const sendEmailSchema = z.object({
    subject: z.string().optional(),
    from: emailAddressSchema,
    to: z.union([emailAddressSchema, z.array(emailAddressSchema)]),
    html: z.string().optional(),
    text: z.string().optional(),
    attachments: z.array(z.object({
        content: z.string(),
        filename: z.string(),
        type: z.string().optional(),
        disposition: z.string().optional()
    })).optional(),
    cc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
    bcc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
    replyTo: emailAddressSchema.optional()
})

const FinalSchema = z.union([sendEmailSchema, z.array(sendEmailSchema)])

type SendEmailProps = z.infer<typeof FinalSchema>

export class SendgridEmailService {
    private static readonly apiKey = env.email.sendgridApiKey;

    private static service: MailService = sg;

    private static isInit: boolean = false;


    public static init() {
        this.service.setApiKey(this.apiKey)
        this.isInit = true
    }

    public static async sendEmail(args: SendEmailProps): Promise<boolean> {
        if (!this.isInit) {
            this.init()
        }

        const params = Array.isArray(args) ? args : [args]

        const sent = await this.service.send(params.map(p => ({
            from: p.from || env.email.defaultSender,
            to: p.to,
            subject: p.subject,
            html: p.html,
            text: p.text!,
            attachments: p.attachments,
            cc: p.cc,
            bcc: p.bcc,
            replyTo: p.replyTo
        })))

        return true
    }
}