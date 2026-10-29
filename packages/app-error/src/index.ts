export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
    message?: string,
  ) {
    super(message ?? code);
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

export interface ErrorBody {
  error: { code: string; message: string };
}

export function toErrorBody(e: AppError): ErrorBody {
  return { error: { code: e.code, message: e.message } };
}
