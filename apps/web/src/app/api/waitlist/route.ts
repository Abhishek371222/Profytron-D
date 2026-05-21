import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'waitlist.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body?.email || '').toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    let list: string[] = [];
    if (fs.existsSync(FILE)) {
      try { list = JSON.parse(fs.readFileSync(FILE, 'utf8')) as string[]; } catch {}
    }

    if (!list.includes(email)) list.push(email);
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf8');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[waitlist] error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
