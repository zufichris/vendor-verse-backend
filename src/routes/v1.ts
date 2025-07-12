import express from "express";
import { intitUserModule } from "../modules/user";
import { initProductModule } from "../modules/product";

const router = express.Router();

router.use("/users", intitUserModule());
router.use("/products", initProductModule());
export const routesv1 = router;
