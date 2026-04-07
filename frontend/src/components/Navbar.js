// src/components/Navbar.js
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TrustBadge from "./TrustBadge";

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

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
    <header className="topbar">
      {/* Logo */}
      <div className="logo" onClick={() => navigate("/")}>
        GUILD<span>SPACE</span>
      </div>

      {/* Nav links */}
      <nav style={{ display: "flex", gap: 4 }}>
        {navLinks.map(({ path, label }) => (
          <button
            key={path}
            className={`nav-link ${isActive(path) ? "active" : ""}`}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate("/create")}
        >
          + Post a Project
        </button>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Avatar + name — click to go to profile */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              onClick={() => navigate("/profile")}
            >
              <div
                className="avatar"
                style={{
                  width: 32, height: 32,
                  background: "rgba(124,58,237,0.2)",
                  border: "1.5px solid rgba(124,58,237,0.4)",
                  fontSize: 12,
                  color: "var(--accent-mid)",
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                  {firstName}
                </div>
                <TrustBadge value={trustScore} />
              </div>
            </div>

            {/* Logout button */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{ fontSize: 11, padding: "4px 10px" }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}