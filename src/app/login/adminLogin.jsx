"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://109.123.252.86:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid username or password');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/caisse');
    } catch (err) {
      setError(err.message || 'Something went wrong');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/backgrund3.jpg')" }}
    >
      <div className="w-full max-w-md p-8 bg-white/25 text-black backdrop-blur-lg rounded-[40px] shadow-2xl">
        <div className="flex justify-center mt-2 mb-6">
          <Image
            src="/logo.svg"
            alt="Company Logo"
            width={181.99}
            height={46.45}
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-2xl text-white text-center mb-6">Login to your account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username field */}
          <div className="relative">
            <img
              className="absolute left-3 top-3 w-6 h-6"
              src="/icona.svg"
              alt="icon"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-100 text-black rounded-full border border-gray-200 focus:ring-2 focus:ring-green-400 focus:outline-none placeholder-gray-500"
            />
          </div>

          {/* Password field */}
          <div className="relative">
            <img
              className="absolute left-3 top-3 w-6 h-6"
              src="/icona.svg"
              alt="icon"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-100 text-black rounded-full border border-gray-200 focus:ring-2 focus:ring-green-400 focus:outline-none placeholder-gray-500"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-full text-white font-semibold transition-all duration-200 ${
              isLoading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-[#E73E2B] hover:bg-gray-900 focus:ring-2 focus:ring-green-400 focus:ring-offset-2'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
