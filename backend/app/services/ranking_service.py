# app/services/ranking_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Pure-Python ranking logic — no external AI API required.
# Uses skill overlap + trust compatibility to produce 0–100 scores.
# You can later replace the scoring functions with a real ML model or
# an LLM API call without changing any route code.
# ─────────────────────────────────────────────────────────────────────────────

from typing import List, Dict, Any
from sqlalchemy.orm import Session


# ─────────────────────────────────────────────────────────────────────────────
# compute_fit_score
# Called when a user applies to a project.
# Returns an integer 0–100 representing how well the applicant fits.
# ─────────────────────────────────────────────────────────────────────────────
def compute_fit_score(
    user_skills:    List[str],
    project_skills: List[str],
    user_trust:     float,
    min_trust:      float,
) -> int:
    """
    Score breakdown (total 100):
      - Skill overlap  : up to 70 points
      - Trust bonus    : up to 30 points
    """
    if not project_skills:
        skill_score = 50   # no requirements → neutral
    else:
        user_lower    = {s.lower() for s in user_skills}
        project_lower = {s.lower() for s in project_skills}
        matched       = user_lower & project_lower
        # Partial credit: token-level overlap (e.g. "machine learning" matches "ML" partially)
        partial = 0
        for ps in project_lower:
            if any(ps in us or us in ps for us in user_lower):
                partial += 1
        # Use whichever is higher
        exact_ratio   = len(matched) / len(project_lower)
        partial_ratio = partial / len(project_lower)
        ratio         = max(exact_ratio, partial_ratio)
        skill_score   = int(ratio * 70)

    # Trust bonus: 0–30 based on how far above min_trust the user is
    if min_trust <= 0:
        trust_score = 30
    else:
        surplus     = max(0.0, user_trust - min_trust)
        trust_score = min(30, int((surplus / max(min_trust, 1.0)) * 30))

    return min(100, skill_score + trust_score)


# ─────────────────────────────────────────────────────────────────────────────
# _skill_match_ratio
# Helper used in feed ranking
# ─────────────────────────────────────────────────────────────────────────────
def _skill_match_ratio(user_skills: List[str], project_skills: List[str]) -> float:
    if not project_skills:
        return 0.5
    user_lower    = {s.lower() for s in user_skills}
    project_lower = [s.lower() for s in project_skills]
    matched = sum(
        1 for ps in project_lower
        if any(ps in us or us in ps or ps == us for us in user_lower)
    )
    return matched / len(project_lower)


# ─────────────────────────────────────────────────────────────────────────────
# rank_projects_for_user
# Called by GET /api/ai/feed to produce a personalised, ranked feed.
# ─────────────────────────────────────────────────────────────────────────────
def rank_projects_for_user(
    projects:    List[Any],
    user_skills: List[str],
    user_trust:  float,
    applied_ids: List[str],
    db:          Session,
) -> List[Dict]:
    """
    Score each project for the user and return sorted list (highest first).

    Score breakdown (total 100):
      40 pts  — skill overlap
      20 pts  — trust tier fit  (project's difficulty band matches user trust)
      20 pts  — domain diversity bonus (spread across domains)
      20 pts  — recency           (newer projects score higher)
    """
    from datetime import datetime

    now    = datetime.utcnow()
    scored = []

    for project in projects:
        project_skills = [ps.skill.name for ps in project.skills]

        # ── Skill score (0–40) ──────────────────────────────────────────────
        skill_ratio  = _skill_match_ratio(user_skills, project_skills)
        skill_score  = int(skill_ratio * 40)

        # ── Trust fit score (0–20) ──────────────────────────────────────────
        min_t = float(project.min_trust)
        if user_trust >= min_t:
            # Bonus for being slightly above minimum (sweet spot)
            gap          = user_trust - min_t
            trust_score  = 20 if gap <= 2.0 else max(0, 20 - int(gap * 2))
        else:
            trust_score  = 0   # can't apply, score 0

        # ── Recency score (0–20) ────────────────────────────────────────────
        age_hours    = (now - project.created_at.replace(tzinfo=None)).total_seconds() / 3600
        recency      = max(0, 20 - int(age_hours / 12))   # lose 1pt every 12h

        # ── Difficulty-trust alignment bonus (0–20) ─────────────────────────
        # Prefer projects whose difficulty level roughly matches trust level
        ideal_diff   = min(10, max(1, int(user_trust * 1.5)))
        diff_gap     = abs(project.difficulty - ideal_diff)
        diff_score   = max(0, 20 - diff_gap * 4)

        total = min(100, skill_score + trust_score + recency + diff_score)

        scored.append({
            "project":         project,
            "score":           total,
            "already_applied": str(project.id) in applied_ids,
        })

    # Sort: already-applied go last; then by score desc
    scored.sort(key=lambda x: (x["already_applied"], -x["score"]))
    return scored