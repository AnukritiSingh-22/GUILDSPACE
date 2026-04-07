import { useEffect, useState } from "react";
import { fetchProjects, fetchApplicants } from "../api/api";
// import SkillTag from "../components/SkillTag";
import TrustBadge from "../components/TrustBadge";

export default function Applications() {
  const [post, setPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [decisions, setDecisions] = useState({});

  const decide = (id, val) =>
    setDecisions(prev => ({ ...prev, [id]: val }));

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch projects
        const projects = await fetchProjects();
        if (!projects || projects.length === 0) return;

        const firstProject = projects[0];
        setPost(firstProject);

        // 2. Fetch applicants for that project
        const apps = await fetchApplicants(firstProject.id);
        setApplicants(apps);

        if (apps.length > 0) {
          setSelected(apps[0]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    loadData();
  }, []);

  if (!post) return <div>Loading...</div>;

  return (
    <div className="poster-layout page-enter">
      {/* Applicant list */}
      <aside className="app-list">
        <div className="app-list-header">
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {applicants.length} applicants
            </div>
            <div style={{ fontSize: 11, color: "var(--text-sec)" }}>
              AI sorted by fit
            </div>
          </div>
        </div>

        {applicants.map(ap => {
          const d = decisions[ap.id];
          return (
            <div
              key={ap.id}
              className={`app-row ${
                selected?.id === ap.id ? " selected" : ""
              }`}
              onClick={() => setSelected(ap)}
              style={{ opacity: d === "pass" ? 0.45 : 1 }}
            >
              <div className="avatar">{ap.name?.[0]}</div>

              <div style={{ flex: 1 }}>
                <div>{ap.name}</div>
                <div style={{ fontSize: 11 }}>
                  Trust {ap.trust_score || "N/A"}
                </div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Detail panel */}
      <main className="poster-detail">
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 20 }}>{post.title}</div>
          <div style={{ fontSize: 12 }}>
            Difficulty {post.difficulty}
          </div>
        </div>

        {selected && (
          <div className="detail-card">
            <div>
              <h3>{selected.name}</h3>
              <TrustBadge value={selected.trust_score} />
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                className="btn btn-success"
                onClick={() => decide(selected.id, "accepted")}
              >
                Accept
              </button>

              <button
                className="btn btn-accent-outline"
                onClick={() => decide(selected.id, "shortlisted")}
              >
                Shortlist
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => decide(selected.id, "pass")}
              >
                Pass
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}