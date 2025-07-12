import { BaseRepository } from "../../core/repository";
import { User } from "./user.types";
import { UserModel } from "./user.models";

export class UserRepository extends BaseRepository<User> {
    constructor(protected readonly model: typeof UserModel) {
        super(model);
    }
    findByEmail(email: string): Promise<User | null> {
        return this.findOne({ email });
    }
}
