// src/api/api.js
// ─────────────────────────────────────────────────────────────────────────────
// All HTTP calls to the GuildSpace FastAPI backend.
// Token is stored in localStorage and attached to every protected request.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken  = ()        => localStorage.getItem("gs_token");
export const setToken  = (token)   => localStorage.setItem("gs_token", token);
export const clearToken = ()       => localStorage.removeItem("gs_token");

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // 401 → clear token so AuthContext can redirect to login
  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    return;
  }

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.detail || data?.message || "Request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/signup
 * Creates account, returns JWT + user info.
 */
export async function signup({ email, password, full_name, role, city, college }) {
  const data = await request("/api/auth/signup", {
    method: "POST",
    body:   JSON.stringify({ email, password, full_name, role, city, college }),
  });
  setToken(data.access_token);
  return data;
}

/**
 * POST /api/auth/login
 * Returns JWT + user info.
 */
export async function login({ email, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body:   JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken();
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURRENT USER
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/users/me — full profile + skills */
export async function fetchMe() {
  return request("/api/users/me");
}

/** PUT /api/users/me — update profile fields */
export async function updateProfile(fields) {
  return request("/api/users/me", {
    method: "PUT",
    body:   JSON.stringify(fields),
  });
}

/** PUT /api/users/me/skills — replace skill list */
export async function updateSkills(skillNames) {
  return request("/api/users/me/skills", {
    method: "PUT",
    body:   JSON.stringify({ skills: skillNames }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/projects — list with optional filters */
export async function fetchProjects({ domain, max_diff, skill, page = 1 } = {}) {
  const params = new URLSearchParams();
  if (domain)   params.set("domain",   domain);
  if (max_diff) params.set("max_diff", max_diff);
  if (skill)    params.set("skill",    skill);
  params.set("page", page);
  return request(`/api/projects?${params}`);
}

/** GET /api/projects/mine — projects the user created */
export async function fetchMyProjects() {
  return request("/api/projects/mine");
}

/** GET /api/projects/:id — single project detail */
export async function fetchProject(id) {
  return request(`/api/projects/${id}`);
}

/** POST /api/projects — create a new project */
export async function createProject(payload) {
  return request("/api/projects", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

/** PUT /api/projects/:id — update project */
export async function updateProject(id, payload) {
  return request(`/api/projects/${id}`, {
    method: "PUT",
    body:   JSON.stringify(payload),
  });
}

/** DELETE /api/projects/:id */
export async function deleteProject(id) {
  return request(`/api/projects/${id}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/applications
 * Apply to a project.
 * payload: { project_id, answers: [{question_id, answer}], link? }
 */
export async function applyToProject(payload) {
  return request("/api/applications", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

/** GET /api/applications/mine — applications the user submitted */
export async function fetchMyApplications() {
  return request("/api/applications/mine");
}

/** GET /api/applications/project/:id — all applicants for a project (creator only) */
export async function fetchApplicants(projectId) {
  return request(`/api/applications/project/${projectId}`);
}

/** PUT /api/applications/:id/status — accept / shortlist / reject */
export async function updateApplicationStatus(applicationId, status) {
  return request(`/api/applications/${applicationId}/status`, {
    method: "PUT",
    body:   JSON.stringify({ status }),
  });
}

export async function rateCollaborator(applicationId, rating) {
  return request(`/api/applications/${applicationId}/rate`, {
    method: "PUT",
    body:   JSON.stringify({ rating }),
  });
}

/** DELETE /api/applications/:id — withdraw application */
export async function withdrawApplication(applicationId) {
  return request(`/api/applications/${applicationId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI FEED
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/ai/feed — AI-ranked personalised project feed */
export async function fetchAiFeed({ domain, max_diff } = {}) {
  const params = new URLSearchParams();
  if (domain)   params.set("domain",   domain);
  if (max_diff) params.set("max_diff", max_diff);
  return request(`/api/ai/feed?${params}`);
}

/** GET /api/ai/skills — all skill names for autocomplete */
export async function fetchAllSkills() {
  return request("/api/ai/skills");
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

export async function fetchPublicProfile(userId) {
  return request(`/api/users/${userId}/public`);
}

export async function fetchIsFollowing(userId) {
  return request(`/api/users/${userId}/is-following`);
}

export async function followUser(userId) {
  return request(`/api/users/${userId}/follow`, { method: "POST" });
}

export async function unfollowUser(userId) {
  return request(`/api/users/${userId}/follow`, { method: "DELETE" });
}

export async function fetchFollowers(userId) {
  return request(`/api/users/${userId}/followers`);
}

export async function fetchFollowing(userId) {
  return request(`/api/users/${userId}/following`);
}

export async function fetchUserProjects(userId) {
  return request(`/api/projects?creator_id=${userId}`);
}

// ── Search ───────────────────────────────────────────────────────
export async function searchUsers(query) {
  return request(`/api/search/users?q=${encodeURIComponent(query)}`);
}

export async function searchProjects(query) {
  return request(`/api/search/projects?q=${encodeURIComponent(query)}`);
}

// ── Messaging ────────────────────────────────────────────────────
export async function fetchConversations() {
  return request('/api/messages/conversations');
}

export async function fetchMessages(conversationId) {
  return request(`/api/messages/${conversationId}`);
}

export async function sendMessage(recipientId, content) {
  return request('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: recipientId, content }),
  });
}

// ── Notifications ────────────────────────────────────────────────
export async function fetchNotifications() {
  return request('/api/notifications');
}

export async function markNotificationRead(notificationId) {
  return request(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead() {
  return request('/api/notifications/read-all', { method: 'PUT' });
}

// ── Post management ──────────────────────────────────────────────
export async function hideProject(projectId) {
  return request(`/api/projects/${projectId}/hide`, { method: 'PUT' });
}

export async function unhideProject(projectId) {
  return request(`/api/projects/${projectId}/unhide`, { method: 'PUT' });
}

export async function closeProject(projectId) {
  return request(`/api/projects/${projectId}/close`, { method: 'PUT' });
}

export async function completeProject(projectId) {
  return request(`/api/projects/${projectId}/complete`, { method: 'PUT' });
}