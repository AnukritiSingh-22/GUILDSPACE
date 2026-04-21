// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  updateProfile, updateSkills,
  fetchMyApplications, fetchMyProjects,
  fetchFollowers, fetchFollowing
} from "../api/api";

function getTrustBand(score) {
  const s = parseFloat(score || 1);
  if (s >= 8.0) return "Elite";
  if (s >= 5.0) return "Trusted";
  if (s >= 3.0) return "Intermediate";
  return "Beginner";
}

function TrustRing({ value }) {
  const r = 30, cx = 38, cy = 38, circ = 2 * Math.PI * r, pct = Math.min(value, 5) / 5;
  return (
    <svg width="76" height="76">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#7B5EA7"
        strokeWidth={5} strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={15} fontWeight={700}
        fill="#9B6FD4" fontFamily="Syne, sans-serif">{value}</text>
    </svg>
  );
}

// ── Follower/Following Modal ──────────────────────────────────────────────────
function UserListModal({ title, users, onClose }) {
  const navigate = useNavigate();
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 16, width: 360, maxHeight: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden",
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {users.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-hint)", fontSize: 13 }}>Nobody here yet.</div>
          ) : users.map(u => {
            const uid = u.user_id || u.id;
            return (
              <div key={uid}
                onClick={() => { onClose(); navigate(`/user/${uid}`); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(155,111,212,0.15)", border: "1.5px solid rgba(155,111,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#9B6FD4", flexShrink: 0 }}>
                  {(u.initials || u.full_name?.slice(0, 2) || "?").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{u.full_name}</div>
                  {u.role && <div style={{ fontSize: 11, color: "var(--text-sec)" }}>{u.role}{u.city ? ` · ${u.city}` : ""}</div>}
                </div>
                <div style={{ fontSize: 10, color: "#9B6FD4" }}>View →</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [tab,        setTab]       = useState("Projects");
  const [editing,    setEditing]   = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [skillInput, setSkillInput]= useState("");
  const [editForm,   setEditForm]  = useState({});

  // Data
  const [myApps,      setMyApps]      = useState(null);
  const [myProjects,  setMyProjects]  = useState(null);
  const [dataLoaded,  setDataLoaded]  = useState(false);

  // Social
  const [followers,   setFollowers]   = useState([]);
  const [following,   setFollowing]   = useState([]);
  const [modal,       setModal]       = useState(null); // "followers"|"following"|null

  const profile = user?.profile;
  const skills  = user?.skills || [];
  const TABS    = ["Projects", "Applications"];

  // ── Load all data on mount (not lazily) ──────────────────────────────────
  useEffect(() => {
    if (!user || dataLoaded) return;
    setDataLoaded(true);

    // Applications
    fetchMyApplications()
      .then(d => setMyApps(Array.isArray(d) ? d : []))
      .catch(() => setMyApps([]));

    // Posted projects
    fetchMyProjects()
      .then(d => setMyProjects(Array.isArray(d) ? d : (d?.projects || [])))
      .catch(() => setMyProjects([]));

    // Social counts
    const uid = user?.id || user?.profile?.user_id;
    if (uid) {
      fetchFollowers(uid).then(d => setFollowers(Array.isArray(d) ? d : (d?.followers || []))).catch(() => {});
      fetchFollowing(uid).then(d => setFollowing(Array.isArray(d) ? d : (d?.following || []))).catch(() => {});
    }
  }, [user]);

  const handleTab = (t) => setTab(t);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await fetch(`${BASE}/api/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("gs_token")}` },
        body: formData
      });
      if (res.ok) await refreshUser();
    } catch (err) { console.error(err); }
  };

  const startEdit = () => {
    setEditForm({
      full_name:     profile?.full_name     || "",
      role:          profile?.role          || "",
      city:          profile?.city          || "",
      college:       profile?.college       || "",
      bio:           profile?.bio           || "",
      interests:     profile?.interests     || "",
      github_url:    profile?.github_url    || "",
      arxiv_url:     profile?.arxiv_url     || "",
      portfolio_url: profile?.portfolio_url || "",
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try { await updateProfile(editForm); await refreshUser(); setEditing(false); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const addSkill = async () => {
    const name = skillInput.trim();
    if (!name) return;
    await updateSkills([...skills.map(s => s.name), name]);
    await refreshUser();
    setSkillInput("");
  };

  const removeSkill = async (skillName) => {
    await updateSkills(skills.map(s => s.name).filter(n => n !== skillName));
    await refreshUser();
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "var(--bg)", border: "1px solid var(--border-mid)",
    borderRadius: "12px", fontSize: 13, color: "var(--text-primary)",
    fontFamily: "var(--font-body)", outline: "none", marginBottom: 10,
    boxSizing: "border-box", transition: "all 0.2s"
  };

  const collaboratedProjects = (myApps || []).filter(a => a.status === "accepted");
  const pendingApps          = (myApps || []).filter(a => a.status !== "accepted");

  return (
    <div className="profile-layout page-enter">
      <style>{`
        .profile-input:focus {
          border-color: rgba(155,111,212,0.6) !important;
          box-shadow: 0 0 0 3px rgba(155,111,212,0.15) !important;
        }
        .skill-chip-luxury {
          background: rgba(123,94,167,0.15);
          border: 1px solid rgba(155,111,212,0.3);
          color: #9B6FD4; border-radius: 8px;
          padding: 4px 10px; font-size: 11px;
          display: inline-block; margin: 3px;
          cursor: pointer; transition: all 0.2s;
        }
        .skill-chip-luxury:hover { box-shadow: 0 0 8px rgba(155,111,212,0.4); border-color: #9B6FD4; }
        .edit-btn-luxury { background: transparent; color: var(--text-sec); border: 1px solid var(--border-bright); transition: all 0.2s; }
        .edit-btn-luxury:hover { color: var(--text-primary); border-color: #9B6FD4; box-shadow: 0 0 8px rgba(155,111,212,0.25); }
        .profile-tab {
          background: transparent; border: none;
          border-bottom: 2px solid var(--border);
          color: var(--text-sec); padding: 10px 16px;
          font-size: 13px; cursor: pointer; transition: all 0.2s; margin-right: 8px;
        }
        .profile-tab.active { color: #9B6FD4; border-bottom-color: #9B6FD4; }
        .text-gradient { background: linear-gradient(135deg, #7B5EA7, #9B6FD4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .badge-app { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
        .follow-btn {
          background: none; border: none; cursor: pointer;
          display: flex; flex-direction: column; align-items: center;
          padding: 6px 16px; border-radius: 10px; transition: background 0.15s;
        }
        .follow-btn:hover { background: var(--bg-elevated); }
        .section-divider {
          font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
          color: var(--text-hint); text-transform: uppercase;
          margin: 20px 0 12px; padding-bottom: 6px;
          border-bottom: 1px solid var(--border);
        }
      `}</style>

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <aside className="profile-left" style={{ background: "var(--bg)", borderRight: "1px solid var(--border)", minWidth: 300, overflowY: "auto" }}>

        {/* Avatar */}
        <div style={{ position: "relative", width: 80, height: 80, marginBottom: 20, cursor: "pointer" }}
          onClick={() => document.getElementById("avatar-upload").click()}>
          <div className="avatar" style={{ width: "100%", height: "100%", fontSize: 26, background: "var(--bg)", backgroundClip: "padding-box", border: "3px solid transparent", backgroundImage: "linear-gradient(var(--bg), var(--bg)), linear-gradient(135deg, #7B5EA7, #9B6FD4)", backgroundOrigin: "border-box", color: "var(--text-primary)", overflow: "hidden" }}>
            {profile?.avatar_url ? (
              <img src={(profile.avatar_url.startsWith("http") ? "" : (process.env.REACT_APP_API_URL || "http://localhost:8000")) + profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
            ) : (profile?.initials || "?")}
          </div>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", opacity: 0, transition: "0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
            <span style={{ fontSize: 20 }}>📷</span>
          </div>
          <input id="avatar-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
        </div>

        {editing ? (
          <>
            <input className="profile-input" style={inputStyle} value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" />
            <input className="profile-input" style={inputStyle} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} placeholder="Role" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input className="profile-input" style={{ ...inputStyle, marginBottom: 0 }} value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
              <input className="profile-input" style={{ ...inputStyle, marginBottom: 0 }} value={editForm.college} onChange={e => setEditForm(f => ({ ...f, college: e.target.value }))} placeholder="College" />
            </div>
            <div style={{ height: 10 }} />
            <textarea className="profile-input" style={{ ...inputStyle, minHeight: 70 }} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short bio…" />
            <input className="profile-input" style={inputStyle} value={editForm.github_url} onChange={e => setEditForm(f => ({ ...f, github_url: e.target.value }))} placeholder="github.com/username" />
            <div className="flex gap-8">
              <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving} style={{ background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", border: "none", borderRadius: 12 }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 3, fontWeight: 700 }}>{profile?.full_name}</h2>
            <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 14 }}>
              {[profile?.role, profile?.college, profile?.city].filter(Boolean).join(" · ")}
            </div>

            {/* ── Follower / Following counts ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
              <button className="follow-btn" onClick={() => setModal("followers")}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", lineHeight: 1 }}>{followers.length}</span>
                <span style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>Followers</span>
              </button>
              <div style={{ width: 1, height: 32, background: "var(--border)" }} />
              <button className="follow-btn" onClick={() => setModal("following")}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", lineHeight: 1 }}>{following.length}</span>
                <span style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>Following</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <button className="btn btn-sm edit-btn-luxury" onClick={startEdit} style={{ borderRadius: 100, padding: "6px 16px" }}>Edit profile</button>
              <div style={{ background: "var(--bg-elevated)", padding: "4px 12px", borderRadius: 20, fontSize: 12, color: "var(--text-sec)", border: "1px solid var(--border-mid)" }}>
                ✉️ {user?.email}
              </div>
            </div>
          </>
        )}

        {/* Trust box */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <div>
              <div className="text-gradient" style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1 }}>{profile?.trust_score || "1.0"}</div>
              <div style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 4 }}>Trust value</div>
            </div>
            <TrustRing value={parseFloat(profile?.trust_score || 1)} />
          </div>
          <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #7B5EA7, #9B6FD4)", width: `${(Math.min(parseFloat(profile?.trust_score || 1), 5) / 5) * 100}%` }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-hint)", marginTop: 8 }}>{getTrustBand(profile?.trust_score)} Guildmember</div>
        </div>

        {/* Skills */}
        <div className="section-label" style={{ marginTop: 0 }}>Skills</div>
        <div style={{ marginBottom: 16 }}>
          {skills.map(s => (
            <span key={s.id} className="skill-chip-luxury" onClick={() => removeSkill(s.name)} title="Click to remove">
              {s.name} <span style={{ marginLeft: 4, opacity: 0.5 }}>×</span>
            </span>
          ))}
        </div>
        <div className="flex gap-6">
          <input className="profile-input" value={skillInput} onChange={e => setSkillInput(e.target.value)}
            placeholder="Add a skill…" onKeyDown={e => e.key === "Enter" && addSkill()}
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
          <button className="btn btn-sm" onClick={addSkill} style={{ background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "#fff", border: "none", borderRadius: 12, padding: "0 16px" }}>Add</button>
        </div>

        {profile?.bio && (<><div className="section-label" style={{ marginTop: 24 }}>Bio</div><div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>{profile.bio}</div></>)}
        {profile?.interests && (<><div className="section-label" style={{ marginTop: 24 }}>Interests</div><div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 14 }}>{profile.interests}</div></>)}
        {(profile?.github_url || profile?.arxiv_url) && (
          <><div className="section-label" style={{ marginTop: 24 }}>Links</div>
            {profile.github_url && <div style={{ fontSize: 12, color: "#9B6FD4", marginBottom: 6, cursor: "pointer" }}>↗ {profile.github_url}</div>}
            {profile.arxiv_url  && <div style={{ fontSize: 12, color: "#9B6FD4", cursor: "pointer" }}>↗ {profile.arxiv_url}</div>}
          </>
        )}
      </aside>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <main className="profile-right">
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            ["Trust score", profile?.trust_score || "1.0"],
            ["Trust level", getTrustBand(profile?.trust_score)],
            ["Skills",      skills.length],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--text-primary)", marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} className={`profile-tab${tab === t ? " active" : ""}`} onClick={() => handleTab(t)}>{t}</button>
          ))}
        </div>

        {/* ── PROJECTS TAB ── Shows both posted + collaborated ── */}
        {tab === "Projects" && (
          <div style={{ padding: "4px 0" }}>

            {/* Collaborated projects section */}
            <div className="section-divider" style={{ marginTop: 28 }}>Collaborated</div>
            {myApps === null ? (
              <div style={{ color: "var(--text-hint)", textAlign: "center", padding: "20px 0" }}>Loading…</div>
            ) : collaboratedProjects.length === 0 ? (
              <div style={{ color: "var(--text-sec)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🤝</div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>No collaborations yet.</div>
                <div style={{ color: "var(--text-hint)", fontSize: 12 }}>Projects you've been accepted into will appear here.</div>
              </div>
            ) : (
              collaboratedProjects.map(app => (
                <div
                  key={app.application_id || app.project_id}
                  onClick={() => navigate(`/project/${app.project_id}`)}   // 🔥 ADD THIS LINE
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 12,
                    cursor: "pointer",   // 🔥 ADD THIS
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(155,111,212,0.5)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div className="flex justify-between items-center mb-8">
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{app.project_title}</div>
                    <span className="badge-app" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>Collaborating ✓</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                    {app.project_domain} <span style={{ opacity: 0.5, margin: "0 8px" }}>|</span> Joined {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── APPLICATIONS TAB ── pending/rejected only ── */}
        {tab === "Applications" && (
          myApps === null
            ? <div style={{ color: "var(--text-hint)", padding: "40px 0", textAlign: "center" }}>Loading…</div>
            : pendingApps.length === 0
            ? <div style={{ color: "var(--text-hint)", padding: "40px 0", textAlign: "center" }}>No pending applications.</div>
            : pendingApps.map(app => (
                <div key={app.application_id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div className="flex justify-between items-center mb-8">
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{app.project_title}</div>
                    <span className="badge-app" style={{
                      background: app.status === "rejected" ? "rgba(239,68,68,0.15)" : "var(--border)",
                      color: app.status === "rejected" ? "#ef4444" : "var(--text-sec)",
                      border: `1px solid ${app.status === "rejected" ? "rgba(239,68,68,0.3)" : "var(--border-mid)"}`
                    }}>{app.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                    {app.project_domain} <span style={{ opacity: 0.5, margin: "0 8px" }}>|</span> Applied {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                </div>
              ))
        )}
      </main>

      {/* Modals */}
      {modal === "followers" && <UserListModal title={`Followers (${followers.length})`} users={followers} onClose={() => setModal(null)} />}
      {modal === "following" && <UserListModal title={`Following (${following.length})`} users={following} onClose={() => setModal(null)} />}
    </div>
  );
}