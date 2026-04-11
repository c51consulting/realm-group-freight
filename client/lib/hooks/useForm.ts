'use client';

/**
 * useForm — generic form state management hook.
 *
 * @example
 * const { values, errors, handleChange, handleSubmit, setFieldError } = useForm({
 *   initialValues: { email: '', password: '' },
 *   onSubmit: async (values) => { ... },
 *   validate: (values) => { ... },
 * });
 */

import { useCallback, useState } from 'react';
import type { ValidationErrors } from '../client-utils';

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => ValidationErrors;
}

interface UseFormReturn<T extends Record<string, unknown>> {
  values: T;
  errors: ValidationErrors;
  submitting: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFieldError: (field: string, message: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  const { initialValues, onSubmit, validate } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setValues((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      // Clear field error on change
      setErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [],
  );

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }
      setErrors({});
      setSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setErrors({ _form: message });
      } finally {
        setSubmitting(false);
      }
    },
    [values, validate, onSubmit],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitting(false);
  }, [initialValues]);

  return { values, errors, submitting, handleChange, setFieldValue, setFieldError, handleSubmit, reset };
}
