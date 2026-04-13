// src/pages/Home.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAiFeed, hideProject, deleteProject } from "../api/api";
import { useAuth } from "../context/AuthContext";
import SkillTag from "../components/SkillTag";

const DOMAINS = ["All", "Research", "Tech / Dev", "Design", "Science", "Social / NGO"];

function DiffBar({ value }) {
  return (
    <div className="diff-bar" style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ 
          width: 6, height: 6, borderRadius: 1, 
          background: i < value ? "linear-gradient(135deg, #7B5EA7, #9B6FD4)" : "var(--border-mid)" 
        }} />
      ))}
    </div>
  );
}

function TrustRing({ value }) {
  const r = 26, cx = 34, cy = 34, circ = 2 * Math.PI * r, pct = value / 5;
  return (
    <svg width="68" height="68">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#7B5EA7"
        strokeWidth={5} strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={600}
        fill="#9B6FD4" fontFamily="Syne, sans-serif">{value}</text>
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

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleDocClick = () => setMenuOpenId(null);
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleHide = async (e, postId) => {
    e.stopPropagation();
    setMenuOpenId(null);
    try {
      await hideProject(postId);
      setProjects(prev => prev.filter(p => p.id !== postId));
      showToast("Post hidden", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteProject(postId);
      setProjects(prev => prev.filter(p => p.id !== postId));
      showToast("Post deleted", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

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
      <style>{`
        .home-post-card {
          background: #141414;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .home-post-card:hover {
          border-color: rgba(155,111,212,0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .home-post-card-featured {
          background: rgba(123,94,167,0.05);
          border-left: none; /* using pseudo instead for gradient */
        }
        .home-post-card-featured::before {
          content: "";
          position: absolute;
          left: -1px; top: -1px; bottom: -1px;
          width: 4px;
          background: linear-gradient(180deg, #7B5EA7, #9B6FD4);
          border-radius: 16px 0 0 16px;
        }
      `}</style>

      {/* ── Left Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar-left" style={{ background: "#0D0D0D", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="section-label" style={{ marginTop: 0 }}>Domain</div>
        {DOMAINS.map(d => {
          const active = domain === d;
          return (
            <div key={d} className="filter-item"
              style={{
                borderRadius: 24, padding: "8px 12px", marginBottom: 6, cursor: "pointer",
                background: active ? "linear-gradient(135deg, rgba(123,94,167,0.2), rgba(155,111,212,0.2))" : "transparent",
                color: active ? "#FFFFFF" : "var(--text-sec)",
                border: active ? "1px solid rgba(155,111,212,0.3)" : "1px solid transparent",
                display: "flex", alignItems: "center", gap: 8, fontSize: 13
              }}
              onClick={() => setDomain(d)}>
              {d}
            </div>
          );
        })}

        <div className="section-label">Max Difficulty</div>
        <input type="range" min={1} max={10} value={maxDiff}
          onChange={e => setMaxDiff(+e.target.value)}
          style={{ width: "100%", marginBottom: 4, accentColor: "#9B6FD4" }} />
        <div className="flex justify-between" style={{ fontSize: 10, color: "var(--text-hint)" }}>
          <span>1</span>
          <span style={{ color: "#9B6FD4", fontWeight: 500 }}>{maxDiff}</span>
          <span>10</span>
        </div>

        {user?.skills?.length > 0 && (
          <>
            <div className="section-label">My Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {user.skills.slice(0, 6).map(s => (
                <div key={s.id} style={{
                  fontSize: 11, background: "rgba(155, 111, 212, 0.08)",
                  border: "1px solid rgba(155, 111, 212, 0.15)", color: "var(--text-sec)",
                  padding: "4px 10px", borderRadius: 8
                }}>
                  {s.name}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* ── Feed ──────────────────────────────────────────────────── */}
      <main className="feed-main">
        <div className="flex items-center gap-12" style={{ marginBottom: 20 }}>
          <span className="ai-pill" style={{ 
            background: "rgba(232,121,160,0.15)", color: "#E879A0", 
            border: "1px solid rgba(232,121,160,0.3)", padding: "4px 12px", borderRadius: 20,
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500
          }}>
            <span className="ai-dot" style={{ background: "#E879A0" }} /> AI-curated for you
          </span>
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
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,.3)",
            color: "#ef4444", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
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
            className={`home-post-card${i === 0 ? " home-post-card-featured" : ""}`}
            onClick={() => navigate(`/project/${post.id}`)}>
            
            {post.creator_id === user?.id && (
              <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === post.id ? null : post.id);
                  }}
                  style={{
                    width: 28, height: 28, background: "transparent", color: "#A0A0A0",
                    border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#A0A0A0"; }}
                >
                  ⋮
                </button>
                {menuOpenId === post.id && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: "absolute", top: 36, right: 8, background: "#1A1A1A",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 50,
                      minWidth: 140, padding: 4
                    }}
                  >
                    <div
                      onClick={(e) => { e.stopPropagation(); navigate(`/edit-project/${post.id}`); }}
                      style={{
                        padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6,
                        color: "white", display: "flex", alignItems: "center", gap: 8
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: 14 }}>✏️</span> Edit post
                    </div>
                    <div
                      onClick={(e) => handleHide(e, post.id)}
                      style={{
                        padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6,
                        color: "white", display: "flex", alignItems: "center", gap: 8
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: 14 }}>👁️‍🗨️</span> Hide post
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                    <div
                      onClick={(e) => handleDelete(e, post.id)}
                      style={{
                        padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6,
                        color: "#EF4444", display: "flex", alignItems: "center", gap: 8
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: 14 }}>🗑️</span> Delete post
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Match Badge (absolute) */}
            {post.ai_match > 0 && (
              <div style={{
                position: "absolute", top: 24, right: 24,
                background: "rgba(232,121,160,0.15)", color: "#E879A0", border: "1px solid rgba(232,121,160,0.3)",
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500
              }}>
                {post.ai_match}% Match
              </div>
            )}

            {/* Header */}
            <div className="proj-card-header" style={{ marginBottom: 16, paddingRight: post.ai_match > 0 ? 80 : 0 }}>
              <div className="flex items-center gap-8">
                <div className="avatar" style={{
                  width: 32, height: 32, fontSize: 12, flexShrink: 0,
                  background: "var(--bg-elevated)", border: "1px solid var(--border-mid)",
                  color: "var(--text-primary)",
                }}>{post.poster_initials}</div>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{post.poster_name}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 6, color: "var(--text-sec)" }}>
                  {post.domain}
                </span>
                {i === 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 500,
                    padding: "3px 10px", borderRadius: 20, background: "rgba(155,111,212,0.15)",
                    color: "#9B6FD4", border: "1px solid rgba(155,111,212,0.3)"
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9B6FD4" }} /> Top Match
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: "var(--text-hint)" }}>{post.time_ago}</span>
            </div>

            <div className="proj-card-body">
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 8 }}>
                {post.title}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6 }}>
                {post.description?.slice(0, 115)}…
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px -24px" }} />

            <div className="proj-card-footer">
              <div className="proj-card-tags">
                {post.skills?.map(t => (
                  <div key={t} style={{
                    fontSize: 11, background: "rgba(155,111,212,0.08)", border: "1px solid rgba(155,111,212,0.15)",
                    color: "var(--text-sec)", padding: "3px 8px", borderRadius: 8
                  }}>
                    {t}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-16">
                <div className="flex items-center gap-6" style={{ fontSize: 12, color: "var(--text-sec)" }}>
                  <DiffBar value={post.difficulty} />
                  <span style={{ fontWeight: 500 }}>{post.difficulty}/10</span>
                </div>
                <button
                  style={{
                    padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                    background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff", cursor: (post.already_applied || !post.can_apply) ? "not-allowed" : "pointer",
                    opacity: (post.already_applied || !post.can_apply) ? 0.45 : 1, transition: "0.2s"
                  }}
                  disabled={post.already_applied || !post.can_apply}
                  onClick={e => { 
                    e.stopPropagation(); 
                    if(!post.already_applied && post.can_apply) navigate(`/project/${post.id}`); 
                  }}
                  onMouseEnter={e => { if(!post.already_applied && post.can_apply) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                >
                  {post.already_applied ? "Applied" : "Apply →"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)",
            borderLeft: `4px solid ${t.type === 'success' ? '#10B981' : '#EF4444'}`,
            borderRadius: 10, padding: "12px 16px", color: "white", fontSize: 13,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Right Panel ───────────────────────────────────────────── */}
      <aside className="sidebar-right" style={{ background: "#0D0D0D", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", paddingBottom: 16,
          borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
          <div className="avatar" style={{
            width: 46, height: 46, fontSize: 17, margin: "0 auto 8px",
            background: "rgba(155,111,212,0.1)", border: "1.5px solid rgba(155,111,212,0.3)",
            color: "#9B6FD4",
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
          <div key={k} style={{ 
            display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", 
            borderBottom: "1px solid rgba(255,255,255,0.06)" 
          }}>
            <span style={{ color: "var(--text-sec)" }}>{k}</span>
            <span style={{ fontWeight: 500, color: "#fff" }}>{v}</span>
          </div>
        ))}
      </aside>
    </div>
  );
}