import { NextResponse } from 'next/server';

const API_ORIGIN =
  process.env.BACKEND_API_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:4000';

export async function GET() {
  return NextResponse.redirect(`${API_ORIGIN}/v1/auth/google`);
}
