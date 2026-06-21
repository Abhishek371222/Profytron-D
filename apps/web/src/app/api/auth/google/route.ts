import { NextResponse } from 'next/server';

const API_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET() {
  // Fetch the NestJS redirect without following it, then forward the Location to the browser.
  const upstream = await fetch(`${API_ORIGIN}/v1/auth/google`, { redirect: 'manual' });
  const location = upstream.headers.get('location');
  if (!location) {
    return new NextResponse('OAuth redirect failed', { status: 502 });
  }
  return NextResponse.redirect(location);
}
