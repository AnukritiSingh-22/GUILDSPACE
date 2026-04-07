// src/pages/Login.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Combined Login + Signup page.
// Tabs switch between the two forms.
// On success → navigate to feed.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate        = useNavigate();
  const { login, signup } = useAuth();

  const [tab,     setTab]     = useState("login");   // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Login form state ───────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // ── Signup form state ──────────────────────────────────────────────────────
  const [signupForm, setSignupForm] = useState({
    email: "", password: "", confirmPassword: "",
    full_name: "", role: "", city: "", college: "",
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email: loginForm.email, password: loginForm.password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (signupForm.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await signup({
        email:     signupForm.email,
        password:  signupForm.password,
        full_name: signupForm.full_name,
        role:      signupForm.role     || undefined,
        city:      signupForm.city     || undefined,
        college:   signupForm.college  || undefined,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input style ─────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", padding: "10px 13px",
    background: "var(--bg-input)", border: "1px solid var(--border-mid)",
    borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--text-primary)",
    fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box",
    marginBottom: 14,
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "0 16px", background: "var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800,
            letterSpacing: -0.5, marginBottom: 8,
          }}>
            GUILD<span style={{ color: "var(--accent-mid)" }}>SPACE</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-sec)" }}>
            Find collaborators. Build together.
          </p>
        </div>

        {/* Card */}
        <div className="detail-card">

          {/* Tab switcher */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            <button
              className={`tab-btn${tab === "login" ? " active" : ""}`}
              onClick={() => { setTab("login"); setError(""); }}
            >Sign in</button>
            <button
              className={`tab-btn${tab === "signup" ? " active" : ""}`}
              onClick={() => { setTab("signup"); setError(""); }}
            >Create account</button>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              background: "var(--danger-light)", border: "1px solid rgba(239,68,68,0.35)",
              color: "var(--danger)", borderRadius: "var(--radius-md)",
              padding: "10px 14px", fontSize: 13, marginBottom: 18,
            }}>
              {error}
            </div>
          )}

          {/* ── LOGIN FORM ──────────────────────────────────────────────────── */}
          {tab === "login" && (
            <form onSubmit={handleLogin}>
              <label className="form-label">Email</label>
              <input
                type="email" required placeholder="you@example.com"
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
              />

              <label className="form-label">Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                style={inputStyle}
              />

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                style={{ marginTop: 6 }}
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-sec)" }}>
                No account?{" "}
                <span
                  style={{ color: "var(--accent-mid)", cursor: "pointer" }}
                  onClick={() => setTab("signup")}
                >Create one</span>
              </div>
            </form>
          )}

          {/* ── SIGNUP FORM ─────────────────────────────────────────────────── */}
          {tab === "signup" && (
            <form onSubmit={handleSignup}>
              <label className="form-label">Full name *</label>
              <input
                type="text" required placeholder="Aryan Rao"
                value={signupForm.full_name}
                onChange={e => setSignupForm(f => ({ ...f, full_name: e.target.value }))}
                style={inputStyle}
              />

              <label className="form-label">Email *</label>
              <input
                type="email" required placeholder="you@example.com"
                value={signupForm.email}
                onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="form-label">Password *</label>
                  <input
                    type="password" required placeholder="Min 8 chars"
                    value={signupForm.password}
                    onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
                <div>
                  <label className="form-label">Confirm password *</label>
                  <input
                    type="password" required placeholder="Repeat password"
                    value={signupForm.confirmPassword}
                    onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
              </div>

              <div style={{ height: 14 }} />

              <label className="form-label">Role <span style={{ color: "var(--text-hint)" }}>(optional)</span></label>
              <input
                type="text" placeholder="e.g. ML Engineer, UX Designer"
                value={signupForm.role}
                onChange={e => setSignupForm(f => ({ ...f, role: e.target.value }))}
                style={inputStyle}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text" placeholder="Delhi"
                    value={signupForm.city}
                    onChange={e => setSignupForm(f => ({ ...f, city: e.target.value }))}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
                <div>
                  <label className="form-label">College / Company</label>
                  <input
                    type="text" placeholder="IIT Delhi"
                    value={signupForm.college}
                    onChange={e => setSignupForm(f => ({ ...f, college: e.target.value }))}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                style={{ marginTop: 20 }}
              >
                {loading ? "Creating account…" : "Create account →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-sec)" }}>
                Already have an account?{" "}
                <span
                  style={{ color: "var(--accent-mid)", cursor: "pointer" }}
                  onClick={() => setTab("login")}
                >Sign in</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}