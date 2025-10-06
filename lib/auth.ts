// lib/auth.ts
// lib/auth.ts
import * as jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

function getSecret(): jwt.Secret {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Missing JWT_SECRET env var");
  return s as jwt.Secret;
}

/**
 * Sign a JWT. Returns the token string.
 */
export function signToken(payload: Record<string, unknown>, expiresIn: jwt.SignOptions["expiresIn"] = "7d"): string {
  const options: jwt.SignOptions = { expiresIn, algorithm: "HS256" };
  return jwt.sign(payload as jwt.JwtPayload, getSecret(), options);
}

/**
 * Verify a token. Returns decoded payload or null on error.
 */
export function verifyToken(token: string): null | jwt.JwtPayload | string {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

/**
 * Helper: get authenticated user from Authorization header or cookie.
 */
export async function getUserFromRequest(
  req: NextRequest | { headers?: any; cookies?: any; body?: any }
) {
  let token: string | null = null;

  // Authorization header (works for NextRequest and plain objects)
  const rawAuth = req.headers?.get ? req.headers.get("authorization") : req.headers && req.headers.authorization;
  if (typeof rawAuth === "string" && rawAuth.startsWith("Bearer ")) token = rawAuth.split(" ")[1];

  // fallback to cookie (NextRequest cookies.get or plain object)
  if (!token) {
    const cookieVal = req.cookies?.get ? req.cookies.get("token") : req.cookies && req.cookies.token;
    if (typeof cookieVal === "string") token = cookieVal;
  }

  if (!token) return null;

  const data = verifyToken(token);
  if (!data || typeof (data as any).id === "undefined") return null;

  const user = await prisma.user.findUnique({ where: { id: (data as any).id } });
  return user;
}
