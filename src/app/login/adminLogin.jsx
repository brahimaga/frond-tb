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
      const response = await fetch('http://192.168.1.109:8002/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/lakis');

    } catch (err) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-100 to-red-700">
      <div className="max-w-md w-full p-8 bg-white/100  text-black backdrop-blur-md ring-1 ring-white/5 rounded-3xl shadow-xl">
        <div className="flex justify-center mb-8">
          <Image 
            src="/logoDarsmok.webp" 
            alt="Company Logo" 
            width={140} 
            height={140}
            className="object-contain"
            priority
          />
        </div>
        
        <h2 className="text-3xl font-bold text-center text-black mb-8">Login</h2>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 text-red-100 rounded-lg text-sm border border-red-500/30">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-black/80 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-white/10 rounded-[40px] focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-black placeholder-white/50"
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black/80 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-white/10 rounded-[40px] focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-black placeholder-white/50"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-[40px] font-semibold transition-all duration-200 ${
              isLoading 
                ? 'bg-black cursor-not-allowed' 
                : 'bg-black hover:bg-grey-1 00 focus:ring-2 focus:ring-green-400 focus:ring-offset-2'
            } text-white`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}