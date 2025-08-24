import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaPaperPlane, FaEllipsisV, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.partner._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/api/messages/conversations');
      setConversations(data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const { data } = await api.get(`/api/messages/conversation/${userId}`);
      setMessages(data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation || sending) return;

    setSending(true);
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('receiverId', selectedConversation._id);
      
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      }
      
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessages(prev => [...prev, response.data.data]);
        setNewMessage('');
        setSelectedFiles([]);
        // Update conversation list to show this as the latest message
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await api.get(`/api/messages/search?query=${encodeURIComponent(query)}`);
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startNewConversation = (user) => {
    const newConversation = {
      partner: user,
      lastMessage: null,
      unreadCount: 0
    };
    setSelectedConversation(newConversation);
    setMessages([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const deleteConversation = async (partnerId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await api.delete(`/api/messages/conversation/${partnerId}`);
      setConversations(prev => prev.filter(conv => conv.partner._id !== partnerId));
      if (selectedConversation?.partner._id === partnerId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      alert('Error deleting conversation: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="messages-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Left Panel - Conversations List */}
        <div className={`conversations-panel ${selectedConversation ? 'hidden-mobile' : ''}`}>
          <div className="conversations-header">
            <h2>Messages</h2>
          </div>

          <div className="search-section">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="search-input"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    className="search-result-item"
                    onClick={() => startNewConversation(user)}
                  >
                    <div className="user-avatar">
                      <img 
                        src={user.profileImage || 'https://via.placeholder.com/40'} 
                        alt={user.name}
                      />
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-type">{user.userType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map(conversation => (
                <div
                  key={conversation.conversationId}
                  className={`conversation-item ${selectedConversation?.partner._id === conversation.partner._id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    <img 
                      src={conversation.partner.profileImage || 'https://via.placeholder.com/50'} 
                      alt={conversation.partner.name}
                    />
                    {conversation.unreadCount > 0 && (
                      <span className="unread-badge">{conversation.unreadCount}</span>
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="partner-name">{conversation.partner.name}</span>
                      <span className="message-time">
                        {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="last-message">
                      {conversation.lastMessage ? (
                        <span className={conversation.unreadCount > 0 ? 'unread' : ''}>
                          {conversation.lastMessage.senderId === user._id ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </span>
                      ) : (
                        <span className="no-messages">No messages yet</span>
                      )}
                    </div>
                  </div>
                  <div className="conversation-actions">
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.partner._id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-conversations">
                <p>No conversations yet</p>
                <p>Search for users to start messaging</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className={`chat-panel ${!selectedConversation ? 'hidden-mobile' : ''}`}>
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <button 
                  className="back-btn mobile-only"
                  onClick={() => setSelectedConversation(null)}
                >
                  <FaArrowLeft />
                </button>
                <div className="chat-partner-info">
                  <img 
                    src={selectedConversation.partner.profileImage || 'https://via.placeholder.com/40'} 
                    alt={selectedConversation.partner.name}
                    className="partner-avatar"
                  />
                  <div>
                    <h3>{selectedConversation.partner.name}</h3>
                    <span className="partner-status">Online</span>
                  </div>
                </div>
                <button className="more-options">
                  <FaEllipsisV />
                </button>
              </div>

              <div className="messages-container-chat">
                {messages.map((message) => (
                  <div 
                    key={message._id} 
                    className={`message ${message.sender.id === user._id ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">
                      <div className="message-content">
                        {message.content}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="message-attachments">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="attachment">
                                {attachment.type === 'image' ? (
                                  <img 
                                    src={`http://localhost:5000${attachment.url}`} 
                                    alt={attachment.originalName}
                                    className="attachment-image"
                                  />
                                ) : attachment.type === 'video' ? (
                                  <video 
                                    src={`http://localhost:5000${attachment.url}`} 
                                    controls
                                    className="attachment-video"
                                  />
                                ) : (
                                  <a 
                                    href={`http://localhost:5000${attachment.url}`}
                                    download={attachment.originalName}
                                    className="attachment-document"
                                  >
                                    📄 {attachment.originalName}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* File preview section */}
              {selectedFiles.length > 0 && (
                <div className="file-preview">
                  <div className="file-preview-header">
                    <span>Selected files:</span>
                  </div>
                  <div className="file-preview-list">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-preview-item">
                        <span className="file-name">{file.name}</span>
                        <button 
                          type="button"
                          onClick={() => removeFile(index)}
                          className="remove-file-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="message-input-form">
                <div className="message-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                    disabled={sending}
                  />
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="file-input"
                    id="file-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-input" className="file-btn">
                    📎
                  </label>
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                  >
                    {uploading ? '⏳' : <FaPaperPlane />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
