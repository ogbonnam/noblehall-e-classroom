// components/QuickStats.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

interface QuickStatsProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}

export default function QuickStats({ icon, title, value, color }: QuickStatsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}