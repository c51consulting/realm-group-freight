/**
 * Form validation helpers, error formatting, file upload utilities,
 * and debounced search for the REALM Ag Marketplace frontend.
 */

'use client';

import { useCallback, useRef, useState } from 'react';

// ─── Validation Rules ─────────────────────────────────────────────────────────

export type ValidationRule<T = string> = (value: T) => string | undefined;

/** Compose multiple validation rules — returns the first error found. */
export function compose<T>(...rules: ValidationRule<T>[]): ValidationRule<T> {
  return (value: T) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return undefined;
  };
}

// ── String rules ──────────────────────────────────────────────────────────────

/** Field must not be empty. */
export const required: ValidationRule<string> = (v) =>
  !v || v.trim() === '' ? 'This field is required.' : undefined;

/** Minimum string length. */
export const minLength =
  (min: number): ValidationRule<string> =>
  (v) =>
    v && v.length < min ? `Must be at least ${min} characters.` : undefined;

/** Maximum string length. */
export const maxLength =
  (max: number): ValidationRule<string> =>
  (v) =>
    v && v.length > max ? `Must be no more than ${max} characters.` : undefined;

/** Valid email address. */
export const email: ValidationRule<string> = (v) =>
  v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address.' : undefined;

/** Australian Business Number (11 digits, optionally spaced). */
export const abn: ValidationRule<string> = (v) => {
  if (!v) return undefined;
  const digits = v.replace(/\s/g, '');
  if (!/^\d{11}$/.test(digits)) return 'ABN must be 11 digits.';
  // ABN checksum validation
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const d = digits.split('').map(Number);
  d[0] -= 1;
  const sum = weights.reduce((acc, w, i) => acc + w * d[i], 0);
  return sum % 89 !== 0 ? 'Enter a valid ABN.' : undefined;
};

/** Australian mobile number. */
export const phone: ValidationRule<string> = (v) =>
  v && !/^(\+?61|0)[2-9]\d{8}$/.test(v.replace(/\s/g, ''))
    ? 'Enter a valid Australian phone number.'
    : undefined;

/** URL format. */
export const url: ValidationRule<string> = (v) => {
  if (!v) return undefined;
  try {
    new URL(v);
    return undefined;
  } catch {
    return 'Enter a valid URL.';
  }
};

// ── Number rules ──────────────────────────────────────────────────────────────

/** Minimum numeric value. */
export const min =
  (minimum: number): ValidationRule<number> =>
  (v) =>
    v !== undefined && v < minimum ? `Must be at least ${minimum}.` : undefined;

/** Maximum numeric value. */
export const max =
  (maximum: number): ValidationRule<number> =>
  (v) =>
    v !== undefined && v > maximum ? `Must be no more than ${maximum}.` : undefined;

/** Value must be a positive number. */
export const positive: ValidationRule<number> = (v) =>
  v !== undefined && v <= 0 ? 'Must be a positive number.' : undefined;

/** Value must be a non-negative number. */
export const nonNegative: ValidationRule<number> = (v) =>
  v !== undefined && v < 0 ? 'Must be 0 or greater.' : undefined;

// ── Password rules ────────────────────────────────────────────────────────────

/** Password strength: at least 8 chars, one uppercase, one number. */
export const passwordStrength: ValidationRule<string> = (v) => {
  if (!v) return undefined;
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Password must contain at least one uppercase letter.';
  if (!/\d/.test(v)) return 'Password must contain at least one number.';
  return undefined;
};

/** Confirm password matches. */
export const passwordMatch =
  (original: string): ValidationRule<string> =>
  (v) =>
    v !== original ? 'Passwords do not match.' : undefined;

// ─── Error Message Formatting ─────────────────────────────────────────────────

export type FieldErrors = Record<string, string | undefined>;

/**
 * Format API field errors (from ApiError.fields) into a FieldErrors map.
 * Merges with any existing client-side errors.
 */
export function mergeApiErrors(
  clientErrors: FieldErrors,
  apiFields?: Record<string, string>
): FieldErrors {
  return { ...clientErrors, ...apiFields };
}

/**
 * Returns the first error message from a FieldErrors map, or undefined.
 * Useful for displaying a single top-level error banner.
 */
