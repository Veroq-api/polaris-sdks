class PolarisError(Exception):
    """Base exception for all Polaris API errors."""

    def __init__(self, message, status_code=None, response_body=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_body = response_body


class AuthenticationError(PolarisError):
    """Raised when the API returns a 401 Unauthorized response."""
    pass


class NotFoundError(PolarisError):
    """Raised when the API returns a 404 Not Found response."""
    pass


class RateLimitError(PolarisError):
    """Raised when the API returns a 429 Too Many Requests response."""

    def __init__(self, message, status_code=429, response_body=None, retry_after=None):
        super().__init__(message, status_code, response_body)
        self.retry_after = retry_after


class APIError(PolarisError):
    """Raised for all other API errors (status >= 400)."""
    pass
