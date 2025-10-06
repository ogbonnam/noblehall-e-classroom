// components/ClassCard.tsx (add props and render counts)
"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Users, Calendar, Trash2, Edit2 } from "lucide-react";

interface ClassCardProps {
  id: string;
  title: string;
  term: string;
  subterm?: string;
  color: string;
  userRole: string;
  userId: string;
  teacherId: string;
  onDelete?: (id: string) => void;
  studentCount?: number;
  assignmentCount?: number;
}

export default function ClassCard({
  id,
  title,
  term,
  subterm,
  color,
  userRole,
  userId,
  teacherId,
  onDelete,
  studentCount = 0,
  assignmentCount = 0,
}: ClassCardProps) {
  const canEditOrDelete = userRole === "ADMIN" || userId === teacherId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
      <div className={`h-2 ${color}`}></div>

      <div className="p-6 flex flex-col justify-between h-full">
        <Link href={`/classes/${id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Calendar className="h-4 w-4 mr-1" />
            {term} {subterm ? `/ ${subterm}` : ""}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4 mr-1" />
              <span>{studentCount} {studentCount === 1 ? "student" : "students"}</span>
            </div>

            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>{assignmentCount} {assignmentCount === 1 ? "assignment" : "assignments"}</span>
            </div>
          </div>
        </Link>

        {canEditOrDelete && (
          <div className="mt-4 flex justify-end space-x-2">
            <Link
              href={`/classes/${id}/edit`}
              className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm hover:bg-yellow-200 transition"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Link>

            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
