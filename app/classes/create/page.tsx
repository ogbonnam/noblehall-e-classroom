"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateClassPage() {
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState("Autumn");
  const [subterm, setSubterm] = useState("Mid Term");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/classes/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, term, subterm }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/classes/${data.id}`);
    } else {
      alert("Failed to create class");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-md rounded-xl p-8">
      <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">
        Create a New Class
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-2 font-medium">Class Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-300"
            placeholder="e.g. Year 8 Chemistry"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Term</label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option>Autumn</option>
            <option>Spring</option>
            <option>Summer</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Subterm</label>
          <select
            value={subterm}
            onChange={(e) => setSubterm(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option>Mid Term</option>
            <option>End of Term</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Create Class
        </button>
      </form>
    </div>
  );
}
