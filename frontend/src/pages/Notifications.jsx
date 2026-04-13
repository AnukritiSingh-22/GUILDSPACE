import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/api";

function getIconForType(type) {
  switch (type) {
    case "new_application":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B6FD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
    case "new_follower":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B6FD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      );
    case "application_accepted":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    case "application_rejected":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      );
    case "new_message":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      );
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifs();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleCardClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch (e) {
        console.error("Error marking read:", e);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#0D0D0D", padding: "40px 0" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#fff" }}>
            Notifications
          </h1>
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={handleMarkAllRead}
              style={{
                background: "transparent", color: "var(--text-sec)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "0.2s"
              }}
              onMouseEnter={(e) => Object.assign(e.target.style, { color: "#fff", background: "rgba(255,255,255,0.05)" })}
              onMouseLeave={(e) => Object.assign(e.target.style, { color: "var(--text-sec)", background: "transparent" })}
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ height: 86, background: "#141414", borderColor: "transparent", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-hint)", opacity: 0.7 }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div style={{ fontSize: 16 }}>No notifications yet</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.map(n => {
              const isUnread = !n.is_read;
              return (
                <div 
                  key={n.id}
                  onClick={() => handleCardClick(n)}
                  style={{
                    position: "relative",
                    background: isUnread ? "rgba(123,94,167,0.06)" : "#141414",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: isUnread ? "2px solid #9B6FD4" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: 20,
                    paddingLeft: isUnread ? 20 : 21, 
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    cursor: n.link ? "pointer" : "default",
                    transition: "0.2s"
                  }}
                  onMouseEnter={(e) => n.link && Object.assign(e.currentTarget.style, {
                    border: "1px solid rgba(255,255,255,0.15)", 
                    borderLeft: isUnread ? "2px solid #9B6FD4" : "1px solid rgba(255,255,255,0.15)"
                  })}
                  onMouseLeave={(e) => n.link && Object.assign(e.currentTarget.style, {
                    border: "1px solid rgba(255,255,255,0.06)", 
                    borderLeft: isUnread ? "2px solid #9B6FD4" : "1px solid rgba(255,255,255,0.06)"
                  })}
                >
                  {isUnread && (
                    <div style={{ position: "absolute", left: -5, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, borderRadius: "50%", background: "#9B6FD4", border: "2px solid #0D0D0D" }} />
                  )}

                  <div style={{ position: "relative" }}>
                    <div className="avatar" style={{
                      width: 44, height: 44, fontSize: 16, background: "rgba(155,111,212,0.1)", 
                      border: "2px solid rgba(155,111,212,0.3)", color: "#9B6FD4", flexShrink: 0
                    }}>
                      {n.actor_initials || "?"}
                    </div>
                    <div style={{
                      position: "absolute", bottom: -6, right: -6, background: "#141414",
                      borderRadius: "50%", padding: 2, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #141414"
                    }}>
                      {getIconForType(n.type)}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, color: "#fff", fontWeight: isUnread ? 600 : 400, lineHeight: 1.4 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-hint)", whiteSpace: "nowrap", marginLeft: 16, marginTop: 2 }}>
                        {n.created_at_ago}
                      </div>
                    </div>
                    {n.body && (
                      <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.body}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
