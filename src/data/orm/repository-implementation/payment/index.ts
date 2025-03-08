import mongoose from "mongoose";
import { PaymentRepository } from "../../../../domain/payment/repository";
import { PaymentDocument } from "../../model/payment";
import { ID, IQueryFilters, IQueryResult } from "../../../../shared/entity";
import { TPayment } from "../../../entity/payment";
import { logger } from "../../../../util/logger";
import { getQueryMetaData, getUnitId } from "../../../../util/functions";

export class PaymentRepositoryImpl implements PaymentRepository {
    constructor(private readonly paymentModel: mongoose.Model<PaymentDocument>) { }

    async create(data: Partial<TPayment>): Promise<TPayment | null> {
        try {
            const payId = await getUnitId(this.paymentModel, "payId", "Payment");
            const payment = await this.paymentModel.create({ ...data, payId });
            return payment.toJSON() as TPayment;
        } catch (error) {
            logger.error("Error Creating Payment", { error, data });
            return null;
        }
    }

    async update(id: ID, data: Partial<TPayment>): Promise<TPayment | null> {
        try {
            const updatedPayment = await this.paymentModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
            return updatedPayment ? (updatedPayment.toJSON() as TPayment) : null;
        } catch (error) {
            logger.error("Error Updating Payment", { error, id, data });
            return null;
        }
    }

    async findById(id: ID): Promise<TPayment | null> {
        try {
            const payment = await this.paymentModel.findById(id);
            return payment ? (payment.toJSON() as TPayment) : null;
        } catch (error) {
            logger.error("Error Finding Payment by ID", { error, id });
            return null;
        }
    }

    async findOne(filter?: mongoose.FilterQuery<TPayment>): Promise<TPayment | null> {
        try {
            const payment = await this.paymentModel.findOne(filter);
            return payment ? (payment.toJSON() as TPayment) : null;
        } catch (error) {
            logger.error("Error Finding Payment", { error, filter });
            return null;
        }
    }

    async count(filter?: mongoose.FilterQuery<TPayment>): Promise<number> {
        try {
            const count = await this.paymentModel.countDocuments(filter);
            return count;
        } catch (error) {
            logger.error("Error Counting Payments", { error, filter });
            return 0;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.paymentModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            logger.error("Error Deleting Payment", { error, id });
            return false;
        }
    }

    async query(options?: IQueryFilters<TPayment>): Promise<IQueryResult<TPayment>> {
        try {
            const limit = options?.limit ?? 10;
            const page = options?.page ?? 1;
            const skip = (page - 1) * limit;

            const [data = [], totalCount = 0, filterCount = 0] = await Promise.all([
                this.paymentModel.find(options?.filter ?? {}, options?.projection, {
                    ...options?.queryOptions,
                    limit,
                    skip,
                }),
                this.count(),
                this.count(options?.filter),
            ]);

            const payments = data.map(payment => payment.toJSON() as TPayment);
            const metadata = getQueryMetaData({
                totalCount,
                page,
                limit,
                filterCount,
            });

            return { data: payments, ...metadata };
        } catch (error) {
            logger.error("Error Querying Payments", { error, options });
            throw error;
        }
    }
}