// src/pages/CreateProject.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/api";

const DOMAINS = ["Research", "Tech / Dev", "Design", "Science", "Social / NGO"];

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    title: "", desc: "", tags: "", domain: "Research",
    difficulty: 5, minTrust: 2, applyType: "questions", questions: ["", ""],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    await createProject(form);
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="success-screen page-enter">
        <div className="success-circle">✓</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>Project posted!</h2>
        <p style={{ fontSize: 14, color: "var(--text-sec)" }}>
          Collaborators can now find and apply to your project.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>Back to feed</button>
      </div>
    );
  }

  return (
    <div className="page-wrap-narrow page-enter">
      <button className="back-btn" onClick={() => navigate("/")}>← Cancel</button>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 6 }}>
        Post a collaboration
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 28 }}>
        Tell the community about your project and what help you need.
      </p>

      {/* Title */}
      <div className="form-group">
        <label className="form-label">Project title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set("title", e.target.value)}
          placeholder="e.g. Building an ML model for air quality prediction…"
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          rows={4}
          value={form.desc}
          onChange={e => set("desc", e.target.value)}
          placeholder="Describe your project, goals, and what kind of collaborator you need…"
        />
      </div>

      {/* Tags + Domain */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="mb-16">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Skill tags (comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={e => set("tags", e.target.value)}
            placeholder="Python, ML, Data Viz"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Domain</label>
          <select value={form.domain} onChange={e => set("domain", e.target.value)}>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Difficulty + Min Trust */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="mb-16">
        <div>
          <label className="form-label">
            Difficulty (1–10):{" "}
            <span style={{ color: "var(--accent-mid)" }}>{form.difficulty}</span>
          </label>
          <input
            type="range" min={1} max={10} step={1} value={form.difficulty}
            onChange={e => set("difficulty", +e.target.value)}
            style={{ width: "100%", marginBottom: 4 }}
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: "var(--text-hint)" }}>
            <span>1 Easy</span><span>10 Expert</span>
          </div>
        </div>
        <div>
          <label className="form-label">
            Minimum trust:{" "}
            <span style={{ color: "var(--accent-mid)" }}>{form.minTrust}</span>
          </label>
          <input
            type="range" min={0.5} max={8} step={0.5} value={form.minTrust}
            onChange={e => set("minTrust", +e.target.value)}
            style={{ width: "100%", marginBottom: 4 }}
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: "var(--text-hint)" }}>
            <span>0.5 Open</span><span>8 Expert</span>
          </div>
        </div>
      </div>

      {/* Apply type */}
      <div className="form-group">
        <label className="form-label">Application type</label>
        <div className="flex gap-8">
          {[
            { value: "oneclick", title: "One-click apply", sub: "Profile auto-submitted" },
            { value: "questions", title: "Custom questions", sub: "You define questions" },
          ].map(opt => (
            <div
              key={opt.value}
              className={`applytype-option${form.applyType === opt.value ? " active" : ""}`}
              onClick={() => set("applyType", opt.value)}
            >
              <div className="applytype-title">{opt.title}</div>
              <div className="applytype-sub">{opt.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom questions */}
      {form.applyType === "questions" && (
        <div className="form-group">
          <label className="form-label">Application questions</label>
          {form.questions.map((q, i) => (
            <input
              key={i}
              type="text"
              value={q}
              onChange={e => {
                const qs = [...form.questions];
                qs[i] = e.target.value;
                set("questions", qs);
              }}
              placeholder={`Question ${i + 1}…`}
              style={{ marginBottom: 8 }}
            />
          ))}
          <button
            className="btn btn-ghost btn-sm"
            style={{ border: "1px dashed var(--accent-border)", color: "var(--accent-mid)" }}
            onClick={() => set("questions", [...form.questions, ""])}
          >
            + Add question
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-between gap-8" style={{
        paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8,
      }}>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Publishing…" : "Publish Project →"}
        </button>
      </div>
    </div>
  );
}