// "use client";

// import { useEffect, useState } from "react";
// import UploadResourceForm from "@/components/UploadResourceForm";
// import SubmitAssignmentForm from "@/components/SubmitAssignmentForm";


// interface ClassPageProps {
//   params: { classId: string } | Promise<{ classId: string }>;
// }

// export default function ClassPage({ params }: ClassPageProps) {
//   const [cls, setCls] = useState<any>(null);
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [submittingResource, setSubmittingResource] = useState<any>(null);
//   const [classId, setClassId] = useState<string | null>(null);

//   // unwrap params if it's a Promise
//   useEffect(() => {
//     let mounted = true;
//     const resolveParams = async () => {
//       const p = params instanceof Promise ? await params : params;
//       if (mounted) setClassId(p.classId);
//     };
//     resolveParams();
//     return () => { mounted = false; };
//   }, [params]);

//   useEffect(() => {
//     if (!classId) return;

//     let mounted = true;
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         // 1️⃣ Fetch class
//         const clsRes = await fetch(`/api/classes/${classId}`, { credentials: "include" });
//         const clsData = await clsRes.json();
//         if (mounted) setCls(clsData);

//         // 2️⃣ Fetch current user
//         const userRes = await fetch(`/api/auth/me`, { credentials: "include" });
//         const userData = await userRes.json();
//         if (mounted) setUser(userData.user || null);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };
//     fetchData();
//     return () => { mounted = false; };
//   }, [classId]);

//   if (loading) return <div className="p-6">Loading...</div>;
//   if (!cls) return <div className="p-6">Class not found.</div>;

//   const canUpload = user && (user.role === "ADMIN" || user.id === cls.teacher?.id);

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <header className="mb-6">
//         <h1 className="text-2xl font-bold">{cls.title}</h1>
//         <p className="text-sm text-gray-600">
//           Teacher: {cls.teacher?.name ?? cls.teacher?.email} • Term: {cls.term}{" "}
//           {cls.subterm ? `• ${cls.subterm}` : ""}
//         </p>
//         <p className="mt-2 text-xs text-indigo-700">
//           Class Code: <strong>{cls.code}</strong>
//         </p>
//       </header>

//       <section className="mb-6">
//         <h2 className="text-lg font-semibold mb-3">Resources</h2>
//         {cls.resources?.length === 0 ? (
//           <p className="text-sm text-gray-500">No resources yet.</p>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             {cls.resources.map((res: any) => (
//               <div key={res.id} className="border rounded p-4 bg-white shadow-sm">
//                 <h3 className="font-medium">{res.title}</h3>
//                 <p className="text-xs text-gray-500">
//                   {res.type.toUpperCase()} • {Math.round(res.size / 1024)} KB
//                 </p>
//                 <a href={res.filePath} target="_blank" rel="noreferrer" className="text-sm underline mt-2 inline-block">
//                   Open
//                 </a>

//                 {user &&
//                   user.role === "STUDENT" &&
//                   (res.type === "ASSIGNMENT" || res.type === "HOMEWORK") && (
//                     <button
//                       className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
//                       onClick={() => setSubmittingResource(res)}
//                     >
//                       Submit
//                     </button>
//                   )}
//               </div>
//             ))}

//             {submittingResource && (
//               <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//                 <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
//                   <button
//                     className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
//                     onClick={() => setSubmittingResource(null)}
//                   >
//                     ✕
//                   </button>
//                   <h2 className="text-lg font-semibold mb-4">
//                     Submit: {submittingResource.title}
//                   </h2>
//                   <SubmitAssignmentForm
//                     resourceId={submittingResource.id}
//                     onSubmitSuccess={() => setSubmittingResource(null)}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </section>

//       {canUpload && classId && (
//   <section className="mt-6">
//     <h2 className="text-lg font-semibold mb-3">Upload Resource</h2>
//     <UploadResourceForm classId={classId} />
//   </section>
// )}

