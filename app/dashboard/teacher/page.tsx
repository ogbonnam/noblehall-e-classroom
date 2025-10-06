// app/dashboard/teacher/page.tsx
import React from "react";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import ClassCard from "@/components/ClassCard";
import QuickStats from "@/components/QuickStats";
import RecentActivity from "@/components/RecentActivity";
import Header from "@/components/Header";
import { PlusCircle, Calendar, Users, TrendingUp } from "lucide-react";
import RecentSubmissionsByClass from "@/components/RecentSubmissionsByClass";

export default async function Dashboard() {
  // Await headers() and cookies() if your Next version returns promises
  const hdrs = await headers();
  const cookieStore = await cookies();

  // Build a small "request-like" object compatible with getUserFromRequest
  const reqLike = {
    headers: {
      get: (key: string) => hdrs.get(key) ?? undefined,
    },
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    },
  };

  // Get user server-side (no HTTP fetch)
  const user = await getUserFromRequest(reqLike);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to NHERC</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">log in</a> to access your dashboard.
          </p>
          <a href="/login" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Now fetch classes directly with Prisma
  const classes = await prisma.class.findMany({
    where: { teacherId: user.id },
    select: { id: true, title: true, term: true, subterm: true },
    orderBy: { createdAt: "desc" },
  });

  // Generate a consistent color for each class based on its ID
  const getClassColor = (id: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", 
      "bg-indigo-500", "bg-red-500", "bg-yellow-500", "bg-teal-500"
    ];
    return colors[parseInt(id, 16) % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <Header userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Here's what's happening in your classes today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <QuickStats 
            icon={<Users className="h-6 w-6" />}
            title="Total Classes"
            value={classes.length}
            color="bg-blue-500"
          />
          {/* <QuickStats 
            icon={<Calendar className="h-6 w-6" />}
            title="Active This Term"
            value={classes.filter(c => c.term === "Current").length}
            color="bg-green-500"
          /> */}
          <QuickStats 
            icon={<TrendingUp className="h-6 w-6" />}
            title="Student Engagement"
            value="87%"
            color="bg-purple-500"
          />
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Classes</h3>
            <a 
              href="/classes/create" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Class
            </a>
          </div>

          {classes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No classes yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first class to get started with EduSpace.</p>
              <a 
                href="/classes/create" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Your First Class
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((c) => (
                <ClassCard 
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  term={c.term}
                  subterm={c.subterm || undefined} // Convert null to undefined
                  color={getClassColor(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentSubmissionsByClass />
          {/* <RecentActivity title="Upcoming Deadlines" /> */}
        </div>
      </main>
    </div>
  );
}