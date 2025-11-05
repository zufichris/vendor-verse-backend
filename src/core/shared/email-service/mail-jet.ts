
import Mailjet, { Client } from "node-mailjet";
import { env } from "../../../config";
import z from 'zod';

const emailAddressSchema = z.object({ name: z.string(), email: z.string().email() });

const sendEmailSchema = z.object({
    subject: z.string().optional(),
    from: emailAddressSchema.optional(),
    to: z.union([emailAddressSchema, z.array(emailAddressSchema)]),
    html: z.string().optional(),
    text: z.string().optional(),
    attachments: z.array(z.object({
        content: z.string(),
        filename: z.string(),
        type: z.string().optional()
    })).optional(),
    cc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
    bcc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
    replyTo: emailAddressSchema.optional()
})

const FinalSchema = z.union([sendEmailSchema, z.array(sendEmailSchema)])

type SendEmailProps = z.infer<typeof FinalSchema>

export class MailJetEmailService {
    private static service: Client;

    private static isInit: boolean = false;


    public static init() {
        this.service = Mailjet.apiConnect(env.email.mailJet.apiKey, env.email.mailJet.apiSecret);
        this.isInit = true
    }

    public static async sendEmail(args: SendEmailProps): Promise<boolean> {
        if (!this.isInit) {
            this.init()
        }

        const params = Array.isArray(args) ? args : [args]

        await this.service.post('send', { version: 'v3.1' }).request({
            Messages: params.map(p => ({
                From: {
                    Email: p.from?.email || env.email.defaultSender.email,
                    Name: p.from?.name || env.email.defaultSender.name
                },
                To: (Array.isArray(p.to) ? p.to : [p.to]).map(itm => ({
                    Email: itm.email,
                    name: itm.name
                })),
                Subject: p.subject || '  ',
                TextPart: p.text,
                HTMLPart: p.html,
                InlinedAttachments: p.attachments?.map(att => ({
                    ContentType: att.type,
                    Filename: att.filename,
                    ContentID: Date.now().toString(),
                    Base64Content: att.content
                }))
            }))
        })
        return true
    }
}