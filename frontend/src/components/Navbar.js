// src/components/Navbar.js
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TrustBadge from "./TrustBadge";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { path: "/",        label: "Feed" },
    { path: "/profile", label: "My Profile" },
    { path: "/my-posts",label: "My Posts" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
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
      <div className="flex items-center gap-12">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate("/create")}
        >
          + Post a Project
        </button>

        {user && (
          <div
            className="flex items-center gap-8"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/profile")}
          >
            {/* Avatar */}
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
              {user.initials}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                {user.name.split(" ")[0]}
              </div>
              <TrustBadge value={user.trust} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}