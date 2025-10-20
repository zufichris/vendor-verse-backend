import * as Stripe from "stripe";
import { Order } from "./order.types";
import { env } from "../../config";
import { AppError } from "../../core/middleware/error.middleware";

export class PaymentService {
    constructor(private readonly stripe: Stripe.Stripe) { }
    async createStripeCheckoutSession(order: Order) {
        try {
            const line_items: Stripe.Stripe.Checkout.SessionCreateParams.LineItem[] =
                order.items.map((item) => ({
                    price_data: {
                        currency: "usd",
                        product_data: { name: item.name },
                        unit_amount: Math.round(item.price * 100),
                    },
                    quantity: item.quantity,
                }));

            const session = await this.stripe.checkout.sessions.create({
                line_items,
                mode: "payment",
                metadata: { orderId: order.id.toString() },
                success_url: `${env.client_url}/home`,
                cancel_url: `${env.client_url}/checkout`,
            });
            return { url: session.url };
        } catch (error) {
            throw AppError.badGateway("stripe payment failed", error);
        }
    }
    async stripeCheckoutWebwook(signature: string, body: any) {
        let received = false;
        let orderId: string | undefined;
        let paymentStatus: 'success' | 'failed' | 'expired' | null = null;
        try {
            const event = this.stripe.webhooks.constructEvent(body as string, signature, env.stripe_webhook_secret);
            const session = event.data.object as Stripe.Stripe.Checkout.Session;
            orderId = session?.metadata?.orderId || session.invoice_creation?.invoice_data?.metadata?.orderId;

            switch (event.type) {
                case 'checkout.session.completed':
                    paymentStatus = 'success';
                    break;
                case 'checkout.session.expired':
                    paymentStatus = 'expired';
                    break
                case 'payment_intent.canceled':
                case 'payment_intent.payment_failed':
                    paymentStatus = 'failed';
                    break
                default:
                    break;
            }

            received = true;
        } catch (error) {
            received = false;
        }
        return { received, orderId, paymentStatus };
    }
}
