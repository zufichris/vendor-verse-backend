import mongoose from "mongoose";
import { OrderRepository } from "../../../../domain/order/repository";
import { OrderDocument } from "../../model/order";
import { ID, IQueryFilters, IQueryResult } from "../../../../shared/entity";
import { TOrder } from "../../../entity/order";
import { logger } from "../../../../util/logger";
import { getQueryMetaData, getUnitId } from "../../../../util/functions";

export class OrderRepositoryImpl implements OrderRepository {
    constructor(private readonly orderModel: mongoose.Model<OrderDocument>) { }
    async create(data: Partial<TOrder>): Promise<TOrder | null> {
        try {
            const ordId = await getUnitId(this.orderModel, "ordId", "Ord")
            const order = await this.orderModel.create({ ...data, ordId });
            return order.toJSON() as TOrder;
        } catch (error) {
            logger.error("Error Creating Order", { error, data });
            return null;
        }
    }

    async update(id: ID, data: Partial<TOrder>): Promise<TOrder | null> {
        try {
            const updatedOrder = await this.orderModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
            return updatedOrder ? updatedOrder.toJSON() as TOrder : null;
        } catch (error) {
            logger.error("Error Updating Order", { error, id, data });
            return null;
        }
    }
    async findById(id: ID): Promise<TOrder | null> {
        try {
            const order = await this.orderModel.findById(id);
            return order?.toJSON() as TOrder | null;
        } catch (error) {
            logger.error("Error Finding Order by ID", { error, id });
            return null;
        }
    }

    async findOne(filter?: mongoose.RootFilterQuery<TOrder>): Promise<TOrder | null> {
        try {
            const order = await this.orderModel.findOne(filter);
            return order?.toJSON() as TOrder | null;
        } catch (error) {
            logger.error("Error Finding Order", { error, filter });
            return null;
        }
    }

    async count(filter?: mongoose.FilterQuery<TOrder>): Promise<number> {
        try {
            const count = await this.orderModel.countDocuments(filter);
            return count;
        } catch (error) {
            logger.error("Error Counting Orders", { error, filter });
            return 0;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.orderModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            logger.error("Error Deleting Order", { error, id });
            return false;
        }
    }

    async query(options?: IQueryFilters<TOrder>): Promise<IQueryResult<TOrder>> {
        try {
            const limit = options?.limit ?? 10;
            const page = options?.page ?? 1;
            const skip = (page - 1) * limit;

            const [data = [], totalCount = 0, filterCount = 0] = await Promise.all([
                this.orderModel.find(options?.filter ?? {}, options?.projection, {
                    ...options?.queryOptions,
                    limit,
                    skip,
                }),
                this.count(),
                this.count(options?.filter),
            ]);

            const orders = data.map(order => order.toJSON() as TOrder);
            const metadata = getQueryMetaData({
                totalCount,
                page,
                limit,
                filterCount,
            });

            return { data: orders, ...metadata };
        } catch (error) {
            logger.error("Error Querying Orders", { error, options });
            throw error;
        }
    }
}