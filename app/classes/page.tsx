"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
};

type ClassItem = {
  id: string;
  title: string;
  term: string;
  subterm?: string | null;
  code: string;
  createdAt?: string;
};

export default function ClassesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // 1) get current user (this endpoint should read the httpOnly cookie token)
        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!meRes.ok) {
          // not logged in
          if (mounted) {
            setUser(null);
            setClasses([]);
            setErr("You must be logged in to see your classes.");
            setLoading(false);
          }
          return;
        }

        const meData = await meRes.json();
        const currUser: User | null = meData?.user ?? null;

        if (!currUser) {
          if (mounted) {
            setUser(null);
            setErr("You must be logged in to see your classes.");
            setLoading(false);
          }
          return;
        }

        if (mounted) setUser(currUser);

        // 2) fetch classes for this teacher
        const clsRes = await fetch(`/api/classes?teacherId=${encodeURIComponent(currUser.id)}`, {
          method: "GET",
          credentials: "include",
        });

        if (!clsRes.ok) {
          const e = await clsRes.json().catch(() => ({ error: "Failed to fetch classes" }));
          if (mounted) {
            setErr(e?.error || "Failed to fetch classes");
            setClasses([]);
          }
        } else {
          const list = (await clsRes.json()) as ClassItem[];
          if (mounted) setClasses(list);
        }
      } catch (e: any) {
        console.error("Error loading classes page:", e);
        if (mounted) setErr("Server error while loading classes.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Classes</h1>
          <p className="text-sm text-gray-600">
            {user ? `Logged in as ${user.email}` : "Sign in to manage your classes"}
          </p>
        </div>
        <div>
          <Link
            href="/classes/create"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            + Create Class
          </Link>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading classes…</div>}
      {err && !loading && <div className="text-red-600 mb-4">{err}</div>}

      {!loading && !err && classes.length === 0 && (
        <div className="border border-dashed p-6 rounded text-center text-gray-600">
          No classes found. Create one using the button above.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/classes/${c.id}`}
            className="block p-4 rounded-lg border hover:shadow-md transition bg-white"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{c.title}</h2>
              <span className="text-xs text-gray-500">{new Date(c.createdAt || "").toLocaleDateString()}</span>
            </div>

            <p className="text-sm text-gray-600 mt-2">
              Term: <strong>{c.term}</strong> {c.subterm ? <>• {c.subterm}</> : null}
            </p>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-indigo-700">Code: <strong>{c.code}</strong></div>
              <div className="text-xs text-gray-400">View →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
