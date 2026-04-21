import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchNotifications, searchProjects, searchUsers, fetchConversations } from "../api/api";
import TrustBadge from "./TrustBadge";

export default function Navbar({ onThemeToggle, isDark }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [searchVal, setSearchVal] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Search states
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchVal);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    Promise.all([
      searchProjects(debouncedQuery).catch(() => []),
      searchUsers(debouncedQuery).catch(() => [])
    ])
      .then(([projectsData, usersData]) => {
        const p = (projectsData || []).map(x => ({ ...x, _type: 'project' }));
        const u = (usersData || []).map(x => ({ ...x, _type: 'user' }));
        setSearchResults([...u, ...p]);
      })
      .catch(err => console.error(err))
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    if (user) {
      fetchNotifications().then(notifs => {
        if (notifs && notifs.some(n => !n.is_read)) {
          setHasUnreadNotifs(true);
        }
      }).catch(err => console.error(err));

      fetchConversations().then(convos => {
        if (convos && convos.some(c => c.unread_count > 0)) {
          setHasUnreadMessages(true);
        }
      }).catch(err => console.error(err));
    }

    const handleNotifsRead = () => setHasUnreadNotifs(false);
    window.addEventListener("notificationsRead", handleNotifsRead);
    return () => window.removeEventListener("notificationsRead", handleNotifsRead);
  }, [user, location.pathname]);

  const navLinks = [
    { path: "/", label: "Feed" },
    { path: "/profile", label: "My Profile" },
    { path: "/my-posts", label: "My Posts" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // ── Safe helpers — the API returns user.profile.full_name ─────────────────
  // Support both shapes: { profile: { full_name } } and { full_name }
  const fullName = user?.profile?.full_name || user?.full_name || "User";
  const initials = user?.profile?.initials || user?.initials || fullName.slice(0, 2).toUpperCase();
  const trustScore = user?.profile?.trust_score ?? user?.trust ?? "1.0";
  const firstName = fullName.split(" ")[0];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar" style={{
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)"
    }}>
      {/* Logo */}
      <div
        className="logo flex items-center gap-12"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="var(--bg-card)" />
          <text x="6" y="24" fill="white" fontFamily="'Times New Roman', Times, serif" fontSize="22" fontWeight="bold">G</text>
          <text x="13" y="20" fill="white" fontFamily="'Times New Roman', Times, serif" fontSize="22" fontWeight="bold" opacity="0.9">S</text>
        </svg>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "3px", color: "var(--text-primary)", fontSize: 13 }}>
          GUILDSPACE
        </span>
      </div>

      {/* Nav links */}
      <nav className="navbar-nav-links flex items-center gap-8" style={{ height: "100%" }}>
        {navLinks.map(({ path, label }) => {
          const active = isActive(path);
          return (
            <div key={path} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
              <button
                className="nav-link"
                style={{
                  borderRadius: 24,
                  padding: "6px 16px",
                  background: active ? "linear-gradient(135deg, rgba(123,94,167,0.2), rgba(155,111,212,0.2))" : "transparent",
                  color: active ? "#FFFFFF" : "var(--text-sec)",
                  fontWeight: active ? 500 : 400,
                  border: "none"
                }}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
              {active && (
                <div style={{ position: "absolute", bottom: -1, left: "15%", width: "70%", height: 3, background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", borderRadius: "4px 4px 0 0" }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-12">
        <div className="navbar-search" ref={wrapperRef} style={{ position: "relative", display: "flex", alignItems: "center", marginRight: 8 }}>
          <svg
            style={{ position: "absolute", left: 12, zIndex: 2, color: "var(--text-hint)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search people..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              if (searchVal.trim()) setShowDropdown(true);
            }}
            onBlur={() => setIsFocused(false)}
            style={{
              width: isFocused || showDropdown ? 280 : 220,
              padding: "8px 16px 8px 34px",
              background: "var(--bg-card)",
              border: isFocused ? "1px solid rgba(155,111,212,0.5)" : "1px solid var(--border)",
              borderRadius: 20,
              fontSize: 13,
              color: "var(--text-primary)",
              outline: "none",
              transition: "width 0.25s ease, border-color 0.25s ease",
              position: "relative",
              zIndex: 1
            }}
          />
          {showDropdown && searchVal.trim().length > 0 && (
            <div style={{
              position: "absolute",
              top: 44,
              left: 0,
              width: "100%",
              maxHeight: 400,
              overflowY: "auto",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-mid)",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              padding: 8,
              gap: 4
            }}>
              {isSearching ? (
                <div style={{ padding: 12, color: "var(--text-hint)", fontSize: 13, textAlign: "center" }}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: 12, color: "var(--text-hint)", fontSize: 13, textAlign: "center" }}>No results found for "{searchVal}"</div>
              ) : (
                searchResults.map(item => {
                  if (item._type === 'user') {
                    return (
                      <div
                        key={`user-${item.user_id}`}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          cursor: "pointer",
                          background: "transparent",
                          transition: "background 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: 12
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--border)";
                          e.currentTarget.style.outline = "1px solid rgba(155,111,212,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.outline = "none";
                        }}
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchVal("");
                          navigate(`/user/${item.user_id}`);
                        }}
                      >
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: "rgba(155,111,212,0.1)", border: "1px solid rgba(155,111,212,0.3)", color: "#9B6FD4", flexShrink: 0 }}>
                          {item.initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{item.full_name} <span style={{ fontSize: 10, color: "var(--text-hint)", fontWeight: 400, marginLeft: 4 }}>• User</span></div>
                          <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{item.role} {item.city ? `· ${item.city}` : ""}</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`proj-${item.id}`}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        cursor: "pointer",
                        background: "transparent",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--border)";
                        e.currentTarget.style.outline = "1px solid rgba(155,111,212,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.outline = "none";
                      }}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchVal("");
                        navigate(`/project/${item.id}`);
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                        {item.title} <span style={{ fontSize: 10, color: "var(--text-hint)", fontWeight: 400, marginLeft: 4 }}>• Project</span>
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {item.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {(item.skills || []).slice(0, 3).map((s, i) => (
                          <span key={i} style={{
                            fontSize: 10, background: "rgba(155,111,212,0.1)", border: "1px solid rgba(155,111,212,0.2)",
                            color: "#9B6FD4", padding: "2px 6px", borderRadius: 4
                          }}>
                            {s}
                          </span>
                        ))}
                        {(item.skills?.length || 0) > 3 && (
                          <span style={{ fontSize: 10, color: "var(--text-hint)", padding: "2px 0" }}>+{(item.skills.length - 3)}</span>
                        )}
                        {item.domain && (
                          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-hint)" }}>
                            {item.domain}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {user && (
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginRight: 8 }}>
            <div
              style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-sec)" }}
              onClick={() => navigate("/messages")}
              onMouseEnter={(e) => e.currentTarget.style.color = "white"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-sec)"}
            >
              <svg style={{ color: "inherit", transition: "color 0.2s" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {hasUnreadMessages && (
                <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#9B6FD4" }} />
              )}
            </div>
            
            <button className="theme-toggle-btn" onClick={onThemeToggle} style={{ marginRight: 8, marginLeft: 8 }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <div
              style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-sec)" }}
              onClick={() => navigate("/notifications")}
              onMouseEnter={(e) => e.currentTarget.style.color = "white"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-sec)"}
            >
            <svg style={{ color: "inherit", transition: "color 0.2s" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {hasUnreadNotifs && (
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#9B6FD4" }} />
            )}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-sm navbar-post-btn"
          style={{
            background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)",
            borderRadius: 24,
            border: "none",
            padding: "8px 16px"
          }}
          onClick={() => navigate("/create")}
        >
          + Post a Project
        </button>

        {user && (
          <div className="navbar-user-info flex items-center gap-8 pl-12" style={{ borderLeft: "1px solid var(--border)" }}>
            {/* Avatar + name — click to go to profile */}
            <div
              className="flex items-center gap-12"
              style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 24, transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => navigate("/profile")}
            >
              <div
                className="avatar"
                style={{
                  width: 34, height: 34,
                  background: "var(--bg-elevated)",
                  backgroundClip: "padding-box",
                  border: "2px solid transparent",
                  backgroundImage: "linear-gradient(var(--bg-elevated), var(--bg-elevated)), linear-gradient(135deg, #7B5EA7, #9B6FD4)",
                  backgroundOrigin: "border-box",
                  fontSize: 12,
                  color: "var(--text-primary)",
                }}
              >
                {initials}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>
                  {firstName}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{ padding: "6px 12px", borderRadius: 20 }}
            >
              Logout
            </button>
          </div>
        )}
        
        <button className="hamburger-btn" onClick={() => setMobileOpen(true)}>
          <span />
          <span />
          <span />
        </button>

        {/* Mobile drawer overlay & drawer */}
        {mobileOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} onClick={() => setMobileOpen(false)} />
        )}
        <div className={`mobile-drawer ${mobileOpen ? "open" : ""}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Menu</span>
            <button onClick={() => setMobileOpen(false)} style={{ background: "transparent", color: "var(--text-primary)", fontSize: 20, border: "none", cursor: "pointer" }}>×</button>
          </div>
          <div onClick={() => { setMobileOpen(false); navigate("/"); }} style={{ cursor: "pointer", padding: "8px 0" }}>Feed</div>
          <div onClick={() => { setMobileOpen(false); navigate("/profile"); }} style={{ cursor: "pointer", padding: "8px 0" }}>My Profile</div>
          <div onClick={() => { setMobileOpen(false); navigate("/my-posts"); }} style={{ cursor: "pointer", padding: "8px 0" }}>My Posts</div>
          <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />
          <div onClick={() => { setMobileOpen(false); navigate("/notifications"); }} style={{ cursor: "pointer", padding: "8px 0" }}>Notifications {hasUnreadNotifs && "🔴"}</div>
          <div onClick={() => { setMobileOpen(false); navigate("/messages"); }} style={{ cursor: "pointer", padding: "8px 0" }}>Messages {hasUnreadMessages && "🔴"}</div>
          <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />
          <button
            onClick={() => { setMobileOpen(false); navigate("/create"); }}
            className="btn btn-primary btn-sm"
            style={{ background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", width: "100%", padding: 10, borderRadius: 24, border: "none" }}
          >
            + Post a Project
          </button>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button className="theme-toggle-btn" onClick={onThemeToggle}>
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
          <button
            onClick={() => { setMobileOpen(false); handleLogout(); }}
            style={{ marginTop: "auto", background: "var(--danger-light)", color: "var(--danger)", padding: 10, borderRadius: 8, border: "none", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
