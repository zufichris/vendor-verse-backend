import { ApiHandler } from "../../../util/api-handler";
import { ContactService } from "../services";

export class ContactsController {
    constructor(private readonly service: ContactService) { }
    contactUs = ApiHandler(async (req, res) => {
        const body = req.body

        const result = await this.service.sendContactUsMessage(body)

        const status = result ? 200 : 400

        res.status(status).json({
            success: result,
            message: result ? "Message received" : "Failed to send email",
            data: result,
            status
        })

    })
}