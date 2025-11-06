import { FileArray } from "express-fileupload";
import { ImgbbProvider } from "./providers/imgbb.provider";

export class FilesManagerService {
    constructor(
        private readonly imgbbService: ImgbbProvider
    ) { }

    uploadImage = async (files: FileArray): Promise<string[]> => {
        return this.imgbbService.uploadImage(files);
    }
}