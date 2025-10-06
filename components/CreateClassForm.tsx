// components/CreateClassForm.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateClassForm() {
  const [title, setTitle] = useState('');
  const [term, setTerm] = useState('AUTUMN');
  const [subterm, setSubterm] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/classes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // don't set empty Authorization header
        body: JSON.stringify({ title, term, subterm }),
        credentials: 'include', // sends cookies
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || `Request failed: ${res.status}`);
        return;
      }

      // navigate to the created class page
      router.push(`/classes/${data.class.id}`);
    } catch (err) {
      console.error('Create class failed', err);
      setError('Network error — try again');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="text-red-600">{error}</div>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Class title"
        className="input"
        required
      />
      <select value={term} onChange={(e) => setTerm(e.target.value)} className="input">
        <option value="AUTUMN">Autumn</option>
        <option value="SPRING">Spring</option>
        <option value="SUMMER">Summer</option>
      </select>
      <input
        placeholder="Subterm (e.g. AUTUMN MID TERM)"
        value={subterm}
        onChange={(e) => setSubterm(e.target.value)}
        className="input"
      />
      <button type="submit" className="btn">Create Class</button>
    </form>
  );
}
