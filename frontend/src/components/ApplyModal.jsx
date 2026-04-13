import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SkillTag from "./SkillTag";
import TrustBadge from "./TrustBadge";
import { applyToProject } from "../api/api";

// ── Diff bar helper ──────────────────────────────────────────────────────────
function DiffBar({ value }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ 
          width: 6, height: 6, borderRadius: 1, 
          background: i < value ? "linear-gradient(135deg, #7B5EA7, #9B6FD4)" : "rgba(255,255,255,0.1)" 
        }} />
      ))}
    </div>
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
      {steps.map((label, i) => {
        const state = current > i + 1 ? "done" : current === i + 1 ? "active" : "pending";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600,
              background: state === "done" ? "#10B981" : state === "active" ? "linear-gradient(135deg, #7B5EA7, #9B6FD4)" : "#222222",
              color: state === "pending" ? "#A0A0A0" : "#fff"
            }}>
              {state === "done" ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 13, color: state === "active" ? "#9B6FD4" : "#A0A0A0", fontWeight: state === "active" ? 600 : 500 }}>
              {label}
            </span>
            {i < steps.length - 1 && <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.08)", margin: "0 8px" }} />}
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
  const [linkValue, setLinkValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  // Support varying prop names
  const applyType = post?.apply_type || post?.applyType;

  // Safe user profile properties
  const fullName = user?.profile?.full_name || user?.full_name || user?.name || "Unknown";
  const initials = user?.profile?.initials || user?.initials || fullName.slice(0, 2).toUpperCase();
  const role = user?.profile?.role || user?.role || "Member";
  const city = user?.profile?.city || user?.city || "Remote";
  const trustScore = user?.profile?.trust_score ?? user?.trust ?? "1.0";
  const skills = user?.skills || [];

  const handleStep2Continue = () => {
    let hasError = false;
    const questions = post.questions || [];
    questions.forEach((q) => {
      const qId = q.id || q.question_id || q;
      if (!answers[qId] || answers[qId].trim() === "") {
        hasError = true;
      }
    });

    if (hasError) {
      setShowErrors(true);
    } else {
      setShowErrors(false);
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        project_id: post.id,
        answers: Object.entries(answers).map(([question_id, answer]) => ({
          question_id: parseInt(question_id),
          answer: answer
        })),
        link: linkValue || null
      };
      await applyToProject(payload);
      onSubmit();
    } catch (err) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const handleOneClickSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await applyToProject({ project_id: post.id, answers: [], link: null });
      onSubmit();
    } catch (err) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const navBtnGhost = {
    background: "transparent", color: "var(--text-sec)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
    padding: "10px 20px", fontSize: 13, cursor: "pointer", fontWeight: 500
  };
  const navBtnGradient = {
    background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "#fff", border: "none", borderRadius: 12,
    padding: "10px 24px", fontSize: 13, cursor: "pointer", fontWeight: 600
  };

  const errorBanner = error ? (
    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 500 }}>
      {error}
    </div>
  ) : null;

  // One-click apply
  if (applyType === "oneclick" || applyType === "one_click") {
    return (
      <div style={{ minHeight: "calc(100vh - 56px)", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 440, background: "#141414", borderRadius: 20, padding: 32, border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 12 }}>One-click Apply</h2>
          <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 28, lineHeight: 1.7 }}>
            Your profile and skill tags will be shared with <strong style={{ color: "#fff" }}>{post.poster_name ? post.poster_name.split(' ')[0] : 'the poster'}</strong> instantly. No questions required.
          </p>

          {errorBanner}

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px", marginBottom: 32, display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}>
            <div className="avatar" style={{
              width: 50, height: 50, fontSize: 18, background: "var(--bg)", backgroundClip: "padding-box",
              border: "3px solid transparent", backgroundImage: "linear-gradient(#141414, #141414), linear-gradient(135deg, #7B5EA7, #9B6FD4)",
              backgroundOrigin: "border-box", color: "#fff", flexShrink: 0
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{fullName}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <TrustBadge value={trustScore} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button style={{ ...navBtnGhost, flex: 1 }} onClick={onBack}>Cancel</button>
            <button style={{ ...navBtnGradient, flex: 2 }} onClick={handleOneClickSubmit} disabled={loading}>
              {loading ? "Submitting…" : "Confirm Application →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multi-step apply
  const STEPS = ["Your profile", "Application", "Review"];

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#0D0D0D" }}>
      <style>{`
        .question-input {
          width: 100%;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 13px;
          outline: none;
          transition: 0.2s;
          box-sizing: border-box;
        }
        .question-input:focus {
          border-color: rgba(155,111,212,0.6);
          box-shadow: 0 0 0 3px rgba(123,94,167,0.15);
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 28px" }}>
        <button style={{ background: "transparent", border: "none", color: "var(--text-sec)", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }} onClick={onBack}>
          ← Back
        </button>
        
        <StepIndicator steps={STEPS} current={step} />

        {errorBanner}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 40 }}>
          {/* Main content */}
          <div>
            {/* Step 1: Profile confirm */}
            {step === 1 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Confirm your profile</h3>
                <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 24 }}>This will be shared with {post.poster_name ? post.poster_name.split(' ')[0] : 'the poster'}.</p>

                <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", gap: 16, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
                    <div className="avatar" style={{
                      width: 56, height: 56, fontSize: 20, background: "var(--bg)", backgroundClip: "padding-box",
                      border: "3px solid transparent", backgroundImage: "linear-gradient(#141414, #141414), linear-gradient(135deg, #7B5EA7, #9B6FD4)",
                      backgroundOrigin: "border-box", color: "#fff", flexShrink: 0
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{fullName}</div>
                      <div style={{ fontSize: 13, color: "var(--text-sec)", margin: "4px 0" }}>{role} · {city}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <TrustBadge value={trustScore} />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {skills.map(s => {
                      const name = typeof s === 'string' ? s : s.name;
                      return (
                        <span key={name} style={{ background: "rgba(123,94,167,0.15)", border: "1px solid rgba(155,111,212,0.3)", color: "#9B6FD4", fontSize: 11, padding: "4px 10px", borderRadius: 8 }}>
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
                  <button style={navBtnGhost} onClick={onBack}>Cancel</button>
                  <button style={navBtnGradient} onClick={() => setStep(2)}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 2: Questions */}
            {step === 2 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Answer the questions</h3>
                <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 24 }}>
                  {post.poster_name ? post.poster_name.split(' ')[0] : 'The poster'} wants to know:
                </p>

                {post.questions?.map((q, i) => {
                  const qId = q.id || q.question_id || i;
                  const qText = q.question || q.question_text || q.text || (typeof q === 'string' ? q : `Question ${i + 1}`);
                  const isError = showErrors && (!answers[qId] || answers[qId].trim() === "");
                  return (
                    <div style={{ marginBottom: 20 }} key={qId}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
                        {qText}
                        <span style={{ background: "rgba(123,94,167,0.15)", color: "#9B6FD4", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Required</span>
                      </label>
                      <textarea
                        className="question-input" rows={3} placeholder="Your answer…" value={answers[qId] || ""}
                        style={isError ? { borderColor: "rgba(239,68,68,0.5)" } : {}}
                        onChange={e => setAnswers({ ...answers, [qId]: e.target.value })}
                      />
                      {isError && (
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 500 }}>
                          This field is required
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 8 }}>Link to relevant past work (optional)</label>
                  <input
                    className="question-input" type="text" placeholder="GitHub / paper / portfolio link" value={linkValue}
                    onChange={e => setLinkValue(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
                  <button style={navBtnGhost} onClick={() => setStep(1)}>← Back</button>
                  <button style={navBtnGradient} onClick={handleStep2Continue}>Review →</button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Review your application</h3>
                <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 24 }}>Everything look good?</p>

                {post.questions?.map((q, i) => {
                  const qId = q.id || q.question_id || i;
                  const qText = q.question || q.question_text || q.text || (typeof q === 'string' ? q : `Question ${i + 1}`);
                  return (
                    <div key={qId} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sec)", marginBottom: 8 }}>{qText}</div>
                      <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.6 }}>
                        {answers[qId] || <em style={{ color: "var(--text-hint)" }}>Not answered</em>}
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#10B981", display: "flex", alignItems: "center", gap: 6 }}>
                    ✓ Trust {trustScore} meets minimum {post.minTrust || post.min_trust || 'requirements'}
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={navBtnGhost} onClick={() => setStep(2)}>← Edit</button>
                    <button style={navBtnGradient} onClick={handleSubmit} disabled={loading}>
                      {loading ? "Submitting…" : "Submit Application →"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>{post.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 16 }}>Posted by {post.poster_name ? post.poster_name.split(' ')[0] : 'Unknown'}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {(post.tags || post.skills || [])?.map(t => <span key={t} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-sec)", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>{t}</span>)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--text-sec)" }}>
                Difficulty
                <DiffBar value={post.difficulty || 1} />
                <span style={{ fontWeight: 600, color: "#fff" }}>{post.difficulty || 1}/10</span>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Skill match</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(post.tags || post.skills || [])?.map(t => {
                const has = skills.some(s => {
                  const skillName = typeof s === 'string' ? s : s.name;
                  return skillName?.toLowerCase().includes(t.toLowerCase().split(" ")[0]);
                });
                return (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: "var(--text-sec)" }}>{t}</span>
                    <span style={{ color: has ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
                      {has ? "In profile ✓" : "Not listed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}