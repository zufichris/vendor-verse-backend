import { DateQueryDto, NumberQueryDto } from "../dtos";

export function getDateFilterQuery(query?: DateQueryDto | null) {
    if (!query) {
        return null
    }

    const filter: Record<'$lte' | '$gte' | string, Date> = {}

    if (query.max) {
        filter.$lte = new Date(query.max)
    }

    if (query.min) {
        filter.gte = new Date(query.min)
    }

    if (Object.keys(filter).length > 0) {
        return null;
    }

    return filter;
}

export function getNumberFilterQuery(query?: NumberQueryDto | null) {
    if (!query) {
        return null;
    }

    const filter: Record<'$lte' | '$gte' | string, number> = {}

    if (query.max) {
        filter.$lte = query.max
    }

    if (query.min) {
        filter.gte = query.min
    }

    if (Object.keys(filter).length > 0) {
        return null;
    }

    return filter;
}