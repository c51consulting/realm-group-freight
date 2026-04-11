/**
 * Custom error classes and error handling utilities for REALM Ag Marketplace.
 */

// ─── Custom Error Classes ────────────────────────────────────────────────────

/** Base application error with HTTP status code support. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 – Request body or query params failed validation. */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400);
    this.fields = fields;
  }
}

/** 401 – Missing or invalid authentication credentials. */
export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

/** 403 – Authenticated but not authorised for this resource. */
export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

/** 404 – Requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/** 409 – Conflict with current state (e.g. duplicate email). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/** 422 – Request understood but business logic rejected it. */
export class UnprocessableError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

/** 429 – Too many requests. */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429);
  }
}

// ─── Type Guards ─────────────────────────────────────────────────────────────

/** Returns true if the error is a known operational AppError. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

// ─── User-Friendly Message Map ───────────────────────────────────────────────

const FRIENDLY_MESSAGES: Record<number, string> = {
  400: 'The request contained invalid data. Please check your input and try again.',
  401: 'You need to be logged in to do that.',
  403: 'You don\'t have permission to perform this action.',
  404: 'We couldn\'t find what you were looking for.',
  409: 'This action conflicts with existing data.',
  422: 'The request could not be processed.',
  429: 'You\'re doing that too fast. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again shortly.',
};

/**
 * Returns a user-friendly error message for a given HTTP status code.
 * Falls back to the original message if no friendly version exists.
 */
export function getFriendlyMessage(statusCode: number, fallback?: string): string {
  return FRIENDLY_MESSAGES[statusCode] ?? fallback ?? FRIENDLY_MESSAGES[500];
}

// ─── Logging Utilities ───────────────────────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Structured logger that writes JSON to stdout/stderr.
 * In development, falls back to readable console output.
 */
export const logger = {
  _write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${entry.timestamp}] ${level.toUpperCase()}:`;
      if (level === 'error') {
        console.error(prefix, message, meta ?? '');
      } else {
        console.log(prefix, message, meta ?? '');
      }
    } else {
      const out = level === 'error' ? process.stderr : process.stdout;
      out.write(JSON.stringify(entry) + '\n');
    }
  },

  info(message: string, meta?: Record<string, unknown>) {
    this._write('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    this._write('warn', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    this._write('error', message, meta);
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      this._write('debug', message, meta);
    }
  },
};

// ─── React Error Boundary ────────────────────────────────────────────────────

'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * React error boundary that catches rendering errors and displays a fallback UI.
 * Wrap page sections or the entire app layout with this component.
 *
 * @example
 * <ErrorBoundary fallback={(err, reset) => <p>{err.message} <button onClick={reset}>Retry</button></p>}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('React render error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-semibold text-red-700">Something went wrong</p>
          <p className="text-sm text-red-600">{getFriendlyMessage(500)}</p>
          <button
            onClick={this.reset}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
