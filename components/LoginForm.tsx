// app/components/LoginForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [err, setErr] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); // clear previous errors

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // keep cookie-based auth behaviour
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error || 'Login failed');
        return;
      }

      // Expecting data.user.role to exist; fall back to general dashboard
      const role = data?.user?.role ?? null;

      if (role === 'ADMIN') router.push('/dashboard/admin');
      else if (role === 'TEACHER') router.push('/dashboard/teacher');
      else if (role === 'STUDENT') router.push('/dashboard/student');
      else router.push('/dashboard'); // fallback

    } catch (error: any) {
      console.error('Login error', error);
      setErr('An unexpected error occurred. Please try again.');
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen flex h-screen">
      {/* Left Column - Image Carousel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-black opacity-20"></div>

        {/* Carousel Images */}
        <div className="relative h-full w-full">
          <div
            className="flex h-full transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            <div className="min-w-full h-full">
              <img
                src="https://picsum.photos/seed/login1/800/1200.jpg"
                alt="Slide 1"
                className="object-cover h-full w-full"
              />
            </div>
            <div className="min-w-full h-full">
              <img
                src="https://picsum.photos/seed/login2/800/1200.jpg"
                alt="Slide 2"
                className="object-cover h-full w-full"
              />
            </div>
            <div className="min-w-full h-full">
              <img
                src="https://picsum.photos/seed/login3/800/1200.jpg"
                alt="Slide 3"
                className="object-cover h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index ? 'bg-white w-8' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
          <h1 className="text-4xl font-bold mb-4 text-center">Welcome Back</h1>
          <p className="text-xl text-center max-w-md">Sign in to access your personalized dashboard and continue your journey with us.</p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 h-full overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
            <p className="text-gray-600">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow-lg">
            {err && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
                {err}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                required
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
            >
              Sign In
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </a>
              </p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Your Company. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
