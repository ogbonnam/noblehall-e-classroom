// app/api/enrollments/me/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // token from cookie or header
    const auth = req.headers.get('authorization') || '';
    let token = null;
    if (auth.startsWith('Bearer ')) token = auth.split(' ')[1];
    else {
      const cookie = req.headers.get('cookie') || '';
      const m = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('token='));
      if (m) token = m.split('=')[1];
    }
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token as string) as any;
    if (!payload?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // find enrollments and include class
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: payload.id },
      include: { class: { include: { teacher: true, resources: true } } },
      orderBy: { joinedAt: 'desc' },
    });

    // return classes (map to class objects)
    const classes = enrollments.map(e => e.class);
    return NextResponse.json({ classes });
  } catch (err) {
    console.error('GET /api/enrollments/me error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
