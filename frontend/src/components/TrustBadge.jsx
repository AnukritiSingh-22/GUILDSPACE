// src/components/TrustBadge.jsx
export default function TrustBadge({ value, size = "sm" }) {
  return (
    <span className="trust-badge" style={size === "lg" ? { fontSize: 13, padding: "4px 12px" } : {}}>
      Trust {value}
    </span>
  );
}