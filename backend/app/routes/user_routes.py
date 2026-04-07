# app/routes/user_routes.py
# ─────────────────────────────────────────────────────────────────────────────
# All user-related endpoints:
#   POST /api/auth/signup     — create account + profile
#   POST /api/auth/login      — authenticate, return JWT
#   GET  /api/users/me        — fetch logged-in user's full data
#   PUT  /api/users/me        — update profile fields
#   PUT  /api/users/me/skills — replace user's skill list
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.skill import Skill, UserSkill
from app.models.trust import TrustEvent
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse
from app.schemas.user import MeResponse, ProfileUpdate, SkillOut
from app.utils.auth import hash_password, verify_password, create_access_token
from app.utils.helpers import make_initials, compute_trust_level
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/signup
# Creates a user, profile, and gives a signup trust bonus
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/auth/signup", response_model=TokenResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):

    # 1. Check email not already taken
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Create user with hashed password
    user = User(
        email    = payload.email,
        password = hash_password(payload.password),
    )
    db.add(user)
    db.flush()   # flush so user.id is available before commit

    # 3. Create profile (one-to-one with user)
    initials = make_initials(payload.full_name)
    profile  = Profile(
        user_id   = user.id,
        full_name = payload.full_name,
        initials  = initials,
        role      = payload.role,
        city      = payload.city,
        college   = payload.college,
        trust_score = 1.0,
        trust_level = 1,
    )
    db.add(profile)

    # 4. Record signup trust bonus event
    trust_event = TrustEvent(
        user_id    = user.id,
        event_type = "signup_bonus",
        delta      = 1.0,
        reason     = "Welcome to GildSpace!",
    )
    db.add(trust_event)
    db.commit()
    db.refresh(user)

    # 5. Return JWT
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token = token,
        user_id      = str(user.id),
        email        = user.email,
        full_name    = profile.full_name,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):

    # 1. Find user by email
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 2. Verify password against bcrypt hash
    if not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # 3. Return JWT
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token = token,
        user_id      = str(user.id),
        email        = user.email,
        full_name    = user.profile.full_name if user.profile else "",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/users/me
# Returns the full profile + skills for the logged-in user
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/users/me", response_model=MeResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session        = Depends(get_db),
):
    # Eagerly load skills
    user_skills = (
        db.query(Skill)
        .join(UserSkill, Skill.id == UserSkill.skill_id)
        .filter(UserSkill.user_id == current_user.id)
        .all()
    )
    return {
        "id":         current_user.id,
        "email":      current_user.email,
        "profile":    current_user.profile,
        "skills":     user_skills,
        "created_at": current_user.created_at,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/users/me
# Update editable profile fields
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/users/me", response_model=MeResponse)
def update_profile(
    payload:      ProfileUpdate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Only update fields that were actually sent
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    # Recompute initials if name changed
    if "full_name" in update_data:
        profile.initials = make_initials(profile.full_name)

    db.commit()
    db.refresh(current_user)

    user_skills = (
        db.query(Skill)
        .join(UserSkill, Skill.id == UserSkill.skill_id)
        .filter(UserSkill.user_id == current_user.id)
        .all()
    )
    return {
        "id":         current_user.id,
        "email":      current_user.email,
        "profile":    profile,
        "skills":     user_skills,
        "created_at": current_user.created_at,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/users/me/skills
# Replace the user's entire skill list
# Body: { "skills": ["Python", "ML", "NLP"] }
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/users/me/skills", response_model=List[SkillOut])
def update_skills(
    payload:      dict,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    skill_names: List[str] = payload.get("skills", [])

    # 1. Remove all existing user skills
    db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()

    # 2. Upsert each skill name into the master skills table
    result = []
    for name in skill_names:
        name = name.strip()
        if not name:
            continue
        skill = db.query(Skill).filter(Skill.name == name).first()
        if not skill:
            skill = Skill(name=name)
            db.add(skill)
            db.flush()
        db.add(UserSkill(user_id=current_user.id, skill_id=skill.id))
        result.append(skill)

    db.commit()
    return result