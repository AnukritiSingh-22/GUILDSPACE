import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProject, fetchMyApplications } from "../api/api";
import { useAuth } from "../context/AuthContext";
import ApplyModal from "../components/ApplyModal";
import SkillTag from "../components/SkillTag";

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

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // ✅ FETCH DATA FROM API
  useEffect(() => {
    async function loadData() {
      try {
        const [projectData, appsData] = await Promise.all([
          fetchProject(id),
          user ? fetchMyApplications() : Promise.resolve([])
        ]);
        setPost(projectData);
        if (appsData && appsData.some(app => String(app.project?.id || app.project_id) === String(id))) {
          setAlreadyApplied(true);
        }
      } catch (err) {
        console.error("Error loading project data:", err);
      }
    }
    loadData();
  }, [id, user]);

  // ✅ LOADING STATE
  if (!post) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0D0D", color: "var(--text-sec)", textAlign: "center", paddingTop: 80 }}>
        Loading...
      </div>
    );
  }

  const userTrust = parseFloat(user?.profile?.trust_score || 1.0);
  const requiredTrust = parseFloat(post.min_trust ?? post.minTrust ?? 2.0);
  const canApply = userTrust >= requiredTrust;

  // SUCCESS SCREEN
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.1)",
            border: "2px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, color: "#10B981", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(16,185,129,0.2)"
          }}>✓</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Application sent!
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-sec)", marginBottom: 32 }}>
            You'll be notified when {post.poster_name || 'the poster'} reviews it.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button style={{
              background: "transparent", color: "var(--text-sec)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12, padding: "14px 32px", fontSize: 14, fontWeight: 500, cursor: "pointer"
            }} onClick={() => navigate("/")}>
              Back to feed
            </button>
            <button style={{
              background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "#fff", border: "none",
              borderRadius: 12, padding: "14px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer"
            }} onClick={() => navigate("/profile", { state: { tab: 'Applications' } })}>
              View my applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApplySuccess = () => {
    setAlreadyApplied(true);
    setSubmitted(true);
    setApplying(false);
  };

  // APPLY FLOW
  if (applying) {
    return (
      <ApplyModal
        post={post}
        onBack={() => { setApplying(false); setApiError(""); }}
        onSubmit={handleApplySuccess}
      />
    );
  }

  // Generate mock AI Match info based on project data if none exists
  const aiMatchPct = post.ai_match || 88;
  const aiMatchReason = post.ai_reason || "Based on your recent completed projects and overlapping skill domains, you align heavily with the requirements established here.";
  
  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", padding: "40px 0" }}>
      <style>{`
        .back-btn-luxury {
          background: transparent;
          border: none;
          color: var(--text-sec);
          font-size: 13px;
          cursor: pointer;
          transition: 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .back-btn-luxury:hover {
          color: #fff;
        }
        .skill-tag-accent {
          background: rgba(123,94,167,0.15);
          border: 1px solid rgba(155,111,212,0.3);
          color: #9B6FD4;
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 8px;
        }
      `}</style>
      
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 28px" }}>
        <button className="back-btn-luxury" onClick={() => navigate("/")} style={{ marginBottom: 24 }}>
          ← Back to feed
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 40 }}>
          {/* ── Left: Content ────────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div className="avatar" style={{
                width: 46, height: 46, fontSize: 16,
                background: "var(--bg)", backgroundClip: "padding-box",
                border: "2px solid transparent",
                backgroundImage: "linear-gradient(#0D0D0D, #0D0D0D), linear-gradient(135deg, #7B5EA7, #9B6FD4)",
                backgroundOrigin: "border-box",
                color: "#fff",
              }}>{post.poster_initials || "?"}</div>
              <div>
                <div 
                  style={{ fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", display: "inline-block" }}
                  onClick={() => navigate(`/user/${post.creator_id}`)}
                  onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.target.style.textDecoration = 'none'}
                >
                  {post.poster_name || "Unknown"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{post.domain} · {post.time_ago || "Just now"}</div>
              </div>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "#fff", lineHeight: 1.3, marginBottom: 16 }}>
              {post.title}
            </h1>

            <div style={{ fontSize: 15, color: "#A0A0A0", lineHeight: 1.8, marginBottom: 24, whiteSpace: "pre-wrap" }}>
              {post.description}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
              {post.skills?.map(t => (
                <span key={t} className="skill-tag-accent">{t}</span>
              ))}
            </div>

            {/* Meta Stats Range Box */}
            <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Difficulty</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <DiffBar value={post.difficulty} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "#fff" }}>{post.difficulty}/10</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Min Trust</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#fff", lineHeight: 1 }}>
                    {post.minTrust || post.min_trust || "2.0"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Applicants</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#fff", lineHeight: 1 }}>
                    {post.applicants || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Questions preview */}
            {post.applyType === "questions" && post.questions && post.questions.length > 0 && (
              <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Application questions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {post.questions.map((q, i) => (
                    <div key={i} style={{
                      fontSize: 14, color: "var(--text-sec)", paddingLeft: 14, lineHeight: 1.6,
                      borderLeft: "3px solid #7B5EA7",
                    }}>
                      {q.question_text || q}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Action Sidebar ────────────────────────────────── */}
          <div>
            {/* Trust gate */}
            <div style={{
              background: canApply ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${canApply ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
              borderRadius: 12, padding: "16px", marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: canApply ? "#10B981" : "#ef4444", marginBottom: 4 }}>
                {canApply ? "✓ You meet requirements" : "✗ Trust too low"}
              </div>
              <div style={{ fontSize: 12, color: canApply ? "#10B981" : "#ef4444", opacity: 0.8 }}>
                Your trust {userTrust.toFixed(1)} {canApply ? "≥" : "<"} required {requiredTrust.toFixed(1)}
              </div>
            </div>

            {/* Skill match */}
            <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Your skill match</div>
              {post.skills?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {post.skills.map(t => {
                    const has = user?.skills?.some(s => s.name?.toLowerCase().includes(t.toLowerCase().split(" ")[0]) || typeof s === 'string' && s.toLowerCase().includes(t.toLowerCase().split(" ")[0]));
                    return (
                      <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <span style={{ color: "var(--text-sec)" }}>{t}</span>
                        <span style={{ color: has ? "#10B981" : "#F59E0B", fontWeight: 500 }}>
                          {has ? "In profile ✓" : "Not listed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-hint)" }}>No specific skills required.</div>
              )}
            </div>

            {/* AI Insight */}
            <div style={{ background: "rgba(123,94,167,0.1)", border: "1px solid rgba(155,111,212,0.25)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>✦</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>AI Insight</span>
                <span style={{ background: "rgba(155,111,212,0.15)", color: "#9B6FD4", border: "1px solid rgba(155,111,212,0.3)", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 500, marginLeft: "auto" }}>
                  {aiMatchPct}% Match
                </span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                {aiMatchReason}
              </div>
            </div>

            {/* Error block */}
            {apiError && (
              <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "12px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid rgba(239,68,68,0.3)" }}>
                {apiError}
              </div>
            )}

            {alreadyApplied ? (
              <button style={{
                width: "100%", background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "not-allowed", opacity: 1
              }} disabled>
                Applied ✓
              </button>
            ) : (
              <div>
                <button
                  style={{
                    width: "100%", background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "#fff", border: "none",
                    borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, transition: "0.2s",
                    cursor: canApply ? "pointer" : "not-allowed", opacity: canApply ? 1 : 0.35
                  }}
                  disabled={!canApply}
                  onClick={() => canApply && setApplying(true)}
                >
                  {post.applyType === "oneclick" ? "One-click Apply →" : "Apply to Project →"}
                </button>
                {!canApply && (
                  <p style={{ fontSize: 12, color: "var(--text-hint)", textAlign: "center", marginTop: 10 }}>
                    Complete easier projects to raise your trust value.
                  </p>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}