import express from "express";
import { intitUserModule } from "../modules/user";
import { initProductModule } from "../modules/product";
import { initOrderModule } from "../modules/order/";

const router = express.Router();

router.use("/users", intitUserModule());
router.use("/products", initProductModule());
router.use("/orders", initOrderModule());

export const routesv1 = router;
