# app/utils/helpers.py

from datetime import datetime, timezone


def time_ago(dt: datetime) -> str:
    """Return a human-readable 'X ago' string for a datetime."""
    now   = datetime.utcnow()
    diff  = now - dt.replace(tzinfo=None)
    secs  = int(diff.total_seconds())

    if secs < 60:
        return "just now"
    if secs < 3600:
        return f"{secs // 60}m ago"
    if secs < 86400:
        return f"{secs // 3600}h ago"
    if secs < 604800:
        return f"{secs // 86400}d ago"
    return dt.strftime("%b %d, %Y")


def make_initials(full_name: str) -> str:
    """'Aryan Rao' → 'AR'"""
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return full_name[:2].upper()


def compute_trust_level(score: float) -> int:
    """Convert a numeric trust score to a level 1–10."""
    if score >= 9.0: return 10
    if score >= 8.0: return 9
    if score >= 7.0: return 8
    if score >= 6.0: return 7
    if score >= 5.0: return 6
    if score >= 4.0: return 5
    if score >= 3.0: return 4
    if score >= 2.5: return 3
    if score >= 1.5: return 2
    return 1