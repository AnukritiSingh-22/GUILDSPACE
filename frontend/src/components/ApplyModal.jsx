// src/components/ApplyModal.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SkillTag from "./SkillTag";
import TrustBadge from "./TrustBadge";

// ── Diff bar helper ──────────────────────────────────────────────────────────
function DiffBar({ value }) {
  return (
    <div className="diff-bar">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={`diff-seg${i < value ? " on" : ""}`} />
      ))}
    </div>
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div className="step-row">
      {steps.map((label, i) => {
        const state = current > i + 1 ? "done" : current === i + 1 ? "active" : "pending";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className={`step-num step-num-${state}`}>
              {state === "done" ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 12, color: state === "active" ? "var(--accent-mid)" : "var(--text-sec)", fontWeight: state === "active" ? 500 : 400 }}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="step-div" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ApplyModal({ post, onBack, onSubmit }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const canApply = user.trust >= post.minTrust;

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit({ postId: post.id, answers });
    setLoading(false);
  };

  // One-click apply
  if (post.applyType === "oneclick") {
    return (
      <div className="page-wrap-narrow page-enter">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="detail-card" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 8 }}>One-click Apply</h2>
          <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 24, lineHeight: 1.7 }}>
            Your profile and skill tags will be shared with <strong style={{ color: "var(--text-primary)" }}>{post.poster.name}</strong> instantly. No questions required.
          </p>

          <div className="sidebar-card flex items-center gap-12" style={{ marginBottom: 24, textAlign: "left" }}>
            <div className="avatar" style={{ width: 44, height: 44, background: "rgba(124,58,237,0.2)", border: "1.5px solid rgba(124,58,237,0.4)", fontSize: 16, color: "var(--accent-mid)", flexShrink: 0 }}>
              {user.initials}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
              <div className="flex gap-6 mt-8">
                <TrustBadge value={user.trust} />
                <span className="badge badge-success">{user.projects.length} projects done</span>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting…" : "Confirm Application →"}
          </button>
        </div>
      </div>
    );
  }

  // Multi-step apply
  const STEPS = ["Your profile", "Application", "Review"];

  return (
    <div className="page-wrap page-enter">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <StepIndicator steps={STEPS} current={step} />

      <div className="apply-grid">
        {/* Main content */}
        <div>
          {/* Step 1: Profile confirm */}
          {step === 1 && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 6 }}>Confirm your profile</h3>
              <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 20 }}>This will be shared with the poster.</p>

              <div className="detail-card">
                <div className="flex gap-12" style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
                  <div className="avatar" style={{ width: 50, height: 50, background: "rgba(124,58,237,0.2)", border: "1.5px solid rgba(124,58,237,0.4)", fontSize: 18, color: "var(--accent-mid)" }}>
                    {user.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{user.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{user.role} · {user.city} · {user.college}</div>
                    <div className="flex gap-6 mt-8">
                      <TrustBadge value={user.trust} />
                      <span className="badge badge-success">{user.projects.length} projects done</span>
                    </div>
                  </div>
                </div>
                <div className="section-label">Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {user.skills.map(s => <SkillTag key={s} accent>{s}</SkillTag>)}
                </div>
              </div>

              <div className="flex justify-between mt-16">
                <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
                <button className="btn btn-primary" onClick={() => setStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === 2 && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 6 }}>Answer the questions</h3>
              <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 20 }}>
                {post.poster.name} wants to know:
              </p>

              {post.questions.map((q, i) => (
                <div className="form-group" key={i}>
                  <label className="form-label">
                    {q}
                    <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 6 }}>Required</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Your answer…"
                    value={answers[i] || ""}
                    onChange={e => setAnswers({ ...answers, [i]: e.target.value })}
                  />
                </div>
              ))}

              <div className="form-group">
                <label className="form-label" style={{ color: "var(--text-sec)" }}>Link to relevant past work (optional)</label>
                <input
                  type="text"
                  placeholder="GitHub / paper / portfolio link"
                  value={answers["link"] || ""}
                  onChange={e => setAnswers({ ...answers, link: e.target.value })}
                />
              </div>

              <div className="flex justify-between mt-16">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Review →</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 6 }}>Review your application</h3>
              <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 20 }}>Everything look good?</p>

              {post.questions.map((q, i) => (
                <div className="meta-box" key={i} style={{ marginBottom: 12 }}>
                  <div className="meta-label">{q}</div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.65 }}>
                    {answers[i] || <em style={{ color: "var(--text-hint)" }}>Not answered</em>}
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center mt-16" style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--success)" }}>
                  ✓ Trust {user.trust} meets minimum {post.minTrust}
                </div>
                <div className="flex gap-8">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Edit</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Submitting…" : "Submit Application →"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="sidebar-card" style={{ background: "var(--bg-elevated)" }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5, lineHeight: 1.35 }}>{post.title}</div>
            <div className="text-sm text-sec mb-8">Posted by {post.poster.name}</div>
            <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
              {post.tags.map(t => <SkillTag key={t}>{t}</SkillTag>)}
            </div>
            <div className="flex items-center gap-8 mt-8" style={{ fontSize: 11, color: "var(--text-sec)" }}>
              Difficulty
              <DiffBar value={post.difficulty} />
              {post.difficulty}/10
            </div>
          </div>

          <div className="section-label">Skill match</div>
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
      </div>
    </div>
  );
}