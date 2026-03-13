"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIError = exports.RateLimitError = exports.NotFoundError = exports.AuthenticationError = exports.PolarisError = void 0;
class PolarisError extends Error {
    constructor(message, statusCode, responseBody) {
        super(message);
        this.name = "PolarisError";
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}
exports.PolarisError = PolarisError;
class AuthenticationError extends PolarisError {
    constructor(message, responseBody) {
        super(message, 401, responseBody);
        this.name = "AuthenticationError";
    }
}
exports.AuthenticationError = AuthenticationError;
class NotFoundError extends PolarisError {
    constructor(message, responseBody) {
        super(message, 404, responseBody);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class RateLimitError extends PolarisError {
    constructor(message, responseBody, retryAfter) {
        super(message, 429, responseBody);
        this.name = "RateLimitError";
        this.retryAfter = retryAfter ?? null;
    }
}
exports.RateLimitError = RateLimitError;
class APIError extends PolarisError {
    constructor(message, statusCode, responseBody) {
        super(message, statusCode, responseBody);
        this.name = "APIError";
    }
}
exports.APIError = APIError;
//# sourceMappingURL=errors.js.map