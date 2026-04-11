import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Health check endpoint used by Railway and load balancers.
 * Returns 200 with service metadata when the app is running.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'realm-ag-marketplace',
      version: process.env.npm_package_version ?? '2.0.0',
      environment: process.env.NODE_ENV ?? 'production',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
