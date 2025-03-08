import mongoose from "mongoose";
import { PaymentMethodRepository } from "../../../../domain/payment-method/repository";
import { PaymentMethodDocument } from "../../model/payment-method";
import { ID, IQueryFilters, IQueryResult } from "../../../../shared/entity";
import { TPaymentMethod } from "../../../entity/payment-method";
import { logger } from "../../../../util/logger";
import { getQueryMetaData, getUnitId } from "../../../../util/functions";

export class PaymentMethodRepositoryImpl implements PaymentMethodRepository {
    constructor(private readonly paymentMethodModel: mongoose.Model<PaymentMethodDocument>) { }

    async create(data: Partial<TPaymentMethod>): Promise<TPaymentMethod | null> {
        try {
            const pmtId = await getUnitId(this.paymentMethodModel, "pmtId", "PaymentMethod");
            const paymentMethod = await this.paymentMethodModel.create({ ...data, pmtId });
            return paymentMethod.toJSON() as TPaymentMethod;
        } catch (error) {
            logger.error("Error Creating Payment Method", { error, data });
            return null;
        }
    }

    async update(id: ID, data: Partial<TPaymentMethod>): Promise<TPaymentMethod | null> {
        try {
            const updatedPaymentMethod = await this.paymentMethodModel.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            );
            return updatedPaymentMethod ? (updatedPaymentMethod.toJSON() as TPaymentMethod) : null;
        } catch (error) {
            logger.error("Error Updating Payment Method", { error, id, data });
            return null;
        }
    }

    async findById(id: ID): Promise<TPaymentMethod | null> {
        try {
            const paymentMethod = await this.paymentMethodModel.findById(id);
            return paymentMethod ? (paymentMethod.toJSON() as TPaymentMethod) : null;
        } catch (error) {
            logger.error("Error Finding Payment Method by ID", { error, id });
            return null;
        }
    }

    async findOne(filter?: mongoose.FilterQuery<TPaymentMethod>): Promise<TPaymentMethod | null> {
        try {
            const paymentMethod = await this.paymentMethodModel.findOne(filter);
            return paymentMethod ? (paymentMethod.toJSON() as TPaymentMethod) : null;
        } catch (error) {
            logger.error("Error Finding Payment Method", { error, filter });
            return null;
        }
    }

    async count(filter?: mongoose.FilterQuery<TPaymentMethod>): Promise<number> {
        try {
            const count = await this.paymentMethodModel.countDocuments(filter);
            return count;
        } catch (error) {
            logger.error("Error Counting Payment Methods", { error, filter });
            return 0;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.paymentMethodModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            logger.error("Error Deleting Payment Method", { error, id });
            return false;
        }
    }

    async query(options?: IQueryFilters<TPaymentMethod>): Promise<IQueryResult<TPaymentMethod>> {
        try {
            const limit = options?.limit ?? 10;
            const page = options?.page ?? 1;
            const skip = (page - 1) * limit;

            const [data = [], totalCount = 0, filterCount = 0] = await Promise.all([
                this.paymentMethodModel.find(options?.filter ?? {}, options?.projection, {
                    ...options?.queryOptions,
                    limit,
                    skip,
                }),
                this.count(),
                this.count(options?.filter),
            ]);

            const paymentMethods = data.map(pm => pm.toJSON() as TPaymentMethod);
            const metadata = getQueryMetaData({
                totalCount,
                page,
                limit,
                filterCount,
            });

            return { data: paymentMethods, ...metadata };
        } catch (error) {
            logger.error("Error Querying Payment Methods", { error, options });
            throw error;
        }
    }
}