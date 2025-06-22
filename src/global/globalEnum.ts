export enum HttpStatus {
  // Success responses
  SUCCESS = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // Client error responses
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  VALIDATION_ERROR = 422,

  // Server error responses
  SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  DATABASE_ERROR = 500,
}

export enum HttpMessage {
  // Success messages
  SUCCESS = 'Request processed successfully',
  CREATED = 'Resource created successfully',
  UPDATED = 'Resource updated successfully',
  DELETED = 'Resource deleted successfully',

  // Authentication/Authorization messages
  UNAUTHORIZED = 'Authentication required',
  INVALID_CREDENTIALS = 'Invalid email or password',
  TOKEN_EXPIRED = 'Token has expired',
  REFRESH_TOKEN_INVALID = 'Invalid refresh token',
  ACCESS_DENIED = 'You do not have permission to access this resource',

  // Validation messages
  VALIDATION_ERROR = 'Validation error occurred',
  MISSING_REQUIRED_FIELDS = 'Required fields are missing',
  INVALID_INPUT_FORMAT = 'Input format is invalid',

  // Resource messages
  NOT_FOUND = 'Resource not found',
  ALREADY_EXISTS = 'Resource already exists',

  // Server errors
  SERVER_ERROR = 'Internal server error',
  DATABASE_ERROR = 'Database operation failed',
  SERVICE_UNAVAILABLE = 'Service temporarily unavailable',
}

// Domain-specific error types for the dormitory application
export enum DormitoryErrorType {
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',

  // Room errors
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_ALREADY_OCCUPIED = 'ROOM_ALREADY_OCCUPIED',
  ROOM_CAPACITY_EXCEEDED = 'ROOM_CAPACITY_EXCEEDED',

  // Booking errors
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  BOOKING_ALREADY_CONFIRMED = 'BOOKING_ALREADY_CONFIRMED',
  BOOKING_ALREADY_CANCELLED = 'BOOKING_ALREADY_CANCELLED',

  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED',

  // General errors
  INVALID_OPERATION = 'INVALID_OPERATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}
