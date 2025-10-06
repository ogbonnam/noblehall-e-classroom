// components/ClassCard.tsx
import React from "react";
import Link from "next/link";
import { BookOpen, Users, Calendar } from "lucide-react";

interface ClassCardProps {
  id: string;
  title: string;
  term: string;
  subterm?: string | null; // Allow null as well as undefined
  color: string;
}

export default function ClassCard({ id, title, term, subterm, color }: ClassCardProps) {
  return (
    <Link href={`/classes/${id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
        <div className={`h-2 ${color}`}></div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Calendar className="h-4 w-4 mr-1" />
            {term} {subterm ? `/ ${subterm}` : ""}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4 mr-1" />
              <span>24 students</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>5 assignments</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}