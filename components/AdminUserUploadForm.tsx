"use client";
import { useState } from "react";

export default function AdminUserUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/users/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStatus("done");
      setMessage(`✅ Uploaded ${data.count} users successfully`);
      setFile(null);
    } catch (err: any) {
      setStatus("error");
      setMessage(`❌ ${err.message}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
    >
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="mt-4 flex text-sm text-gray-600 justify-center items-center">
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
        >
          <span>{file ? file.name : "Upload a file"}</span>
          <input
            id="file-upload"
            name="file"
            type="file"
            className="sr-only"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <p className="pl-1">or drag and drop</p>
      </div>

      <p className="text-xs text-gray-500">CSV, XLSX up to 10MB</p>

      <button
        type="submit"
        disabled={!file || status === "uploading"}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
      >
        {status === "uploading" ? "Uploading..." : "Submit"}
      </button>

      {message && (
        <p
          className={`mt-2 text-sm ${
            status === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
