import { Request, Response } from "express";
import { FilesManagerService } from "./files.service";

export class FilesManagerController {
    constructor(
        private readonly service: FilesManagerService
    ) { }

    public async uploadImage(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files;

            if (!files) {
                res.status(400).json({ message: "No files were uploaded." });
                return;
            }

            const imageUrls = await this.service.uploadImage(files);

            res.json({
                success: true,
                status: 201,
                message: "Images uploaded successfully",
                data: imageUrls
            });
        } catch (err: any) {
            if (err.status && typeof err.status == 'number') {
                res.status(err.status).json(err)
                return
            }

            res.status(500).json({
                message: "Internal server error",
                status: 500,
                data: null,
                error: err.message
            })
        }
    }
}