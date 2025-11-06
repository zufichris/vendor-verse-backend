import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
type Config = {
    baseURL: string;
    defaultHeaders?: Record<string, string>;
};

export type HttpClientError = {
    status: number;
    message: string;
    data?: any;
}

type HttpClientResponse<T> = {
    status: number;
    message: string;
    data: T;
}

type HttpClientRequestConfig = AxiosRequestConfig & {}

export class HttpClient {
    private axiosInstance: AxiosInstance;

    constructor(config?: Config) {

        this.axiosInstance = axios.create({
            baseURL: config?.baseURL,
            headers: {
                // 'Content-Type': 'application/json',
                ...(config?.defaultHeaders || {}),
            },
        });
    }

    init(config: Config) {
        this.axiosInstance = axios.create({
            baseURL: config.baseURL,
            headers: {
                // 'Content-Type': 'application/json',
                ...(config?.defaultHeaders || {}),
            },
        });
    }

    private handleError(error: AxiosError): HttpClientError {

        const { response } = error;
        const status = response?.status || 500;
        const message = response?.statusText || 'Internal Server Error';
        const data = response?.data || {};

        return { status, message, data };
    }

    private handleResponse<T>(response: AxiosResponse<T>): HttpClientResponse<T> {
        return {
            status: response.status,
            message: response.statusText,
            data: response.data,
        };
    }

    async get<T>(url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>> {
        try {
            const response = await this.axiosInstance.get<T>(url, config);
            return this.handleResponse<T>(response);
        } catch (error) {
            throw this.handleError(error as AxiosError);
        }
    }

    async post<T>(url: string, data?: any, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>> {
        try {
            const response = await this.axiosInstance.post<T>(url, data, config);
            return this.handleResponse<T>(response);
        } catch (error) {
            throw this.handleError(error as AxiosError);
        }
    }

    async put<T>(url: string, data?: any, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>> {
        try {
            const response = await this.axiosInstance.put<T>(url, data, config);
            return this.handleResponse<T>(response);
        } catch (error) {
            throw this.handleError(error as AxiosError);
        }
    }

    async delete<T>(url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>> {
        try {
            const response = await this.axiosInstance.delete<T>(url, config);
            return this.handleResponse<T>(response);
        } catch (error) {
            throw this.handleError(error as AxiosError);
        }
    }

    async patch<T>(url: string, data?: any, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>> {
        try {
            const response = await this.axiosInstance.patch<T>(url, data, config);
            return this.handleResponse<T>(response);
        } catch (error) {
            throw this.handleError(error as AxiosError);
        }
    }
}