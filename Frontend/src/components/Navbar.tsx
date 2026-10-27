import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link2, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-blue-600 font-bold text-xl">
          <Link2 className="w-6 h-6" />
          <span>URL Analytics</span>
        </Link>
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span>{user.email}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex space-x-3 text-sm">
            <Link to="/login" className="px-3 py-1.5 text-slate-600 hover:text-slate-900">Login</Link>
            <Link to="/register" className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}