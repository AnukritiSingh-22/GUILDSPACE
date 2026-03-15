// src/pages/ProjectDetails.js
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { POSTS } from "../api/api";
import { useAuth } from "../context/AuthContext";
import ApplyModal from "../components/ApplyModal";
import SkillTag from "../components/SkillTag";

function DiffBar({ value }) {
  return (
    <div className="diff-bar">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={`diff-seg${i < value ? " on" : ""}`} />
      ))}
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const post = POSTS.find(p => p.id === Number(id));
  if (!post) return (
    <div className="page-wrap" style={{ textAlign: "center", paddingTop: 80, color: "var(--text-sec)" }}>
      Post not found. <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>Go home</button>
    </div>
  );

  const canApply = user.trust >= post.minTrust;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="success-screen page-enter">
        <div className="success-circle">✓</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>Application sent!</h2>
        <p style={{ fontSize: 14, color: "var(--text-sec)" }}>
          You'll be notified when {post.poster.name} reviews it.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>Back to feed</button>
      </div>
    );
  }

  // ── Apply flow ──────────────────────────────────────────────────────────────
  if (applying) {
    return (
      <ApplyModal
        post={post}
        onBack={() => setApplying(false)}
        onSubmit={async (data) => {
          await new Promise(r => setTimeout(r, 800));
          setSubmitted(true);
        }}
      />
    );
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  return (
    <div className="page-wrap page-enter">
      <button className="back-btn" onClick={() => navigate("/")}>← Back to feed</button>

      <div className="detail-grid">
        {/* Left: post content */}
        <div>
          {/* Poster row */}
          <div className="flex items-center gap-12" style={{ marginBottom: 16 }}>
            <div className="avatar" style={{
              width: 42, height: 42, fontSize: 15,
              background: "rgba(124,58,237,0.18)",
              border: "1.5px solid rgba(124,58,237,0.3)",
              color: "var(--accent-mid)",
            }}>{post.poster.initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{post.poster.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{post.domain} · {post.poster.city} · {post.timeAgo}</div>
            </div>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1.25, marginBottom: 14 }}>
            {post.title}
          </h1>

          <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.75, marginBottom: 20 }}>
            {post.desc}
          </p>

          {/* Tags */}
          <div className="flex gap-6" style={{ flexWrap: "wrap", marginBottom: 20 }}>
            {post.tags.map(t => <SkillTag key={t} accent>{t}</SkillTag>)}
          </div>

          {/* Stats */}
          <div className="meta-box">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <div className="meta-label">Difficulty</div>
                <div className="flex items-center gap-6">
                  <DiffBar value={post.difficulty} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{post.difficulty}/10</span>
                </div>
              </div>
              <div>
                <div className="meta-label">Min trust</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--accent-mid)" }}>
                  {post.minTrust}
                </div>
              </div>
              <div>
                <div className="meta-label">Applicants</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  {post.applicants}
                </div>
              </div>
            </div>
          </div>

          {/* Questions preview */}
          {post.applyType === "questions" && post.questions.length > 0 && (
            <div className="meta-box">
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Application questions</div>
              {post.questions.map((q, i) => (
                <div key={i} style={{
                  fontSize: 13, color: "var(--text-sec)", paddingLeft: 12,
                  borderLeft: "2px solid var(--accent-border)", marginBottom: 10, lineHeight: 1.6,
                }}>{q}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right: action sidebar */}
        <div>
          {/* Trust gate */}
          <div className="sidebar-card" style={{
            background: canApply ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${canApply ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: canApply ? "var(--success)" : "var(--danger)", marginBottom: 3 }}>
              {canApply ? "✓ You meet requirements" : "✗ Trust too low"}
            </div>
            <div style={{ fontSize: 11, color: canApply ? "var(--success)" : "var(--danger)" }}>
              Your trust {user.trust} {canApply ? "≥" : "<"} required {post.minTrust}
            </div>
          </div>

          {/* Skill match */}
          <div className="sidebar-card">
            <div className="section-label" style={{ marginTop: 0 }}>Your skill match</div>
            {post.tags.map(t => {
              const has = user.skills.some(s => s.toLowerCase().includes(t.toLowerCase().split(" ")[0]));
              return (
                <div className="match-row" key={t}>
                  <span style={{ color: "var(--text-sec)" }}>{t}</span>
                  <span style={{ color: has ? "var(--success)" : "var(--warning)", fontWeight: 500, fontSize: 12 }}>
                    {has ? "In profile ✓" : "Not listed"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* AI insight */}
          <div className="ai-box" style={{ marginBottom: 14 }}>
            <div className="ai-box-header">
              <span>✦</span> AI insight · {post.aiMatch}% match
            </div>
            <div className="ai-box-body">{post.aiReason}</div>
          </div>

          {/* Apply button */}
          <button
            className="btn btn-primary btn-lg btn-full"
            disabled={!canApply}
            style={{ opacity: canApply ? 1 : 0.4, cursor: canApply ? "pointer" : "not-allowed" }}
            onClick={() => canApply && setApplying(true)}
          >
            {post.applyType === "oneclick" ? "One-click Apply →" : "Apply to Project →"}
          </button>
          {!canApply && (
            <p style={{ fontSize: 11, color: "var(--text-hint)", textAlign: "center", marginTop: 6 }}>
              Complete easier projects to raise your trust value.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}