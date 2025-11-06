import { FilterQuery, QueryOptions } from "mongoose";
import { QueryUersDTO } from "./user.dtos";
import { User } from "./user.types";

export function setupUsersQuery(query: QueryUersDTO) {
    const { sortBy, sortOrder: so, limit: lm, page: pg } = query;

    const filter: FilterQuery<User> = {
        email: query.email,
        _id: query?.id,
        phone: query?.phone,
        role: query?.role,
        status: query?.status
    }

    if (query.search?.trim()) {
        const regex = { $regex: new RegExp(query.search), $options: 'i' };
        filter.$or = [
            {
                firstName: regex
            },
            {
                lastName: regex
            },
            {
                email: regex
            }
        ]
    }

    const page = Math.max(pg || 1, 1);
    const limit = Math.min(Math.max(lm || 20, 1), 100);
    const sortField = sortBy || 'createdAt';
    const sortOrder = so !== 'desc' ? 1 : -1;
    const offset = (page - 1) * limit;

    const options: QueryOptions<User> = {
        limit,
        skip: offset,
        sort: { [sortField]: sortOrder }
    }

    Object.keys(filter).map(f => {
        if (filter[f] === undefined) {
            delete filter[f]
        }
    })

    return {
        filter,
        options,
        page,
        limit
    }

}