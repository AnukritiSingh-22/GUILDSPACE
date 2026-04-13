import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchPublicProfile,
  fetchIsFollowing,
  followUser,
  unfollowUser,
  fetchUserProjects
} from "../api/api";

function getTrustBand(score) {
  const s = parseFloat(score || 1);
  if (s >= 8.0) return "Elite";
  if (s >= 5.0) return "Trusted";
  if (s >= 3.0) return "Intermediate";
  return "Beginner";
}

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

function TrustRingGradient({ value, initials }) {
  const r = 38, cx = 46, cy = 46, circ = 2 * Math.PI * r, pct = value / 5;
  return (
    <div style={{ position: "relative", width: 92, height: 92 }}>
      <svg width="92" height="92" style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#purpleGradient)"
          strokeWidth={6} strokeDasharray={`${pct * circ} ${circ}`}
          strokeDashoffset={circ * 0.25} strokeLinecap="round" />
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B5EA7" />
            <stop offset="100%" stopColor="#9B6FD4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="avatar" style={{
        position: "absolute", top: 8, left: 8, width: 76, height: 76, 
        fontSize: 26, background: "rgba(155,111,212,0.1)", 
        border: "none", color: "#9B6FD4"
      }}>
        {initials || "?"}
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.id === parseInt(userId)) {
      navigate("/profile", { replace: true });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, followingData, projectsData] = await Promise.all([
          fetchPublicProfile(userId),
          fetchIsFollowing(userId).catch(() => ({ is_following: false })),
          fetchUserProjects(userId).catch(() => ({ projects: [] }))
        ]);
        setProfile(profileData);
        setIsFollowing(followingData?.is_following || false);
        setProjects(projectsData?.projects || projectsData || []);
      } catch (err) {
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, user, navigate]);

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        setProfile(p => ({ ...p, follower_count: Math.max(0, p.follower_count - 1) }));
      } else {
        await followUser(userId);
        setIsFollowing(true);
        setProfile(p => ({ ...p, follower_count: p.follower_count + 1 }));
      }
    } catch (e) {
      console.error("Failed to toggle follow status", e);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap page-enter" style={{ maxWidth: 860 }}>
        <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: "var(--bg-elevated)", animation: "pulse 1.5s infinite" }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: 200, height: 32, background: "var(--bg-elevated)", borderRadius: 6, marginBottom: 12, animation: "pulse 1.5s infinite" }} />
            <div style={{ width: 140, height: 16, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 16, animation: "pulse 1.5s infinite" }} />
            <div style={{ width: 300, height: 16, background: "var(--bg-elevated)", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <div style={{ width: 100, height: 24, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 16, animation: "pulse 1.5s infinite" }} />
            <div className="card" style={{ height: 200, background: "var(--bg-elevated)", borderColor: "transparent", animation: "pulse 1.5s infinite" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-wrap page-enter" style={{ maxWidth: 860, textAlign: "center", paddingTop: 80 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>User not found</h2>
        <p style={{ color: "var(--text-sec)", marginBottom: 24 }}>The user you are looking for does not exist or has been removed.</p>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>← Back to Home</button>
      </div>
    );
  }

  return (
    <div className="page-wrap page-enter" style={{ maxWidth: 860 }}>
      {/* ── Header Profile Info ─────────────────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: 48 }}>
        <button className="btn btn-ghost" style={{ position: "absolute", top: -40, left: -16, padding: "4px 12px", fontSize: 12 }} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
          <TrustRingGradient value={parseFloat(profile.trust_score || 1)} initials={profile.initials} />
          
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
                  {profile.full_name}
                </h1>
                <div style={{ fontSize: 14, color: "var(--text-sec)", marginBottom: 12 }}>
                  {profile.role || "Member"} · {profile.city || "Earth"}
                  {profile.college && <><span style={{ margin: "0 6px" }}>•</span>{profile.college}</>}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-sec)", marginBottom: 16 }}>
                  <div><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{profile.follower_count || 0}</span> Followers</div>
                  <div><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{profile.following_count || 0}</span> Following</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-hint)" }}>
                        [GitHub]
                      </a>
                    )}
                    {profile.arxiv_url && (
                      <a href={profile.arxiv_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-hint)" }}>
                        [arXiv]
                      </a>
                    )}
                  </div>
                </div>

              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-ghost" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-mid)" }}>
                  Message
                </button>
                <button 
                  className={isFollowing ? "btn btn-ghost" : "btn btn-primary"}
                  style={{
                    minWidth: 100,
                    ...(isFollowing 
                      ? { 
                          border: "1px solid rgba(155,111,212,0.4)", 
                          color: "#9B6FD4", 
                          background: "rgba(155,111,212,0.05)" 
                        } 
                      : { 
                          background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", 
                          color: "#fff",
                          border: "none"
                        })
                  }}
                  disabled={followLoading}
                  onClick={handleFollowToggle}
                >
                  {followLoading ? "..." : isFollowing ? "✓ Following" : "Follow"}
                </button>
              </div>
            </div>

            {profile.bio && (
              <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, marginTop: 4 }}>
                {profile.bio}
              </p>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                {profile.skills.map((s, i) => (
                  <span key={i} className="skill-chip">{s}</span>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: 16, display: "inline-block", background: "rgba(123,94,167,0.1)", border: "1px solid rgba(155,111,212,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#9B6FD4", fontWeight: 600 }}>
              {getTrustBand(profile.trust_score)} Guildmember
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────────────────────── */}
      <div className="section-label">Projects Posted</div>
      
      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-hint)" }}>
          {profile.full_name} hasn't posted any projects yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
          {projects.map((proj) => (
            <div 
              key={proj.id} 
              className="proj-card proj-card-clickable" 
              onClick={() => navigate(`/project/${proj.id}`)}
              style={{ background: "#141414", cursor: "pointer" }}
            >
              <div className="proj-card-header" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: 12 }}>
                  <span className="badge badge-neutral" style={{ background: "transparent" }}>
                    {proj.domain}
                  </span>
                  <div style={{ fontSize: 11, color: "var(--text-hint)" }}>
                    {proj.applicant_count || 0} applicants
                  </div>
                </div>
              </div>

              <div className="proj-card-title" style={{ fontSize: 16 }}>{proj.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8, flex: 1, minHeight: 40 }}>
                {proj.description?.length > 100 ? proj.description.slice(0, 100) + '...' : proj.description}
              </div>

              <div className="proj-card-divider" style={{ margin: "16px -16px 12px" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="proj-card-tags" style={{ gap: 6 }}>
                  {(proj.skills || []).slice(0, 3).map((s, i) => (
                    <span key={i} className="tag">{s}</span>
                  ))}
                  {(proj.skills?.length || 0) > 3 && (
                    <span className="tag" style={{ background: "transparent", border: "none" }}>+{(proj.skills.length - 3)}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-sec)" }}>
                  <DiffBar value={proj.difficulty || 1} />
                  <span style={{ fontWeight: 500 }}>{proj.difficulty || 1}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Contributed Projects ────────────────────────────────────────────────── */}
      {profile.contributions && profile.contributions.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 48 }}>Projects Contributed To</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {profile.contributions.map((c, i) => (
              <div key={i} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", cursor: c.project_id ? "pointer" : "default" }} onClick={() => c.project_id && navigate(`/project/${c.project_id}`)}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 14, display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} style={{ color: c.rating && c.rating >= star ? "#EAB308" : "rgba(255,255,255,0.1)" }}>★</span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  Collaboration with Post Creator: <span style={{ color: "#fff", fontWeight: 500 }}>{c.poster_name}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
