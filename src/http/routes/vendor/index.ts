import express from "express"
import { authMiddleware } from "../../middleware/auth"
import { Role } from "../../../data/enum/user"
import { vendorControllers } from "../../controller/vendor"
const router = express.Router()

router.use(authMiddleware.requireAuth, authMiddleware.requirePermission("vendor", "manage"))

router.route("/")
    .get(vendorControllers.queryVendors)
    .post(vendorControllers.createVendor)

router.route('/:vendId')
    .get(vendorControllers.getVendor)
    .patch(vendorControllers.updateVendor)
    .delete(vendorControllers.deleteVendor)

router.route("/:vendId/verify")
    .patch(vendorControllers.verifyVendor)

export default router