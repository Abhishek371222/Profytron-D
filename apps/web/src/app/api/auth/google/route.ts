import { NextResponse } from 'next/server';

const API_ORIGIN =
  process.env.BACKEND_API_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:4000';

export async function GET() {
  // Send the browser to the NestJS Passport route directly — avoids a fragile
  // server-side fetch proxy that fails when the API is briefly unavailable.
  return NextResponse.redirect(`${API_ORIGIN}/v1/auth/google`);
}
