// src/pages/PublicProfile.jsx — with working Message button
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPublicProfile, fetchIsFollowing, followUser, unfollowUser, fetchUserProjects, fetchUserRatings, submitRating } from "../api/api";

function TrustRingGradient({ value, initials, avatarUrl }) {
  const r = 38, cx = 46, cy = 46, circ = 2 * Math.PI * r, pct = Math.min(value, 5) / 5;
  return (
    <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
      <svg width="92" height="92" style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#pg)" strokeWidth={6}
          strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B5EA7"/><stop offset="100%" stopColor="#9B6FD4"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="avatar" style={{
        position: "absolute", top: 8, left: 8, width: 76, height: 76,
        fontSize: 26, background: "rgba(155,111,212,0.1)", border: "none", color: "#9B6FD4", overflow: "hidden",
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          : (initials || "?")}
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [profile, setProfile]       = useState(null);
  const [projects, setProjects]     = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [ratingInput, setRatingInput] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (user && String(user.id) === String(userId)) { navigate("/profile", { replace: true }); return; }
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [profileData, followingData, projectsData, collabsData] = await Promise.all([
          fetchPublicProfile(userId),
          fetchIsFollowing(userId).catch(() => ({ is_following: false })),
          fetchUserProjects(userId).catch(() => ({ projects: [] })),
          fetchUserRatings(userId).catch(() => [])
        ]);
        setProfile(profileData);
        setIsFollowing(followingData?.is_following || false);
        // Only projects by this user
        const allProjects = projectsData?.projects || (Array.isArray(projectsData) ? projectsData : []);
        setProjects(allProjects.filter(p => String(p.creator_id) === String(userId) || !p.creator_id));
        setCollaborations(collabsData || []);
      } catch { setError("User not found"); }
      finally { setLoading(false); }
    };
    load();
  }, [userId, user, navigate]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) { await unfollowUser(userId); setIsFollowing(false); setProfile(p => ({ ...p, follower_count: Math.max(0, p.follower_count - 1) })); }
      else             { await followUser(userId);   setIsFollowing(true);  setProfile(p => ({ ...p, follower_count: p.follower_count + 1 })); }
    } catch (e) { console.error(e); }
    finally { setFollowLoading(false); }
  };

  const handleMessage = () => navigate(`/messages/new?to=${userId}`);

  const handleRatingSubmit = async (collab) => {
    const r = ratingInput[collab.project_id];
    if (!r || !r.stars) return;
    try {
      await submitRating(collab.project_id, userId, r.stars, r.comment || "");
      setCollaborations(prev => prev.map(c => 
        c.project_id === collab.project_id 
          ? { ...c, stars: r.stars, comment: r.comment } 
          : c
      ));
    } catch(e) {
      alert("Error submitting rating: " + e.message);
    }
  };

  if (loading) return (
    <div className="page-wrap page-enter" style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
        <div style={{ width: 92, height: 92, borderRadius: "50%", background: "var(--bg-elevated)", animation: "pulse 1.5s infinite" }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 200, height: 28, background: "var(--bg-elevated)", borderRadius: 6, marginBottom: 10, animation: "pulse 1.5s infinite" }} />
          <div style={{ width: 300, height: 16, background: "var(--bg-elevated)", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
        </div>
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="page-wrap page-enter" style={{ maxWidth: 860, textAlign: "center", paddingTop: 80 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>User not found</h2>
      <button className="btn btn-ghost" onClick={() => navigate("/")}>← Back to Home</button>
    </div>
  );

  return (
    <div className="page-wrap page-enter" style={{ maxWidth: 900 }}>
      <button className="btn btn-ghost" style={{ marginBottom: 24, fontSize: 12, padding: "4px 12px" }} onClick={() => navigate(-1)}>← Back</button>

      {/* Header */}
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 40, padding: "28px 32px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20 }}>
        <TrustRingGradient value={parseFloat(profile.trust_score || 1)} initials={profile.initials} avatarUrl={profile.avatar_url} />

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>{profile.full_name}</h1>
              <div style={{ fontSize: 14, color: "var(--text-sec)" }}>
                {profile.role && <span style={{ color: "#9B6FD4", fontWeight: 500 }}>{profile.role}</span>}
                {profile.role && (profile.city || profile.college) && <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>}
                {[profile.city, profile.college].filter(Boolean).join(" · ")}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleMessage}
                style={{ fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 20, background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", color: "var(--text-primary)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(155,111,212,0.5)"; e.currentTarget.style.color = "#9B6FD4"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-mid)"; e.currentTarget.style.color = "var(--text-primary)"; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Message
              </button>
              <button onClick={handleFollow} disabled={followLoading}
                style={{ fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 20, minWidth: 90,
                  background: isFollowing ? "rgba(155,111,212,0.08)" : "linear-gradient(135deg, #7B5EA7, #9B6FD4)",
                  border: isFollowing ? "1px solid rgba(155,111,212,0.4)" : "none",
                  color: isFollowing ? "#9B6FD4" : "#fff", cursor: "pointer", transition: "all 0.2s" }}>
                {followLoading ? "…" : isFollowing ? "✓ Following" : "Follow"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-sec)", marginBottom: 12 }}>
            <div><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{profile.follower_count || 0}</span> Followers</div>
            <div><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{profile.following_count || 0}</span> Following</div>
            <div>Trust: <span style={{ fontWeight: 700, color: "#9B6FD4" }}>{profile.trust_score}</span></div>
          </div>

          {profile.bio && <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.65, marginBottom: 12 }}>{profile.bio}</p>}

          {profile.skills?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {profile.skills.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
            </div>
          )}

          {(profile.github_url || profile.portfolio_url || profile.arxiv_url) && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {profile.github_url && (
                <a href={profile.github_url.startsWith("http") ? profile.github_url : `https://${profile.github_url}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: "#9B6FD4", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
                  GitHub
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url.startsWith("http") ? profile.portfolio_url : `https://${profile.portfolio_url}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: "#9B6FD4", display: "flex", alignItems: "center", gap: 4 }}>
                  🌐 Portfolio
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="section-label" style={{ marginBottom: 16 }}>Projects Posted</div>
      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-hint)" }}>
          {profile.full_name} hasn't posted any projects yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
          {projects.map(proj => (
            <div key={proj.id} className="proj-card" onClick={() => navigate(`/project/${proj.id}`)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>{proj.domain}</span>
                <div style={{ fontSize: 11, color: "var(--text-hint)" }}>{proj.applicant_count || 0} applicants</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.35 }}>{proj.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 14, lineHeight: 1.6 }}>
                {proj.description?.length > 100 ? proj.description.slice(0, 100) + "…" : proj.description}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(proj.skills || []).slice(0, 4).map((s, i) => <span key={i} className="tag">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collaborations */}
      {collaborations.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 48, marginBottom: 16 }}>Collaborations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {collaborations.map(c => (
              <div key={c.project_id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }} onClick={() => navigate(`/project/${c.project_id}`)}>
                    {c.project_title}
                  </div>
                  {c.stars ? (
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} style={{ color: c.stars >= s ? "#EAB308" : "var(--border-mid)" }}>★</span>
                      ))}
                    </div>
                  ) : user && String(user.id) === String(c.creator_id) ? (
                    <div style={{ background: "rgba(155,111,212,0.1)", padding: 16, borderRadius: 12, border: "1px solid var(--border)", minWidth: 280 }}>
                      <div style={{ fontSize: 13, marginBottom: 8, color: "var(--text-primary)", fontWeight: 500 }}>Rate this collaborator</div>
                      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} 
                            onClick={() => setRatingInput(prev => ({ ...prev, [c.project_id]: { ...prev[c.project_id], stars: s } }))}
                            style={{ cursor: "pointer", fontSize: 24, color: ratingInput[c.project_id]?.stars >= s ? "#EAB308" : "var(--border-mid)", transition: "color 0.2s" }}
                          >★</span>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Add a comment... (optional)"
                        value={ratingInput[c.project_id]?.comment || ""}
                        onChange={e => setRatingInput(prev => ({ ...prev, [c.project_id]: { ...prev[c.project_id], comment: e.target.value } }))}
                        style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border-mid)", padding: "10px 14px", borderRadius: 8, fontSize: 13, outline: "none", color: "var(--text-primary)", marginBottom: 12, boxSizing: "border-box" }}
                      />
                      <div style={{ textAlign: "right" }}>
                        <button 
                          onClick={() => handleRatingSubmit(c)}
                          disabled={!ratingInput[c.project_id]?.stars}
                          style={{ background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "white", padding: "6px 16px", borderRadius: 20, border: "none", cursor: ratingInput[c.project_id]?.stars ? "pointer" : "default", fontSize: 13, fontWeight: 600, opacity: ratingInput[c.project_id]?.stars ? 1 : 0.5 }}
                        >Submit Rating</button>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-hint)" }}>No rating yet</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  Project by: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.rater_name}</span>
                </div>
                {c.comment && (
                  <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 12, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontStyle: "italic", borderLeft: "3px solid #9B6FD4" }}>
                    "{c.comment}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
