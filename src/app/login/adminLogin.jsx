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
      router.push('/lakis');
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
      style={{ backgroundImage: "url('/background2.jpg')" }} // ضع الصورة داخل public/background.jpg
    >
      <div className="max-w-md w-full p-8 bg-white/10 text-black backdrop-blur-lg rounded-3xl shadow-[30px]">
        <div className="flex justify-center mb-6">
          <Image
            src="/logoDarsmok.webp"
            alt="Company Logo"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-3xl font-extrabold text-center mb-6">Login to Your Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-gray-100 text-black rounded-full border border-gray-200 focus:ring-2 focus:ring-green-400 focus:outline-none placeholder-gray-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-gray-100 text-black rounded-full border border-gray-200 focus:ring-2 focus:ring-green-400 focus:outline-none placeholder-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-full text-white font-semibold transition-all duration-200 ${
              isLoading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-black hover:bg-gray-900 focus:ring-2 focus:ring-green-400 focus:ring-offset-2'
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
