import { TUser } from "../../data/entities/user";
import { Role } from "../data/enums/user";
import { ID } from "../entities";

declare module 'express-serve-static-core' {
    interface Request {
        user?: Partial<TUser>
    }
}