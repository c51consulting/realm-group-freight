/**
 * Request/response utilities for the REALM Ag Marketplace Express API.
 * Provides consistent response formatting, pagination, query parsing, and rate-limit headers.
 */

import type { Request, Response } from 'express';

// ─── Response Formatting ─────────────────────────────────────────────────────

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  fields?: Record<string, string>;
}

export interface PaginatedResponse<T = unknown> extends SuccessResponse<T[]> {
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Send a standardised success response.
 *
 * @example
 * sendSuccess(res, listing, 201);
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): void {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
}

/**
 * Send a standardised error response.
 *
 * @example
 * sendError(res, 'Listing not found', 404);
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  options?: { code?: string; fields?: Record<string, string> }
): void {
  const body: ErrorResponse = { success: false, error: message };
  if (options?.code) body.code = options.code;
  if (options?.fields) body.fields = options.fields;
  res.status(statusCode).json(body);
}

/**
 * Send a paginated list response.
 *
 * @example
 * sendPaginated(res, listings, { page: 1, limit: 20, total: 150 });
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  meta?: Record<string, unknown>
): void {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
  if (meta) body.meta = meta;
  res.status(200).json(body);
}

// ─── Pagination Helpers ───────────────────────────────────────────────────────

export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Parse and clamp pagination query parameters from an Express request.
 *
 * @param req - Express request object
 * @param maxLimit - Maximum allowed page size (default: 50)
 * @returns Parsed page, limit, and calculated offset
 */
export function parsePagination(req: Request, maxLimit = 50): ParsedPagination {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20)
  );
  return { page, limit, offset: (page - 1) * limit };
}

// ─── Query Parameter Parsing ──────────────────────────────────────────────────

/**
 * Safely parse a query parameter as a string.
 * Returns undefined if the param is absent or not a plain string.
 */
export function queryString(req: Request, key: string): string | undefined {
  const val = req.query[key];
  return typeof val === 'string' && val.trim() !== '' ? val.trim() : undefined;
}

/**
 * Safely parse a query parameter as a number.
 * Returns undefined if the param is absent or not a valid number.
 */
export function queryNumber(req: Request, key: string): number | undefined {
  const val = req.query[key];
  if (typeof val !== 'string') return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

/**
 * Safely parse a query parameter as a boolean.
 * Accepts 'true'/'1' as true, 'false'/'0' as false.
 */
export function queryBool(req: Request, key: string): boolean | undefined {
  const val = req.query[key];
  if (typeof val !== 'string') return undefined;
  if (val === 'true' || val === '1') return true;
  if (val === 'false' || val === '0') return false;
  return undefined;
}

/**
 * Parse a comma-separated query parameter into an array of strings.
 *
 * @example
 * // ?materialType=hay,grain,straw
 * queryArray(req, 'materialType') // ['hay', 'grain', 'straw']
 */
export function queryArray(req: Request, key: string): string[] | undefined {
  const val = req.query[key];
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(val)) {
    return (val as string[]).map((s) => String(s).trim()).filter(Boolean);
  }
  return undefined;
}

// ─── Rate Limiting Headers ────────────────────────────────────────────────────

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Attach standard rate-limit headers to a response.
 * Compatible with the RateLimit header spec (draft-ietf-httpapi-ratelimit-headers).
 */
export function setRateLimitHeaders(res: Response, info: RateLimitInfo): void {
  res.setHeader('X-RateLimit-Limit', info.limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, info.remaining));
  res.setHeader('X-RateLimit-Reset', Math.floor(info.resetAt.getTime() / 1000));
  res.setHeader('Retry-After', Math.ceil((info.resetAt.getTime() - Date.now()) / 1000));
}

// ─── Async Route Wrapper ──────────────────────────────────────────────────────

import type { NextFunction } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps an async Express route handler and forwards any thrown errors to next().
 * Eliminates the need for try/catch in every route.
 *
 * @example
 * router.get('/listings', asyncHandler(async (req, res) => {
 *   const listings = await Listing.findAll();
 *   sendSuccess(res, listings);
 * }));
 */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ─── Request ID ───────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';

/**
 * Express middleware that attaches a unique request ID to each request and response.
 * Useful for correlating logs across services.
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers['x-request-id'] as string) || randomUUID();
    (req as Request & { id: string }).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}
