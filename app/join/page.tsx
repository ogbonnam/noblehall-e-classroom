// // app/join/page.tsx
// 'use client';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function JoinPage() {
//   const [code, setCode] = useState('');
//   const [classId, setClassId] = useState('');
//   const [msg, setMsg] = useState('');
//   const router = useRouter();

//   async function findClass() {
//     // find class by code: implement API /api/classes/find?code=...
//     const res = await fetch(`/api/classes/find?code=${encodeURIComponent(code)}`);
//     const data = await res.json();
//     if (!res.ok) return setMsg(data.error || 'Not found');
//     setClassId(data.class.id);
//   }

//   async function join() {
//     if (!classId) return setMsg('Find class first');
//     const res = await fetch(`/api/classes/${classId}/join`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ code }),
//       credentials: 'include',
//     });
//     const data = await res.json();
//     if (!res.ok) return setMsg(data.error || 'Failed to join');
//     router.push(`/classes/${classId}`);
//   }

//   return (
//     <div className="max-w-md mx-auto p-4">
//       <input className="input" placeholder="Enter class code" value={code} onChange={e=>setCode(e.target.value)} />
//       <div className="flex gap-2 mt-2">
//         <button onClick={findClass} className="btn">Find</button>
//         <button onClick={join} className="btn">Join</button>
//       </div>
//       {msg && <p className="text-red-600 mt-2">{msg}</p>}
//     </div>
//   );
// }


'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [classId, setClassId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundClass, setFoundClass] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();

  // Fetch user information on component mount
  useState(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            setUserEmail(data.email);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setUserEmail("student@example.com");
      }
    };
    
    fetchUserInfo();
  });

  async function findClass() {
    if (!code.trim()) {
      setMsg('Please enter a class code');
      return;
    }
    
    setLoading(true);
    setMsg('');
    setFoundClass(null);
    
    try {
      const res = await fetch(`/api/classes/find?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      
      if (!res.ok) {
        setMsg(data.error || 'Class not found');
        return;
      }
      
      setFoundClass(data.class);
      setClassId(data.class.id);
      setMsg('');
    } catch (error) {
      console.error('Error finding class:', error);
      setMsg('An error occurred while finding the class');
    } finally {
      setLoading(false);
    }
  }

  async function join() {
    if (!classId) {
      setMsg('Find class first');
      return;
    }
    
    setLoading(true);
    setMsg('');
    
    try {
      const res = await fetch(`/api/classes/${classId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMsg(data.error || 'Failed to join class');
        return;
      }
      
      // Success - redirect to class page
      router.push(`/classes/${classId}`);
    } catch (error) {
      console.error('Error joining class:', error);
      setMsg('An error occurred while joining the class');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header userEmail={userEmail || "User"} />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div className="mb-8 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join a Class</h1>
            <p className="text-gray-600 dark:text-gray-400">Enter the class code provided by your teacher</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="class-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class Code
              </label>
              <input
                id="class-code"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter class code"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && findClass()}
              />
            </div>
            
            <button
              onClick={findClass}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding...
                </>
              ) : (
                'Find Class'
              )}
            </button>
            
            {foundClass && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Class Found</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {foundClass.title.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{foundClass.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Term: {foundClass.term} {foundClass.subterm ? `• ${foundClass.subterm}` : ''}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={join}
                  disabled={loading}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </>
                  ) : (
                    'Join Class'
                  )}
                </button>
              </div>
            )}
            
            {msg && (
              <div className={`p-4 rounded-lg ${msg.includes('not found') || msg.includes('error') ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
                <p className={`text-sm ${msg.includes('not found') || msg.includes('error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{msg}</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Don't have a class code? Ask your teacher for one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}