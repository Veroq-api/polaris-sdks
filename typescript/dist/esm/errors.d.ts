export declare class PolarisError extends Error {
    statusCode: number | undefined;
    responseBody: unknown;
    constructor(message: string, statusCode?: number, responseBody?: unknown);
}
export declare class AuthenticationError extends PolarisError {
    constructor(message: string, responseBody?: unknown);
}
export declare class NotFoundError extends PolarisError {
    constructor(message: string, responseBody?: unknown);
}
export declare class RateLimitError extends PolarisError {
    retryAfter: number | string | null;
    constructor(message: string, responseBody?: unknown, retryAfter?: number | string | null);
}
export declare class APIError extends PolarisError {
    constructor(message: string, statusCode: number, responseBody?: unknown);
}
//# sourceMappingURL=errors.d.ts.map