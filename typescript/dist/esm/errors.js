export class PolarisError extends Error {
    constructor(message, statusCode, responseBody) {
        super(message);
        this.name = "PolarisError";
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}
export class AuthenticationError extends PolarisError {
    constructor(message, responseBody) {
        super(message, 401, responseBody);
        this.name = "AuthenticationError";
    }
}
export class NotFoundError extends PolarisError {
    constructor(message, responseBody) {
        super(message, 404, responseBody);
        this.name = "NotFoundError";
    }
}
export class RateLimitError extends PolarisError {
    constructor(message, responseBody, retryAfter) {
        super(message, 429, responseBody);
        this.name = "RateLimitError";
        this.retryAfter = retryAfter ?? null;
    }
}
export class APIError extends PolarisError {
    constructor(message, statusCode, responseBody) {
        super(message, statusCode, responseBody);
        this.name = "APIError";
    }
}
//# sourceMappingURL=errors.js.map