// // app/api/auth/me/route.ts
// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { verifyToken } from '@/lib/auth';

// export async function GET(req: Request) {
//   const auth = req.headers.get('authorization') || '';
//   let token = null;
//   if (auth.startsWith('Bearer ')) token = auth.split(' ')[1];
//   else {
//     // try cookie
//     const cookie = (req as any).cookies?.get ? (req as any).cookies.get('token') : null;
//     if (cookie) token = cookie;
//   }
//   if (!token) return NextResponse.json({ user: null });

//   const data = verifyToken(token as string);
//   if (!data) return NextResponse.json({ user: null });

//   const user = await prisma.user.findUnique({ where: { id: (data as any).id } });
//   return NextResponse.json({ user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null });
// }


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    let token: string | null = null;

    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];

    // Try cookie as fallback
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) return NextResponse.json({ user: null });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ user: null });

    const user = await prisma.user.findUnique({
      where: { id: (payload as any).id },
    });

    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('GET /api/auth/me error', err);
    return NextResponse.json({ user: null });
  }
}



// app/api/auth/me/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { prisma } from "@/lib/prisma";
// import { verifyToken } from "@/lib/auth";

// export async function GET(req: Request) {
//   try {
//     // 1) Try Authorization header
//     const authHeader = req.headers.get("authorization") ?? "";
//     let token: string | null = null;

//     if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
//       token = authHeader.split(" ")[1];
//     } else {
//       // 2) Fallback to cookie using next/headers cookies() (App Router)
//       const cookieStore = await cookies();
//       const cookieVal = cookieStore.get("token")?.value ?? null;
//       if (typeof cookieVal === "string") token = cookieVal;
//     }

//     if (!token) {
//       return NextResponse.json({ user: null }, { status: 200 });
//     }

//     const data = verifyToken(token);
//     if (!data) {
//       return NextResponse.json({ user: null }, { status: 200 });
//     }

//     const userId = (data as any).id;
//     if (!userId) return NextResponse.json({ user: null }, { status: 200 });

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { id: true, email: true, name: true, role: true },
//     });

//     return NextResponse.json({ user: user ?? null }, { status: 200 });
//   } catch (err) {
//     console.error("GET /api/auth/me error:", err);
//     return NextResponse.json({ user: null }, { status: 500 });
//   }
// }
