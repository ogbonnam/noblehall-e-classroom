// app/users/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import UsersTableClient from "@/components/UsersTableClient";
import PageHeader from "@/components/PageHeader";
import { Prisma, Role } from "@prisma/client";
import AdminUserUploadForm from "@/components/AdminUserUploadForm";

const USERS_PER_PAGE = 5;

type Props = { searchParams?: { page?: string; q?: string } | Promise<{ page?: string; q?: string }> };

export default async function UsersPage({ searchParams }: Props) {
  // --- Authentication Logic (unchanged) ---
  const tokenCookie = (await cookies()).get("token")?.value;
  if (!tokenCookie) redirect("/login");

  const payload = verifyToken(tokenCookie!) as any; // safe: redirect above if missing
  if (!payload || !payload.id) redirect("/login");
  if (payload.role !== "ADMIN") redirect("/unauthorized");

  // --- IMPORTANT: await searchParams before using its properties ---
  const sp = (searchParams ? await (searchParams as any) : {}) as { page?: string; q?: string };

  // --- Pagination + search params (use awaited sp) ---
  const page = Math.max(1, Number(sp.page || "1"));
  const q = (sp.q || "").trim();

  // Build typed Prisma where clause safely
  const where: Prisma.UserWhereInput = (() => {
    if (!q) return {};
    const or: Prisma.UserWhereInput[] = [];

    // string filters: email and name use contains + insensitive mode
    or.push({ email: { contains: q, mode: Prisma.QueryMode.insensitive } });
    or.push({ name: { contains: q, mode: Prisma.QueryMode.insensitive } });

    // role is an enum; only add a role equality filter if q matches a Role value
    const qUpper = q.toUpperCase();
    const possibleRoles = Object.values(Role).map(String); // ['ADMIN','TEACHER','STUDENT']
    if (possibleRoles.includes(qUpper)) {
      or.push({ role: qUpper as Role });
    }

    return or.length ? { OR: or } : {};
  })();

  // --- Data Fetching (server-side pagination) ---
  const [total, usersFromDb] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / USERS_PER_PAGE));

  // serialize dates
  const users = usersFromDb.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

  // --- Render the Page ---
  return (
    <div className="min-h-screen bg-gray-100">
      <PageHeader title="User Management" subtitle="Manage system users, roles, and permissions." />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload Users</h2>
              <AdminUserUploadForm />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <a href="#" className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="ml-3 text-sm font-medium text-gray-900">Create Single User</span>
                </div>
              </a>
              <a href="#" className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="ml-3 text-sm font-medium text-gray-900">Export Users (CSV)</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Pass server-side page results into client table */}
        <UsersTableClient users={users} page={page} totalPages={totalPages} total={total} q={q} />
      </main>
    </div>
  );
}


