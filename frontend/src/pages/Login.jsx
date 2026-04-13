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
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── Login form state ───────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // ── Signup form state ──────────────────────────────────────────────────────
  const [signupForm, setSignupForm] = useState({
    email: "", password: "", confirmPassword: "", full_name: "",
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
        email: signupForm.email,
        password: signupForm.password,
        full_name: signupForm.full_name,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

    {/* ── LEFT SIDE: Image + Branding ─────────────────────────── */}
    <div
      className="auth-left"
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",   // push content to bottom
        padding: "60px 8%",           // slightly tighter spacing
        overflow: "hidden",
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/assets/Login_img.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9)",   // 🔥 clearer image
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 10, 20, 0.35)", // 🔥 lighter overlay
        }}
      />

      {/* Content (BOTTOM LEFT) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "420px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: "-1px",
            marginBottom: 12,
            color: "white",
          }}
        >
          GUILD<span style={{ color: "var(--accent)" }}>SPACE</span>
        </div>

        <p
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.5,
          }}
        >
          Find collaborators.<br />
          Build together.
        </p>
      </div>
    </div>

      {/* ── RIGHT SIDE: Form ────────────────────────────────────────────── */}
      <div
  style={{
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    background: "var(--bg)",
  }}
>
        <div style={{ width: "100%", maxWidth: 380 }}>

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
              <form onSubmit={handleLogin} className="flex flex-col gap-12">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email" required placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"} required placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      style={{ paddingRight: 50 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 12, top: 10, background: "none", color: "var(--text-sec)", fontSize: 11, cursor: "pointer", fontWeight: 500 }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full mt-12"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign in →"}
                </button>

                <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-sec)" }}>
                  No account?{" "}
                  <span
                    style={{ color: "var(--text-primary)", fontWeight: 500, cursor: "pointer", borderBottom: "1px transparent" }}
                    onMouseEnter={e => e.currentTarget.style.borderBottom = "1px solid var(--border-mid)"}
                    onMouseLeave={e => e.currentTarget.style.borderBottom = "1px transparent"}
                    onClick={() => setTab("signup")}
                  >Create one</span>
                </div>
              </form>
            )}

            {/* ── SIGNUP FORM ─────────────────────────────────────────────────── */}
            {tab === "signup" && (
              <form onSubmit={handleSignup} className="flex flex-col gap-12">
                <div>
                  <label className="form-label">Full name</label>
                  <input
                    type="text" required placeholder="Jane Doe"
                    value={signupForm.full_name}
                    onChange={e => setSignupForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email" required placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"} required placeholder="Min 8 chars"
                      value={signupForm.password}
                      onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                      style={{ paddingRight: 50 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 12, top: 10, background: "none", color: "var(--text-sec)", fontSize: 11, cursor: "pointer", fontWeight: 500 }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirm password</label>
                  <input
                    type={showPassword ? "text" : "password"} required placeholder="Repeat password"
                    value={signupForm.confirmPassword}
                    onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full mt-12"
                  disabled={loading}
                >
                  {loading ? "Creating account…" : "Create account →"}
                </button>

                <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-sec)" }}>
                  Already have an account?{" "}
                  <span
                    style={{ color: "var(--text-primary)", fontWeight: 500, cursor: "pointer", borderBottom: "1px transparent" }}
                    onMouseEnter={e => e.currentTarget.style.borderBottom = "1px solid var(--border-mid)"}
                    onMouseLeave={e => e.currentTarget.style.borderBottom = "1px transparent"}
                    onClick={() => setTab("login")}
                  >Sign in</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}