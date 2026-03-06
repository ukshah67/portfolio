import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, Users, X } from 'lucide-react';

interface UserData {
    _id: string;
    username: string;
    role: string;
    portfolioOwnerName?: string;
    createdAt?: string;
}

interface AdminPanelProps {
    onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const { token, isAdmin } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New user form state
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newOwner, setNewOwner] = useState('');
    const [creating, setCreating] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'https://portfolio-backend-6tqz.onrender.com';

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/portfolio-auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setCreating(true);

        try {
            const response = await fetch(`${API_URL}/api/portfolio-auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    portfolioOwnerName: newOwner
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create user');

            setSuccessMsg(`User ${newUsername} successfully created!`);
            setNewUsername('');
            setNewPassword('');
            setNewOwner('');
            fetchUsers(); // Refresh list

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center px-6">
                    <div className="flex items-center space-x-2">
                        <Shield className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold">Admin Management Panel</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50">

                    {/* Left Col: Create User Form */}
                    <div className="md:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
                        <div className="flex items-center space-x-2 mb-4 text-slate-800">
                            <UserPlus size={20} className="text-blue-600" />
                            <h3 className="font-semibold">Create New User</h3>
                        </div>

                        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">{error}</div>}
                        {successMsg && <div className="text-sm text-green-700 bg-green-50 p-2 rounded mb-4 border border-green-200">{successMsg}</div>}

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Login Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={newUsername}
                                    onChange={e => setNewUsername(e.target.value)}
                                    placeholder="e.g. jsmith"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Login Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Secure password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Portfolio Owner Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={newOwner}
                                    onChange={e => setNewOwner(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    title="This user will ONLY see stocks associated with this owner name."
                                />
                                <p className="text-xs text-slate-400 mt-1">Links this login to a specific portfolio owner.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-2"
                            >
                                {creating ? 'Creating...' : 'Create Account'}
                            </button>
                        </form>
                    </div>

                    {/* Right Col: User List */}
                    <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center space-x-2 text-slate-800">
                                <Users size={20} className="text-slate-600" />
                                <h3 className="font-semibold">Registered Users</h3>
                            </div>
                            <span className="text-sm text-slate-500">{users.length} Total</span>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading users...</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-3 pl-4 font-medium">Username</th>
                                            <th className="p-3 font-medium">Role</th>
                                            <th className="p-3 font-medium">Linked Owner</th>
                                            <th className="p-3 font-medium">Created On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm p-4 divide-y divide-slate-100">
                                        {users.map(user => (
                                            <tr key={user._id} className="hover:bg-slate-50">
                                                <td className="p-3 pl-4 font-medium text-slate-800 flex items-center gap-2">
                                                    {user.username}
                                                    {user.role === 'admin' && <Shield size={14} className="text-amber-500" />}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                                        {user.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-600">
                                                    {user.portfolioOwnerName || <span className="text-slate-400 italic">None (Admin)</span>}
                                                </td>
                                                <td className="p-3 text-slate-500">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
