import * as Stripe from "stripe";
import { Order } from "./order.types";
import { env } from "../../config";
import { AppError } from "../../core/middleware/error.middleware";

export class PaymentService {
  constructor(private readonly stripe: Stripe.Stripe) {}
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
      return {url:session.url};
    } catch (error) {
      console.log("Stripe Error", error);
      throw AppError.badGateway("stripe payment failed", error);
    }
  }
}
