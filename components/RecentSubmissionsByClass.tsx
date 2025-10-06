// components/RecentSubmissionsByClass.tsx (simple usage)
"use client";
import { useEffect, useState } from "react";

export default function RecentSubmissionsByClass() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/recent-submissions-per-class", { credentials: "include" })
      .then(r => r.json())
      .then(j => { setData(j.classes || []); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div>Loading…</div>;
  if (!data.length) return <div>No recent submissions.</div>;

  return (
    <div className="space-y-4">
      {data.map(cls => (
        <div key={cls.classId} className="p-4 bg-white rounded shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{cls.classTitle}</h3>
            <a href={`/classes/${cls.classId}`} className="text-sm text-indigo-600">Open class</a>
          </div>
          <div className="space-y-2">
            {cls.submissions.map((s: any) => (
              <div key={s.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="text-sm font-medium">{s.student?.name ?? s.student?.email}</div>
                  <div className="text-xs text-gray-500">{s.resourceTitle} • {new Date(s.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={s.filePath} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Download</a>
                  {s.graded ? <div className="text-sm text-green-600">Graded</div> : <div className="text-sm text-yellow-600">Ungraded</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
