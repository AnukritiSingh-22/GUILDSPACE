// src/components/SkillTag.jsx
export default function SkillTag({ children, accent = false }) {
  return (
    <span className={accent ? "skill-chip" : "tag"}>
      {children}
    </span>
  );
}