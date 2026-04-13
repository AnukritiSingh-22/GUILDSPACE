// src/pages/Profile.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, updateSkills, fetchMyApplications } from "../api/api";
import ProjectCard from "../components/ProjectCard";
import SkillTag from "../components/SkillTag";
import TrustBadge from "../components/TrustBadge";

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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#7B5EA7"
        strokeWidth={5} strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={15} fontWeight={700}
        fill="#9B6FD4" fontFamily="Syne, sans-serif">{value}</text>
    </svg>
  );
}

export default function Profile() {
  const { user, refreshUser }        = useAuth();
  const [tab,        setTab]         = useState("Projects");
  const [editing,    setEditing]     = useState(false);
  const [saving,     setSaving]      = useState(false);
  const [skillInput, setSkillInput]  = useState("");
  const [editForm,   setEditForm]    = useState({});
  const [myApps,     setMyApps]      = useState(null);

  const profile  = user?.profile;
  const skills   = user?.skills  || [];
  const TABS     = ["Projects", "Applications"];

  // Load my applications when tab switches
  const handleTab = async (t) => {
    setTab(t);
    if ((t === "Applications" || t === "Projects") && myApps === null) {
      const data = await fetchMyApplications().catch(() => []);
      setMyApps(data || []);
    }
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
    try {
      await updateProfile(editForm);
      await refreshUser();
      setEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = async () => {
    const name = skillInput.trim();
    if (!name) return;
    const names = [...skills.map(s => s.name), name];
    await updateSkills(names);
    await refreshUser();
    setSkillInput("");
  };

  const removeSkill = async (skillName) => {
    const names = skills.map(s => s.name).filter(n => n !== skillName);
    await updateSkills(names);
    await refreshUser();
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", fontSize: 13, color: "var(--text-primary)",
    fontFamily: "var(--font-body)", outline: "none", marginBottom: 10, boxSizing: "border-box",
    transition: "all 0.2s"
  };

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
          color: #9B6FD4;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11px;
          display: inline-block;
          margin: 3px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .skill-chip-luxury:hover {
          box-shadow: 0 0 8px rgba(155,111,212,0.4);
          border-color: #9B6FD4;
        }
        .edit-btn-luxury {
          background: transparent;
          color: var(--text-sec);
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.2s;
        }
        .edit-btn-luxury:hover {
          color: #fff;
          border-color: #9B6FD4;
          box-shadow: 0 0 8px rgba(155,111,212,0.25);
        }
        .profile-tab {
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(255,255,255,0.06);
          color: var(--text-sec);
          padding: 10px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          margin-right: 8px;
        }
        .profile-tab.active {
          color: #9B6FD4;
          border-bottom-color: #9B6FD4;
        }
        .text-gradient {
          background: linear-gradient(135deg, #7B5EA7, #9B6FD4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .badge-app {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
        }
      `}</style>

      {/* ── Left panel ──────────────────────────────────────────── */}
      <aside className="profile-left" style={{ background: "#0D0D0D", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="avatar" style={{
          width: 80, height: 80, fontSize: 26, marginBottom: 20,
          background: "var(--bg)", backgroundClip: "padding-box",
          border: "3px solid transparent",
          backgroundImage: "linear-gradient(#0D0D0D, #0D0D0D), linear-gradient(135deg, #7B5EA7, #9B6FD4)",
          backgroundOrigin: "border-box",
          color: "#fff",
        }}>{profile?.initials || "?"}</div>

        {editing ? (
          <>
            <input className="profile-input" style={inputStyle} value={editForm.full_name}
              onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Full name" />
            <input className="profile-input" style={inputStyle} value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
              placeholder="Role (e.g. ML Engineer)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input className="profile-input" style={{ ...inputStyle, marginBottom: 0 }} value={editForm.city}
                onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                placeholder="City" />
              <input className="profile-input" style={{ ...inputStyle, marginBottom: 0 }} value={editForm.college}
                onChange={e => setEditForm(f => ({ ...f, college: e.target.value }))}
                placeholder="College" />
            </div>
            <div style={{ height: 10 }} />
            <textarea className="profile-input" style={{ ...inputStyle, minHeight: 70 }} value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Short bio…" />
            <input className="profile-input" style={inputStyle} value={editForm.github_url}
              onChange={e => setEditForm(f => ({ ...f, github_url: e.target.value }))}
              placeholder="github.com/username" />
            <div className="flex gap-8">
              <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving} style={{ background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", border: "none", borderRadius: 12 }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 3, fontWeight: 700 }}>
              {profile?.full_name}
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 20 }}>
              {[profile?.role, profile?.college, profile?.city].filter(Boolean).join(" · ")}
            </div>
            <button className="btn btn-sm edit-btn-luxury" onClick={startEdit} style={{ marginBottom: 24, borderRadius: 100, padding: "6px 16px" }}>
              Edit profile
            </button>
          </>
        )}

        {/* Trust box */}
        <div style={{ 
          background: "#141414", border: "1px solid rgba(255,255,255,0.08)", 
          borderRadius: 16, padding: 20, marginBottom: 24 
        }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <div>
              <div className="text-gradient" style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1 }}>
                {profile?.trust_score || "1.0"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 4 }}>Trust value</div>
            </div>
            <TrustRing value={parseFloat(profile?.trust_score || 1)} />
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ 
              height: "100%", 
              background: "linear-gradient(90deg, #7B5EA7, #9B6FD4)",
              width: `${(Math.min(parseFloat(profile?.trust_score || 1), 5) / 5) * 100}%` 
            }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-hint)", marginTop: 8 }}>
            {getTrustBand(profile?.trust_score)} Guildmember
          </div>
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

        {/* Bio & links */}
        {profile?.bio && (
          <>
            <div className="section-label" style={{ marginTop: 24 }}>Bio</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>{profile.bio}</div>
          </>
        )}
        {profile?.interests && (
          <>
            <div className="section-label" style={{ marginTop: 24 }}>Interests</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 14 }}>
              {profile.interests}
            </div>
          </>
        )}
        {(profile?.github_url || profile?.arxiv_url) && (
          <>
            <div className="section-label" style={{ marginTop: 24 }}>Links</div>
            {profile.github_url && (
              <div style={{ fontSize: 12, color: "#9B6FD4", marginBottom: 6, cursor: "pointer" }}>
                ↗ {profile.github_url}
              </div>
            )}
            {profile.arxiv_url && (
              <div style={{ fontSize: 12, color: "#9B6FD4", cursor: "pointer" }}>
                ↗ {profile.arxiv_url}
              </div>
            )}
          </>
        )}
      </aside>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <main className="profile-right">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            ["Trust score",  profile?.trust_score || "1.0"],
            ["Trust level",  getTrustBand(profile?.trust_score)],
            ["Skills",       skills.length],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#fff", marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} className={`profile-tab${tab === t ? " active" : ""}`}
              onClick={() => handleTab(t)}>{t}</button>
          ))}
        </div>

        {tab === "Projects" && (
          <div style={{ padding: "10px 0" }}>
            {myApps === null ? (
              <div style={{ color: "var(--text-hint)", textAlign: "center" }}>Loading...</div>
            ) : myApps.filter(app => app.status === "accepted").length === 0 ? (
              <div style={{ color: "var(--text-sec)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                Your active collaborated projects will appear here once you are approved.
              </div>
            ) : (
              myApps.filter(app => app.status === "accepted").map(app => (
                <div key={app.application_id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div className="flex justify-between items-center mb-8">
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{app.project_title}</div>
                    <span className="badge-app" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>Collaborator</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                    {app.project_domain} <span style={{ opacity: 0.5, margin: "0 8px" }}>|</span> Approved Application
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "Applications" && (
          myApps === null
            ? <div style={{ color: "var(--text-hint)", padding: "40px 0", textAlign: "center" }}>Loading…</div>
            : myApps.filter(app => app.status !== "accepted").length === 0
            ? <div style={{ color: "var(--text-hint)", padding: "40px 0", textAlign: "center" }}>No pending or rejected applications.</div>
            : myApps.filter(app => app.status !== "accepted").map(app => (
                <div key={app.application_id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div className="flex justify-between items-center mb-8">
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{app.project_title}</div>
                    <span className="badge-app" style={{ 
                      background: app.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
                      color: app.status === "rejected" ? "#ef4444" : "#A0A0A0",
                      border: `1px solid ${app.status === "rejected" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`
                    }}>{app.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                    {app.project_domain} <span style={{ opacity: 0.5, margin: "0 8px" }}>|</span> Applied {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                </div>
              ))
        )}
      </main>
    </div>
  );
}