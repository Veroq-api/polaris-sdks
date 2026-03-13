export class PolarisError extends Error {
  statusCode: number | undefined;
  responseBody: unknown;

  constructor(message: string, statusCode?: number, responseBody?: unknown) {
    super(message);
    this.name = "PolarisError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class AuthenticationError extends PolarisError {
  constructor(message: string, responseBody?: unknown) {
    super(message, 401, responseBody);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends PolarisError {
  constructor(message: string, responseBody?: unknown) {
    super(message, 404, responseBody);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends PolarisError {
  retryAfter: number | string | null;

  constructor(message: string, responseBody?: unknown, retryAfter?: number | string | null) {
    super(message, 429, responseBody);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter ?? null;
  }
}

export class APIError extends PolarisError {
  constructor(message: string, statusCode: number, responseBody?: unknown) {
    super(message, statusCode, responseBody);
    this.name = "APIError";
  }
}
