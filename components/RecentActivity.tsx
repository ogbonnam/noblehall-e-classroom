// components/RecentActivity.tsx
import React from "react";
import { FileText, Clock, CheckCircle } from "lucide-react";

interface RecentActivityProps {
  title: string;
}

export default function RecentActivity({ title }: RecentActivityProps) {
  const activities = [
    { id: 1, name: "Essay Assignment", time: "2 hours ago", status: "pending" },
    { id: 2, name: "Math Quiz", time: "5 hours ago", status: "completed" },
    { id: 3, name: "Science Project", time: "1 day ago", status: "pending" },
    { id: 4, name: "History Presentation", time: "2 days ago", status: "completed" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div className={`mr-3 mt-0.5 ${
              activity.status === "completed" 
                ? "text-green-500" 
                : "text-yellow-500"
            }`}>
              {activity.status === "completed" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <FileText className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
        View all
      </button>
    </div>
  );
}