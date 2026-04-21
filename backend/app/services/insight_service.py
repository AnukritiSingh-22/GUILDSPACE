# app/services/insight_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Groq-powered AI insights with bulletproof error handling.
# If GROQ_API_KEY is missing or the call fails for any reason,
# falls back silently to a rule-based score — never throws / never returns
# an error string that gets shown as page content.
# ─────────────────────────────────────────────────────────────────────────────

import os
import json
import re
import logging

logger = logging.getLogger(__name__)

# ── Try importing httpx (comes with FastAPI default install) ──────────────────
try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    logger.warning("httpx not installed. Run: pip install httpx")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"  # Updated model name as per Groq's latest offerings


def _get_api_key() -> str:
    return os.getenv("GROQ_API_KEY", "").strip()


def _safe_json(text: str) -> dict:
    """Strip markdown fences then parse JSON. Returns {} on any failure."""
    if not text:
        return {}
    text = text.strip()
    # Remove ```json ... ``` fences
    text = re.sub(r"^```[a-z]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text.strip())
    try:
        return json.loads(text)
    except Exception:
        # Try to find the first {...} block
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass
    return {}


def _call_groq(prompt: str, max_tokens: int = 400) -> str:
    """
    Synchronous Groq call. Returns the assistant message text,
    or raises an exception if anything goes wrong.
    """
    api_key = _get_api_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in .env")

    if not HTTPX_AVAILABLE:
        raise ImportError("httpx package not installed")

    with httpx.Client(timeout=25.0) as client:
        resp = client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type":  "application/json",
            },
            json={
                "model":       GROQ_MODEL,
                "messages":    [{"role": "user", "content": prompt}],
                "temperature": 0.4,
                "max_tokens":  max_tokens,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


# ─────────────────────────────────────────────────────────────────────────────
# PROJECT INSIGHT — "Should I apply to this project?"
# ─────────────────────────────────────────────────────────────────────────────
def generate_project_insight(
    user_name:          str,
    user_trust:         float,
    user_level:         int,
    user_skills:        list,
    user_projects_done: int,
    project_title:      str,
    project_domain:     str,
    project_desc:       str,
    project_skills:     list,
    project_difficulty: int,
    project_min_trust:  float,
) -> dict:
    """
    Returns a dict with keys:
      should_apply, match_pct, headline, reasoning, skill_matches, skill_gaps, trust_note
    Never raises — falls back to rule-based scoring on any failure.
    """
    fallback = _fallback_project_insight(
        user_trust, user_skills, project_skills,
        project_min_trust, project_difficulty
    )

    api_key = _get_api_key()
    if not api_key:
        logger.info("No GROQ_API_KEY — using rule-based project insight")
        return fallback

    prompt = f"""You are an AI advisor on GuildSpace, a collaboration platform.
Evaluate whether the user should apply to this project.

USER:
- Name: {user_name}
- Trust score: {user_trust}/10 (earned by completing projects)
- Trust level: Level {user_level}
- Skills: {', '.join(user_skills) if user_skills else 'None listed'}
- Completed projects: {user_projects_done}

PROJECT:
- Title: {project_title}
- Domain: {project_domain}
- Description: {project_desc[:300]}
- Required skills: {', '.join(project_skills) if project_skills else 'Not specified'}
- Difficulty: {project_difficulty}/10
- Minimum trust required: {project_min_trust}

Be specific — reference the actual skill names and trust values above.
Do NOT give generic advice. This user, this project.

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "should_apply": true,
  "match_pct": 72,
  "headline": "Strong Python match but missing ML skills",
  "reasoning": "2-3 sentences citing specific skills and trust.",
  "skill_matches": ["Python", "React"],
  "skill_gaps": ["TensorFlow"],
  "trust_note": "One sentence about trust eligibility."
}}"""

    try:
        text   = _call_groq(prompt)
        result = _safe_json(text)
        # Validate required fields present
        if result.get("reasoning") and "match_pct" in result:
            return result
        logger.warning("Groq returned incomplete JSON for project insight; using fallback")
    except Exception as e:
        logger.warning(f"Groq project insight failed ({e}); using fallback")

    return fallback


def _fallback_project_insight(
    user_trust, user_skills, project_skills,
    project_min_trust, project_difficulty
) -> dict:
    user_lower    = {s.lower() for s in user_skills}
    project_lower = [s.lower() for s in project_skills]

    matched = [s for s in project_skills if s.lower() in user_lower]
    missing = [s for s in project_skills if s.lower() not in user_lower]

    if project_lower:
        match_pct = int((len(matched) / len(project_lower)) * 70)
    else:
        match_pct = 50

    trust_ok    = float(user_trust) >= float(project_min_trust)
    trust_bonus = min(30, int(((float(user_trust) - float(project_min_trust)) / max(float(project_min_trust), 1)) * 30)) if trust_ok else 0
    match_pct   = min(100, match_pct + trust_bonus)
    should_apply = trust_ok and match_pct >= 40

    if not trust_ok:
        trust_note = f"Your trust {user_trust} is below the required {project_min_trust}. Complete easier projects first."
    else:
        trust_note = f"Your trust {user_trust} meets the requirement of {project_min_trust}."

    parts = []
    if matched:
        parts.append(f"You match {len(matched)} required skill(s): {', '.join(matched[:3])}.")
    if missing:
        parts.append(f"Missing: {', '.join(missing[:3])}.")
    parts.append(trust_note)

    return {
        "should_apply":  should_apply,
        "match_pct":     match_pct,
        "headline":      "Good fit — consider applying" if should_apply else "Skill or trust gap",
        "reasoning":     " ".join(parts),
        "skill_matches": matched,
        "skill_gaps":    missing,
        "trust_note":    trust_note,
    }


# ─────────────────────────────────────────────────────────────────────────────
# APPLICANT INSIGHT — "Should I accept this applicant?"
# ─────────────────────────────────────────────────────────────────────────────
def generate_applicant_insight(
    applicant_name:     str,
    applicant_trust:    float,
    applicant_skills:   list,
    applicant_answers:  list,
    projects_done:      int,
    project_title:      str,
    project_skills:     list,
    project_min_trust:  float,
    project_difficulty: int,
) -> dict:
    """
    Returns a dict with keys:
      recommend_accept, fit_score, headline, reasoning, answer_quality, risk_flags
    Never raises.
    """
    fallback = _fallback_applicant_insight(
        applicant_trust, applicant_skills, project_skills, project_min_trust
    )

    api_key = _get_api_key()
    if not api_key:
        return fallback

    qa_text = ""
    for qa in applicant_answers[:3]:
        q = qa.get("question", "")
        a = qa.get("answer",   "")
        if q and a:
            qa_text += f"\nQ: {q}\nA: {a}\n"

    prompt = f"""You are an AI advisor on GuildSpace, a collaboration platform.
Evaluate whether the project creator should accept this applicant.

PROJECT: {project_title}
- Required skills: {', '.join(project_skills) if project_skills else 'Not specified'}
- Difficulty: {project_difficulty}/10
- Min trust: {project_min_trust}

APPLICANT: {applicant_name}
- Trust score: {applicant_trust}/10
- Skills: {', '.join(applicant_skills) if applicant_skills else 'None listed'}
- Projects completed: {projects_done}
- Answers:{qa_text if qa_text else ' (one-click apply — no written answers)'}

Be direct and specific. Cite actual skills and answer content.

Respond ONLY with valid JSON (no markdown):
{{
  "recommend_accept": true,
  "fit_score": 78,
  "headline": "Strong match with relevant experience",
  "reasoning": "2-3 sentences with specific evidence.",
  "answer_quality": "One sentence assessing written answers.",
  "risk_flags": []
}}"""

    try:
        text   = _call_groq(prompt)
        result = _safe_json(text)
        if result.get("reasoning") and "fit_score" in result:
            return result
        logger.warning("Groq returned incomplete JSON for applicant insight; using fallback")
    except Exception as e:
        logger.warning(f"Groq applicant insight failed ({e}); using fallback")

    return fallback


def _fallback_applicant_insight(
    applicant_trust, applicant_skills, project_skills, project_min_trust
) -> dict:
    user_lower    = {s.lower() for s in applicant_skills}
    project_lower = [s.lower() for s in project_skills]
    matched = [s for s in project_skills if s.lower() in user_lower]
    missing = [s for s in project_skills if s.lower() not in user_lower]

    fit = int((len(matched) / len(project_lower)) * 70) if project_lower else 50
    trust_ok = float(applicant_trust) >= float(project_min_trust)
    if trust_ok:
        fit = min(100, fit + 20)

    return {
        "recommend_accept": trust_ok and fit >= 50,
        "fit_score":        fit,
        "headline":         f"{'Strong' if fit >= 70 else 'Moderate'} match — {'eligible' if trust_ok else 'trust below minimum'}",
        "reasoning":        f"Matches {len(matched)}/{len(project_lower)} required skills. Trust {applicant_trust} {'meets' if trust_ok else 'is below'} minimum {project_min_trust}.",
        "answer_quality":   "Add GROQ_API_KEY to backend/.env for AI answer analysis.",
        "risk_flags":       [] if trust_ok else [f"Trust {applicant_trust} < required {project_min_trust}"],
    }