// src/pages/Home.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAiFeed } from "../api/api";
import { useAuth } from "../context/AuthContext";
import SkillTag from "../components/SkillTag";

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
  const r = 26, cx = 34, cy = 34, circ = 2 * Math.PI * r, pct = value / 5;
  return (
    <svg width="68" height="68">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)"
        strokeWidth={5} strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={600}
        fill="var(--accent-mid)" fontFamily="Syne, sans-serif">{value}</text>
    </svg>
  );
}

export default function Home() {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const [domain,    setDomain]    = useState("All");
  const [maxDiff,   setMaxDiff]   = useState(10);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  // Fetch AI-ranked feed whenever filters change
  useEffect(() => {
    setLoading(true);
    setError("");
    fetchAiFeed({
      domain:   domain !== "All" ? domain : undefined,
      max_diff: maxDiff < 10    ? maxDiff : undefined,
    })
      .then(data => setProjects(data?.projects || []))
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false));
  }, [domain, maxDiff]);

  const profile = user?.profile;

  return (
    <div className="feed-layout page-enter">

      {/* ── Left Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar-left">
        <div className="section-label" style={{ marginTop: 0 }}>Domain</div>
        {DOMAINS.map(d => (
          <div key={d} className={`filter-item${domain === d ? " active" : ""}`}
            onClick={() => setDomain(d)}>
            <div className="filter-dot" />{d}
          </div>
        ))}

        <div className="section-label">Max Difficulty</div>
        <input type="range" min={1} max={10} value={maxDiff}
          onChange={e => setMaxDiff(+e.target.value)}
          style={{ width: "100%", marginBottom: 4 }} />
        <div className="flex justify-between" style={{ fontSize: 10, color: "var(--text-hint)" }}>
          <span>1</span>
          <span style={{ color: "var(--accent-mid)", fontWeight: 500 }}>{maxDiff}</span>
          <span>10</span>
        </div>

        {user?.skills?.length > 0 && (
          <>
            <div className="section-label">My Skills</div>
            <div>{user.skills.slice(0, 6).map(s => (
              <SkillTag key={s.id} accent>{s.name}</SkillTag>
            ))}</div>
          </>
        )}
      </aside>

      {/* ── Feed ──────────────────────────────────────────────────── */}
      <main className="feed-main">
        <div className="flex items-center gap-12" style={{ marginBottom: 20 }}>
          <span className="ai-pill"><span className="ai-dot" /> AI-curated for you</span>
          {!loading && (
            <span style={{ fontSize: 13, color: "var(--text-sec)" }}>
              {projects.length} relevant collaborations
            </span>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-hint)" }}>
            Loading your feed…
          </div>
        )}

        {error && (
          <div style={{ background: "var(--danger-light)", border: "1px solid rgba(239,68,68,.3)",
            color: "var(--danger)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!loading && projects.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-hint)" }}>
            No posts match your filters.
          </div>
        )}

        {projects.map((post, i) => (
          <div key={post.id}
            className={`card card-clickable${i === 0 ? " card-featured" : ""}`}
            style={{ marginBottom: 12 }}
            onClick={() => navigate(`/project/${post.id}`)}>

            {/* Header */}
            <div className="post-header">
              <div className="avatar" style={{
                width: 26, height: 26, fontSize: 10, flexShrink: 0,
                background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.3)",
                color: "var(--accent-mid)",
              }}>{post.poster_initials}</div>
              <span>{post.poster_name}</span>
              <span className="badge badge-neutral" style={{ fontSize: 10 }}>{post.domain}</span>
              {i === 0 && <span className="ai-pill"><span className="ai-dot" /> AI match</span>}
              <span style={{ marginLeft: "auto" }}>{post.time_ago}</span>
            </div>

            <div className="post-title">{post.title}</div>
            <div className="post-desc">{post.description?.slice(0, 115)}…</div>

            <div className="post-footer">
              <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
                {post.skills?.map(t => <SkillTag key={t}>{t}</SkillTag>)}
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-6" style={{ fontSize: 11, color: "var(--text-sec)" }}>
                  <DiffBar value={post.difficulty} />
                  <span>{post.difficulty}/10</span>
                </div>
                <span style={{ fontSize: 10, color: "var(--text-hint)" }}>
                  Min trust {post.min_trust}
                </span>
                {post.ai_match > 0 && (
                  <span className="badge badge-accent" style={{ fontSize: 10 }}>
                    {post.ai_match}% match
                  </span>
                )}
                <button
                  className="btn btn-accent-outline btn-sm"
                  disabled={post.already_applied || !post.can_apply}
                  style={{ opacity: post.can_apply && !post.already_applied ? 1 : 0.45 }}
                  onClick={e => { e.stopPropagation(); navigate(`/project/${post.id}`); }}
                >
                  {post.already_applied ? "Applied" : "Apply"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* ── Right Panel ───────────────────────────────────────────── */}
      <aside className="sidebar-right">
        <div style={{ textAlign: "center", paddingBottom: 16,
          borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <div className="avatar" style={{
            width: 46, height: 46, fontSize: 17, margin: "0 auto 8px",
            background: "rgba(124,58,237,0.2)", border: "1.5px solid rgba(124,58,237,0.4)",
            color: "var(--accent-mid)",
          }}>{profile?.initials || "?"}</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{profile?.full_name || ""}</div>
          <div style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8 }}>
            {profile?.role} · {profile?.city}
          </div>
          <TrustRing value={parseFloat(profile?.trust_score || 1)} />
          <div style={{ fontSize: 10, color: "var(--text-hint)", marginTop: 4 }}>Trust value</div>
        </div>

        <div className="section-label" style={{ marginTop: 0 }}>Your stats</div>
        {[
          ["Trust level", `Level ${profile?.trust_level || 1}`],
          ["Trust score", profile?.trust_score || "1.0"],
        ].map(([k, v]) => (
          <div key={k} className="stat-row">
            <span style={{ color: "var(--text-sec)" }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </aside>
    </div>
  );
}