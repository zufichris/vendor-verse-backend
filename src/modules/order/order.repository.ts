import { BaseRepository } from "../../core/repository";
import { OrderModel, OrderDocument } from "./order.models";
import { Order } from "./order.types";

export class OrderRepository extends BaseRepository<Order> {
    constructor(protected readonly model: typeof OrderModel) {
        super(model);
    }

    async findByUser(userId: string) {
        return this.find({ userId, isDeleted: { $ne: true } }, undefined, {
            sort: { createdAt: -1 },
        });
    }

    async findByOrderNumber(orderNumber: string):Promise<Order|null> {
        return this.findOne({ orderNumber, isDeleted: { $ne: true } });
    }
}
