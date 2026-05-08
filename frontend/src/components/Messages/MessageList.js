import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, User, Clock } from 'lucide-react';
import { messagesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MessageList = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageType, setMessageType] = useState('all'); // 'all', 'sent', 'received'

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchConversation(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getMessages(messageType);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await messagesAPI.getAllUsers();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchConversation = async (userId) => {
    try {
      const response = await messagesAPI.getConversation(userId);
      setConversation(response.data.data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSendingMessage(true);
      const response = await messagesAPI.sendMessage({
        receiver_id: selectedUser.id,
        subject: 'Message',
        content: newMessage
      });

      setConversation([...conversation, response.data.data]);
      setNewMessage('');
      
      // Refresh messages list
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      message.content?.toLowerCase().includes(searchLower) ||
      message.sender_name?.toLowerCase().includes(searchLower) ||
      message.receiver_name?.toLowerCase().includes(searchLower);
    
    return matchesSearch;
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Messages List */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
            <div className="flex space-x-2">
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="form-input text-sm"
              >
                <option value="all">All Messages</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages found</p>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message-item cursor-pointer ${
                    !message.read_at && message.receiver_id === user.id ? 'unread' : ''
                  }`}
                  onClick={() => setSelectedUser(
                    message.sender_id === user.id 
                      ? { id: message.receiver_id, name: message.receiver_name }
                      : { id: message.sender_id, name: message.sender_name }
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {message.sender_id === user.id ? `To: ${message.receiver_name}` : `From: ${message.sender_name}`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{message.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Conversation/Compose */}
      <div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedUser ? `Conversation with ${selectedUser.name}` : 'Start Conversation'}
          </h3>

          {!selectedUser ? (
            <div>
              <p className="text-gray-600 mb-4">Select a user to start messaging:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="border rounded-lg p-4 mb-4 h-64 overflow-y-auto bg-gray-50">
                {conversation.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet</p>
                ) : (
                  conversation.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 ${
                        message.sender_id === user.id ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block max-w-xs p-3 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="form-input flex-1"
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="btn btn-primary"
                >
                  {sendingMessage ? (
                    <div className="loading-spinner" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-outline w-full mt-2"
              >
                Back to User List
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageList;
