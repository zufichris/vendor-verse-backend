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
  async getUserWithPassword(
    by: "id" | "email",
    value: string,
  ): Promise<User | null> {
    let result: any;

    if (by === "email") {
      result = await this.model.findOne({
        email: value,
      });
    } else {
      result = await this.model.findById(value);
    }
    if (!result) {
      return null;
    }

    return result.toObject();
  }
}
