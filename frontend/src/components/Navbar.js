// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchNotifications } from "../api/api";
import TrustBadge from "./TrustBadge";

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const [searchVal, setSearchVal] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications().then(notifs => {
        if (notifs && notifs.some(n => !n.is_read)) {
          setHasUnreadNotifs(true);
        }
      }).catch(err => console.error(err));
    }
  }, [user]);

  const handleSearch = () => {
    if (searchVal.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchVal)}`);
    } else if (searchVal.trim().length === 0) {
      navigate(`/search`);
    }
  };

  const navLinks = [
    { path: "/",         label: "Feed"       },
    { path: "/profile",  label: "My Profile" },
    { path: "/my-posts", label: "My Posts"   },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // ── Safe helpers — the API returns user.profile.full_name ─────────────────
  // Support both shapes: { profile: { full_name } } and { full_name }
  const fullName   = user?.profile?.full_name || user?.full_name || "User";
  const initials   = user?.profile?.initials  || user?.initials  || fullName.slice(0, 2).toUpperCase();
  const trustScore = user?.profile?.trust_score ?? user?.trust ?? "1.0";
  const firstName  = fullName.split(" ")[0];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar" style={{
      background: "rgba(0,0,0,0.85)", 
      backdropFilter: "blur(20px)", 
      borderBottom: "1px solid rgba(255,255,255,0.06)"
    }}>
      {/* Logo */}
      <div 
        className="logo flex items-center gap-12" 
        onClick={() => navigate("/")} 
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#141414" />
          <text x="6" y="24" fill="white" fontFamily="'Times New Roman', Times, serif" fontSize="22" fontWeight="bold">G</text>
          <text x="13" y="20" fill="white" fontFamily="'Times New Roman', Times, serif" fontSize="22" fontWeight="bold" opacity="0.9">S</text>
        </svg>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "3px", color: "white", fontSize: 13 }}>
          GUILDSPACE
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-8" style={{ height: "100%" }}>
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
        <div style={{ position: "relative", display: "flex", alignItems: "center", marginRight: 8 }}>
          <svg
            style={{ position: "absolute", left: 12, color: "var(--text-hint)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search people & projects"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            onClick={() => {
              if (location.pathname !== "/search") {
                navigate(searchVal ? `/search?q=${encodeURIComponent(searchVal)}` : '/search');
              }
            }}
            style={{
              width: isFocused ? 260 : 200,
              padding: "8px 16px 8px 34px",
              background: "#141414",
              border: isFocused ? "1px solid rgba(155,111,212,0.5)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              fontSize: 13,
              color: "white",
              outline: "none",
              transition: "width 0.25s ease, border-color 0.25s ease"
            }}
          />
        </div>

        {user && (
          <div 
            style={{ position: "relative", cursor: "pointer", marginRight: 8, display: "flex", alignItems: "center", color: "#A0A0A0" }}
            onClick={() => navigate("/notifications")}
            onMouseEnter={(e) => e.currentTarget.style.color = "white"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#A0A0A0"}
          >
            <svg style={{ color: "inherit", transition: "color 0.2s" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {hasUnreadNotifs && (
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#9B6FD4" }} />
            )}
          </div>
        )}

        <button
          className="btn btn-primary btn-sm"
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
          <div className="flex items-center gap-8 pl-12" style={{ borderLeft: "1px solid var(--border)" }}>
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
      </div>
    </header>
  );
}