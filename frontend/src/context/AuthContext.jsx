// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const token = api.getToken();
    if (!token) { setLoading(false); return; }
    api.fetchMe()
      .then(me => setUser(me))
      .catch(() => { api.clearToken(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  // ── Signup — creates account + token but does NOT set user state.
  //    Login.jsx handles the UX: redirect to login tab so user signs in manually.
  // ──────────────────────────────────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    setError(null);
    // Call the API (this also stores the token in localStorage via api.signup)
    const tokenData = await api.signup(formData);
    // Clear the token immediately — we want the user to log in manually
    api.clearToken();
    return tokenData; // just return success data; do NOT setUser
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setError(null);
    await api.login({ email, password });
    const me = await api.fetchMe();
    setUser(me);
    return me;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => { api.logout(); setUser(null); }, []);

  // ── Refresh (call after profile update) ───────────────────────────────────
  const refreshUser = useCallback(async () => {
    const me = await api.fetchMe();
    setUser(me);
    return me;
  }, []);

  const isLoggedIn = !!user && !!api.getToken();

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, error, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}