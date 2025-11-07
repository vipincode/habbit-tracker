export class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  static BadRequest(msg: string) {
    return new CustomError(msg, 400);
  }

  static Unauthorized(msg = "Unauthorized") {
    return new CustomError(msg, 401);
  }

  static Forbidden(msg = "Forbidden") {
    return new CustomError(msg, 403);
  }

  static NotFound(msg = "Not Found") {
    return new CustomError(msg, 404);
  }

  static Internal(msg = "Internal Server Error") {
    return new CustomError(msg, 500);
  }
}
