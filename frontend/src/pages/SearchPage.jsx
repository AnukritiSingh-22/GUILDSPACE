import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { searchUsers, searchProjects } from "../api/api";

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

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuery = new URLSearchParams(location.search).get("q") || "";

  const [inputVal, setInputVal] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("People");
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce input updates to set actual query
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputVal);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputVal]);

  // Execute search when query or activeTab changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        if (activeTab === "People") {
          const data = await searchUsers(query);
          setResults(data || []);
        } else {
          const data = await searchProjects(query);
          setResults(data || []);
        }
      } catch (e) {
        console.error("Search error:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, activeTab]);

  return (
    <div className="page-wrap page-enter" style={{ maxWidth: 760, padding: "32px 24px", margin: "0 auto" }}>
      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "var(--text-hint)" }}>
          🔍
        </span>
        <input 
          type="text" 
          placeholder="Search users, roles, skills, or projects..." 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          style={{ 
            width: "100%", padding: "16px 16px 16px 44px", fontSize: 16, 
            background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", 
            borderRadius: 12, color: "var(--text-primary)", outline: "none"
          }} 
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, justifyContent: "center" }}>
        {["People", "Projects"].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setResults([]); }}
            style={{
              padding: "8px 24px", borderRadius: 100, fontSize: 14, fontWeight: 500,
              background: activeTab === tab ? "linear-gradient(135deg, #7B5EA7, #9B6FD4)" : "var(--bg-elevated)",
              color: activeTab === tab ? "#fff" : "var(--text-sec)",
              border: activeTab === tab ? "none" : "1px solid var(--border-mid)",
              cursor: "pointer", transition: "0.2s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* States */}
      {!hasSearched && query.trim() === "" && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-hint)", opacity: 0.7 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16 }}>Search for people or projects</div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: 120, background: "var(--bg-elevated)", borderColor: "transparent", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && query.trim() !== "" && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-hint)" }}>
          <div style={{ fontSize: 16 }}>No results for "{query}"</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Try adjusting your search terms or filters.</div>
        </div>
      )}

      {/* Results List */}
      {!loading && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {activeTab === "People" ? (
            // PEOPLE RESULT CARDS
            results.map(user => (
              <div 
                key={user.user_id} 
                className="card card-clickable" 
                style={{ background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20 }}
                onClick={() => navigate(`/user/${user.user_id}`)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="avatar" style={{
                    width: 48, height: 48, fontSize: 18, background: "rgba(155,111,212,0.1)", 
                    border: "2px solid rgba(155,111,212,0.3)", color: "#9B6FD4", flexShrink: 0
                  }}>
                    {user.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                      {user.full_name}
                      <span className="badge badge-accent" style={{ fontSize: 10 }}>Trust {user.trust_score}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 4 }}>
                      {user.role} {user.city ? `· ${user.city}` : ""}
                    </div>
                    {(user.skills || []).length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        {user.skills.slice(0, 4).map((s, i) => (
                          <span key={i} className="skill-chip">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ border: "1px solid var(--border-mid)" }} onClick={(e) => { e.stopPropagation(); navigate(`/user/${user.user_id}`); }}>
                  View Profile
                </button>
              </div>
            ))
          ) : (
            // PROJECT RESULT CARDS
            results.map(proj => (
              <div 
                key={proj.id} 
                className="card card-clickable" 
                style={{ background: "var(--bg-card)", padding: 20 }}
                onClick={() => navigate(`/project/${proj.id}`)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <span className="badge badge-neutral" style={{ background: "transparent" }}>
                    {proj.domain}
                  </span>
                  <div style={{ fontSize: 12, color: "var(--text-hint)" }}>
                    {proj.time_ago}
                  </div>
                </div>

                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                  {proj.title}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-sec)", marginBottom: 16 }}>
                  By <span style={{ fontWeight: 500 }}>{proj.poster_name}</span>
                </div>

                <div className="divider" style={{ margin: "16px -20px" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(proj.skills || []).slice(0, 3).map((s, i) => (
                      <span key={i} className="tag">{s}</span>
                    ))}
                    {(proj.skills?.length || 0) > 3 && (
                      <span className="tag" style={{ background: "transparent", border: "none" }}>+{(proj.skills.length - 3)}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-sec)" }}>
                      <DiffBar value={proj.difficulty || 1} />
                      <span style={{ fontWeight: 500 }}>{proj.difficulty || 1}/10</span>
                    </div>
                    <button className="btn btn-ghost text-sm" style={{ padding: "4px 12px" }} onClick={(e) => { e.stopPropagation(); navigate(`/project/${proj.id}`); }}>
                      View Project →
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
