// // components/UploadResourceForm.tsx
// "use client";

// import React, { useState } from "react";

// export default function UploadResourceForm({ classId }: { classId: string }) {
//   const [file, setFile] = useState<File | null>(null);
//   const [title, setTitle] = useState("");
//   const [status, setStatus] = useState<string | null>(null);
//   const [type, setType] = useState(""); // <-- add this line

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setStatus(null);
//     if (!file) {
//       setStatus("Please choose a file first.");
//       return;
//     }

//     const fd = new FormData();
//     fd.append("file", file);
//     fd.append("title", title || file.name);
//     fd.append("type", type); // <-- add this line


//     try {
//       const res = await fetch(`/api/classes/${classId}/upload`, {
//         method: "POST",
//         body: fd,
//         credentials: "include", // send cookie token if you use cookie auth
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         setStatus(data?.error || "Upload failed");
//         return;
//       }

//       setStatus("Upload successful");
//       setFile(null);
//       setTitle("");
//       // Optionally: you can trigger a refresh to show uploaded file (not included here)
//     } catch (err) {
//       setStatus("Upload error");
//       console.error(err);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-4 rounded">
//       {status && <div className="text-sm text-indigo-700">{status}</div>}

//       <div className="mb-4">
//   <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
//     Resource Type
//   </label>
//   <select
//     id="type"
//     name="type"
//     value={type}
//     onChange={(e) => setType(e.target.value)}
//     className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//     required
//   >
//     <option value="">Select type</option>
//     <option value="ASSIGNMENT">Assignment</option>
//     <option value="HOMEWORK">Homework</option>
//     <option value="NOTE">Note</option>
//     <option value="VIDEO">Video</option>
//   </select>
// </div>


//       <div>
//         <label className="block text-sm font-medium mb-1">Title (optional)</label>
//         <input
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           placeholder="Resource title"
//           className="w-full border rounded p-2"
//         />
//       </div>


//       <div>
//         <label className="block text-sm font-medium mb-1">File (PDF or video)</label>
//         <input
//           type="file"
//           accept=".pdf,video/*"
//           onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//         />
//       </div>

//       <div>
//         <button
//           type="submit"
//           className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
//         >
//           Upload
//         </button>
//       </div>
//     </form>
//   );
// }


// components/UploadResourceForm.tsx
"use client";

import React, { useState } from "react";

interface UploadResourceFormProps {
  classId: string;
  onUploadSuccess?: () => void;
}

export default function UploadResourceForm({ classId, onUploadSuccess }: UploadResourceFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title || file.name);
    fd.append("type", type);

    try {
      const res = await fetch(`/api/classes/${classId}/upload`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || "Upload failed");
        return;
      }

      setStatus("Upload successful");
      setFile(null);
      setTitle("");
      setType("");
      
      // Call the success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setStatus("Upload error");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <div className={`p-3 rounded-md text-sm ${
          status === "Upload successful" 
            ? "bg-green-50 text-green-800" 
            : "bg-red-50 text-red-800"
        }`}>
          {status}
        </div>
      )}

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          Resource Type
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">Select type</option>
          <option value="ASSIGNMENT">Assignment</option>
          <option value="HOMEWORK">Homework</option>
          <option value="NOTE">Note</option>
          <option value="VIDEO">Video</option>
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title (optional)
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resource title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
          File (PDF or video)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".pdf,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF or video up to 10MB</p>
            {file && (
              <p className="text-sm text-gray-900 mt-2">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isUploading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          } transition-colors`}
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </>
          ) : (
            "Upload Resource"
          )}
        </button>
      </div>
    </form>
  );
}