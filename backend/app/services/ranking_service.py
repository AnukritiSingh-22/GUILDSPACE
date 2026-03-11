def calculate_score(user, project):
    """
    Simple AI-like ranking logic (MVP version)
    """

    # Convert comma-separated skills to sets
    user_skills = set(user.skills.split(","))
    project_skills = set(project.required_skills.split(","))

    # Skill match score
    skill_match = len(user_skills.intersection(project_skills))

    # Trust contribution
    trust_score = user.trust_score

    # Final weighted score
    score = (skill_match * 10) + (trust_score * 2)

    return score