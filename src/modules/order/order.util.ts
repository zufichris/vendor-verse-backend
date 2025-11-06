import { FilterQuery } from "mongoose";
import { QueryOrdersDto } from "./order.dtos";
import { Order } from "./order.types";
import { getDateFilterQuery, getNumberFilterQuery } from "../../core/utils/mongoose.filter.helpers";

export function setupOrdersQuery(query: QueryOrdersDto) {
    const { sortOrder: so = 'desc', sortBy, page: pg, limit: lm, status, search, paymentStatus, createdAt, updatedAt, id, total, withDeleted, ...rest } = query;

    const filter: FilterQuery<Order> = {
        ...rest,
        createdAt: getDateFilterQuery(createdAt) || undefined, // undefined is crucial so the query is not passed to mongoose if not available
        updatedAt: getDateFilterQuery(updatedAt) || undefined,
        grandTotal: getNumberFilterQuery(total) || undefined,
        _id: id || undefined,
        fulfillmentStatus: status?.trim() || undefined,
        payment: paymentStatus?.trim() ? { status: paymentStatus } : undefined,
        isDeleted: false,
        userId: query.userId
    }

    const page = Math.max(pg || 1, 1);
    const limit = Math.min(Math.max(lm || 20, 1), 100);
    const sortField = sortBy || 'createdAt';
    const sortOrder = so !== 'desc' ? 1 : -1;
    const offset = (page - 1) * limit;


    if (search?.trim()) {
        filter.$or = [{ orderNumber: { $regex: search.trim(), $options: 'i' } }]
    }

    if (withDeleted === 'true') {
        delete filter.isDeleted
    }

    // Clean up filters

    Object.keys(filter).map(k => {
        if (filter[k] === undefined) {
            delete filter[k]
        }
    })

    return {
        filter,
        options: {
            sort: {
                [sortField]: sortOrder
            },
            limit,
            skip: offset,
            populate: ['userId']
        }
    }


}