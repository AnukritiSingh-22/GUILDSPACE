// src/pages/Applications.jsx
import { useState } from "react";
import { POSTS, APPLICANTS } from "../api/api";
import SkillTag from "../components/SkillTag";
import TrustBadge from "../components/TrustBadge";

export default function Applications() {
  const post = POSTS[0]; // Poster viewing their first post
  const [selected, setSelected] = useState(APPLICANTS[0]);
  const [decisions, setDecisions] = useState({});

  const decide = (id, val) => setDecisions(prev => ({ ...prev, [id]: val }));

  return (
    <div className="poster-layout page-enter">
      {/* ── Applicant list ───────────────────────────────────────────── */}
      <aside className="app-list">
        <div className="app-list-header">
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{APPLICANTS.length} applicants</div>
            <div style={{ fontSize: 11, color: "var(--text-sec)" }}>AI sorted by fit</div>
          </div>
          <button className="btn btn-accent-outline btn-sm" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span className="ai-dot" /> AI suggest
          </button>
        </div>

        {APPLICANTS.map(ap => {
          const d = decisions[ap.id];
          return (
            <div
              key={ap.id}
              className={`app-row${selected?.id === ap.id ? " selected" : ""}`}
              onClick={() => setSelected(ap)}
              style={{ opacity: d === "pass" ? 0.45 : 1 }}
            >
              {/* Avatar */}
              <div className="avatar" style={{
                width: 36, height: 36, fontSize: 12, flexShrink: 0,
                background: "rgba(124,58,237,0.18)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "var(--accent-mid)",
              }}>{ap.initials}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-6" style={{ flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{ap.name}</span>
                  {ap.badge && <span className="badge badge-accent" style={{ fontSize: 10 }}>{ap.badge}</span>}
                  {d === "accepted"   && <span className="badge badge-success" style={{ fontSize: 10 }}>Accepted</span>}
                  {d === "shortlisted"&& <span className="badge badge-info"    style={{ fontSize: 10 }}>Shortlisted</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-sec)" }}>{ap.role} · Trust {ap.trust}</div>
                <div className="flex gap-4 mt-4" style={{ flexWrap: "wrap" }}>
                  {ap.skills.slice(0, 3).map(s => (
                    <span key={s} className="tag" style={{ fontSize: 9, padding: "1px 5px" }}>
                      {s.replace(" ✓", "")}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-display)" }}
                  className={ap.fit >= 80 ? "fit-high" : ap.fit >= 60 ? "fit-mid" : "fit-low"}>
                  {ap.fit}%
                </div>
                <div style={{ fontSize: 9, color: "var(--text-hint)" }}>AI fit</div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* ── Detail panel ─────────────────────────────────────────────── */}
      <main className="poster-detail">
        {/* Post summary */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 4 }}>{post.title}</div>
          <div className="flex gap-16" style={{ fontSize: 12, color: "var(--text-sec)", flexWrap: "wrap" }}>
            <span>Difficulty {post.difficulty}/10</span>
            <span>Min trust {post.minTrust}</span>
            <span>Needs: {post.tags.join(", ")}</span>
          </div>
        </div>

        {selected && (
          <div className="detail-card">
            {/* Applicant header */}
            <div className="flex gap-14" style={{ paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 18 }}>
              <div className="avatar" style={{
                width: 54, height: 54, fontSize: 18,
                background: "rgba(124,58,237,0.2)",
                border: "2px solid rgba(124,58,237,0.35)",
                color: "var(--accent-mid)",
              }}>{selected.initials}</div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-display)" }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{selected.role} · {selected.city}</div>
                <div className="flex gap-6 mt-8" style={{ flexWrap: "wrap" }}>
                  <TrustBadge value={selected.trust} />
                  <span className="badge badge-success">{selected.projects} projects done</span>
                  {selected.badge && <span className="badge badge-info">AI Top Pick</span>}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1 }}
                  className={selected.fit >= 80 ? "fit-high" : selected.fit >= 60 ? "fit-mid" : "fit-low"}>
                  {selected.fit}%
                </div>
                <div style={{ fontSize: 11, color: "var(--text-hint)" }}>AI fit score</div>
              </div>
            </div>

            {/* AI recommendation */}
            <div className="ai-box" style={{ marginBottom: 18 }}>
              <div className="ai-box-header"><span>✦</span> AI recommendation</div>
              <div className="ai-box-body">{post.aiReason}</div>
            </div>

            {/* Skill match */}
            <div className="flex gap-6" style={{ flexWrap: "wrap", marginBottom: 18 }}>
              {selected.skills.map(s => (
                <span key={s} style={{
                  fontSize: 11, background: "rgba(16,185,129,0.12)",
                  color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)",
                  padding: "3px 9px", borderRadius: 5,
                }}>{s}</span>
              ))}
              {selected.missing.map(s => (
                <span key={s} className="tag" style={{ fontSize: 11 }}>{s} (missing)</span>
              ))}
            </div>

            {/* Q&A */}
            {selected.answers.map((a, i) => (
              <div key={i} className="answer-block">
                <div className="answer-q">{post.questions[i] || `Question ${i + 1}`}</div>
                <div className="answer-a">"{a}"</div>
              </div>
            ))}

            {/* Action row */}
            <div className="flex gap-8" style={{
              paddingTop: 18, borderTop: "1px solid var(--border)",
              flexWrap: "wrap", alignItems: "center",
            }}>
              <button className="btn btn-success" onClick={() => decide(selected.id, "accepted")}>
                Accept collaborator
              </button>
              <button className="btn btn-accent-outline" onClick={() => decide(selected.id, "shortlisted")}>
                Shortlist
              </button>
              <button className="btn btn-ghost" onClick={() => decide(selected.id, "pass")}>
                Pass
              </button>
              {decisions[selected.id] && (
                <span style={{ fontSize: 11, color: "var(--success)", marginLeft: 8 }}>
                  {decisions[selected.id] === "accepted"
                    ? "✓ Accepted — they'll be notified."
                    : decisions[selected.id] === "shortlisted"
                    ? "✓ Shortlisted."
                    : "Passed."}
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}