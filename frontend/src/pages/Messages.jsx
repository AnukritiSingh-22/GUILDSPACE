// src/pages/Messages.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { fetchConversations, fetchMessages, sendMessage, searchUsers, fetchPublicProfile } from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./Messages.css";

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const newToUserId = searchParams.get("to");
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  
  // New Message Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  const [otherUserHeader, setOtherUserHeader] = useState(null);

  // Fetch initial conversations
  useEffect(() => {
    let mounted = true;
    fetchConversations().then(data => {
      if(mounted) {
        setConversations(data || []);
        setLoadingConvos(false);
      }
    }).catch(err => {
      console.error(err);
      if(mounted) setLoadingConvos(false);
    });
    return () => mounted = false;
  }, []);

  // Fetch messages when conversationId changes
  useEffect(() => {
    let mounted = true;
    if (conversationId) {
      setLoadingMessages(true);
      fetchMessages(conversationId).then(data => {
        if(mounted) {
          setMessages(data || []);
          setLoadingMessages(false);
          // Find other user details from conversations if available
          const conv = conversations.find(c => String(c.id) === String(conversationId));
          if (conv && conv.other_user) {
            setOtherUserHeader(conv.other_user);
          }
        }
      }).catch(err => {
        console.error(err);
        if(mounted) setLoadingMessages(false);
      });
    } else {
      setMessages([]);
      setOtherUserHeader(null);
    }
    return () => mounted = false;
  }, [conversationId, conversations]);

  // If new message flow, fetch user profile for header
  useEffect(() => {
    let mounted = true;
    if (!conversationId && newToUserId) {
      fetchPublicProfile(newToUserId).then(data => {
        if(mounted) setOtherUserHeader(data);
      }).catch(console.error);
    }
    return () => mounted = false;
  }, [conversationId, newToUserId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(() => {
      searchUsers(searchQuery).then(data => setSearchResults(data || [])).catch(console.error);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const content = inputValue;
    setInputValue("");
    
    // Optimistic UI for existing conversation
    let tempMsgId = null;
    if (conversationId) {
      tempMsgId = "temp-" + Date.now();
      const tempMsg = {
        id: tempMsgId,
        content,
        created_at: new Date().toISOString(),
        sender_id: user?.id
      };
      setMessages(prev => [...prev, tempMsg]);
    }
    
    try {
      // We need recipientId. If conversationId, find other_user from conversatons list.
      let targetUserId = newToUserId;
      if (!targetUserId && conversationId) {
        const conv = conversations.find(c => String(c.id) === String(conversationId));
        if (conv) targetUserId = conv.other_user?.id;
      }
      
      const newMsg = await sendMessage(targetUserId, content);
      
      if (!conversationId) {
        // Must fetch conversations to get the new conversation ID and redirect
        const latestConvos = await fetchConversations();
        setConversations(latestConvos || []);
        // Find conversation with this user
        const newConv = latestConvos.find(c => String(c.other_user?.id) === String(targetUserId));
        if (newConv) {
          navigate(`/messages/${newConv.id}`);
        }
      } else {
        // Replace temp msg with real or fetch messages again
        setMessages(prev => prev.map(m => m.id === tempMsgId ? newMsg : m));
        // Refetch convos to update last message preview
        const latestConvos = await fetchConversations();
        setConversations(latestConvos || []);
      }
    } catch (err) {
      console.error(err);
      // fallback handled if we wanted
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach(msg => {
    const msgDateStr = new Date(msg.created_at).toDateString();
    if (msgDateStr !== lastDate) {
      groupedMessages.push({ type: 'separator', date: msg.created_at, id: `sep-${msgDateStr}` });
      lastDate = msgDateStr;
    }
    groupedMessages.push({ type: 'message', ...msg });
  });

  return (
    <div className="messages-layout">
      {/* LEFT PANEL: Conversation List */}
      <aside className="messages-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2>Messages</h2>
            <button className="new-message-btn" onClick={() => setIsSearching(!isSearching)}>
              {isSearching ? 'Close' : 'New +'}
            </button>
          </div>
          {isSearching && (
            <div className="new-message-search">
              <input 
                type="text" 
                placeholder="Search user by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map(res => (
                    <div 
                      key={res.id} 
                      className="search-user-item"
                      onClick={() => {
                        navigate(`/messages/new?to=${res.id}`);
                        setIsSearching(false);
                        setSearchQuery("");
                      }}
                    >
                      <img src={res.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + res.id} alt="avatar" />
                      <span>{res.full_name || res.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="conversation-list">
          {loadingConvos && <div className="p-4 text-hint text-center pt-4">Loading conversations...</div>}
          {!loadingConvos && conversations.length === 0 && (
            <div className="empty-state">No conversations yet.<br/>Start by searching a user!</div>
          )}
          {conversations.map(conv => {
            const isActive = String(conv.id) === String(conversationId);
            const other = conv.other_user || {};
            const lastMsg = conv.last_message || {};
            const preview = lastMsg.content || "";
            const truncPreview = preview.length > 40 ? preview.substring(0, 40) + "..." : preview;
            
            return (
              <div 
                key={conv.id} 
                className={`conversation-row ${isActive ? 'active' : ''}`}
                onClick={() => navigate(`/messages/${conv.id}`)}
              >
                <img 
                  className="conv-avatar" 
                  src={other.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + other.id} 
                  alt="avatar" 
                />
                <div className="conv-details">
                  <div className="conv-top-row">
                    <span className="conv-name">{other.full_name || other.username}</span>
                    <span className="conv-time">{formatTimeAgo(lastMsg.created_at)}</span>
                  </div>
                  <div className="conv-bottom-row">
                    <span className="conv-preview">{truncPreview}</span>
                    {conv.unread_count > 0 && <span className="conv-unread">{conv.unread_count}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT PANEL: Message Thread */}
      <main className="messages-thread">
        {(!conversationId && !newToUserId) ? (
          <div className="thread-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose an existing conversation or start a new one.</p>
          </div>
        ) : (
          <div className="thread-active">
            <div className="thread-header">
              <div className="header-user-info">
                {otherUserHeader && (
                  <>
                    <img 
                      className="header-avatar" 
                      src={otherUserHeader.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + otherUserHeader.id} 
                      alt="avatar"
                    />
                    <h3>{otherUserHeader.full_name || otherUserHeader.username}</h3>
                  </>
                )}
              </div>
              {otherUserHeader && (
                <Link to={`/user/${otherUserHeader.id}`} className="view-profile-link">
                  View Profile
                </Link>
              )}
            </div>

            <div className="messages-list">
              {loadingMessages ? (
                <div className="p-4 text-hint text-center">Loading messages...</div>
              ) : (
                <>
                  {groupedMessages.map((item) => {
                    if (item.type === 'separator') {
                      return (
                        <div key={item.id} className="date-separator">
                          <span>{formatDateSeparator(item.date)}</span>
                        </div>
                      );
                    }
                    
                    const isMine = String(item.sender_id) === String(user?.id);
                    return (
                      <div key={item.id} className={`message-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                        <div className="message-bubble">
                          {item.content}
                        </div>
                        <span className="message-time">{formatMessageTime(item.created_at)}</span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="message-input-area">
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="message-input"
              />
              <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
