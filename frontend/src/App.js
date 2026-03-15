// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProjectDetails from "./pages/ProjectDetails";
import Profile from "./pages/Profile";
import Applications from "./pages/Applications";
import CreateProject from "./pages/CreateProject";
import Login from "./pages/Login";

// Protected route wrapper
function Protected({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppLayout() {
  const { isLoggedIn } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — with navbar */}
        <Route path="/*" element={
          <Protected>
            <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
              <Navbar />
              <Routes>
                <Route path="/"               element={<Home />} />
                <Route path="/project/:id"    element={<ProjectDetails />} />
                <Route path="/profile"        element={<Profile />} />
                <Route path="/my-posts"       element={<Applications />} />
                <Route path="/create"         element={<CreateProject />} />
                <Route path="*"              element={<Navigate to="/" replace />} />
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
      <AppLayout />
    </AuthProvider>
  );
}