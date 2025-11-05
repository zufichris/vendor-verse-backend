import express from "express";
import { intitUserModule } from "../modules/user";
import { initProductModule } from "../modules/product";
import { initOrderModule } from "../modules/order/";
import { initNewsletterModule } from "../modules/newsletter";
import { initBlogModule } from "../modules/blogs";
import fileUpload from "express-fileupload";
import { initFilesManagerModule } from "../modules/files-manager";

const router = express.Router();

router.use(
    fileUpload({
        limits: {
            fileSize: 30 * 1024 * 1024, // 30MB
        }
    })
);

router.use("/users", intitUserModule());
router.use("/products", initProductModule());
router.use("/orders", initOrderModule());
router.use("/newsletters", initNewsletterModule());
router.use("/blogs", initBlogModule());
router.use("/files-manager", initFilesManagerModule())

export const routesv1 = router;
