// // app/api/classes/create/route.ts
// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { verifyToken } from '@/lib/auth';
// import crypto from 'crypto';

// export async function POST(req: Request) {
//   const auth = req.headers.get('authorization') || '';
//   if (!auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   const token = auth.split(' ')[1];
//   const data = verifyToken(token as string) as any;
//   if (!data) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   if (data.role !== 'TEACHER' && data.role !== 'ADMIN') {
//     return NextResponse.json({ error: 'Only teachers/admins can create classes' }, { status: 403 });
//   }

//   const body = await req.json();
//   const { title, term, subterm } = body;
//   if (!title || !term) return NextResponse.json({ error: 'title and term required' }, { status: 400 });

//   // code generation: 6 chars alphanumeric
//   const code = crypto.randomBytes(3).toString('hex').toUpperCase();

//   const cls = await prisma.class.create({
//     data: {
//       title,
//       term,
//       subterm,
//       code,
//       teacherId: data.id,
//     },
//   });

//   return NextResponse.json({ ok: true, class: cls });
// }


// app/api/classes/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

function extractTokenFromHeadersOrCookie(headers: Headers) {
  // 1) Authorization header
  const auth = headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.split(" ")[1];

  // 2) Cookie header (fall back)
  const cookie = headers.get("cookie") || "";
  // cookie string like: "token=xxx; other=..."
  const m = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("token="));
  if (m) return m.split("=")[1];
  return null;
}

export async function POST(req: Request) {
  const token = extractTokenFromHeadersOrCookie(req.headers);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = verifyToken(token as string) as any;
  if (!data) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (data.role !== "TEACHER" && data.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers/admins can create classes" }, { status: 403 });
  }

  const body = await req.json();
  const { title, term, subterm } = body;
  if (!title || !term) return NextResponse.json({ error: "title and term required" }, { status: 400 });

  // code generation: 6 hex chars (uppercase)
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();

  const cls = await prisma.class.create({
    data: {
      title,
      term,
      subterm,
      code,
      teacherId: data.id,
    },
  });

  // Return the created class directly so client can use data.id
  return NextResponse.json(cls);
}
