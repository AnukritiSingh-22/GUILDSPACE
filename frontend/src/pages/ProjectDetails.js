// src/pages/ProjectDetails.js
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProject, fetchMyApplications, fetchAIInsight  } from "../api/api";
import { useAuth } from "../context/AuthContext";
import ApplyModal from "../components/ApplyModal";

function DiffBar({ value }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: 1, background: i < value ? "#7B5EA7" : "rgba(255,255,255,0.08)" }} />
      ))}
    </div>
  );
}

export default function ProjectDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post,           setPost]           = useState(null);
  const [applying,       setApplying]       = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [apiError,       setApiError]       = useState("");

  // AI insight — only shown if we get clean text back
  const [aiText,    setAiText]    = useState("");
  // 🧠 Local AI fallback (same as reference logic)
  const userSkills = (user?.skills || []).map(s => (s.name || s).toLowerCase());
  const projectSkills = (post?.skills || []);

  const matched = projectSkills.filter(s =>
    userSkills.some(u =>
      u.includes(s.toLowerCase()) || s.toLowerCase().includes(u)
    )
  );

  const missing = projectSkills.filter(s =>
    !userSkills.some(u =>
      u.includes(s.toLowerCase()) || s.toLowerCase().includes(u)
    )
  );

  const userTrust = parseFloat(user?.profile?.trust_score ?? 1);
  const minTrust  = parseFloat(post?.min_trust ?? post?.minTrust ?? 1);

  let fallbackInsight = "";

  const trustMet = userTrust >= minTrust;

  if (matched.length === projectSkills.length && trustMet) {
    fallbackInsight = `Strong match — you have all ${matched.length} required skill${matched.length !== 1 ? "s" : ""} (${matched.join(", ")}) and your trust score (${userTrust}) meets the requirement (${minTrust}). You should apply.`;

  } else if (matched.length >= Math.ceil(projectSkills.length * 0.5) && trustMet) {
    // 🔥 IMPROVED CONDITION (50% threshold)
    fallbackInsight = `Good match — you have ${matched.length} of ${projectSkills.length} required skills (${matched.join(", ")}). ${missing.length > 0 ? `Missing: ${missing.join(", ")}. ` : ""}Trust score is sufficient. Consider applying.`;

  } else if (!trustMet) {
    fallbackInsight = `Your trust score (${userTrust}) is below the required minimum (${minTrust}). Complete easier projects to raise your trust, then apply.`;

  } else {
    fallbackInsight = `Low skill match — none or few of your skills match (${projectSkills.join(", ")}). Consider upskilling before applying.`;
  }
  const [aiLoading, setAiLoading] = useState(false);
  const fetchedRef = useRef(null);

  // Load project + check already applied
  useEffect(() => {
    async function load() {
      try {
        const [projectData, appsData] = await Promise.all([
          fetchProject(id),
          user ? fetchMyApplications().catch(() => []) : Promise.resolve([]),
        ]);
        setPost(projectData);
        const apps = Array.isArray(appsData) ? appsData : [];
        if (apps.some(a => String(a.project?.id || a.project_id) === String(id))) {
          setAlreadyApplied(true);
        }
      } catch (err) {
        console.error("Error loading project:", err);
      }
    }
    load();
  }, [id, user]);

  // Fetch AI insight once per project — uses the correct /api/ai/insight route
  // useEffect(() => {
  //   if (!post || !user) return;
  //   if (fetchedRef.current === id) return;
  //   fetchedRef.current = id;

  //   const promptText = `Should this user apply to this project? Answer in 2-3 clear sentences.

  //   Project: ${post.title}
  //   Required skills: ${(post.skills || []).join(", ") || "Not specified"}
  //   Difficulty: ${post.difficulty}/10
  //   Min trust required: ${post.min_trust ?? post.minTrust ?? 1}

  //   User skills: ${(user?.skills || []).map(s => s.name || s).join(", ") || "None listed"}
  //   User trust: ${user?.profile?.trust_score ?? 1}

  //   Be specific. Mention actual skills that match or are missing.`;

  //   setAiLoading(true);

  //   fetch(`${process.env.REACT_APP_API_URL}/api/ai/insight`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${localStorage.getItem("gs_token")}`,
  //     },
  //     body: JSON.stringify({ prompt: promptText }),
  //   })
  //     .then(async res => {
  //       // If not JSON (e.g. 404 HTML page), silently ignore
  //       const contentType = res.headers.get("content-type") || "";
  //       if (!contentType.includes("application/json")) {
  //         console.warn("AI insight endpoint not available");
  //         return;
  //       }
  //       if (!res.ok) {
  //         const err = await res.json().catch(() => ({}));
  //         console.warn("AI insight error:", err);
  //         return;
  //       }
  //       const data = await fetchAIInsight(promptText);
  //       const text = (data?.text || "").trim();
  //       // Reject raw error objects or HTML
  //       if (!text || text.startsWith("{") || text.startsWith("<") || text.toLowerCase().startsWith("error")) {
  //         console.warn("AI returned invalid content");
  //         return;
  //       }
  //       setAiText(text);
  //     })
  //     .catch(err => console.warn("AI insight fetch failed:", err.message))
  //     .finally(() => setAiLoading(false));

  // }, [post, user, id]);

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-sec)" }}>
        Loading…
      </div>
    );
  }

  // userTrust = parseFloat(user?.profile?.trust_score ?? user?.trust ?? 1);
  // minTrust  = parseFloat(post.min_trust ?? post.minTrust ?? 0);
  const canApply  = userTrust >= minTrust;

  // Success screen
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#10B981", margin: "0 auto 24px" }}>✓</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Application sent!</h2>
          <p style={{ fontSize: 14, color: "var(--text-sec)", marginBottom: 32 }}>You'll be notified when {post.poster_name || "the poster"} reviews it.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button style={{ background: "transparent", color: "var(--text-sec)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 32px", fontSize: 14, cursor: "pointer" }} onClick={() => navigate("/")}>Back to feed</button>
            <button style={{ background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={() => navigate("/profile", { state: { tab: "Applications" } })}>View my applications</button>
          </div>
        </div>
      </div>
    );
  }

  // Apply modal
  if (applying) {
    return (
      <ApplyModal
        post={post}
        onBack={() => { setApplying(false); setApiError(""); }}
        onSubmit={() => { setAlreadyApplied(true); setSubmitted(true); setApplying(false); }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", padding: "40px 0" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 28px" }}>

        <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: "var(--text-sec)", fontSize: 13, cursor: "pointer", marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← Back to feed
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 28, alignItems: "start" }}>

          {/* ── Left ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(155,111,212,0.15)", border: "1px solid rgba(155,111,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#9B6FD4", flexShrink: 0 }}>
                {post.poster_initials}
              </div>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer" }}
                  onClick={() => post.creator_id && navigate(`/user/${post.creator_id}`)}
                  onMouseEnter={e => e.currentTarget.style.color = "#9B6FD4"}
                  onMouseLeave={e => e.currentTarget.style.color = "#fff"}
                >
                  {post.poster_name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{post.domain} · {post.time_ago}</div>
              </div>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.25, marginBottom: 14 }}>{post.title}</h1>
            <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.75, marginBottom: 20 }}>{post.description}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
              {(post.skills || []).map(t => (
                <span key={t} style={{ fontSize: 12, background: "rgba(123,94,167,0.15)", border: "1px solid rgba(155,111,212,0.3)", color: "#9B6FD4", padding: "4px 12px", borderRadius: 8 }}>{t}</span>
              ))}
            </div>

            <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#5E5D80", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Difficulty</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><DiffBar value={post.difficulty} /><span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{post.difficulty}/10</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#5E5D80", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Min Trust</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", color: "#9B6FD4" }}>{post.min_trust ?? post.minTrust}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#5E5D80", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Applicants</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", color: "#fff" }}>{post.applicant_count ?? 0}</div>
                </div>
              </div>
            </div>

            {(post.questions || []).length > 0 && (
              <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Application questions</div>
                {post.questions.map((q, i) => (
                  <div key={q.id || i} style={{ fontSize: 13, color: "var(--text-sec)", paddingLeft: 12, borderLeft: "2px solid rgba(155,111,212,0.4)", marginBottom: 10, lineHeight: 1.6 }}>
                    {q.question || q}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div>
            {/* Trust gate */}
            <div style={{ background: canApply ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${canApply ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: canApply ? "#10B981" : "#EF4444", marginBottom: 4 }}>
                {canApply ? "✓ You meet requirements" : "✗ Trust too low"}
              </div>
              <div style={{ fontSize: 12, color: canApply ? "#10B981" : "#EF4444", opacity: 0.8 }}>
                Your trust {userTrust} {canApply ? "≥" : "<"} required {minTrust}
              </div>
            </div>

            {/* Skill match */}
            <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#5E5D80", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Your skill match</div>
              {(post.skills || []).map(t => {
                const userSkillNames = user?.skills?.map(s => (s.name || s).toLowerCase()) || [];
                const has = userSkillNames.some(s => s.includes(t.toLowerCase().split(" ")[0]) || t.toLowerCase().includes(s));
                return (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "var(--text-sec)" }}>{t}</span>
                    <span style={{ color: has ? "#10B981" : "#F59E0B", fontWeight: 500 }}>{has ? "In profile ✓" : "Not listed"}</span>
                  </div>
                );
              })}
            </div>

            {/* AI Insight — only shown when we have real content */}
            {(aiLoading || aiText || fallbackInsight) && (
              <div style={{ background: "rgba(123,94,167,0.08)", border: "1px solid rgba(155,111,212,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9B6FD4", fontWeight: 600, marginBottom: 8 }}>
                  <span>✦</span> AI Insight
                </div>
                {aiLoading ? (
                <div style={{ fontSize: 12, color: "#9F9EC5", fontStyle: "italic" }}>
                  Analysing your fit…
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#9F9EC5", lineHeight: 1.7 }}>
                  {aiText || fallbackInsight}
                </div>
              )}
              </div>
            )}

            {/* Apply button — always shown regardless of AI state */}
            <button
              style={{
                width: "100%", padding: "13px 0", fontSize: 14, fontWeight: 600,
                background: canApply && !alreadyApplied ? "linear-gradient(135deg, #7B5EA7, #9B6FD4)" : "rgba(255,255,255,0.05)",
                color: canApply && !alreadyApplied ? "#fff" : "var(--text-sec)",
                border: "none", borderRadius: 12,
                cursor: canApply && !alreadyApplied ? "pointer" : "not-allowed",
                opacity: canApply && !alreadyApplied ? 1 : 0.55,
                transition: "0.2s"
              }}
              disabled={!canApply || alreadyApplied}
              onClick={() => canApply && !alreadyApplied && setApplying(true)}
            >
              {alreadyApplied ? "Applied ✓" : post.apply_type === "oneclick" ? "One-click Apply →" : "Apply to Project →"}
            </button>

            {!canApply && (
              <p style={{ fontSize: 11, color: "#5E5D80", textAlign: "center", marginTop: 8 }}>
                Complete easier projects to raise your trust score.
              </p>
            )}

            {apiError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 12, color: "#EF4444" }}>
                {apiError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}