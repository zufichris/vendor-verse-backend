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
                        currency: order.currency.toLowerCase(),
                        product_data: { name: item.name },
                        unit_amount: Math.round(item.price * 100),
                    },
                    quantity: item.quantity,
                }));

            const session = await this.stripe.checkout.sessions.create({
                line_items,
                shipping_options: [
                    {
                        shipping_rate_data: {
                            display_name: "Shipping",
                            fixed_amount: {
                                amount: Math.round(order.shipping * 100),
                                currency: order.currency.toLowerCase()
                            },
                            type: 'fixed_amount',
                        }
                    }
                ],
                mode: "payment",
                metadata: { orderId: order.id.toString() },
                payment_intent_data: {
                    metadata: { orderId: order.id.toString() }
                },
                success_url: `${env.client_url}/home`,
                cancel_url: `${env.client_url}/checkout`,
            });

            const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

            return { url: session.url, id: session.id, paymentIntentId };

        } catch (error) {
            throw AppError.badGateway("stripe payment failed", error);
        }
    }
    async stripeCheckoutWebwook(signature: string, body: any) {
        let received = false;
        let orderId: string | undefined;
        let paymentStatus: 'success' | 'failed' | 'expired' | null = null;
        let transactionId: string | null = null;
        let paymentIntentId: string | null = null;
        let receiptUrl: string = ''
        const paymentMethod: Order['payment']['method'] = 'stripe';
        try {
            const event = this.stripe.webhooks.constructEvent(body as string, signature, env.stripe_webhook_secret);
            const session = event.data.object as Stripe.Stripe.Checkout.Session;
            orderId = session?.metadata?.orderId || session.invoice_creation?.invoice_data?.metadata?.orderId;

            transactionId = session.id;
            paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;

            // const pi = 

            switch (event.type) {
                // case 'checkout.session.completed':
                case 'payment_intent.succeeded':
                    paymentStatus = 'success';

                    const chrge = (event as any).data.object?.charges?.data[0]
                    receiptUrl = chrge?.receipt_url || ''
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

        return { received, orderId, paymentStatus, transactionId, paymentIntentId, receiptUrl, paymentMethod };
    }

    async createRefund(dto: { transactionId: string, method: string, grandTotal: number, id: string }) {
        const handleStripeRefund = async () => {
            const session = await this.stripe.checkout.sessions.retrieve(dto.transactionId);

            if (!session) {
                throw AppError.badRequest('Invalid stripe session id')
            }

            // Create refund
            const refund = await this.stripe.refunds.create({
                amount: dto.grandTotal,
                currency: 'usd',
                metadata: {
                    orderId: dto.id
                },
                payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
            })

            return {
                id: refund.id,
            }
        }

        let refundObj: { id: string } | null = null;

        switch (dto.method) {
            case 'stripe':
                refundObj = await handleStripeRefund()
                break;

            default:
                throw AppError.badRequest(`Please contact support for ${dto.method} refunds`)
        }

        return refundObj
    }
}
