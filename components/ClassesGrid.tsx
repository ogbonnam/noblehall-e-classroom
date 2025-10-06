// components/ClassesGrid.tsx (update types)
"use client";

import React from "react";
import ClassCard from "./ClassCard";

type ClassData = {
  id: string;
  title: string;
  term: string;
  subterm?: string | null;
  teacherId: string;
  studentCount: number;
  assignmentCount: number;
};

interface ClassesGridProps {
  classes: ClassData[];
  userRole: string;
  userId: string;
}

export default function ClassesGrid({ classes, userRole, userId }: ClassesGridProps) {
  const getClassColor = (id: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
      "bg-indigo-500", "bg-red-500", "bg-yellow-500", "bg-teal-500",
    ];
    return colors[parseInt(id.slice(0, 6), 16) % colors.length];
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    await fetch(`/api/classes/${id}`, { method: "DELETE", credentials: "include" });
    window.location.reload();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {classes.map((c) => (
        <ClassCard
          key={c.id}
          id={c.id}
          title={c.title}
          term={c.term}
          subterm={c.subterm || undefined}
          color={getClassColor(c.id)}
          userRole={userRole}
          userId={userId}
          teacherId={c.teacherId}
          onDelete={handleDelete}
          studentCount={c.studentCount}
          assignmentCount={c.assignmentCount}
        />
      ))}
    </div>
  );
}