//     </div>
//   );
// }



"use client"

import { useEffect, useState, useRef } from "react";
import UploadResourceForm from "@/components/UploadResourceForm";
import SubmitAssignmentForm from "@/components/SubmitAssignmentForm";
import Header from "@/components/Header"; // Import the Header component
import { format } from "date-fns";
import TeacherSubmissionsPanel from "@/components/TeacherSubmissionsPanel";


interface ClassPageProps {
  params: { classId: string } | Promise<{ classId: string }>;
}

export default function ClassPage({ params }: ClassPageProps) {
  const [cls, setCls] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingResource, setSubmittingResource] = useState<any>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resources");
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // For refreshing resources after upload
  const uploadFormRef = useRef<HTMLDivElement>(null);
  // which resource's submissions panel is currently open (id) or null
  const [openSubmissionsFor, setOpenSubmissionsFor] = useState<string | null>(null);

  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9); // 3x3 grid on desktop

  // unwrap params if it's a Promise
  useEffect(() => {
    let mounted = true;
    const resolveParams = async () => {
      const p = params instanceof Promise ? await params : params;
      if (mounted) setClassId(p.classId);
    };
    resolveParams();
    return () => { mounted = false; };
  }, [params]);

  useEffect(() => {
    if (!classId) return;

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1️⃣ Fetch class
        const clsRes = await fetch(`/api/classes/${classId}`, { credentials: "include" });
        const clsData = await clsRes.json();
        if (mounted) setCls(clsData);

        // 2️⃣ Fetch current user
        const userRes = await fetch(`/api/auth/me`, { credentials: "include" });
        const userData = await userRes.json();
        if (mounted) setUser(userData.user || null);
        
        // 3️⃣ Process upcoming deadlines (the twist)
        if (clsData.resources) {
          const assignments = clsData.resources.filter((res: any) => 
            res.type === "ASSIGNMENT" || res.type === "HOMEWORK"
          );
          if (assignments.length > 0) {
            setUpcomingDeadlines(assignments.slice(0, 3)); // Show next 3 assignments
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [classId, refreshKey]); // Add refreshKey to trigger refetch

  const scrollToUploadForm = () => {
    if (uploadFormRef.current) {
      uploadFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUploadSuccess = () => {
    // Refresh the resources after successful upload
    setRefreshKey(prev => prev + 1);
    // Reset to first page after upload
    setCurrentPage(1);
  };

  // Calculate pagination
  const resources = cls?.resources || [];
  const totalResources = resources.length;
  const totalPages = Math.ceil(totalResources / itemsPerPage);
  const indexOfLastResource = currentPage * itemsPerPage;
  const indexOfFirstResource = indexOfLastResource - itemsPerPage;
  const currentResources = resources.slice(indexOfFirstResource, indexOfLastResource);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  
  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generate page numbers
  const pageNumbers = [];
  const maxPageButtons = 5; // Maximum number of page buttons to show
  
  if (totalPages <= maxPageButtons) {
    // Show all page numbers if total pages is less than or equal to maxPageButtons
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Show a subset of page numbers with ellipsis
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
  }

  // Extract user email for Header component
  const userEmail = user?.email || user?.name || "User";

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Header userEmail={userEmail} />
      <div className="flex justify-center items-center flex-grow">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    </div>
  );
  
  if (!cls) return (
    <div className="flex flex-col min-h-screen">
      <Header userEmail={userEmail} />
      <div className="flex justify-center items-center flex-grow">
        <div className="p-6 text-center text-gray-500">Class not found.</div>
      </div>
    </div>
  );

  const canUpload = user && (user.role === "ADMIN" || user.id === cls.teacher?.id);
  
  // Count different resource types
  const assignmentsCount = cls.resources?.filter((r: any) => r.type === "ASSIGNMENT" || r.type === "HOMEWORK").length || 0;
  const materialsCount = cls.resources?.filter((r: any) => r.type === "MATERIAL" || r.type === "DOCUMENT").length || 0;
  const otherCount = (cls.resources?.length || 0) - assignmentsCount - materialsCount;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Component */}
      <Header userEmail={userEmail} />
      
      {/* Main Content */}
      <main className="flex-grow">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{cls.title}</h1>
                <div className="mt-2 flex items-center text-indigo-100">
                  <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="mr-4">{cls.teacher?.name ?? cls.teacher?.email}</span>
                  <span className="mr-4">•</span>
                  <span>{cls.term} {cls.subterm ? `• ${cls.subterm}` : ""}</span>
                </div>
                <div className="mt-2 flex items-center">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium text-black">
                    Class Code: <strong>{cls.code}</strong>
                  </span>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="mt-6 md:mt-0 grid grid-cols-3 gap-4 text-black">
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{assignmentsCount}</div>
                  <div className="text-xs text-indigo-600">Assignments</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{materialsCount}</div>
                  <div className="text-xs text-indigo-600">Others (e.g videos)</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{otherCount}</div>
                  <div className="text-xs text-indigo-600">Notes Resources</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "resources"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("resources")}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Resources
                </div>
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "deadlines"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("deadlines")}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upcoming Deadlines
                </div>
              </button>
              {user?.role === "STUDENT" && (
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "progress"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("progress")}
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    My Progress
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Resources Tab */}
          {activeTab === "resources" && (
            <div>
              {totalResources === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resources yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Resources will appear here once they're added.</p>
                  {canUpload && (
                    <button
                      onClick={scrollToUploadForm}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
                    >
                      Add First Resource
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Resource count and items per page selector */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resources</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Showing {indexOfFirstResource + 1}-{Math.min(indexOfLastResource, totalResources)} of {totalResources} resources
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1); // Reset to first page when changing items per page
                        }}
                        className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                      </select>
                      <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
                    </div>
                  </div>

                  {/* Resources Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {currentResources.map((res: any) => (
                      <div key={res.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden">
                        <div className={`h-2 ${res.type === "ASSIGNMENT" ? "bg-red-500" : res.type === "HOMEWORK" ? "bg-orange-500" : res.type === "NOTE" ? "bg-green-500" : res.type === "VIDEO" ? "bg-purple-500" : "bg-indigo-500"}`}></div>
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg ${res.type === "ASSIGNMENT" ? "bg-red-100" : res.type === "HOMEWORK" ? "bg-orange-100" : res.type === "NOTE" ? "bg-green-100" : res.type === "VIDEO" ? "bg-purple-100" : "bg-indigo-100"}`}>
                                {res.type === "ASSIGNMENT" || res.type === "HOMEWORK" ? (
                                  <svg className={`h-6 w-6 ${res.type === "ASSIGNMENT" ? "text-red-600" : "text-orange-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                ) : res.type === "NOTE" ? (
                                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                ) : res.type === "VIDEO" ? (
                                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{res.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {res.type.toUpperCase()} • {Math.round(res.size / 1024)} KB
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="">
                           
                            {/* Actions area inside each resource card */}
                              <div className="bg-gray-50 rounded-b-xl p-4 mt-4">
                                {/* Actions area inside each resource card */}
                                <div className="flex items-center justify-between">
                                  {/* Main Action: View (styled as a button) */}
                                  <a
                                    href={res.filePath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Open File
                                  </a>

                                  {/* Conditional Actions */}
                                  <div className="flex items-center space-x-3">
                                    {/* Student: Submit Button with Gradient */}
                                    {user && user.role === "STUDENT" && (res.type === "ASSIGNMENT" || res.type === "HOMEWORK") && (
                                      <button
                                        className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        onClick={() => setSubmittingResource(res)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Submit
                                      </button>
                                    )}

                                    {/* Teacher/Admin: Toggle Submissions Panel */}
                                    {canUpload && (res.type === "ASSIGNMENT" || res.type === "HOMEWORK") && (
                                      <button
                                        onClick={() => setOpenSubmissionsFor(openSubmissionsFor === res.id ? null : res.id)}
                                        className={`inline-flex items-center font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 ${
                                          openSubmissionsFor === res.id
                                            ? 'bg-white text-indigo-600 shadow-md'
                                            : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900'
                                        }`}
                                        aria-expanded={openSubmissionsFor === res.id}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {openSubmissionsFor === res.id ? "Hide" : "Submissions"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                            {/* After that button (still inside the mapping), conditionally render panel */}
                            {canUpload && openSubmissionsFor === res.id && (
                              <div className="mt-4">
                                <TeacherSubmissionsPanel resourceId={res.id} refreshKey={refreshKey} initialPageSize={2} />
                              </div>
                            )}

                          </div>
                          
                        </div>
                        
                      </div>
                      
                    ))}
                  </div>
                   
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Previous button */}
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === 1
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Page numbers */}
                        {pageNumbers.map((page, index) => (
                          <div key={index}>
                            {page === '...' ? (
                              <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
                            ) : (
                              <button
                                onClick={() => paginate(page as number)}
                                className={`px-3 py-2 rounded-md text-sm font-medium ${
                                  currentPage === page
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                {page}
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Next button */}
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === totalPages
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Upcoming Deadlines Tab */}
          {activeTab === "deadlines" && (
            <div>
              {upcomingDeadlines.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming deadlines</h3>
                  <p className="text-gray-500 dark:text-gray-400">Assignment deadlines will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline: any, index: number) => (
                    <div key={deadline.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
                      <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 rounded-lg p-3">
                        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{deadline.title}</h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Due {deadline.dueDate ? format(new Date(deadline.dueDate), "MMM d, yyyy") : "No due date"}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {user && user.role === "STUDENT" && (
                          <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
                            onClick={() => setSubmittingResource(deadline)}
                          >
                            Submit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Student Progress Tab */}
          {activeTab === "progress" && user?.role === "STUDENT" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Progress</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignments Completed</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">5/8</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '62.5%' }}></div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Submissions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-green-100 dark:bg-green-900 rounded-full p-1 mr-3">
                          <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Introduction to React</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Submitted on Oct 15, 2023</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Grade: A</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-green-100 dark:bg-green-900 rounded-full p-1 mr-3">
                          <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">CSS Grid and Flexbox</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Submitted on Oct 10, 2023</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Grade: B+</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-1 mr-3">
                          <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">JavaScript Fundamentals</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Submitted on Oct 5, 2023</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Resource Section for Teachers/Admins */}
          {canUpload && classId && (
            <div ref={uploadFormRef} className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Upload Resource</h2>
              </div>
              <div className="p-6">
                <UploadResourceForm 
                  classId={classId} 
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Upload Resource Section for Teachers/Admins */}
      {canUpload && classId && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={scrollToUploadForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Submit Assignment Modal */}
{submittingResource && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md transform transition-all">
      {/* Modal Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit Assignment</h2>
          </div>
          <button
            onClick={() => setSubmittingResource(null)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Modal Body */}
      <div className="p-6">
        {/* Assignment Info Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                {submittingResource.title.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {submittingResource.title}
              </h3>
              <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {submittingResource.type.toUpperCase()}
                </span>
                <span className="ml-2">
                  {Math.round(submittingResource.size / 1024)} KB
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add your work below.
          </p>
        </div>
        
        {/* Form */}
        <div className="space-y-4">
          <SubmitAssignmentForm
            resourceId={submittingResource.id}
            onSubmitSuccess={() => setSubmittingResource(null)}
          />
        </div>
        
        {/* Action Buttons */}
        {/* <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSubmittingResource(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="submit-assignment-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Submit
          </button>
        </div> */}
      </div>
    </div>
  </div>
)}
    </div>
  );
}