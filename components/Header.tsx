"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import Image from "next/image";

interface HeaderProps {
  userEmail: string;
}

export default function Header({ userEmail }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/login"); // or your actual login route
      } else {
        alert("Failed to log out. Please try again.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed. Check console.");
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Image 
                src="/images/NH.png"
                alt="logo"
                width={70}
                height={70}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">NHERC</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
            Welcome back,{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {userEmail}
            </span>
          </div>

          <ThemeToggle />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition"
          >
            Logout
          </button>

          {/* Profile Initial */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {userEmail.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
