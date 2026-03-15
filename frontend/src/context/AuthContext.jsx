import { createContext, useContext, useState } from "react";
import { CURRENT_USER } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(CURRENT_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const login = (credentials) => {
    // Mock login — replace with real API call
    setUser(CURRENT_USER);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}