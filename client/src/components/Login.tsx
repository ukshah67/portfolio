import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [slowLogin, setSlowLogin] = useState(false); // To detect Render cold starts
    const { login } = useAuth();

    const API_URL = import.meta.env.VITE_API_URL || 'https://portfolio-backend-6tqz.onrender.com';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSlowLogin(false);

        // Render free tier spins down after 15 minutes. Warn user if it's taking >3s to wake up.
        const coldStartTimer = setTimeout(() => {
            setSlowLogin(true);
        }, 3000);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to login');
            }

            login(data.token, data.user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            clearTimeout(coldStartTimer);
            setLoading(false);
            setSlowLogin(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 p-8">
                <div className="text-center mb-8 relative">
                    <div className="absolute -top-4 -right-4 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white shadow-sm">
                        v1.6
                    </div>
                    <div className="mx-auto bg-blue-600 p-3 rounded-xl inline-block mb-4 text-white shadow-md shadow-blue-200">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Portfolio Portal</h2>
                    <p className="text-slate-500 text-sm mt-1">Please sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    {slowLogin && (
                        <div className="text-center mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
                            <p className="text-amber-700 text-sm font-medium">
                                Please wait .... it may take 40-45 seconds
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
