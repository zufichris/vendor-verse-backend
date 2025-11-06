// src/modules/files-manager/providers/imgbb.provider.ts
import { FileArray, UploadedFile } from 'express-fileupload';
import { env } from '../../../config';
import { HttpClient } from '../../../core/utils/httpclient.util';
import FormData from 'form-data';

export class ImgbbProvider {
    private readonly apiKey: string;

    constructor(private readonly httpClient: HttpClient) {
        this.apiKey = env.imgbb.apiKey || '';
        httpClient.init({
            baseURL: env.imgbb.baseUrl,
        });
    }

    public async uploadImage(files: FileArray): Promise<string[]> {
        const uploadPromises: Array<Promise<string>> = [];

        for (const field of Object.keys(files)) {
            const value = files[field];
            const fileList = Array.isArray(value) ? value : [value as UploadedFile];

            for (const f of fileList) {
                uploadPromises.push(this.uploadSingleFile(f as UploadedFile));
            }
        }

        return Promise.all(uploadPromises);
    }

    private async uploadSingleFile(file: UploadedFile): Promise<string> {
        const form = new FormData();
        form.append('image', file.data, {
            filename: file.name,
            contentType: file.mimetype,
        } as any);

        const headers = form.getHeaders();

        const res = await this.httpClient.post<{ data: { url: string; display_url: string } }>(
            `/1/upload?key=${this.apiKey}`,
            form as any,
            {
                headers: {
                    ...headers,
                },
            }
        );

        return res.data.data.display_url;
    }
}