export declare class AppError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, status?: number, message?: string);
    static notFound(code?: string): AppError;
    static unauthorized(code?: string): AppError;
    static forbidden(code?: string): AppError;
    static conflict(code?: string): AppError;
}
export interface ErrorBody {
    error: {
        code: string;
        message: string;
    };
}
export declare function toErrorBody(e: AppError): ErrorBody;
