"use client";

import { useEffect, useState } from "react";

interface TeacherSubmissionsPanelProps {
  resourceId: string;
  refreshKey?: number;
  initialPage?: number;
  initialPageSize?: number;
}

export default function TeacherSubmissionsPanel({
  resourceId,
  refreshKey,
  initialPage = 1,
  initialPageSize = 10,
}: TeacherSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/resources/${resourceId}/submissions?page=${page}&pageSize=${pageSize}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setError(data?.error || "Failed to load submissions");
          setSubmissions([]);
          setTotal(0);
        } else {
          setSubmissions(data.submissions || []);
          setTotal(typeof data.total === "number" ? data.total : 0);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("TeacherSubmissionsPanel load error:", err);
        setError("Server error");
        setSubmissions([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [resourceId, page, pageSize, refreshKey]); // refresh when parent bumps refreshKey

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  }

  if (loading) return <div className="text-sm text-gray-500">Loading submissions…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!submissions.length) return <div className="text-sm text-gray-500">No submissions yet.</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>Total submissions: <span className="font-medium text-gray-800">{total}</span></div>
        <div className="flex items-center space-x-2">
          <label className="text-xs">Per page</label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {submissions.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 border">
            <div>
              <div className="text-sm font-medium">{s.student?.name || s.student?.email || "Student"}</div>
              <div className="text-xs text-gray-500">Submitted: {new Date(s.createdAt).toLocaleString()}</div>
              {s.graded && <div className="text-xs text-green-600">Graded: {s.grade ?? "—"}</div>}
            </div>

            <div className="flex items-center space-x-2">
              <a href={s.filePath} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Download</a>

              <button
                onClick={async () => {
                  const val = prompt("Enter numeric grade (or leave empty to ungrade):", s.grade ?? "");
                  if (val === null) return;
                  const grade = val === "" ? null : Number(val);
                  try {
                    const res = await fetch(`/api/submissions/${s.id}/grade`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ graded: true, grade }),
                      credentials: "include",
                    });
                    const data = await res.json();
                    if (!res.ok) { alert(data?.error || "Failed to grade"); }
                    else {
                      // refresh current page after grading
                      setSubmissions(prev => prev.map(p => p.id === s.id ? data.submission : p));
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Server error while grading");
                  }
                }}
                className="px-2 py-1 text-sm rounded bg-indigo-600 text-white"
              >
                Grade
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(1)}
            disabled={page === 1}
            className={`px-2 py-1 rounded text-sm ${page === 1 ? "text-gray-400" : "bg-white border"}`}
          >
            « First
          </button>
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className={`px-2 py-1 rounded text-sm ${page === 1 ? "text-gray-400" : "bg-white border"}`}
          >
            ‹ Prev
          </button>

          {/* show a few page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            // center around current page
            let start = Math.max(1, page - 2);
            if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`px-2 py-1 rounded text-sm ${p === page ? "bg-indigo-600 text-white" : "bg-white border"}`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className={`px-2 py-1 rounded text-sm ${page === totalPages ? "text-gray-400" : "bg-white border"}`}
          >
            Next ›
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={page === totalPages}
            className={`px-2 py-1 rounded text-sm ${page === totalPages ? "text-gray-400" : "bg-white border"}`}
          >
            Last »
          </button>
        </div>
      </div>
    </div>
  );
}
