// "use client";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// export default function StudentDashboard() {
//   const [classes, setClasses] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       setLoading(true);
//       try {
//         const res = await fetch("/api/enrollments/me", { credentials: "include" });
//         if (!res.ok) {
//           const e = await res.json().catch(() => ({ error: 'Unauthorized' }));
//           if (mounted) setErr(e.error || "Failed to fetch classes");
//           return;
//         }
//         const data = await res.json();
//         if (mounted) setClasses(data.classes ?? []);
//       } catch (e) {
//         console.error(e);
//         if (mounted) setErr("Server error");
//       } finally { if (mounted) setLoading(false); }
//     };
//     load();
//     return () => { mounted = false; };
//   }, [router]);

//   if (loading) return <div className="p-6">Loading...</div>;
//   if (err) return <div className="p-6 text-red-600">{err}</div>;

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <div className="flex items-center mb-4">
//         <h1 className="text-2xl font-bold">My Classes</h1>
//         <Link href="/join" className="ml-auto btn">
//           Join Class
//         </Link>
//       </div>

//       {classes.length === 0 ? (
//         <div>No classes joined yet.</div>
//       ) : (
//         <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
//           {classes.map((c: any) => (
//             <Link key={c.id} href={`/classes/${c.id}`} className="p-4 border rounded hover:shadow">
//               <h3 className="font-semibold">{c.title}</h3>
//               <p className="text-sm text-gray-600">Term: {c.term} {c.subterm ? `• ${c.subterm}` : ''}</p>
//               <p className="text-xs text-indigo-700">Code: {c.code}</p>
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

// Define colors for class cards (similar to Google Classroom)
const classCardColors = [
  { bg: "bg-blue-500", lightBg: "bg-blue-100" },
  { bg: "bg-green-500", lightBg: "bg-green-100" },
  { bg: "bg-purple-500", lightBg: "bg-purple-100" },
  { bg: "bg-red-500", lightBg: "bg-red-100" },
  { bg: "bg-yellow-500", lightBg: "bg-yellow-100" },
  { bg: "bg-pink-500", lightBg: "bg-pink-100" },
  { bg: "bg-indigo-500", lightBg: "bg-indigo-100" },
  { bg: "bg-teal-500", lightBg: "bg-teal-100" },
];

export default function StudentDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    // Fetch user information
    const fetchUserInfo = async () => {
      try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.email) {
            setUserEmail(data.email);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        // Set a default email if fetch fails
        if (mounted) setUserEmail("student@example.com");
      }
    };
    
    // Fetch classes
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/enrollments/me", { credentials: "include" });
        if (!res.ok) {
          const e = await res.json().catch(() => ({ error: 'Unauthorized' }));
          if (mounted) setErr(e.error || "Failed to fetch classes");
          return;
        }
        const data = await res.json();
        if (mounted) setClasses(data.classes ?? []);
      } catch (e) {
        console.error(e);
        if (mounted) setErr("Server error");
      } finally { 
        if (mounted) setLoading(false); 
      }
    };
    
    fetchUserInfo();
    load();
    
    return () => { mounted = false; };
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header userEmail={userEmail || "Loading..."} />
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
  
  if (err) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header userEmail={userEmail || "User"} />
      <div className="p-6 text-red-600 max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{err}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header userEmail={userEmail || "User"} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Classes</h1>
          <Link href="/join" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Join Class
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No classes joined yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Join your first class to get started</p>
            <Link href="/join" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
              Join Class
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {classes.map((c: any, index) => {
              const colorIndex = index % classCardColors.length;
              const color = classCardColors[colorIndex];
              
              return (
                <Link key={c.id} href={`/classes/${c.id}`} className="group block">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                    <div className={`h-28 ${color.bg} relative`}>
                      <div className="absolute inset-0 bg-black opacity-10"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-lg truncate">{c.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Term: {c.term} {c.subterm ? `• ${c.subterm}` : ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          Code: {c.code}
                        </p>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}