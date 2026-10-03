import re
import string

def clean_text(text: str) -> str:
    """
    Normalizes text for NLP feature extraction.
    - Converts to lowercase
    - Removes punctuation
    - Strips whitespace
    """
    if not text:
        return ""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()
    return text

def extract_skills_from_text(text: str, candidate_skills: list) -> list:
    """
    Extracts matches from candidate skills present in normalized text.
    """
    cleaned = clean_text(text)
    matched = []
    for skill in candidate_skills:
        skill_clean = clean_text(skill)
        if skill_clean in cleaned:
            matched.append(skill)
    return matched
