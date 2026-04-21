import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProject, updateProject, fetchProject } from "../api/api";

const DOMAINS = ["Research", "Tech / Dev", "Design", "Science", "Social / NGO"];

export default function CreateProject() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");
  const [form,     setForm]     = useState({
    title:       "",
    description: "", 
    tags:        "",
    domain:      "Research",
    difficulty:  5,
    minTrust:    2,
    applyType:   "questions",
    questions:   ["", ""],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchProject(id)
        .then(p => {
          setForm({
            title:       p.title || "",
            description: p.description || "",
            tags:        p.skills?.join(", ") || "",
            domain:      p.domain || "Research",
            difficulty:  p.difficulty || 5,
            minTrust:    p.min_trust || 2,
            applyType:   p.apply_type || "questions",
            questions:   (p.questions && p.questions.length > 0) ? p.questions.map(q => q.question) : ["", ""],
          });
        })
        .catch(err => setError("Failed to load project: " + err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async () => {
    // Basic validation
    if (!form.title.trim()) {
      setError("Please enter a project title.");
      return;
    }
    if (!form.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const skillNames = form.tags
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const cleanQuestions = form.questions.filter(q => q.trim().length > 0);

      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        domain:      form.domain,
        difficulty:  form.difficulty,
        min_trust:   form.minTrust,
        apply_type:  form.applyType,
        skill_names: skillNames,
        questions:   cleanQuestions,
      };

      if (id) {
        await updateProject(id, payload);
      } else {
        await createProject(payload);
      }
      setDone(true);
    } catch (err) {
      setError(err.message || "Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.1)",
            border: "2px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, color: "#10B981", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(16,185,129,0.2)"
          }}>✓</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
            {id ? "Project updated!" : "Project posted!"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-sec)", marginBottom: 32 }}>
            {id ? "Your project has been successfully updated." : "Collaborators can now find and apply to your project."}
          </p>
          <button style={{
            background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "#fff", border: "none",
            borderRadius: 12, padding: "14px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer"
          }} onClick={() => navigate("/")}>
            Back to feed
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 0" }}>
      <style>{`
        .create-input {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .create-input:focus {
          border-color: rgba(155,111,212,0.5);
          box-shadow: 0 0 0 3px rgba(123,94,167,0.15);
        }
        select.create-input {
          cursor: pointer;
          appearance: none;
        }
        .applytype-card {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .applytype-card.active {
          border-color: #9B6FD4;
          background: rgba(123,94,167,0.1);
        }
        .applytype-card.active .applytype-card-title {
          color: #9B6FD4;
        }
        .divider {
          height: 1px;
          background: var(--border);
          margin: 32px 0;
        }
      `}</style>
      
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 28px" }}>
        <button 
          style={{ background: "transparent", border: "none", color: "var(--text-sec)", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }} 
          onClick={() => navigate("/")}
        >
          ← Cancel
        </button>

        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            {id ? "Edit your project" : "Post a collaboration"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-sec)" }}>
            Tell the community about your project and what kind of help you need.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
            color: "#ef4444", borderRadius: 12, padding: "12px 16px", fontSize: 13, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {/* ── Project Info ─────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 8 }}>Project title *</label>
          <input
            className="create-input" type="text" value={form.title} placeholder="e.g. Building an ML model for air quality prediction…"
            onChange={e => set("title", e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 8 }}>Description *</label>
          <textarea
            className="create-input" rows={5} value={form.description} placeholder="Describe your project, goals, and what kind of collaborator you need…"
            onChange={e => set("description", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 8 }}>Skill tags</label>
            <input
              className="create-input" type="text" value={form.tags} placeholder="Python, ML, Data"
              onChange={e => set("tags", e.target.value)}
            />
            <div style={{ fontSize: 11, color: "var(--text-hint)", marginTop: 6 }}>Separate with a comma</div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 8 }}>Domain</label>
            <select className="create-input" value={form.domain} onChange={e => set("domain", e.target.value)}>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="divider" />

        {/* ── Requirements ─────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 12 }}>
              <span>Difficulty (1–10)</span>
              <span style={{ color: "#9B6FD4", fontWeight: 600 }}>{form.difficulty}</span>
            </label>
            <input
              type="range" min={1} max={10} step={1} value={form.difficulty}
              onChange={e => set("difficulty", +e.target.value)}
              style={{ width: "100%", marginBottom: 8, accentColor: "#9B6FD4" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span>1 Easy</span><span>10 Expert</span>
            </div>
          </div>
          <div>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 12 }}>
              <span>Minimum trust</span>
              <span style={{ color: "#9B6FD4", fontWeight: 600 }}>{form.minTrust}</span>
            </label>
            <input
              type="range" min={0.5} max={8} step={0.5} value={form.minTrust}
              onChange={e => set("minTrust", +e.target.value)}
              style={{ width: "100%", marginBottom: 8, accentColor: "#9B6FD4" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span>0.5 Open</span><span>8 Strict</span>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* ── Application Settings ─────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 12 }}>Application type</label>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { value: "oneclick",  title: "One-click apply",   sub: "Profile auto-submitted" },
              { value: "questions", title: "Custom questions",  sub: "You define questions" },
            ].map(opt => (
              <div key={opt.value} className={`applytype-card ${form.applyType === opt.value ? "active" : ""}`} onClick={() => set("applyType", opt.value)}>
                <div className="applytype-card-title" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{opt.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {form.applyType === "questions" && (
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-sec)", marginBottom: 6 }}>Candidate questions</label>
            <div style={{ fontSize: 12, color: "var(--text-hint)", marginBottom: 16 }}>
              Applicants must answer these to apply. We recommend asking 2-3 questions.
            </div>
            {form.questions.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input
                  className="create-input" type="text" value={q} placeholder={`Question ${i + 1}…`}
                  onChange={e => {
                    const qs = [...form.questions];
                    qs[i] = e.target.value;
                    set("questions", qs);
                  }}
                  style={{ flex: 1, padding: "12px 14px" }}
                />
                {form.questions.length > 1 && (
                  <button
                    style={{ background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "0 16px", cursor: "pointer", transition: "0.2s" }}
                    onClick={() => set("questions", form.questions.filter((_, j) => j !== i))}
                  >✕</button>
                )}
              </div>
            ))}
            <button
              style={{
                background: "transparent", border: "1px dashed rgba(155,111,212,0.4)", borderRadius: 8,
                color: "#9B6FD4", padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 8
              }}
              onClick={() => set("questions", [...form.questions, ""])}
            >
              + Add question
            </button>
          </div>
        )}

        <div className="divider" />

        {/* Submit */}
        <div style={{ display: "flex", gap: 16 }}>
          <button style={{
            background: "var(--border)", border: "none", borderRadius: 12, color: "var(--text-primary)",
            padding: "14px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "0.2s"
          }} onClick={() => navigate("/")}>
            Cancel
          </button>
          <button style={{
            flex: 1, background: "linear-gradient(135deg, #7B5EA7, #9B6FD4)", color: "#fff", border: "none",
            borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "0.2s", opacity: loading ? 0.7 : 1
          }} onClick={handleSubmit} disabled={loading}>
            {loading ? (id ? "Saving…" : "Publishing…") : (id ? "Save Changes" : "Publish Project →")}
          </button>
        </div>
      </div>
    </div>
  );
}