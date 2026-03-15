// src/pages/Profile.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProjectCard from "../components/ProjectCard";
import SkillTag from "../components/SkillTag";
import TrustBadge from "../components/TrustBadge";

function TrustRing({ value }) {
  const r = 30, cx = 38, cy = 38;
  const circ = 2 * Math.PI * r;
  const pct = value / 5;
  return (
    <svg width="76" height="76">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)"
        strokeWidth={5}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round" />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={15} fontWeight={700}
        fill="var(--accent-mid)" fontFamily="Syne, sans-serif">{value}</text>
    </svg>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Projects");
  const TABS = ["Projects", "Applied", "Posted", "Endorsements"];

  return (
    <div className="profile-layout page-enter">
      {/* ── Left panel ──────────────────────────────────────────────── */}
      <aside className="profile-left">
        {/* Avatar */}
        <div className="avatar" style={{
          width: 72, height: 72, fontSize: 26,
          background: "rgba(124,58,237,0.2)",
          border: "2px solid rgba(124,58,237,0.4)",
          color: "var(--accent-mid)",
          marginBottom: 14,
        }}>{user.initials}</div>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 3 }}>{user.name}</h2>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 18 }}>
          {user.role} · {user.college} · {user.city}
        </div>

        {/* Trust display */}
        <div className="meta-box" style={{ marginBottom: 20 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--accent-mid)", lineHeight: 1 }}>
                {user.trust}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>Trust value</div>
            </div>
            <TrustRing value={user.trust} />
          </div>
          <div className="trust-bar-outer">
            <div className="trust-bar-inner" style={{ width: `${(user.trust / 5) * 100}%` }} />
          </div>
          <div style={{ fontSize: 10, color: "var(--text-hint)", marginTop: 5 }}>
            {user.trust} / 5.0 — Level {user.level} Guildmember · Unlock Level {user.level + 1} at 5.0
          </div>
        </div>

        {/* Skills */}
        <div className="section-label" style={{ marginTop: 0 }}>Top skills</div>
        <div style={{ marginBottom: 18 }}>
          {user.skills.slice(0, 3).map(s => <SkillTag key={s} accent>{s}</SkillTag>)}
          {user.skills.slice(3).map(s => <SkillTag key={s}>{s}</SkillTag>)}
          <span className="tag" style={{
            border: "1px dashed var(--accent-border)",
            color: "var(--accent-mid)",
            background: "transparent",
            cursor: "pointer",
          }}>+ Add skill</span>
        </div>

        {/* Interests */}
        <div className="section-label">Interests</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.75, marginBottom: 18 }}>
          {user.interests}
        </div>

        {/* Links */}
        <div className="section-label">Links</div>
        <div style={{ fontSize: 12, color: "var(--accent-mid)" }}>
          <div style={{ marginBottom: 5, cursor: "pointer" }}>↗ {user.links.github}</div>
          <div style={{ cursor: "pointer" }}>↗ {user.links.arxiv}</div>
        </div>
      </aside>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <main className="profile-right">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[["Projects done", "7"], ["Active now", "3"], ["Endorsements", "24"]].map(([label, val]) => (
            <div key={label} className="stat-box">
              <div className="stat-num">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {tab === "Projects" && user.projects.map((p, i) => (
          <ProjectCard key={i} project={p} />
        ))}

        {tab !== "Projects" && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-hint)" }}>
            No {tab.toLowerCase()} yet.
          </div>
        )}
      </main>
    </div>
  );
}