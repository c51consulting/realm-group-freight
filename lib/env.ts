/**
 * Environment variable validation and type-safe access.
 *
 * Call `validateEnv()` once at application startup (in server.js or next.config.js).
 * Access env vars through the exported `env` object for full TypeScript safety.
 */

// ─── Variable Definitions ────────────────────────────────────────────────────

interface EnvVar {
  /** Whether the app should refuse to start if this var is missing. */
  required: boolean;
  /** Default value used when the var is absent and not required. */
  default?: string;
  /** Human-readable description shown in error messages. */
  description: string;
  /** Mask the value in logs (e.g. secrets). */
  secret?: boolean;
}

const ENV_SCHEMA: Record<string, EnvVar> = {
  // ── Core ──────────────────────────────────────────────────────────────────
  NODE_ENV: {
    required: false,
    default: 'development',
    description: 'Runtime environment (development | production | test)',
  },
  PORT: {
    required: false,
    default: '3000',
    description: 'HTTP port the Express server listens on',
  },

  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL connection string (postgresql://user:pass@host:5432/db)',
    secret: true,
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  JWT_SECRET: {
    required: true,
    description: 'Secret key used to sign and verify JWT tokens (min 32 chars recommended)',
    secret: true,
  },
  JWT_EXPIRES_IN: {
    required: false,
    default: '7d',
    description: 'JWT token lifetime (e.g. 7d, 24h, 3600)',
  },

  // ── Stripe ────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: {
    required: false,
    description: 'Stripe secret API key (sk_live_... or sk_test_...)',
    secret: true,
  },
  STRIPE_WEBHOOK_SECRET: {
    required: false,
    description: 'Stripe webhook signing secret (whsec_...)',
    secret: true,
  },
  STRIPE_PLATFORM_FEE_PERCENT: {
    required: false,
    default: '5',
    description: 'Platform fee percentage charged on each order (default: 5)',
  },

  // ── Supabase (optional – used for storage/auth if enabled) ────────────────
  SUPABASE_URL: {
    required: false,
    description: 'Supabase project URL (https://xxx.supabase.co)',
  },
  SUPABASE_ANON_KEY: {
    required: false,
    description: 'Supabase anonymous/public API key',
    secret: true,
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: false,
    description: 'Supabase service role key (server-side only)',
    secret: true,
  },

  // ── Next.js public vars ───────────────────────────────────────────────────
  NEXT_PUBLIC_API_URL: {
    required: false,
    default: 'http://localhost:3000',
    description: 'Base URL of the Express API (used by the Next.js client)',
  },
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    required: false,
    description: 'Stripe publishable key exposed to the browser (pk_...)',
  },

  // ── File uploads ──────────────────────────────────────────────────────────
  UPLOAD_DIR: {
    required: false,
    default: 'uploads',
    description: 'Local directory for file uploads (weighbridge tickets, certificates)',
  },
  MAX_UPLOAD_SIZE_MB: {
    required: false,
    default: '10',
    description: 'Maximum file upload size in megabytes',
  },

  // ── Rate limiting ─────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    default: '900000',
    description: 'Rate limit window in milliseconds (default: 15 minutes)',
  },
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    default: '100',
    description: 'Maximum requests per window per IP',
  },
};

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates all environment variables against the schema.
 * Throws a descriptive error listing every missing required variable.
 * Should be called once at application startup before any other code runs.
 *
 * @throws {Error} If any required environment variables are missing.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const [key, spec] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[key];
    if (!value && spec.required) {
      missing.push(`  • ${key} — ${spec.description}`);
    }
    // Apply defaults for optional vars
    if (!value && spec.default !== undefined) {
      process.env[key] = spec.default;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌  Missing required environment variables:\n\n${missing.join('\n')}\n\n` +
        `Copy .env.production to .env and fill in the missing values.\n`
    );
  }

  // Warn about weak JWT secret in production
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length < 32
  ) {
    console.warn(
      '⚠️  JWT_SECRET is shorter than 32 characters. Use a longer, random secret in production.'
    );
  }
}

// ─── Type-Safe Accessor ───────────────────────────────────────────────────────

/**
 * Type-safe environment variable accessor.
 * All values are strings (as provided by process.env), with numeric helpers.
 *
 * @example
 * const port = env.PORT_NUMBER;   // number
 * const secret = env.JWT_SECRET;  // string
 */
export const env = {
  get NODE_ENV() {
    return (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test';
  },
  get IS_PRODUCTION() {
    return process.env.NODE_ENV === 'production';
  },
  get IS_DEVELOPMENT() {
    return process.env.NODE_ENV === 'development';
  },
  get IS_TEST() {
    return process.env.NODE_ENV === 'test';
  },

  // Core
  get PORT() {
    return process.env.PORT ?? '3000';
  },
  get PORT_NUMBER() {
    return parseInt(process.env.PORT ?? '3000', 10);
  },

  // Database
  get DATABASE_URL() {
    return process.env.DATABASE_URL!;
  },

  // Auth
  get JWT_SECRET() {
    return process.env.JWT_SECRET!;
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN ?? '7d';
  },

  // Stripe
  get STRIPE_SECRET_KEY() {
    return process.env.STRIPE_SECRET_KEY;
  },
  get STRIPE_WEBHOOK_SECRET() {
    return process.env.STRIPE_WEBHOOK_SECRET;
  },
  get STRIPE_PLATFORM_FEE_PERCENT() {
    return parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '5');
  },

  // Supabase
  get SUPABASE_URL() {
    return process.env.SUPABASE_URL;
  },
  get SUPABASE_ANON_KEY() {
    return process.env.SUPABASE_ANON_KEY;
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },

  // Next.js public
  get NEXT_PUBLIC_API_URL() {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  },
  get NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY() {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  },

  // Uploads
  get UPLOAD_DIR() {
    return process.env.UPLOAD_DIR ?? 'uploads';
  },
  get MAX_UPLOAD_SIZE_BYTES() {
    return parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '10', 10) * 1024 * 1024;
  },

  // Rate limiting
  get RATE_LIMIT_WINDOW_MS() {
    return parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10);
  },
  get RATE_LIMIT_MAX_REQUESTS() {
    return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10);
  },
};
