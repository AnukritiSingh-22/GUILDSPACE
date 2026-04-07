// src/pages/Profile.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, updateSkills, fetchMyApplications } from "../api/api";
import ProjectCard from "../components/ProjectCard";
import SkillTag from "../components/SkillTag";
import TrustBadge from "../components/TrustBadge";

function TrustRing({ value }) {
  const r = 30, cx = 38, cy = 38, circ = 2 * Math.PI * r, pct = Math.min(value, 5) / 5;
  return (
    <svg width="76" height="76">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)"
        strokeWidth={5} strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={15} fontWeight={700}
        fill="var(--accent-mid)" fontFamily="Syne, sans-serif">{value}</text>
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
  const TABS     = ["Projects", "Applications", "Endorsements"];

  // Load my applications when tab switches
  const handleTab = async (t) => {
    setTab(t);
    if (t === "Applications" && myApps === null) {
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
    width: "100%", padding: "8px 11px",
    background: "var(--bg-input)", border: "1px solid var(--border-mid)",
    borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--text-primary)",
    fontFamily: "var(--font-body)", outline: "none", marginBottom: 10, boxSizing: "border-box",
  };

  return (
    <div className="profile-layout page-enter">

      {/* ── Left panel ──────────────────────────────────────────── */}
      <aside className="profile-left">
        <div className="avatar" style={{
          width: 72, height: 72, fontSize: 26, marginBottom: 14,
          background: "rgba(124,58,237,0.2)", border: "2px solid rgba(124,58,237,0.4)",
          color: "var(--accent-mid)",
        }}>{profile?.initials || "?"}</div>

        {editing ? (
          <>
            <input style={inputStyle} value={editForm.full_name}
              onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Full name" />
            <input style={inputStyle} value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
              placeholder="Role (e.g. ML Engineer)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input style={{ ...inputStyle, marginBottom: 0 }} value={editForm.city}
                onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                placeholder="City" />
              <input style={{ ...inputStyle, marginBottom: 0 }} value={editForm.college}
                onChange={e => setEditForm(f => ({ ...f, college: e.target.value }))}
                placeholder="College" />
            </div>
            <div style={{ height: 10 }} />
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Short bio…" />
            <input style={inputStyle} value={editForm.github_url}
              onChange={e => setEditForm(f => ({ ...f, github_url: e.target.value }))}
              placeholder="github.com/username" />
            <div className="flex gap-8">
              <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 3 }}>
              {profile?.full_name}
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 18 }}>
              {[profile?.role, profile?.college, profile?.city].filter(Boolean).join(" · ")}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={startEdit} style={{ marginBottom: 18 }}>
              Edit profile
            </button>
          </>
        )}

        {/* Trust box */}
        <div className="meta-box" style={{ marginBottom: 20 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-display)",
                color: "var(--accent-mid)", lineHeight: 1 }}>
                {profile?.trust_score || "1.0"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>Trust value</div>
            </div>
            <TrustRing value={parseFloat(profile?.trust_score || 1)} />
          </div>
          <div className="trust-bar-outer">
            <div className="trust-bar-inner"
              style={{ width: `${(Math.min(parseFloat(profile?.trust_score || 1), 5) / 5) * 100}%` }} />
          </div>
          <div style={{ fontSize: 10, color: "var(--text-hint)", marginTop: 5 }}>
            Level {profile?.trust_level || 1} Guildmember
          </div>
        </div>

        {/* Skills */}
        <div className="section-label" style={{ marginTop: 0 }}>Skills</div>
        <div style={{ marginBottom: 12 }}>
          {skills.map(s => (
            <span key={s.id} className="skill-chip" style={{ cursor: "pointer" }}
              onClick={() => removeSkill(s.name)} title="Click to remove">
              {s.name} ×
            </span>
          ))}
        </div>
        <div className="flex gap-6">
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            placeholder="Add a skill…" onKeyDown={e => e.key === "Enter" && addSkill()}
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
          <button className="btn btn-accent-outline btn-sm" onClick={addSkill}>Add</button>
        </div>

        {/* Bio & links */}
        {profile?.bio && (
          <>
            <div className="section-label">Bio</div>
            <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>{profile.bio}</div>
          </>
        )}
        {profile?.interests && (
          <>
            <div className="section-label">Interests</div>
            <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 14 }}>
              {profile.interests}
            </div>
          </>
        )}
        {(profile?.github_url || profile?.arxiv_url) && (
          <>
            <div className="section-label">Links</div>
            {profile.github_url && (
              <div style={{ fontSize: 12, color: "var(--accent-mid)", marginBottom: 4, cursor: "pointer" }}>
                ↗ {profile.github_url}
              </div>
            )}
            {profile.arxiv_url && (
              <div style={{ fontSize: 12, color: "var(--accent-mid)", cursor: "pointer" }}>
                ↗ {profile.arxiv_url}
              </div>
            )}
          </>
        )}
      </aside>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <main className="profile-right">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            ["Trust score",  profile?.trust_score || "1.0"],
            ["Trust level",  `Level ${profile?.trust_level || 1}`],
            ["Skills",       skills.length],
          ].map(([label, val]) => (
            <div key={label} className="stat-box">
              <div className="stat-num">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn${tab === t ? " active" : ""}`}
              onClick={() => handleTab(t)}>{t}</button>
          ))}
        </div>

        {tab === "Projects" && (
          <div style={{ color: "var(--text-sec)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
            Your completed and active projects will appear here once you join collaborations.
          </div>
        )}

        {tab === "Applications" && (
          myApps === null
            ? <div style={{ color: "var(--text-hint)", padding: "40px 0", textAlign: "center" }}>Loading…</div>
            : myApps.length === 0
            ? <div style={{ color: "var(--text-hint)", padding: "40px 0", textAlign: "center" }}>No applications yet.</div>
            : myApps.map(app => (
                <div key={app.application_id} className="proj-card">
                  <div className="flex justify-between items-center mb-8">
                    <div className="proj-card-title">{app.project_title}</div>
                    <span className={`badge ${
                      app.status === "accepted"    ? "badge-success" :
                      app.status === "rejected"    ? "badge-danger"  :
                      app.status === "shortlisted" ? "badge-info"    :
                      "badge-neutral"
                    }`}>{app.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-sec)" }}>
                    {app.project_domain} · Applied {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                </div>
              ))
        )}

        {tab === "Endorsements" && (
          <div style={{ color: "var(--text-hint)", padding: "40px 0", textAlign: "center" }}>
            Endorsements will appear here after collaborating on projects.
          </div>
        )}
      </main>
    </div>
  );
}