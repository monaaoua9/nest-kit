"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.toErrorBody = toErrorBody;
class AppError extends Error {
    code;
    status;
    constructor(code, status = 400, message) {
        super(message ?? code);
        this.code = code;
        this.status = status;
    }
    static notFound(code = 'NOT_FOUND') {
        return new AppError(code, 404);
    }
    static unauthorized(code = 'UNAUTHORIZED') {
        return new AppError(code, 401);
    }
    static forbidden(code = 'FORBIDDEN') {
        return new AppError(code, 403);
    }
    static conflict(code = 'CONFLICT') {
        return new AppError(code, 409);
    }
}
exports.AppError = AppError;
function toErrorBody(e) {
    return { error: { code: e.code, message: e.message } };
}
