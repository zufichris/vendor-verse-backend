import moment from "moment";
import { AppError } from "../../core/middleware";
import { NewsletterService } from "../newsletter/newsletter.service";
import { ProductService } from "../product";
import { UserService } from "../user";
import { type OrderAnalyticsResponseDto, QueryOrderDtoSchema } from "./order.dtos";
import { OrderRepository } from "./order.repository";
import { setupOrdersQuery } from "./order.util";
import { PaymentService } from "./payment.service";

export class OrderAdminService {
    constructor(
        protected readonly orderRepo: OrderRepository,
        protected readonly userService: UserService,
        protected readonly productService: ProductService,
        protected readonly paymentService: PaymentService,
        protected readonly newsletterService: NewsletterService
    ) { }

    queryOrders(query: Record<string, unknown>) {
        const { success, data: queryData, error } = QueryOrderDtoSchema.safeParse(query)

        if (!success) {
            throw AppError.badRequest('Invalid query', error.format())
        }

        const page = Math.max(queryData.page || 1, 1);
        const limit = Math.min(Math.max(queryData.limit || 20, 1), 100);

        const { filter, options } = setupOrdersQuery(queryData);

        return this.orderRepo.paginate({
            filter: filter,
            options,
            limit,
            page
        })
    }

    async getAnalytics(): Promise<OrderAnalyticsResponseDto> {
        const now = moment()

        const thisMonthStart = now.startOf('month')

        const thisWeekStart = now.startOf('week')


        const [analytics] = await this.orderRepo.aggregate([
            { $match: { isDeleted: false } },
            {
                $facet: {
                    totalOrder: [
                        { $count: "total" }
                    ],
                    todayOrders: [
                        { $match: { createdAt: { $gte: now.startOf('day').toDate().toISOString() } } },
                        { $count: "today" }
                    ],
                    totalRev: [
                        { $group: { _id: null, total: { $sum: "$grandTotal" } } }
                    ],
                    weeklyRevenue: [
                        { $match: { createdAt: { $gte: thisWeekStart.toDate().toISOString() } } },
                        { $group: { _id: null, thisWeek: { $sum: "$grandTotal" } } }
                    ],
                    pendingOrder: [
                        {
                            $match: {
                                fulfillmentStatus: {
                                    $in: ['pending', 'processing', 'shipped']
                                }
                            }
                        },
                        { $count: "processing" }
                    ],
                    avgOrderThisMonth: [
                        { $match: { createdAt: { $gte: thisMonthStart.toDate() } } },
                        { $group: { _id: null, thisMonth: { $avg: "$grandTotal" } } }
                    ],
                    avgOrderThreeMonths: [
                        { $match: { createdAt: { $gte: thisMonthStart.subtract(3, 'months').toDate() } } },
                        { $group: { _id: null, pastThreeMonths: { $avg: "$grandTotal" } } }
                    ]
                }
            },
            {
                $project: {
                    totalOrders: {
                        total: { $arrayElemAt: ["$totalOrder.total", 0] },
                        today: { $arrayElemAt: ["$todayOrders.today", 0] },
                    },
                    totalRevenue: {
                        total: { $arrayElemAt: ["$totalRev.total", 0] },
                        thisWeek: { $arrayElemAt: ["$weeklyRevenue.thisWeek", 0] },
                    },
                    averageOrder: {
                        pastThreeMonths: { $arrayElemAt: ["$avgOrderThreeMonths.pastThreeMonths", 0] },
                        thisMonth: { $arrayElemAt: ["$avgOrderThisMonth.thisMonth", 0] },
                    },
                    pendingOrders: {
                        total: { $arrayElemAt: ["$pendingOrder.processing", 0] },
                    }
                }
            }
        ], { allowDiskUse: true });

        return analytics;
    }
}