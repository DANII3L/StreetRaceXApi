import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    statusCode: statusCode,
    error: err.message || 'Internal Server Error',
    path: req.url
  });
};