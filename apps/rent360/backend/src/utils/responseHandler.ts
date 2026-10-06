import { Response } from "express";

const extractErrorMessage = (error: any): string => {
  if (!error) return `Unknown error occurred`;
  if (typeof error === "string") return error;
  return (
    error.message ||
    error.error?.message ||
    error.errors?.[0]?.message ||
    error.sqlMessage ||
    error.details?.[0]?.message ||
    `Unknown error occurred`
  );
};

const formatError = (error: any): any => {
  if (!error) return null;
  return {
    message: extractErrorMessage(error),
    code: error.code || error.name || "UNKNOWN_ERROR",
    ...(error.errors && { details: error.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

const responseHandler = {
  success: (res: Response, message: string, data: any = null) => {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
    });
  },
  created: (res: Response, message: string, data: any) =>
    res
      .status(HTTP_STATUS.CREATED)
      .json({
        success: true,
        message: `${message}`,
        data,
        statusCode: HTTP_STATUS.CREATED,
      }),
  noContent: (res: Response) => res.status(HTTP_STATUS.NO_CONTENT).send(),
  error: (res: Response, message: string, statusCode: number = 400) => {
    return res.status(statusCode).json({
      success: false,
      message: message || "Something went wrong",
    });
  },
  badRequest: (res: Response, error: any) => {
    const formattedError = formatError(error);
    formattedError.code =
      formattedError.code === "UNKNOWN_ERROR"
        ? "BAD_REQUEST"
        : formattedError.code;
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `${formattedError.message}`,
      error: formattedError,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  },
  unauthorized: (res: Response, message: string = "Unauthorized access") =>
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: `${message}`,
      error: "UNAUTHORIZED",
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    }),
  forbidden: (res: Response, message: string = "Access forbidden") =>
    res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: `${message}`,
      error: "FORBIDDEN",
      statusCode: HTTP_STATUS.FORBIDDEN,
    }),
  notFound: (res: Response, message: string = "Resource not found") => {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message,
    });
  },
  conflict: (res: Response, message: string) =>
    res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `${message}`,
      error: "CONFLICT",
      statusCode: HTTP_STATUS.CONFLICT,
    }),
  validationError: (res: Response, error: any) => {
    const formattedError = formatError(error);
    formattedError.code = "VALIDATION_ERROR";
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: `${formattedError.message}`,
      error: formattedError,
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
  },
  tooManyRequests: (
    res: Response,
    message: string = "Too many requests",
    retryAfter: number = 60,
  ) => {
    res.set("Retry-After", retryAfter.toString());
    return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: `${message}`,
      error: "TOO_MANY_REQUESTS",
      retryAfter,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    });
  },
  internalServerError: (res: Response, error: any) => {
    console.error("Internal Server Error:", error);
    const body: any = {
      success: false,
      message: "Something went wrong. Please try again.",
      error: "INTERNAL_SERVER_ERROR",
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
    if (process.env.NODE_ENV === "development") {
      body.detail = extractErrorMessage(error);
      body.stack = error?.stack;
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(body);
  },
  serviceUnavailable: (
    res: Response,
    message: string = "Service temporarily unavailable",
  ) =>
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      message: `${message}`,
      error: "SERVICE_UNAVAILABLE",
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    }),
};

export default responseHandler;
