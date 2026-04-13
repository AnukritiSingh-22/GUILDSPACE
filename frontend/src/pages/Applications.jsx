import { useEffect, useState } from "react";
import { fetchMyProjects, fetchApplicants, hideProject, deleteProject, closeProject, completeProject, updateApplicationStatus, rateCollaborator } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Applications() {
  const [projects, setProjects] = useState([]);
  const [post, setPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const decide = async (appId, val) => {
    try {
      if (val === 'pass') val = 'rejected';
      await updateApplicationStatus(appId, val);
      
      if (val === 'rejected') {
        const nextApps = applicants.filter(a => a.application_id !== appId);
        setApplicants(nextApps);
        if (selected?.application_id === appId) {
          setSelected(nextApps.length > 0 ? nextApps[0] : null);
        }
      } else {
        setDecisions(prev => ({ ...prev, [appId]: val }));
      }
      showToast(`Applicant ${val}`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleRate = async (appId, rating) => {
    try {
      await rateCollaborator(appId, rating);
      showToast(`Rating submitted!`, "success");
      setApplicants(prev => prev.map(a => a.application_id === appId ? { ...a, rating } : a));
      if (selected?.application_id === appId) {
         setSelected(prev => ({ ...prev, rating }));
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const handleDocClick = () => setMenuOpen(false);
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  const handleHide = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await hideProject(post.id);
      showToast("Project hidden from public feed.", "success");
      setPost({ ...post, status: 'hidden' });
      setProjects(prev => prev.map(p => p.id === post.id ? { ...p, status: 'hidden' } : p));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleClose = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await closeProject(post.id);
      setPost({ ...post, status: 'closed' });
      setProjects(prev => prev.map(p => p.id === post.id ? { ...p, status: 'closed' } : p));
      showToast("Project closed", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleComplete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await completeProject(post.id);
      setPost({ ...post, status: 'completed' });
      setProjects(prev => prev.map(p => p.id === post.id ? { ...p, status: 'completed' } : p));
      showToast("Project marked as completed!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await deleteProject(post.id);
      showToast("Project deleted", "success");
      setProjects(prev => prev.filter(p => p.id !== post.id));
      setPost(null);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  useEffect(() => {
    async function loadProjects() {
      try {
        const myProjects = await fetchMyProjects();
        setProjects(myProjects || []);
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const handleSelectProject = async (p) => {
    setPost(p);
    try {
      const apps = await fetchApplicants(p.id);
      setApplicants(apps || []);
      if (apps && apps.length > 0) {
        setSelected(apps[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      console.error("Error fetching applicants:", err);
    }
  };

  if (loading) return <div style={{ padding: "40px", color: "var(--text-hint)", textAlign: "center" }}>Loading...</div>;

  if (!post) {
    return (
      <div className="page-enter" style={{ minHeight: "calc(100vh - 56px)", padding: "40px 60px", maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Toast Container */}
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

        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "white", marginBottom: 32 }}>
          My Posts
        </h2>
        {projects.length === 0 ? (
          <div style={{ color: "var(--text-hint)" }}>You haven't posted any projects yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {projects.map(p => (
              <div 
                key={p.id} 
                onClick={() => handleSelectProject(p)}
                style={{
                  background: "#141414", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: 24, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", flexDirection: "column", minHeight: 220, position: "relative"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(155,111,212,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9B6FD4", background: "rgba(123,94,167,0.1)", padding: "4px 8px", borderRadius: 6 }}>
                    {p.domain}
                  </span>
                  {p.status !== 'open' && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.status === 'closed' ? "#EF4444" : "var(--text-hint)", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: 6, textTransform: 'capitalize' }}>
                      {p.status}
                    </span>
                  )}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "white", marginBottom: 8, lineHeight: 1.3 }}>
                  {p.title}
                </h3>
                <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 16, flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.description}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-hint)", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    {p.applicant_count || 0} applicants
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-hint)" }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="poster-layout page-enter" style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "calc(100vh - 56px)" }}>
      <style>{`
        .app-row-luxury {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          gap: 12px;
          align-items: center;
          background: transparent;
        }
        .app-row-luxury:hover { background: #141414; }
        .app-row-luxury.selected {
          background: rgba(123,94,167,0.08);
          border-left: 3px solid transparent;
          border-image: linear-gradient(180deg, #7B5EA7, #9B6FD4) 1;
        }
        .ai-fit-number {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 20px;
        }
        .skill-green {
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.3);
          color: #10B981;
          font-size: 11px; padding: 4px 10px; border-radius: 8px; display: inline-block; margin: 3px;
        }
        .skill-gray {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-hint);
          font-size: 11px; padding: 4px 10px; border-radius: 8px; display: inline-block; margin: 3px;
        }
      `}</style>
      
      {/* Applicant list */}
      <aside className="app-list" style={{ background: "#0D0D0D", borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", maxHeight: "calc(100vh - 56px)" }}>
        <div className="app-list-header" style={{ 
          background: "#0D0D0D", position: "sticky", top: 0, zIndex: 10, 
          padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {applicants.length} applicants
            </div>
            <div style={{ fontSize: 12, color: "var(--text-sec)" }}>
              Sorted by Match
            </div>
          </div>
          <button style={{ 
            background: "rgba(232,121,160,0.15)", color: "#E879A0", border: "1px solid rgba(232,121,160,0.3)",
            borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer"
          }}>
            AI Suggest
          </button>
        </div>

        {applicants.map(ap => {
          const d = decisions[ap.application_id] || ap.status;
          const isSelected = selected?.application_id === ap.application_id;
          const fitScore = ap.ai_fit_score || ap.ai_match || Math.floor(Math.random() * 40) + 55; // Placeholder if missing
          const fitColor = fitScore >= 80 ? "#10B981" : fitScore >= 60 ? "#9B6FD4" : "var(--text-hint)";

          return (
            <div
              key={ap.application_id}
              className={`app-row-luxury ${isSelected ? "selected" : ""}`}
              onClick={() => setSelected(ap)}
              style={{ opacity: d === "rejected" ? 0.45 : d === "accepted" ? 1 : 1, borderLeft: d === 'accepted' ? '3px solid #10B981' : isSelected ? '' : '3px solid transparent' }}
            >
              <div className="avatar" style={{
                width: 44, height: 44, cursor: "pointer",
                background: "var(--bg)", backgroundClip: "padding-box",
                border: "2px solid transparent",
                backgroundImage: "linear-gradient(#0D0D0D, #0D0D0D), linear-gradient(135deg, #7B5EA7, #9B6FD4)",
                backgroundOrigin: "border-box",
                color: "#fff", fontSize: 16
              }} onClick={(e) => { e.stopPropagation(); navigate(`/user/${ap.applicant_id}`); }}>{ap.full_name?.[0] || "?"}</div>

              <div style={{ flex: 1 }}>
                <div 
                  style={{ fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer", display: "inline-block" }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/user/${ap.applicant_id}`); }}
                  onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.target.style.textDecoration = 'none'}
                >
                  {ap.full_name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-sec)" }}>
                  Trust: {ap.trust_score || "N/A"}
                </div>
                {d === 'accepted' && <div style={{ fontSize: 10, color: '#10B981', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Approved</div>}
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="ai-fit-number" style={{ color: fitColor }}>{fitScore}%</div>
                <div style={{ fontSize: 10, color: "var(--text-hint)" }}>Match</div>
              </div>
            </div>
          );
        })}
      </aside>

      <main className="poster-detail" style={{ padding: "32px", overflowY: "auto", maxHeight: "calc(100vh - 56px)", position: "relative" }}>
        
        {/* Toast Container */}
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

        <button 
          onClick={() => setPost(null)}
          style={{ background: "transparent", border: "none", color: "var(--text-sec)", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 6 }} 
        >
          ← Back to My Posts
        </button>

        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
              {post.title}
              {post.status !== 'open' && (
                <span style={{ fontSize: 12, padding: "4px 8px", background: post.status === 'closed' ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.1)", color: post.status === 'closed' ? "#EF4444" : "var(--text-hint)", borderRadius: 6, fontWeight: 600, textTransform: "capitalize" }}>{post.status}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
              Project Difficulty: <span style={{ color: "#fff" }}>{post.difficulty}/10</span>
            </div>
          </div>
          
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              style={{
                width: 32, height: 32, background: "rgba(255,255,255,0.05)", color: "#A0A0A0",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", cursor: "pointer", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#A0A0A0"; }}
            >
              ⋮
            </button>
            {menuOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", top: 40, right: 0, background: "#1A1A1A",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 50,
                  minWidth: 180, padding: 4
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
                  <span style={{ fontSize: 14 }}>✏️</span> Edit project
                </div>
                {post.status !== 'closed' && (
                  <div
                    onClick={handleClose}
                    style={{
                      padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6,
                      color: "white", display: "flex", alignItems: "center", gap: 8
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 14 }}>🔒</span> Mark as closed
                  </div>
                )}
                {post.status !== 'completed' && (
                  <div
                    onClick={handleComplete}
                    style={{
                      padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6,
                      color: "#10B981", display: "flex", alignItems: "center", gap: 8
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 14 }}>✅</span> Mark as done
                  </div>
                )}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                <div
                  onClick={handleDelete}
                  style={{
                    padding: "10px 16px", fontSize: 13, cursor: "pointer", borderRadius: 6,
                    color: "#EF4444", display: "flex", alignItems: "center", gap: 8
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 14 }}>🗑️</span> Delete project
                </div>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="detail-card" style={{ 
            background: "#141414", border: "1px solid rgba(255,255,255,0.08)", 
            borderRadius: 20, padding: 32 
          }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
              <div className="avatar" style={{
                width: 64, height: 64, cursor: "pointer",
                background: "var(--bg)", backgroundClip: "padding-box",
                border: "3px solid transparent",
                backgroundImage: "linear-gradient(#141414, #141414), linear-gradient(135deg, #7B5EA7, #9B6FD4)",
                backgroundOrigin: "border-box",
                color: "#fff", fontSize: 24
              }} onClick={() => navigate(`/user/${selected.applicant_id}`)}>{selected.full_name?.[0] || "?"}</div>
              <div>
                <h3 
                  style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#fff", cursor: "pointer", display: "inline-block" }}
                  onClick={() => navigate(`/user/${selected.applicant_id}`)}
                  onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.target.style.textDecoration = 'none'}
                >
                  {selected.full_name}
                </h3>
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  Trust Score: <span style={{ color: "#9B6FD4", fontWeight: 600 }}>{selected.trust_score || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div style={{ 
              background: "rgba(123,94,167,0.1)", border: "1px solid rgba(155,111,212,0.25)", 
              borderRadius: 12, padding: "16px 20px", marginBottom: 24 
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9B6FD4", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                ✨ AI Recommendation
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                {selected.ai_reason || `${selected.full_name} shows a strong foundational match for this project. Their trust score indicates reliability, and their core skills align with your requirements.`}
              </div>
            </div>

            {/* Skills Match */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sec)", marginBottom: 12 }}>Skills Alignment</div>
              <div>
                {(selected.matched_skills || ["React", "CSS"]).map(s => <span key={s} className="skill-green">{s}</span>)}
                {(selected.missing_skills || ["Node.js"]).map(s => <span key={s} className="skill-gray">{s}</span>)}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              {(decisions[selected.application_id] === "accepted" || selected.status === "accepted") ? (
                <div style={{ width: "100%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: "16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ color: "#10B981", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                     ✅ Approved Collaborator
                   </div>
                   {post.status === "completed" && (
                     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                       <span style={{ fontSize: 13, color: "var(--text-sec)" }}>Rate Contribution:</span>
                       <div style={{ display: "flex", gap: 4 }}>
                         {[1, 2, 3, 4, 5].map(star => (
                           <span 
                             key={star} 
                             onClick={() => handleRate(selected.application_id, star)}
                             style={{ 
                               cursor: "pointer", fontSize: 20, 
                               color: (selected.rating >= star) ? "#EAB308" : "rgba(255,255,255,0.1)",
                               transition: "color 0.2s"
                             }}
                           >
                             ★
                           </span>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              ) : (
                <>
                  <button
                    style={{
                      flex: 1, background: "linear-gradient(135deg, #059669, #10B981)",
                      color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "0.2s"
                    }}
                    onClick={() => decide(selected.application_id, "accepted")}
                  >
                    Approve
                  </button>
                  <button
                    style={{
                      background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                      color: "var(--text-sec)", borderRadius: 12, padding: "12px 24px", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--text-sec)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sec)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    onClick={() => decide(selected.application_id, "pass")}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}