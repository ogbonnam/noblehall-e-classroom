"use client";

import { useEffect, useState } from "react";

interface SubmitAssignmentFormProps {
  resourceId: string;
  onSubmitSuccess?: () => void;
}

export default function SubmitAssignmentForm({ resourceId, onSubmitSuccess }: SubmitAssignmentFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);

  // fetch submission status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/submission-status`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setAlreadySubmitted(!!data.submitted);
        setSubmission(data.submission ?? null);
        return data;
      } else {
        console.error("submission-status failed", data);
        setAlreadySubmitted(false);
        setSubmission(null);
        return null;
      }
    } catch (err) {
      console.error("submission-status error", err);
      setAlreadySubmitted(false);
      setSubmission(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchStatus();
    })();
    return () => { mounted = false; };
  }, [resourceId]);

  // poll for grade updates if submitted but not graded
  useEffect(() => {
    if (!alreadySubmitted || !submission) return;
    if (submission.graded) return; // already graded, don't poll

    let cancelled = false;
    const maxPolls = 12; // poll up to 12 times (~2 minutes if interval 10s)
    const intervalMs = 10000;

    const poll = async () => {
      if (cancelled) return;
      const data = await fetchStatus();
      setPollCount((p) => p + 1);
      if (!data) return;
      if (data.submission?.graded) {
        // pick up grade and stop
        setSubmission(data.submission);
        return;
      }
      if (pollCount >= maxPolls) {
        // stop polling
        return;
      }
      setTimeout(poll, intervalMs);
    };

    const t = setTimeout(poll, intervalMs);
    return () => { cancelled = true; clearTimeout(t); };
  }, [alreadySubmitted, submission, pollCount, resourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setStatus("Please select a file"); return; }

    setStatus("Uploading...");
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`/api/resources/${resourceId}/submit`, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || "Submission failed");
        return;
      }

      setStatus("Submission successful");
      setFile(null);
      setAlreadySubmitted(true);
      setSubmission(data.submission ?? null);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      console.error(err);
      setStatus("Server error");
    }
  };

  // UI: loading status
  if (alreadySubmitted === null) return <div className="text-sm text-gray-500">Checking submission status...</div>;

  return (
    <div>
      {alreadySubmitted ? (
        <div className="p-3 bg-gray-100 rounded text-sm">
          <div className="mb-2">✅ You submitted this assignment.</div>

          {submission?.graded ? (
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-green-600">Graded: {submission.grade ?? "—"}</div>
              {submission.comment && <div className="text-gray-700">Teacher comment: {submission.comment}</div>}
              <div className="text-xs text-gray-500">Submitted: {new Date(submission.createdAt).toLocaleString()}</div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <div>Waiting for teacher to grade your submission...</div>
              <div className="text-xs">We will check for an update automatically.</div>
            </div>
          )}

          {/* Allow replace submission if you want */}
          <div className="mt-3">
            <button
              onClick={() => {
                // optional: allow re-submit -> clear state to show form again
                setAlreadySubmitted(false);
                setSubmission(null);
              }}
              className="text-sm text-indigo-600 underline"
            >
              Replace submission
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {status && <div className="text-sm text-indigo-700">{status}</div>}
          <input type="file" accept=".pdf,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Submit</button>
        </form>
      )}
    </div>
  );
}
