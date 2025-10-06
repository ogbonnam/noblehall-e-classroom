// app/api/classes/find/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const cls = await prisma.class.findFirst({ where: { code } });
  if (!cls) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ class: cls });
}
