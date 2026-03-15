// src/pages/Home.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { POSTS } from "../api/api";
import { useAuth } from "../context/AuthContext";
import SkillTag from "../components/SkillTag";
import TrustBadge from "../components/TrustBadge";

const DOMAINS = ["All", "Research", "Tech / Dev", "Design", "Science", "Social / NGO"];

function DiffBar({ value }) {
  return (
    <div className="diff-bar">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={`diff-seg${i < value ? " on" : ""}`} />
      ))}
    </div>
  );
}

function TrustRing({ value }) {
  const r = 26, cx = 34, cy = 34;
  const circ = 2 * Math.PI * r;
  const pct = value / 5;
  return (
    <svg width="68" height="68">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)"
        strokeWidth={5}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={600}
        fill="var(--accent-mid)" fontFamily="Syne, sans-serif">{value}</text>
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domain, setDomain] = useState("All");
  const [maxDiff, setMaxDiff] = useState(10);

  const filtered = POSTS.filter(p =>
    (domain === "All" || p.domain === domain) && p.difficulty <= maxDiff
  );

  return (
    <div className="feed-layout page-enter">
      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar-left">
        <div className="section-label" style={{ marginTop: 0 }}>Domain</div>
        {DOMAINS.map(d => (
          <div
            key={d}
            className={`filter-item${domain === d ? " active" : ""}`}
            onClick={() => setDomain(d)}
          >
            <div className="filter-dot" />
            {d}
          </div>
        ))}

        <div className="section-label">Max Difficulty</div>
        <input
          type="range" min={1} max={10} value={maxDiff}
          onChange={e => setMaxDiff(+e.target.value)}
          style={{ width: "100%", marginBottom: 4 }}
        />
        <div className="flex justify-between" style={{ fontSize: 10, color: "var(--text-hint)" }}>
          <span>1</span>
          <span style={{ color: "var(--accent-mid)", fontWeight: 500 }}>{maxDiff}</span>
          <span>10</span>
        </div>

        <div className="section-label">My Skills</div>
        <div>
          {user.skills.slice(0, 5).map(s => (
            <SkillTag key={s} accent>{s}</SkillTag>
          ))}
        </div>
      </aside>

      {/* ── Feed ─────────────────────────────────────────────────────── */}
      <main className="feed-main">
        <div className="flex items-center gap-12" style={{ marginBottom: 20 }}>
          <span className="ai-pill"><span className="ai-dot" /> AI-curated for you</span>
          <span style={{ fontSize: 13, color: "var(--text-sec)" }}>
            {filtered.length} relevant collaborations
          </span>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-hint)" }}>
            No posts match your filters.
          </div>
        )}

        {filtered.map((post, i) => (
          <div
            key={post.id}
            className={`card card-clickable${i === 0 ? " card-featured" : ""}`}
            style={{ marginBottom: 12 }}
            onClick={() => navigate(`/project/${post.id}`)}
          >
            {/* Header */}
            <div className="post-header">
              <div className="avatar" style={{
                width: 26, height: 26, fontSize: 10,
                background: "rgba(124,58,237,0.18)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "var(--accent-mid)",
              }}>{post.poster.initials}</div>
              <span>{post.poster.name}</span>
              <span className="badge badge-neutral" style={{ fontSize: 10 }}>{post.domain}</span>
              {i === 0 && <span className="ai-pill"><span className="ai-dot" /> AI match</span>}
              <span style={{ marginLeft: "auto" }}>{post.timeAgo}</span>
            </div>

            <div className="post-title">{post.title}</div>
            <div className="post-desc">{post.desc.slice(0, 115)}…</div>

            {/* Footer */}
            <div className="post-footer">
              <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
                {post.tags.map(t => <SkillTag key={t}>{t}</SkillTag>)}
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-6" style={{ fontSize: 11, color: "var(--text-sec)" }}>
                  <DiffBar value={post.difficulty} />
                  <span>{post.difficulty}/10</span>
                </div>
                <span style={{ fontSize: 10, color: "var(--text-hint)" }}>Min trust {post.minTrust}</span>
                <button
                  className="btn btn-accent-outline btn-sm"
                  onClick={e => { e.stopPropagation(); navigate(`/project/${post.id}`); }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* ── Right Panel ──────────────────────────────────────────────── */}
      <aside className="sidebar-right">
        {/* Mini profile */}
        <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <div className="avatar" style={{
            width: 46, height: 46, fontSize: 17, margin: "0 auto 8px",
            background: "rgba(124,58,237,0.2)",
            border: "1.5px solid rgba(124,58,237,0.4)",
            color: "var(--accent-mid)",
          }}>{user.initials}</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8 }}>
            {user.role} · {user.city}
          </div>
          <TrustRing value={user.trust} />
          <div style={{ fontSize: 10, color: "var(--text-hint)", marginTop: 4 }}>Trust value</div>
        </div>

        <div className="section-label" style={{ marginTop: 0 }}>Your stats</div>
        {[["Projects done", "7"], ["Applied", "3"], ["Posted", "2"]].map(([k, v]) => (
          <div key={k} className="stat-row">
            <span style={{ color: "var(--text-sec)" }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}

        <div className="section-label">Trending skills</div>
        {[["#Python", "148"], ["#MachineLearning", "97"], ["#UXResearch", "64"], ["#ReactJS", "58"]].map(([k, v]) => (
          <div key={k} className="trend-item">
            <span className="trend-tag">{k}</span> {v} posts
          </div>
        ))}
      </aside>
    </div>
  );
}