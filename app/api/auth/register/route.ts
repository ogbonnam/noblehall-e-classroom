// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, name, role } = body;

  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'User exists' }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, role: role || 'TEACHER' },
  });

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
}
