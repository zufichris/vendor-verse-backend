import { env } from "../../config";
import { HttpClient } from "../utils/httpclient.util";

type Address = {
    "contact_name": string,
    "contact_phone": string,
    "partner_order_id": string,
    "share_tracking": true,
    "notes": string,
    "address": {
        "address1": string,
        "address2": string,
        "coords": number[], //[55.1631158,25.0559987]
        "country": string, //"UAE"
        "town": string //Dubai
    }
}

type Item = {
    "name": string,
    "quantity": number,
    "parcel_barcode": string
}

type CreateOrderDTO = {
    "kind": "partner_same_day" | "partner_4hr" | "partner_next_day" | "partner_return",
    "notes": string,
    "payment_amount": number, //if payment_mode=paid_on_delivery, then amount must be greated than 1, else must be 0 (case of pre_paid )
    "payment_mode": "paid_on_delivery" | "pre_paid ",
    "disallowed_payment_types": string[], // Payment types to disallow ["cash"]
    // "billing_identifier": "rafael-company", // to be 
    "scheduled_for": null,
    "metadata": null,
    "partner_order_id": string, // Order unique our order identifier
    "required_documents": string[], //[ "customer_identification_photo" ]
    "destination": Address,
    "items": Item[]
}

export class QuiqupCLient {
    private static readonly confiq = env.quiqup
    private static readonly businessName = "aetli" // this should be provided by quiqup

    private static httpClient = new HttpClient({
        baseURL: this.confiq.baseUrl,
        defaultHeaders: {
            'Content-Type': 'application/json'
        }
    })

    private static token: string = ''
    private static tokenExpiry: number = 0
    private static tokenType: string = ''

    private static orderOrigin: Address = {
        address: {
            address1: 'Business pickup location',
            address2: '',
            coords: [],
            country: 'UAE',
            town: 'Dubai'
        },
        contact_name: 'Tarryn Petersen',
        contact_phone: "+971588629213",
        notes: '',
        share_tracking: true,
        partner_order_id: ''
    }

    static async initClient() {
        const { data } = await this.httpClient.post<{
            "access_token": string,
            "token_type": string,
            "expires_in": number,
            "created_at": number
        }>(`/oauth/token?grant_type=client_credentials&client_id=${this.confiq.clientId}&client_secret=${this.confiq.clientSecret}`, {})

        const now = Date.now()

        this.token = data.access_token
        this.tokenType = data.token_type

        // Token expiry is in seconds, convert to miliseconds, add to now date and set this.tokenExpiry
        this.tokenExpiry = now + (data.expires_in * 1000)

        console.log(`Configured token and expiry`)

    }

    static async creatOrder(dto: CreateOrderDTO) {
        try {
            if (this.isExpired()) {
                console.log('Reefreshing token')
                await this.initClient()
            } else {
                console.log('Using existing token')
            }

            const { data } = await this.httpClient.post(`/orders`, {
                ...dto,
                billing_identifier: this.businessName,
                origin: {
                    ...this.orderOrigin,
                    partner_order_id: dto.partner_order_id
                },
            }, {
                headers: {
                    Authorization: `${this.tokenType} ${this.token}`,
                    Accept: 'application/json'
                }
            })

            return data

        } catch (error) {

        }
    }

    private static isExpired() {
        const now = Date.now()

        return !this.token || ((now - 2000) > this.tokenExpiry)
    }
}