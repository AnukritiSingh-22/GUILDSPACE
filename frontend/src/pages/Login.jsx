// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(form);
    setLoading(false);
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px", background: "var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800,
            color: "var(--text-primary)", letterSpacing: -0.5, marginBottom: 8,
          }}>
            GUILD<span style={{ color: "var(--accent-mid)" }}>SPACE</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-sec)" }}>
            Find collaborators. Build together.
          </p>
        </div>

        {/* Card */}
        <div className="detail-card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 6 }}>
            Sign in
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 24 }}>
            Welcome back to the guild.
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="aryan@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <hr className="divider" />

          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-sec)" }}>
            New to GuildSpace?{" "}
            <span
              style={{ color: "var(--accent-mid)", cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              Create an account
            </span>
          </div>

          {/* Demo shortcut */}
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, color: "var(--text-hint)" }}
              onClick={() => { login({}); navigate("/"); }}
            >
              Continue as demo user →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}