import React, { useEffect, useState } from 'react';
import { MessageSquare, Wrench, TrendingUp, Clock } from 'lucide-react';
import { messagesAPI, maintenanceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    maintenanceRequests: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'tenant') {
        // Fetch tenant-specific data
        const [messagesResponse, maintenanceResponse] = await Promise.all([
          messagesAPI.getMessages('received'),
          maintenanceAPI.getMyRequests(),
        ]);

        const messages = messagesResponse.data.data;
        const maintenance = maintenanceResponse.data.data;

        setStats({
          totalMessages: messages.length,
          unreadMessages: messages.filter(m => !m.read_at).length,
          maintenanceRequests: maintenance.length,
          pendingRequests: maintenance.filter(r => r.status === 'open' || r.status === 'pending').length,
        });
      } else {
        // Fetch admin/landlord data
        const [messagesResponse, maintenanceResponse] = await Promise.all([
          messagesAPI.getMessages(),
          maintenanceAPI.getAllRequests(),
        ]);

        const messages = messagesResponse.data.data;
        const maintenance = maintenanceResponse.data.data;

        setStats({
          totalMessages: messages.length,
          unreadMessages: messages.filter(m => !m.read_at).length,
          maintenanceRequests: maintenance.length,
          pendingRequests: maintenance.filter(r => r.status === 'open' || r.status === 'pending').length,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color = 'blue' }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`bg-${color}-100 rounded-full p-3 mr-4`}>
          <Icon className={`h-6 w-6 text-${color}-500`} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your {user?.role === 'tenant' ? 'rental' : 'property management'} today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={MessageSquare}
          title="Total Messages"
          value={stats.totalMessages}
          color="blue"
        />
        <StatCard
          icon={MessageSquare}
          title="Unread Messages"
          value={stats.unreadMessages}
          color="red"
        />
        <StatCard
          icon={Wrench}
          title="Maintenance Requests"
          value={stats.maintenanceRequests}
          color="green"
        />
        <StatCard
          icon={Clock}
          title="Pending Requests"
          value={stats.pendingRequests}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {user?.role === 'tenant' ? (
              <>
                <button className="btn btn-primary w-full justify-center">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </button>
                <button className="btn btn-outline w-full justify-center">
                  <Wrench className="h-4 w-4" />
                  Submit Maintenance Request
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary w-full justify-center">
                  <MessageSquare className="h-4 w-4" />
                  View Messages
                </button>
                <button className="btn btn-outline w-full justify-center">
                  <Wrench className="h-4 w-4" />
                  Manage Maintenance Requests
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="bg-blue-100 rounded-full p-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-900">New message received</p>
                <p className="text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="bg-green-100 rounded-full p-2">
                <Wrench className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-gray-900">Maintenance request updated</p>
                <p className="text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="bg-yellow-100 rounded-full p-2">
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-gray-900">New maintenance request</p>
                <p className="text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
