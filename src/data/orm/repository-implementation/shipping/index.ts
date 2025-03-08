import mongoose from "mongoose";
import { ShippingRepository } from "../../../../domain/shipping/repository";
import { ShippingDocument } from "../../model/shipping";
import { ID, IQueryFilters, IQueryResult } from "../../../../shared/entity";
import { TShipping } from "../../../entity/shipping";
import { logger } from "../../../../util/logger";
import { getQueryMetaData, getUnitId } from "../../../../util/functions";

export class ShippingRepositoryImpl implements ShippingRepository {
    constructor(private readonly shippingModel: mongoose.Model<ShippingDocument>) { }

    async create(data: Partial<TShipping>): Promise<TShipping | null> {
        try {
            const shipId = await getUnitId(this.shippingModel, "shipId", "Ship");
            const shipping = await this.shippingModel.create({ ...data, shipId });
            return shipping.toJSON() as TShipping;
        } catch (error) {
            logger.error("Error Creating Shipping", { error, data });
            return null;
        }
    }

    async update(id: ID, data: Partial<TShipping>): Promise<TShipping | null> {
        try {
            const updatedShipping = await this.shippingModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
            return updatedShipping ? (updatedShipping.toJSON() as TShipping) : null;
        } catch (error) {
            logger.error("Error Updating Shipping", { error, id, data });
            return null;
        }
    }

    async findById(id: ID): Promise<TShipping | null> {
        try {
            const shipping = await this.shippingModel.findById(id);
            return shipping?.toJSON() as TShipping | null;
        } catch (error) {
            logger.error("Error Finding Shipping by ID", { error, id });
            return null;
        }
    }

    async findOne(filter?: mongoose.FilterQuery<TShipping>): Promise<TShipping | null> {
        try {
            const shipping = await this.shippingModel.findOne(filter);
            return shipping?.toJSON() as TShipping | null;
        } catch (error) {
            logger.error("Error Finding Shipping", { error, filter });
            return null;
        }
    }

    async count(filter?: mongoose.FilterQuery<TShipping>): Promise<number> {
        try {
            const count = await this.shippingModel.countDocuments(filter);
            return count;
        } catch (error) {
            logger.error("Error Counting Shippings", { error, filter });
            return 0;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.shippingModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            logger.error("Error Deleting Shipping", { error, id });
            return false;
        }
    }

    async query(options?: IQueryFilters<TShipping>): Promise<IQueryResult<TShipping>> {
        try {
            const limit = options?.limit ?? 10;
            const page = options?.page ?? 1;
            const skip = (page - 1) * limit;

            const [data = [], totalCount = 0, filterCount = 0] = await Promise.all([
                this.shippingModel.find(options?.filter ?? {}, options?.projection, {
                    ...options?.queryOptions,
                    limit,
                    skip,
                }),
                this.count(),
                this.count(options?.filter),
            ]);

            const shippings = data.map(shipping => shipping.toJSON() as TShipping);
            const metadata = getQueryMetaData({
                totalCount,
                page,
                limit,
                filterCount,
            });

            return { data: shippings, ...metadata };
        } catch (error) {
            logger.error("Error Querying Shippings", { error, options });
            throw error;
        }
    }
}