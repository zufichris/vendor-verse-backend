import { BaseRepository } from "../../core/repository";
import { CouponModel } from "./coupon.models";
import { Coupon } from "./coupon.types";

export class CouponRepository extends BaseRepository<Coupon> {
    constructor(protected readonly model: typeof CouponModel) {
        super(model);
    }

    async findByCode(code: string) {
        return this.findOne({ code });
    }


}
