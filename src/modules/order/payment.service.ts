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
                metadata: { orderId: order.id },
                success_url: `${env.client_url}/home`,
                cancel_url: `${env.client_url}/checkout`,
            });
            return { url: session.url };
        } catch (error) {
            throw AppError.badGateway("stripe payment failed", error);
        }
    }
    async stripeCheckoutWebwook(signature: string, body: unknown) {
        let received = false;
        let orderId: string | undefined;
        try {
            const event = this.stripe.webhooks.constructEvent(body as string, signature, env.stripe_webhook_secret);
            if (event.type === "checkout.session.completed") {
                const session = event.data.object as Stripe.Stripe.Checkout.Session;
                orderId = session?.metadata?.orderId;
            }
            received = true;
        } catch (error) {
            received = false;
        }
        return { received, orderId };
    }
}
