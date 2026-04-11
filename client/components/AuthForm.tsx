'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotification } from '@/lib/context/NotificationContext';
import { useForm } from '@/lib/hooks/useForm';
import { validateEmail, validatePassword, validateRequired, validateABN } from '@/lib/client-utils';
import type { ValidationErrors } from '@/lib/client-utils';
import ErrorMessage from './ErrorMessage';

interface AuthFormProps {
  mode: 'login' | 'register';
}

interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues {
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  abn: string;
  phone: string;
  role: string;
}

/**
 * AuthForm — handles both login and registration flows.
 */
export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const { notify } = useNotification();

  // ── Login ──────────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginValues>({
    initialValues: { email: '', password: '' },
    validate(v): ValidationErrors {
      const errs: ValidationErrors = {};
      const emailErr = validateEmail(v.email);
      if (emailErr) errs.email = emailErr;
      const pwErr = validatePassword(v.password);
      if (pwErr) errs.password = pwErr;
      return errs;
    },
    async onSubmit(v) {
      await login(v.email, v.password);
      notify('Welcome back!', 'success');
      router.push('/dashboard');
    },
  });

  // ── Register ───────────────────────────────────────────────────────────────
  const registerForm = useForm<RegisterValues>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      abn: '',
      phone: '',
      role: 'buyer',
    },
    validate(v): ValidationErrors {
      const errs: ValidationErrors = {};
      const emailErr = validateEmail(v.email);
      if (emailErr) errs.email = emailErr;
      const pwErr = validatePassword(v.password);
      if (pwErr) errs.password = pwErr;
      if (v.password !== v.confirmPassword) errs.confirmPassword = 'Passwords do not match';
      const nameErr = validateRequired(v.businessName, 'Business name');
      if (nameErr) errs.businessName = nameErr;
      const abnErr = validateABN(v.abn);
      if (abnErr) errs.abn = abnErr;
      return errs;
    },
    async onSubmit(v) {
      await register({
        email: v.email,
        password: v.password,
        businessName: v.businessName,
        abn: v.abn || undefined,
        phone: v.phone || undefined,
        role: v.role,
      });
      notify('Account created! Welcome to REALM.', 'success');
      router.push('/dashboard');
    },
  });

  if (mode === 'login') {
    return (
      <form onSubmit={loginForm.handleSubmit} noValidate className="space-y-4">
        <ErrorMessage message={loginForm.errors._form} />

        <div>
          <label htmlFor="login-email" className="label">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`input ${loginForm.errors.email ? 'input-error' : ''}`}
            value={loginForm.values.email}
            onChange={loginForm.handleChange}
            required
          />
          {loginForm.errors.email && <p className="field-error">{loginForm.errors.email}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="label">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className={`input ${loginForm.errors.password ? 'input-error' : ''}`}
            value={loginForm.values.password}
            onChange={loginForm.handleChange}
            required
          />
          {loginForm.errors.password && <p className="field-error">{loginForm.errors.password}</p>}
        </div>

        <button type="submit" disabled={loginForm.submitting} className="btn-primary w-full btn-lg">
          {loginForm.submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={registerForm.handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={registerForm.errors._form} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="reg-email" className="label">Email address *</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`input ${registerForm.errors.email ? 'input-error' : ''}`}
            value={registerForm.values.email}
            onChange={registerForm.handleChange}
            required
          />
          {registerForm.errors.email && <p className="field-error">{registerForm.errors.email}</p>}
        </div>

        <div>
          <label htmlFor="reg-business" className="label">Business / Trading Name *</label>
          <input
            id="reg-business"
            name="businessName"
            type="text"
            autoComplete="organization"
            className={`input ${registerForm.errors.businessName ? 'input-error' : ''}`}
            value={registerForm.values.businessName}
            onChange={registerForm.handleChange}
            required
          />
          {registerForm.errors.businessName && <p className="field-error">{registerForm.errors.businessName}</p>}
        </div>

        <div>
          <label htmlFor="reg-password" className="label">Password *</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className={`input ${registerForm.errors.password ? 'input-error' : ''}`}
            value={registerForm.values.password}
            onChange={registerForm.handleChange}
            required
          />
          {registerForm.errors.password && <p className="field-error">{registerForm.errors.password}</p>}
        </div>

        <div>
          <label htmlFor="reg-confirm" className="label">Confirm Password *</label>
          <input
            id="reg-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={`input ${registerForm.errors.confirmPassword ? 'input-error' : ''}`}
            value={registerForm.values.confirmPassword}
            onChange={registerForm.handleChange}
            required
          />
          {registerForm.errors.confirmPassword && <p className="field-error">{registerForm.errors.confirmPassword}</p>}
        </div>

        <div>
          <label htmlFor="reg-abn" className="label">ABN</label>
          <input
            id="reg-abn"
            name="abn"
            type="text"
            className={`input ${registerForm.errors.abn ? 'input-error' : ''}`}
            placeholder="12 345 678 901"
            value={registerForm.values.abn}
            onChange={registerForm.handleChange}
          />
          {registerForm.errors.abn && <p className="field-error">{registerForm.errors.abn}</p>}
        </div>

        <div>
          <label htmlFor="reg-phone" className="label">Phone</label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="input"
            placeholder="04xx xxx xxx"
            value={registerForm.values.phone}
            onChange={registerForm.handleChange}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="reg-role" className="label">I am primarily a…</label>
          <select
            id="reg-role"
            name="role"
            className="input"
            value={registerForm.values.role}
            onChange={registerForm.handleChange}
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="carrier">Carrier / Freight</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={registerForm.submitting} className="btn-primary w-full btn-lg">
        {registerForm.submitting ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
