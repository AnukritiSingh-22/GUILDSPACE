// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar          from "./components/Navbar";
import Home            from "./pages/Home";
import ProjectDetails  from "./pages/ProjectDetails";
import Profile         from "./pages/Profile";
import PublicProfile   from "./pages/PublicProfile";
import Applications    from "./pages/Applications";
import CreateProject   from "./pages/CreateProject";
import Login           from "./pages/Login";
import SearchPage      from "./pages/SearchPage";
import Messages        from "./pages/Messages";
import Notifications   from "./pages/Notifications";

// ── Shows nothing while the auth check is in-flight ──────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)",
    }}>
      <div style={{ fontSize: 14, color: "var(--text-hint)" }}>Loading…</div>
    </div>
  );
}

// ── Redirects to /login if not authenticated ──────────────────────────────────
function Protected({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// ── Redirects to / if already authenticated ───────────────────────────────────
function PublicOnly({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isLoggedIn ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — only accessible when NOT logged in */}
        <Route path="/login" element={
          <PublicOnly><Login /></PublicOnly>
        } />

        {/* Protected — require auth, show Navbar */}
        <Route path="/*" element={
          <Protected>
            <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
              <Navbar />
              <Routes>
                <Route path="/"            element={<Home />} />
                <Route path="/project/:id" element={<ProjectDetails />} />
                <Route path="/profile"     element={<Profile />} />
                <Route path="/user/:userId" element={<PublicProfile />} />
                <Route path="/search"      element={<SearchPage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages"    element={<Messages />} />
                <Route path="/messages/:conversationId" element={<Messages />} />
                <Route path="/my-posts"    element={<Applications />} />
                <Route path="/create"      element={<CreateProject />} />
                <Route path="/edit-project/:id" element={<CreateProject />} />
                <Route path="*"            element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Protected>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}