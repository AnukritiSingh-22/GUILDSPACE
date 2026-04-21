// src/pages/Messages.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { fetchConversations, fetchMessages, sendMessage, searchUsers, } from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./Messages.css";

// ── Time helpers — IST aware ───────────────────────────────────────────────
function toIST(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  // Add IST offset (+5:30 = 330 minutes) only if the date doesn't already include timezone
  const istOFFset = 330 * 60 * 1000;
  if (dateString.endsWith("Z") || dateString.match(/[\+\-]\d{2}:\d{2}$/)) {
    return d; // Already in UTC or has timezone, convert to local and then add IST offset
  }
  return new Date(d.getTime() + istOFFset);

}

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = toIST(dateString);
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
  const date = toIST(dateString);
  // Display in IST (India Standard Time)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function formatDateSeparator(dateString) {
  if (!dateString) return '';
  const date = toIST(dateString);
  const now = new Date();

  const dateIST = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const todayIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  todayIST.setHours(0, 0, 0, 0);
  const yesterdayIST = new Date(todayIST); yesterdayIST.setDate(yesterdayIST.getDate() - 1);
  const dateDayIST = new Date(dateIST); dateDayIST.setHours(0, 0, 0, 0);

  if (dateDayIST.getTime() === todayIST.getTime()) return 'Today';
  if (dateDayIST.getTime() === yesterdayIST.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

// ── Avatar placeholder ─────────────────────────────────────────────────────
function UserAvatar({ user, size = 38 }) {
  const initials = (user?.full_name || user?.username || "?").slice(0, 2).toUpperCase();
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={initials} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "rgba(155,111,212,0.15)", border: "1.5px solid rgba(155,111,212,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.floor(size * 0.35), fontWeight: 600, color: "#9B6FD4",
      fontFamily: "var(--font-display)",
    }}>{initials}</div>
  );
}

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const newToUserId = searchParams.get("to");
  const { user } = useAuth();

  const [conversations,   setConversations]   = useState([]);
  const [messages,        setMessages]        = useState([]);
  const [loadingConvos,   setLoadingConvos]   = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue,      setInputValue]      = useState("");
  const [sendError,       setSendError]       = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [isSearching,   setIsSearching]   = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [otherUserHeader, setOtherUserHeader] = useState(null);

  // ── Load conversations ─────────────────────────────────────────────────
  const refreshConvos = useCallback(() => {
    return fetchConversations().then(d => setConversations(d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    refreshConvos().finally(() => setLoadingConvos(false));
  }, []);

  // ── Load messages when conversationId changes ──────────────────────────
  useEffect(() => {
    let mounted = true;
    if (conversationId) {
      setLoadingMessages(true);
      fetchMessages(conversationId).then(data => {
        if (!mounted) return;
        setMessages(data || []);
        setLoadingMessages(false);
        const conv = conversations.find(c => String(c.id) === String(conversationId));
        if (conv?.other_user) setOtherUserHeader(conv.other_user);
      }).catch(() => { if (mounted) setLoadingMessages(false); });
    } else {
      setMessages([]);
      setOtherUserHeader(null);
    }
    return () => { mounted = false; };
  }, [conversationId]);

  // Set header from conversations once they load
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => String(c.id) === String(conversationId));
      if (conv?.other_user) setOtherUserHeader(conv.other_user);
    }
  }, [conversations, conversationId]);

  // ── Fetch profile for new conversation ────────────────────────────────
  // useEffect(() => {
  //   if (!conversationId && newToUserId) {
  //     fetchPublicProfile(newToUserId).then(setOtherUserHeader).catch(() => {});
  //   }
  // }, [conversationId, newToUserId]);

  // ── Auto scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Real-time polling (every 4 seconds when conversation open) ─────────
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      fetchMessages(conversationId).then(data => {
        setMessages(prev => {
          // Only update if there are new messages
          if (data && data.length !== prev.filter(m => !m.id?.startsWith("temp-")).length) {
            return data;
          }
          return prev;
        });
      }).catch(() => {});
      refreshConvos();
    }, 4000);
    return () => clearInterval(interval);
  }, [conversationId, refreshConvos]);

  // ── Search debounce ────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      searchUsers(searchQuery).then(d => setSearchResults(d || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const content = inputValue.trim();
    setInputValue("");
    setSendError("");

    let targetUserId = newToUserId;
    if (!targetUserId && conversationId) {
      const conv = conversations.find(c => String(c.id) === String(conversationId));
      if (conv) targetUserId = conv.other_user?.id;
    }

    // Optimistic UI
    const tempId = "temp-" + Date.now();
    if (conversationId) {
      setMessages(prev => [...prev, {
        id: tempId, content,
        created_at: new Date().toISOString(),
        sender_id: String(user?.id),
      }]);
    }

    try {
      const newMsg = await sendMessage(targetUserId, content);
      if (!conversationId) {
        const convos = await fetchConversations();
        setConversations(convos || []);
        const newConv = convos?.find(c => String(c.other_user?.id) === String(targetUserId));
        if (newConv) navigate(`/messages/${newConv.id}`);
      } else {
        setMessages(prev => prev.map(m =>
          m.id === tempId
            ? { ...newMsg, sender_id: String(newMsg.sender_id), id: String(newMsg.id) }
            : m
        ));
        refreshConvos();
      }
    } catch (err) {
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempId));
      // Show friendly error
      const msg = err.message || "";
      if (msg.includes("collaborator") || msg.includes("mutual") || msg.includes("403")) {
        setSendError("❌ You can't message this user as you are not a collaborator or mutual follower.");
      } else {
        setSendError("Failed to send message. Please try again.");
      }
      setInputValue(content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Group messages by date ─────────────────────────────────────────────
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach(msg => {
    const dstr = new Date(msg.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    if (dstr !== lastDate) {
      groupedMessages.push({ type: "sep", date: msg.created_at, id: "sep-" + dstr });
      lastDate = dstr;
    }
    groupedMessages.push({ type: "msg", ...msg });
  });

  return (
    <div className="messages-layout">
      {/* ── LEFT: Conversation list ───────────────────────────────────── */}
      <aside className="messages-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2>Messages</h2>
            
          </div>

          {isSearching && (
            <div className="new-message-search">
              <input type="text" placeholder="Search user by name..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
              {searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map(r => (
                    <div key={r.id} className="search-user-item"
                      onClick={() => { navigate(`/messages/new?to=${r.id}`); setIsSearching(false); setSearchQuery(""); }}>
                      <UserAvatar user={r} size={30} />
                      <span>{r.full_name || r.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="conversation-list">
          {loadingConvos && <div className="p-4 text-hint" style={{ padding: 20, color: "var(--text-hint)", textAlign: "center", fontSize: 13 }}>Loading…</div>}
          {!loadingConvos && conversations.length === 0 && (
            <div className="empty-state" style={{ padding: 30, textAlign: "center", color: "var(--text-hint)", fontSize: 13 }}>
              No conversations yet.<br />Start by clicking "New +"
            </div>
          )}
          {conversations.map(conv => {
            const isActive = String(conv.id) === String(conversationId);
            const other = conv.other_user || {};
            const lastMsg = conv.last_message || {};
            const preview = lastMsg.content || "";
            const trunc = preview.length > 38 ? preview.slice(0, 38) + "…" : preview;

            return (
              <div key={conv.id}
                className={`conversation-row${isActive ? " active" : ""}`}
                onClick={() => navigate(`/messages/${conv.id}`)}>
                <UserAvatar user={other} size={40} />
                <div className="conv-details">
                  <div className="conv-top-row">
                    <span className="conv-name">{other.full_name || other.username}</span>
                    <span className="conv-time">{formatTimeAgo(lastMsg.created_at)}</span>
                  </div>
                  <div className="conv-bottom-row">
                    <span className="conv-preview">{trunc}</span>
                    {conv.unread_count > 0 && <span className="conv-unread">{conv.unread_count}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── RIGHT: Thread ─────────────────────────────────────────────── */}
      <main className="messages-thread">
        {(!conversationId && !newToUserId) ? (
          <div className="thread-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose an existing conversation or start a new one.</p>
          </div>
        ) : (
          <div className="thread-active">
            {/* Header */}
            <div className="thread-header">
              <div className="header-user-info">
                {otherUserHeader && (
                  <>
                    <UserAvatar user={otherUserHeader} size={36} />
                    <h3 style={{ marginLeft: 10 }}>{otherUserHeader.full_name || otherUserHeader.username}</h3>
                  </>
                )}
              </div>
              {otherUserHeader && (
                <Link to={`/user/${otherUserHeader.id}`} className="view-profile-link">
                  View Profile
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="messages-list">
              {loadingMessages ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-hint)", fontSize: 13 }}>Loading…</div>
              ) : (
                <>
                  {groupedMessages.map(item => {
                    if (item.type === "sep") {
                      return (
                        <div key={item.id} className="date-separator">
                          <span>{formatDateSeparator(item.date)}</span>
                        </div>
                      );
                    }
                    const isMine = String(item.sender_id) === String(user?.id);
                    return (
                      <div key={item.id} className={`message-bubble-wrapper ${isMine ? "mine" : "theirs"}`}>
                        <div className="message-bubble">{item.content}</div>
                        <span className="message-time">{formatMessageTime(item.created_at)}</span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Send error */}
            {sendError && (
              <div style={{
                margin: "0 16px 8px", padding: "10px 14px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10, fontSize: 13, color: "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                {sendError}
                <button onClick={() => setSendError("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
            )}

            {/* Input */}
            <div className="message-input-area">
              <input ref={inputRef} type="text" placeholder="Type a message..."
                value={inputValue} onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown} className="message-input" />
              <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim()}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
