import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { maintenanceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MaintenanceList = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = user?.role === 'tenant' 
        ? await maintenanceAPI.getMyRequests()
        : await maintenanceAPI.getAllRequests();
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (e) => {
    e.preventDefault();
    try {
      await maintenanceAPI.createRequest(formData);
      setShowCreateForm(false);
      setFormData({ title: '', description: '' });
      fetchRequests();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
    }
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      await maintenanceAPI.updateStatus(requestId, { status: newStatus });
      fetchRequests();
      if (selectedRequest?.id === requestId) {
        const updatedRequest = await maintenanceAPI.getRequest(requestId);
        setSelectedRequest(updatedRequest.data.data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Wrench className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'status-open';
      case 'pending': return 'status-pending';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      default: return 'status-open';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Requests List */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Maintenance Requests</h3>
            {user?.role === 'tenant' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>
            )}
          </div>

          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No maintenance requests found</p>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="maintenance-item cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className={`status-badge ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1">{request.title}</h4>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{request.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{request.tenant_name}</span>
                    </div>
                    {request.assigned_name && (
                      <span>Assigned to: {request.assigned_name}</span>
                    )}
                  </div>

                  {user?.role !== 'tenant' && (
                    <div className="flex space-x-2 mt-3">
                      {request.status !== 'in_progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(request.id, 'in_progress');
                          }}
                          className="btn btn-outline text-xs"
                        >
                          Start Work
                        </button>
                      )}
                      {request.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(request.id, 'completed');
                          }}
                          className="btn btn-outline text-xs"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Request Details / Create Form */}
      <div>
        {showCreateForm ? (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Maintenance Request</h3>
            <form onSubmit={createRequest} className="space-y-4">
              <div>
                <label className="form-label">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  rows="4"
                  placeholder="Detailed description of the maintenance issue"
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : selectedRequest ? (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Status</label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedRequest.status)}
                  <span className={`status-badge ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">Title</label>
                <p className="text-gray-900 font-medium">{selectedRequest.title}</p>
              </div>

              <div>
                <label className="form-label">Description</label>
                <p className="text-gray-700">{selectedRequest.description}</p>
              </div>

              <div>
                <label className="form-label">Submitted By</label>
                <p className="text-gray-700">{selectedRequest.tenant_name}</p>
              </div>

              {selectedRequest.assigned_name && (
                <div>
                  <label className="form-label">Assigned To</label>
                  <p className="text-gray-700">{selectedRequest.assigned_name}</p>
                </div>
              )}

              <div>
                <label className="form-label">Submitted</label>
                <p className="text-gray-700">
                  {new Date(selectedRequest.created_at).toLocaleDateString()} at{' '}
                  {new Date(selectedRequest.created_at).toLocaleTimeString()}
                </p>
              </div>

              {user?.role !== 'tenant' && selectedRequest.status !== 'completed' && (
                <div className="pt-4 border-t">
                  <label className="form-label">Update Status</label>
                  <div className="space-y-2">
                    {selectedRequest.status !== 'in_progress' && (
                      <button
                        onClick={() => updateStatus(selectedRequest.id, 'in_progress')}
                        className="btn btn-outline w-full"
                      >
                        Mark as In Progress
                      </button>
                    )}
                    {selectedRequest.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(selectedRequest.id, 'completed')}
                        className="btn btn-primary w-full"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Request Selected</h3>
              <p className="text-gray-600 mb-4">
                Select a maintenance request to view details or create a new one.
              </p>
              {user?.role === 'tenant' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Create New Request
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceList;
