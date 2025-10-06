// app/api/admin/users/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

// helper: get token from header or cookie
function extractToken(headers: Headers) {
  const auth = headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.split(" ")[1];
  const cookie = headers.get("cookie") || "";
  const tokenCookie = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("token="));
  if (tokenCookie) return tokenCookie.split("=")[1];
  return null;
}

// normalize header names to expected column names
function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

type Row = { [key: string]: any };

export async function POST(req: NextRequest) {
  try {
    // auth: must be ADMIN
    const token = extractToken(req.headers);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token as string) as any;
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
    }

    // parse multipart form via Request.formData() (works in node runtime)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded (field name must be 'file')" }, { status: 400 });

    // read file into ArrayBuffer and parse with xlsx
    const ab = await file.arrayBuffer();
    const workbook = XLSX.read(ab, { type: "array" });

    // pick first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return NextResponse.json({ error: "Uploaded file has no sheets" }, { status: 400 });

    const sheet = workbook.Sheets[sheetName];

    // convert to JSON: raw values (header row auto-detected)
    const rawRows: Row[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: "No rows found in the first sheet" }, { status: 400 });
    }

    // Normalize keys: map spreadsheet header names => canonical keys
    // Accept headers like: "name", "full name", "Email", "e-mail", "password", "role"
    const normalizedRows: { name?: string; email?: string; password?: string; role?: string; _rowIndex: number }[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i];
      const normalized: any = { _rowIndex: i + 2 }; // for human-friendly row ref (assuming header row 1)
      for (const key of Object.keys(r)) {
        const nk = normalizeHeader(String(key));
        const val = r[key] === null ? "" : String(r[key]).trim();

        if (["name", "fullname", "fullnamE", "full_name"].includes(nk)) normalized.name = val;
        else if (["email", "e-mail", "emailaddress", "email_address"].includes(nk)) normalized.email = val.toLowerCase();
        else if (["password", "pass", "pwd"].includes(nk)) normalized.password = val;
        else if (["role", "roles", "userrole"].includes(nk)) normalized.role = val.toUpperCase();
        else {
          // ignore unknown columns
        }
      }
      normalizedRows.push(normalized);
    }

    // Process rows: validate and then upsert
    const results: {
      created: number;
      updated: number;
      skipped: number;
      errors: { row: number; message: string }[];
    } = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of normalizedRows) {
      const rowNum = row._rowIndex;
      const email = (row.email || "").trim();
      if (!email) {
        results.errors.push({ row: rowNum, message: "Missing email — skipping" });
        results.skipped++;
        continue;
      }

      // validate email format (very basic)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.errors.push({ row: rowNum, message: `Invalid email format: ${email}` });
        results.skipped++;
        continue;
      }

      // map role
      let roleValue: "ADMIN" | "TEACHER" | "STUDENT" = "STUDENT";
      if (row.role) {
        const r = String(row.role).trim().toUpperCase();
        if (r === "ADMIN" || r === "TEACHER" || r === "STUDENT") roleValue = r as any;
        else {
          results.errors.push({ row: rowNum, message: `Invalid role "${row.role}" — defaulting to STUDENT` });
        }
      }

      // build create and update objects
      const createData: any = {
        email,
        name: row.name || null,
        role: roleValue,
      };

      // password handling: if password provided, hash and include; otherwise create with random temp password
      if (row.password) {
        if (String(row.password).length < 6) {
          results.errors.push({ row: rowNum, message: "Password too short (min 6 chars) — skipping" });
          results.skipped++;
          continue;
        }
        const hashed = await bcrypt.hash(String(row.password), 10);
        createData.password = hashed;
      } else {
        // create a random password when creating new user (but don't overwrite existing user's password on update)
        const temp = Math.random().toString(36).slice(-10);
        createData.password = await bcrypt.hash(temp, 10);
      }

      // for update: only update fields present in the sheet. If password present - update it; else don't touch password.
      const updateData: any = {};
      if (row.name) updateData.name = row.name;
      if (row.role) updateData.role = roleValue;
      if (row.password) updateData.password = await bcrypt.hash(String(row.password), 10);

      try {
        // upsert by unique email
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          await prisma.user.create({ data: createData });
          results.created++;
        } else {
          // if there is nothing to update, skip
          if (Object.keys(updateData).length === 0) {
            results.skipped++;
          } else {
            await prisma.user.update({ where: { email }, data: updateData });
            results.updated++;
          }
        }
      } catch (e: any) {
        console.error("Row upsert error", rowNum, e);
        results.errors.push({ row: rowNum, message: e.message || String(e) });
      }
    } // end loop rows

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("Bulk upload error:", err);
    return NextResponse.json({ error: "Server error during upload", details: (err as any).message }, { status: 500 });
  }
}
