// app/classes/[classId]/edit/page.tsx
import React from "react";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import EditClassForm from "@/components/EditClassForm";
import Header from "@/components/Header";

type Props = { params: { classId: string | Promise<string> } };

export default async function Page({ params }: Props) {
  const p = (await params) as { classId: string };
  const classId = p.classId;

  const hdrs = await headers();
  const cookieStore = await cookies();
  const reqLike = {
    headers: { get: (k: string) => hdrs.get(k) ?? undefined },
    cookies: { get: (name: string) => cookieStore.get(name)?.value ?? undefined },
  };
  const user = await getUserFromRequest(reqLike);

  if (!user) {
    return <div className="p-6">Unauthorized - please log in.</div>;
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, title: true, term: true, subterm: true, teacherId: true },
  });

  if (!cls) return <div className="p-6">Class not found.</div>;

  // permission: only teacher owner or admin can access this edit page
  if (user.role !== "ADMIN" && user.id !== cls.teacherId) {
    return <div className="p-6">Forbidden: you don't have permission to edit this class.</div>;
  }

  return (
    <div>
      <Header userEmail={user.email} />
      <main className="max-w-4xl mx-auto p-6">
        <EditClassForm initial={cls} />
      </main>
    </div>
  );
}
