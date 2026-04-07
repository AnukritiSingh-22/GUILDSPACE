// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Provides authentication state to the entire app.
// On mount it checks localStorage for a token and fetches /api/users/me.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);   // true while checking token on mount
  const [error,     setError]     = useState(null);

  // ── On mount: restore session from localStorage token ──────────────────────
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.fetchMe()
      .then(me => setUser(me))
      .catch(() => {
        api.clearToken();   // token expired / invalid
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    setError(null);
    const tokenData = await api.signup(formData);       // stores token in localStorage
    const me        = await api.fetchMe();
    setUser(me);
    return me;
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setError(null);
    await api.login({ email, password });               // stores token in localStorage
    const me = await api.fetchMe();
    setUser(me);
    return me;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  // ── Refresh user (call after profile update) ───────────────────────────────
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