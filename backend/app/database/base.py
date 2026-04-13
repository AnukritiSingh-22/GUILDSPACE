# app/database/base.py
# ─────────────────────────────────────────────────────────────────────────────
# This file just imports every model so SQLAlchemy / Alembic can see them
# when create_all() or alembic autogenerate is called.
# ─────────────────────────────────────────────────────────────────────────────

from app.database.db import Base          # noqa: F401

# Import every model here
from app.models.user import User          # noqa: F401
from app.models.profile import Profile   # noqa: F401
from app.models.skill import Skill, UserSkill, ProjectSkill  # noqa: F401
from app.models.project import Project, ProjectQuestion       # noqa: F401
from app.models.application import Application, ApplicationAnswer  # noqa: F401
from app.models.trust import TrustEvent  # noqa: F401
from app.models.follow import Follow  # noqa
from app.models.notification import Notification  # noqa
from app.models.message import Message  # noqa