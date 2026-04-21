import { useEffect, useState } from "react";
import { fetchMyProjects, fetchApplicants, hideProject, deleteProject, closeProject, completeProject, updateApplicationStatus, rateCollaborator } from "../api/api";
import { useNavigate } from "react-router-dom";

// AI INSIGHT (from reference file — stable + fallback)
async function getAiInsight(applicant, project) {
  const projectSkills = (project.skills || []).map(s => 
    typeof s === "string" ? s : s.name
  );
  
  const applicantSkills = applicant.skills || [];
  
  // Dynamically calculate matched and missing if backend doesn't provide them array
  const matched = applicant.matched_skills?.length ? applicant.matched_skills : 
    projectSkills.filter(skill => applicantSkills.some(s => s.toLowerCase() === skill.toLowerCase()));
    
  const missing = applicant.missing_skills?.length ? applicant.missing_skills : 
    projectSkills.filter(skill => !applicantSkills.some(s => s.toLowerCase() === skill.toLowerCase()));

  const trust = parseFloat(applicant.trust_score || 0);
  const totalReq = projectSkills.length || (matched.length + missing.length);
  const name = applicant.full_name || "Applicant";

  console.log({
    projectSkills,
    applicantSkills,
    matched,
    missing,
    totalReq
  });

  const groqKey = process.env.REACT_APP_GROQ_API_KEY;

  if (groqKey) {
    try {
      const prompt = `Project: ${project.title}
Required Skills: ${projectSkills.join(", ")}

Applicant: ${name}
Skills: ${applicantSkills.join(", ")}
Matched: ${matched.join(", ") || "none"}
Missing: ${missing.join(", ") || "none"}
Trust: ${trust}

Give a short recommendation (2–3 lines). End with Recommendation: Accept / Reject.`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150
        })
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content;
      }
    } catch (e) { }
  }

  // ✅ fallback (always works)
  if (totalReq === 0) {
    return `No required skills defined for this project. AI cannot evaluate properly.`;
  }
  const trustGood = trust >= 3;
  const skillGood = matched.length >= totalReq * 0.6;

  if (matched.length === totalReq && trustGood) {
    return `Strong match — covers all ${totalReq} required skills (${matched.join(", ")}). Trust score (${trust}) is solid. Recommendation: Accept.`;
  }

  if (skillGood && trustGood) {
    return `Good match — ${matched.length}/${totalReq} skills matched (${matched.join(", ")}). ${
      missing.length ? `Missing: ${missing.join(", ")}.` : ""
    } Recommendation: Accept.`;
  }

  if (skillGood && !trustGood) {
    return `Skills are good (${matched.join(", ")}), but trust score (${trust}) is low. Recommendation: Can be approved but needs more oversight.`;
  }

  if (!skillGood && trust >= 5) {
    return `High trust (${trust}) but low skill match (${matched.length}/${totalReq}). Recommendation: Reconsider.`;
  }

  if (matched.length === 0) {
    return `No required skills matched (${projectSkills.join(", ")}). Trust score: ${trust}. Recommendation: Reject.`;
  }

  return `Partial match — ${matched.length}/${totalReq} skills matched. ${
    missing.length ? `Missing: ${missing.join(", ")}.` : ""
  } Recommendation: Consider Carefully.`;
}
export default function Applications() {
  const [projects, setProjects] = useState([]);
  const [post, setPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const navigate = useNavigate();

  // ── Decide (accept /reject) ────────────────────────────────────
  const decide = async (appId, val) => {
    // "pass" maps to "rejected" for the API
    const apiStatus = val === "pass" ? "rejected" : val;

    const prevDecisions = { ...decisions };
    const prevApplicants = [...applicants];

    // Optimistic update
    setDecisions(prev => ({ ...prev, [appId]: apiStatus }));
    setApplicants(prev => prev.map(a =>
      a.application_id === appId ? { ...a, status: apiStatus } : a
    ));
    if (selected?.application_id === appId) {
      setSelected(prev => ({ ...prev, status: apiStatus }));
    }

    try {
      await updateApplicationStatus(appId, apiStatus);
      const msg = apiStatus === "accepted" ? "✅ Accepted — notification sent"
        : "❌ Rejected — notification sent";
      showToast(msg, "success");
    } catch (err) {
      setDecisions(prevDecisions);
      setApplicants(prevApplicants);
      showToast(err.message, "error");
    }
  };

  const handleRate = async (appId, rating) => {
    try {
      await rateCollaborator(appId, rating);
      showToast("Rating submitted!", "success");
      setApplicants(prev => prev.map(a => a.application_id === appId ? { ...a, rating } : a));
      if (selected?.application_id === appId) setSelected(prev => ({ ...prev, rating }));
    } catch (err) { showToast(err.message, "error"); }
  };

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    const load = async () => {
      if (!selected || !post) return;
      const id = selected.application_id;

      if (aiInsights[id] || aiLoading[id]) return;

      setAiLoading(prev => ({ ...prev, [id]: true }));

      const text = await getAiInsight(selected, post);

      setAiInsights(prev => ({ ...prev, [id]: text }));
      setAiLoading(prev => ({ ...prev, [id]: false }));
    };

    load();
  }, [selected?.application_id]);

  useEffect(() => {
    const fn = () => setMenuOpen(false);
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  // ── Project actions ─────────────────────────────────────────────────────────
  const handleHide = async (e) => {
    e.stopPropagation(); setMenuOpen(false);
    try {
      await hideProject(post.id);
      showToast("Project hidden from public feed.", "success");
      setPost({ ...post, status: "hidden" });
      setProjects(prev => prev.map(p => p.id === post.id ? { ...p, status: "hidden" } : p));
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleClose = async (e) => {
    e.stopPropagation(); setMenuOpen(false);
    try {
      await closeProject(post.id);
      setPost({ ...post, status: "closed" });
      setProjects(prev => prev.map(p => p.id === post.id ? { ...p, status: "closed" } : p));
      showToast("Project closed", "success");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleComplete = async (e) => {
    e.stopPropagation(); setMenuOpen(false);
    try {
      await completeProject(post.id);
      setPost({ ...post, status: "completed" });
      setProjects(prev => prev.map(p => p.id === post.id ? { ...p, status: "completed" } : p));
      showToast("Project marked as completed!", "success");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); setMenuOpen(false);
    try {
      await deleteProject(post.id);
      showToast("Project deleted", "success");
      setProjects(prev => prev.filter(p => p.id !== post.id));
      setPost(null);
    } catch (err) { showToast(err.message, "error"); }
  };

  useEffect(() => {
    fetchMyProjects()
      .then(data => setProjects(Array.isArray(data) ? data : (data?.projects || [])))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectProject = async (p) => {
    setPost(p);
    try {
      const apps = await fetchApplicants(p.id);
      setApplicants(apps || []);
      setSelected(apps?.length > 0 ? apps[0] : null);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: "40px", color: "var(--text-hint)", textAlign: "center" }}>Loading...</div>;

  // ── Project grid (no post selected yet) ─────────────────────────────────────
  if (!post) {
    return (
      <div className="page-enter" style={{ minHeight: "calc(100vh - 56px)", padding: "40px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderLeft: `4px solid ${t.type === "success" ? "#10B981" : "#EF4444"}`, borderRadius: 10, padding: "12px 16px", color: "var(--text-primary)", fontSize: 13 }}>
              {t.message}
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--text-primary)", marginBottom: 32 }}>
          My Posts
        </h2>

        {projects.length === 0 ? (
          <div style={{ color: "var(--text-hint)" }}>You haven't posted any projects yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {projects.map(p => (
              <div key={p.id} onClick={() => handleSelectProject(p)}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", minHeight: 220, position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(155,111,212,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9B6FD4", background: "rgba(123,94,167,0.1)", padding: "4px 8px", borderRadius: 6 }}>{p.domain}</span>
                  {p.status !== "open" && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.status === "closed" ? "#EF4444" : "var(--text-hint)", background: "var(--border)", padding: "4px 8px", borderRadius: 6, textTransform: "capitalize" }}>{p.status}</span>
                  )}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.3 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: "auto", flex: 1 }}>{p.description?.slice(0, 100)}…</p>
                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-hint)" }}>
                  <span>{p.applicant_count || 0} applicants</span>
                  <span style={{ color: "#9B6FD4", fontWeight: 500 }}>View →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Applicant review view ────────────────────────────────────────────────────
  return (
    <div className="poster-layout page-enter" style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "calc(100vh - 56px)" }}>
      <style>{`
        .app-row-luxury { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s; display: flex; gap: 12px; align-items: center; background: transparent; }
        .app-row-luxury:hover { background: #141414; }
        .app-row-luxury.selected { background: rgba(123,94,167,0.08); border-left: 3px solid #9B6FD4; }
        .ai-fit-number { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
        .skill-green { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #10B981; font-size: 11px; padding: 4px 10px; border-radius: 8px; display: inline-block; margin: 3px; }
        .skill-gray  { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-hint); font-size: 11px; padding: 4px 10px; border-radius: 8px; display: inline-block; margin: 3px; }
      `}</style>

      {/* ── Applicant list ──────────────────────────────────────────── */}
      <aside style={{ background: "#0D0D0D", borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", maxHeight: "calc(100vh - 56px)" }}>
        <div style={{ background: "#0D0D0D", position: "sticky", top: 0, zIndex: 10, padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{applicants.length} applicants</div>
            <div style={{ fontSize: 12, color: "var(--text-sec)" }}>Sorted by Match</div>
          </div>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(232,121,160,0.15)", color: "#E879A0", border: "1px solid rgba(232,121,160,0.3)", fontWeight: 600 }}>
            ✦ AI Ranked
          </span>
        </div>

        {applicants.map(ap => {
          const d = decisions[ap.application_id] || ap.status;
          const fitScore = ap.ai_fit_score ?? ap.ai_match ?? 0;
          const fitColor = fitScore >= 80 ? "#10B981" : fitScore >= 60 ? "#9B6FD4" : "var(--text-hint)";
          const isSelected = selected?.application_id === ap.application_id;

          return (
            <div key={ap.application_id}
              className={`app-row-luxury${isSelected ? " selected" : ""}`}
              onClick={() => setSelected(ap)}
              style={{ opacity: d === "rejected" ? 0.4 : 1 }}
            >
              <div className="avatar" style={{ width: 44, height: 44, background: "var(--bg)", backgroundClip: "padding-box", border: "2px solid transparent", backgroundImage: "linear-gradient(#0D0D0D, #0D0D0D), linear-gradient(135deg, #7B5EA7, #9B6FD4)", backgroundOrigin: "border-box", color: "#fff", fontSize: 16 }}>
                {ap.full_name?.[0] || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{ap.full_name}</div>
                <div style={{ fontSize: 12, color: "var(--text-sec)" }}>Trust: {ap.trust_score || "N/A"}</div>
                {d && d !== "pending" && (
                  <div style={{ fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: 1, color: d === "accepted" ? "#10B981" : d === "rejected" ? "#EF4444" : "#EAB308" }}>
                    {d === "accepted" ? "Approved" : d === "rejected" ? "Rejected" : d}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="ai-fit-number" style={{ color: fitColor }}>{fitScore > 0 ? `${fitScore}%` : "—"}</div>
                <div style={{ fontSize: 10, color: "var(--text-hint)" }}>Match</div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* ── Detail panel ────────────────────────────────────────────── */}
      <main style={{ padding: "32px", overflowY: "auto", maxHeight: "calc(100vh - 56px)", position: "relative", background: "#0D0D0D" }}>

        {/* Toast */}
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderLeft: `4px solid ${t.type === "success" ? "#10B981" : "#EF4444"}`, borderRadius: 10, padding: "12px 16px", color: "var(--text-primary)", fontSize: 13, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              {t.message}
            </div>
          ))}
        </div>

        <button onClick={() => setPost(null)}
          style={{ background: "transparent", border: "none", color: "var(--text-sec)", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to My Posts
        </button>

        {/* Project header */}
        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
              {post.title}
              {post.status !== "open" && (
                <span style={{ fontSize: 12, padding: "4px 8px", background: post.status === "closed" ? "rgba(239,68,68,0.15)" : "var(--border-mid)", color: post.status === "closed" ? "#EF4444" : "var(--text-hint)", borderRadius: 6, fontWeight: 600, textTransform: "capitalize" }}>
                  {post.status}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
              Project Difficulty: <span style={{ color: "var(--text-primary)" }}>{post.difficulty}/10</span>
            </div>
          </div>

          {/* Three-dot menu */}
          <div style={{ position: "relative" }}>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{ width: 32, height: 32, background: "rgba(255,255,255,0.05)", color: "var(--text-sec)", border: "1px solid var(--border-mid)", borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--border-mid)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-sec)"; }}
            >⋮</button>
            {menuOpen && (
              <div onClick={e => e.stopPropagation()}
                style={{ position: "absolute", top: 40, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 50, minWidth: 180, padding: 4 }}>
                {[
                  { label: "Edit project", icon: "✏️", action: () => navigate(`/edit-project/${post.id}`), color: "var(--text-primary)" },
                  post.status !== "closed" ? { label: "Mark as closed", icon: "🔒", action: handleClose, color: "var(--text-primary)" } : null,
                  post.status !== "completed" ? { label: "Mark as done", icon: "✅", action: handleComplete, color: "#10B981" } : null,
                ].filter(Boolean).map(item => (
                  <div key={item.label} onClick={item.action}
                    style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6, color: item.color, display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
                  </div>
                ))}
                <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                <div onClick={handleDelete}
                  style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6, color: "#EF4444", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 14 }}>🗑️</span> Delete project
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Applicant detail */}
        {selected && (() => {
          const currentStatus = decisions[selected.application_id] || selected.status;
          const isAccepted = currentStatus === "accepted";
          const isRejected = currentStatus === "rejected";
          {console.log("SELECTED:", selected)}

          return (
            <div className="detail-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 32 }}>

              {/* Applicant header */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
                <div className="avatar" style={{ width: 64, height: 64, cursor: "pointer", background: "var(--bg)", backgroundClip: "padding-box", border: "3px solid transparent", backgroundImage: "linear-gradient(var(--bg-card), var(--bg-card)), linear-gradient(135deg, #7B5EA7, #9B6FD4)", backgroundOrigin: "border-box", color: "var(--text-primary)", fontSize: 24 }}
                  onClick={() => navigate(`/user/${selected.applicant_id}`)}>
                  {selected.full_name?.[0] || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)", cursor: "pointer" }}
                      onClick={() => navigate(`/user/${selected.applicant_id}`)}
                      onMouseEnter={e => e.target.style.textDecoration = "underline"}
                      onMouseLeave={e => e.target.style.textDecoration = "none"}
                    >
                      {selected.full_name}
                    </h3>
                    {isAccepted && (
                      <button onClick={() => navigate(`/messages/new?to=${selected.applicant_id}`)}
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 16, fontSize: 12, color: "white", cursor: "pointer" }}>
                        💬 Message
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                    Trust Score: <span style={{ color: "#9B6FD4", fontWeight: 600 }}>{selected.trust_score || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              <div style={{ background: "rgba(123,94,167,0.1)", border: "1px solid rgba(155,111,212,0.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9B6FD4", textTransform: "uppercase", letterSpacing: 1 }}>✨ AI Recommendation</div>
                  {aiInsights[selected.application_id] == null && !aiLoading[selected.application_id] && (
                    <button onClick={async () => {
                      const id = selected.application_id;
                      setAiLoading(prev => ({ ...prev, [id]: true }));
                      const text = await getAiInsight(selected, post);
                      setAiInsights(prev => ({ ...prev, [id]: text }));
                      setAiLoading(prev => ({ ...prev, [id]: false }));
                    }}
                      style={{ background: "rgba(155,111,212,0.15)", color: "#9B6FD4", border: "1px solid rgba(155,111,212,0.4)", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Generate ✨
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                  {aiLoading[selected.application_id] ? (
                    <span style={{ color: "var(--text-sec)", fontStyle: "italic" }}>Analyzing…</span>
                  ) : aiInsights[selected.application_id] != null ? (
                    aiInsights[selected.application_id]
                  ) : (
                    selected.ai_reason || "Click Generate to run AI analysis."
                  )}
                </div>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sec)", marginBottom: 12 }}>Skills Alignment</div>
                {post?.skills?.length > 0 ? (
                  <>
                    {(post.skills || []).map(skill => {
                      const hasSkill = (selected?.skills || []).some(s => s.toLowerCase() === skill.toLowerCase());
                      return hasSkill ? (
                        <span key={skill} className="skill-green">
                          {skill} ✓
                        </span>
                      ) : (
                        <span key={skill} className="skill-gray">
                          {skill} ✗
                        </span>
                      );
                    })}
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: "var(--text-hint)" }}>
                    No skill data available
                  </span>
                )}
              </div>


              {/* ── Action buttons ────────────────────────────────────────
                  ACCEPTED → show green card + message button
                  REJECTED → show grey "Rejected" label only (no action buttons)  ── */}
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                {isAccepted ? (
                  <div style={{ width: "100%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: 16, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ color: "#10B981", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      ✅ Approved Collaborator
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <button onClick={() => navigate(`/messages/new?to=${selected.applicant_id}`)}
                        style={{ background: "var(--border-mid)", border: "1px solid var(--border-bright)", color: "var(--text-primary)", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                        Message Collaborator
                      </button>
                      {post.status === "completed" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "var(--text-sec)" }}>Rate:</span>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} onClick={() => handleRate(selected.application_id, star)}
                              style={{ cursor: "pointer", fontSize: 20, color: (selected.rating >= star) ? "#EAB308" : "var(--border-mid)", transition: "color 0.2s" }}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                ) : isRejected ? (
                  /* ── REJECTED — no buttons, just status label ── */
                  <div style={{ width: "100%", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✗</span>
                    <span style={{ color: "#EF4444", fontWeight: 600, fontSize: 14 }}>Application Rejected</span>
                  </div>

                ) : (
                  /* ── PENDING — show Approve + Reject buttons ── */
                  <>
                    <button style={{ flex: 1, background: "linear-gradient(135deg, #059669, #10B981)", color: "var(--text-primary)", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      onClick={() => decide(selected.application_id, "accepted")}>
                      Approve
                    </button>
                    <button style={{ background: "transparent", border: "1px solid var(--border-bright)", color: "var(--text-sec)", borderRadius: 12, padding: "12px 24px", fontSize: 13, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sec)"; e.currentTarget.style.borderColor = "var(--border-bright)"; }}
                      onClick={() => decide(selected.application_id, "pass")}>
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}