// app/dashboard/page.tsx
import React from "react";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export default async function Dashboard() {
  // Await headers() and cookies() if your Next version returns promises
  const hdrs = await headers();
  const cookieStore = await cookies();

  // Build a small "request-like" object compatible with getUserFromRequest
  const reqLike = {
    headers: {
      get: (key: string) => hdrs.get(key) ?? undefined,
    },
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    },
  };

  // Get user server-side (no HTTP fetch)
  const user = await getUserFromRequest(reqLike);

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>
          Please <a href="/login" className="underline">log in</a>.
        </p>
      </div>
    );
  }

  // Now fetch classes directly with Prisma
  const classes = await prisma.class.findMany({
    where: { teacherId: user.id },
    select: { id: true, title: true, term: true, subterm: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* This will show the logged-in user's email */}
      <p>Welcome {user.email}</p>

      <a href="/classes/create" className="btn inline-block mt-3">Create Class</a>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Your Classes</h2>
        {classes.length === 0 ? (
          <p>No classes yet</p>
        ) : (
          <ul className="list-disc ml-6">
            {classes.map((c) => (
              <li key={c.id}>
                <a href={`/classes/${c.id}`} className="underline">
                  {c.title} — {c.term} {c.subterm ? ` / ${c.subterm}` : ""}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
