// components/EditClassForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initial: {
    id: string;
    title: string;
    term: string;
    subterm?: string | null;
  };
}

export default function EditClassForm({ initial }: Props) {
  const [title, setTitle] = useState(initial.title || "");
  const [term, setTerm] = useState(initial.term || "");
  const [subterm, setSubterm] = useState(initial.subterm || "");
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const res = await fetch(`/api/classes/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, term, subterm }),
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Update failed");
      return;
    }

    // redirect to class page
    router.push(`/classes/${initial.id}`);
  }

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Edit Class</h2>
      {status && <div className="mb-4 text-sm text-red-600">{status}</div>}

      <label className="block mb-2 text-sm font-medium">Title</label>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full p-2 border rounded mb-4" required />

      <label className="block mb-2 text-sm font-medium">Term</label>
      <select value={term} onChange={(e)=>setTerm(e.target.value)} className="w-full p-2 border rounded mb-4" required>
        <option value="">Select term</option>
        <option value="Autumn">Autumn</option>
        <option value="Spring">Spring</option>
        <option value="Summer">Summer</option>
        {/* Add other values you use */}
      </select>

      <label className="block mb-2 text-sm font-medium">Subterm</label>
      <input value={subterm||""} onChange={(e)=>setSubterm(e.target.value)} className="w-full p-2 border rounded mb-4" placeholder="e.g. Mid Term" />

      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
        <button type="button" onClick={()=>router.push(`/classes/${initial.id}`)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
      </div>
    </form>
  );
}
