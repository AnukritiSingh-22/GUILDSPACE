// src/components/ProjectCard.jsx
import SkillTag from "./SkillTag";

export default function ProjectCard({ project }) {
  const { title, status, domain, tags, rating, trustGain, collab, duration } = project;
  const isCompleted = status === "Completed";
  const roundedRating = rating ? Math.round(rating) : 0;

  return (
    <div className="proj-card">
      <header className="proj-card-header">
        <div className="proj-card-heading">
          <div className="proj-card-eyebrow">Project</div>
          <div className="proj-card-title">{title}</div>
        </div>
        <span
          className={`badge ${isCompleted ? "badge-success" : "badge-warning"} proj-card-status`}
        >
          {status}
        </span>
      </header>

      <div className="proj-card-body">
        <div className="proj-card-meta">
          <span>With {collab}</span>
          <span>{duration}</span>
          <span className="badge badge-neutral proj-card-domain">{domain}</span>
        </div>

        <div className="proj-card-tags">
          {tags.map((t) => (
            <SkillTag key={t}>{t}</SkillTag>
          ))}
        </div>
      </div>

      <div className="proj-card-divider" />

      <footer className="proj-card-footer">
        <div className="proj-card-stat">
          <span className="proj-card-stat-label">Collaboration</span>
          <span className="proj-card-stat-value">{collab}</span>
        </div>

        <div className="proj-card-stat">
          <span className="proj-card-stat-label">Timeline</span>
          <span className="proj-card-stat-value">{duration}</span>
        </div>

        {rating && (
          <div className="proj-card-stat proj-card-stat-highlight">
            <span className="proj-card-stat-label">Rating</span>
            <span className="proj-card-stat-value">
              <span className="proj-card-rating-stars">{"★".repeat(roundedRating)}</span>
              <span>{rating}</span>
              <span className="proj-card-trust">+{trustGain} trust</span>
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}
