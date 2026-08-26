import { NextResponse } from 'next/server';

// Force this route to run on the Node.js runtime so process.env is available
// at request time. Edge runtime does not expose arbitrary env vars.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let password = '';
  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'pyramid2026';

  if (!password || password !== expected) {
    return NextResponse.json({ ok: false, error: 'wrong_password' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
