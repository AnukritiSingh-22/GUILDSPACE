// src/components/ProjectCard.jsx
import SkillTag from "./SkillTag";

export default function ProjectCard({ project }) {
  const { title, status, domain, tags, rating, trustGain, collab, duration } = project;
  const isCompleted = status === "Completed";

  return (
    <div className="proj-card">
      <div className="flex items-center justify-between mb-8">
        <div className="proj-card-title" style={{ flex: 1, marginRight: 10 }}>{title}</div>
        <span className={`badge ${isCompleted ? "badge-success" : "badge-warning"}`}
          style={{ flexShrink: 0 }}>
          {status}
        </span>
      </div>

      <div className="text-sm text-sec mb-8">
        With {collab} · {duration} ·{" "}
        <span className="badge badge-neutral" style={{ fontSize: 10, padding: "1px 7px" }}>{domain}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
          {tags.map(t => <SkillTag key={t}>{t}</SkillTag>)}
        </div>
        {rating && (
          <div className="flex items-center gap-6 text-sm text-sec">
            <span style={{ color: "var(--warning)" }}>{"★".repeat(Math.round(rating))}</span>
            <span>{rating} · <span style={{ color: "var(--success)" }}>+{trustGain} trust</span></span>
          </div>
        )}
      </div>
    </div>
  );
}