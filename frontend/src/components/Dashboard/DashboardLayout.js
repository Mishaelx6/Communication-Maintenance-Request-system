import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Wrench, Home, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
    ];

    if (user?.role === 'tenant') {
      baseItems.push(
        { path: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
        { path: '/dashboard/maintenance', label: 'Maintenance Requests', icon: Wrench }
      );
    } else {
      baseItems.push(
        { path: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
        { path: '/dashboard/maintenance', label: 'Maintenance Requests', icon: Wrench }
      );
    }

    return baseItems;
  };

  return (
    <div className="dashboard-container flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg min-h-screen">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 rounded-full p-2">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tenant Portal</h1>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {getNavItems().map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link flex items-center space-x-3 w-full mb-2 ${
                  isActive(item.path) ? 'active' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gray-200 rounded-full p-2">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary w-full justify-center text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {getNavItems().find(item => isActive(item.path))?.label || 'Dashboard'}
            </h2>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
