// api/src/core/utils/response.ts
import { Response } from 'express';

export const successResponse = (
  res: Response,
  statusCode: number = 200,
  message: string,
  data: any = null
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number = 500,
  message: string,
  error: any = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
};