export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors).find(Boolean);
}

/**
 * Returns true if the FieldErrors map contains no errors.
 */
export function isValid(errors: FieldErrors): boolean {
  return Object.values(errors).every((e) => !e);
}

// ─── File Upload Helpers ──────────────────────────────────────────────────────

export interface FileValidationOptions {
  /** Allowed MIME types (e.g. ['image/jpeg', 'image/png']). */
  accept?: string[];
  /** Maximum file size in bytes. */
  maxSize?: number;
}

/**
 * Validate a File object against size and type constraints.
 * Returns an error message string, or undefined if valid.
 */
export function validateFile(file: File, options: FileValidationOptions = {}): string | undefined {
  const { accept, maxSize } = options;

  if (accept && accept.length > 0 && !accept.includes(file.type)) {
    const types = accept.map((t) => t.split('/')[1].toUpperCase()).join(', ');
    return `File type not supported. Accepted: ${types}.`;
  }

  if (maxSize && file.size > maxSize) {
    const mb = (maxSize / 1024 / 1024).toFixed(0);
    return `File is too large. Maximum size is ${mb} MB.`;
  }

  return undefined;
}

/** Accepted image types for listing photos and proof-of-delivery. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/** Accepted document types for lab certificates. */
export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/** Maximum photo upload size: 10 MB. */
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

/** Maximum document upload size: 20 MB. */
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

/**
 * Convert a File to a base64 data URL for preview.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Build a FormData object for a multipart file upload.
 * Merges additional string fields alongside the file.
 */
export function buildFormData(
  file: File,
  fieldName: string,
  extras?: Record<string, string>
): FormData {
  const fd = new FormData();
  fd.append(fieldName, file);
  if (extras) {
    for (const [key, val] of Object.entries(extras)) {
      fd.append(key, val);
    }
  }
  return fd;
}

/**
 * Upload a file to the API using multipart/form-data.
 * Returns the parsed JSON response.
 */
export async function uploadFile<T = unknown>(
  url: string,
  formData: FormData,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? `Upload failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── Debounced Search Hook ────────────────────────────────────────────────────

/**
 * React hook that returns a debounced version of a callback.
 * Useful for search inputs that trigger API calls.
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds (default: 400)
 *
 * @example
 * const search = useDebounce((query: string) => {
 *   listingsApi.list({ search: query });
 * }, 400);
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay = 400
): (...args: Parameters<T>) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

/**
 * React hook for a debounced search input value.
 * Returns [value, debouncedValue, setValue].
 *
 * @example
 * const [query, debouncedQuery, setQuery] = useDebouncedSearch(400);
 * // Use `query` for the input value, `debouncedQuery` for API calls.
 */
export function useDebouncedSearch(
  delay = 400
): [string, string, (value: string) => void] {
  const [value, setValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDebounced(newValue), delay);
    },
    [delay]
  );

  return [value, debounced, handleChange];
}

// ─── Form State Hook ──────────────────────────────────────────────────────────

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validate?: (values: T) => FieldErrors;
  onSubmit: (values: T) => Promise<void>;
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  values: T;
  errors: FieldErrors;
  isSubmitting: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
}

/**
 * Lightweight form state hook with validation and submission handling.
 *
 * @example
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validate: (v) => ({ email: required(v.email) }),
 *   onSubmit: async (v) => { await authApi.login(v.email, v.password); },
 * });
 */
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options;
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear field error on change
    setErrors((prev) => ({ ...prev, [field as string]: undefined }));
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Run validation
      if (validate) {
        const validationErrors = validate(values);
        if (!isValid(validationErrors)) {
          setErrors(validationErrors);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
        setIsDirty(false);
      } catch (err: unknown) {
        // Surface API field errors
        if (err && typeof err === 'object' && 'fields' in err) {
          setErrors((prev) => mergeApiErrors(prev, (err as { fields: Record<string, string> }).fields));
        } else if (err instanceof Error) {
          setErrors((prev) => ({ ...prev, _form: err.message }));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  return { values, errors, isSubmitting, isDirty, setValue, setError, clearError, handleSubmit, reset };
}
