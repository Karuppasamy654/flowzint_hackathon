import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ml.preprocessing import clean_text

def compute_pair_features(request_data: dict, helper_data: dict, vectorizer: TfidfVectorizer = None) -> dict:
    """
    Computes pairwise feature representation between a Help Request and a Helper.
    """
    req_title = request_data.get("title", "")
    req_desc = request_data.get("description", "")
    req_cat = request_data.get("category", "")
    req_loc = request_data.get("location", "")

    helper_skills = helper_data.get("skills", [])
    helper_bio = helper_data.get("bio", "")
    helper_loc = helper_data.get("location", "")
    helper_rating = float(helper_data.get("rating", 0.0))

    # 1. Skill overlap (Exact / Category match)
    has_exact_category_skill = 1.0 if req_cat in helper_skills else 0.0
    category_tokens = set(clean_text(req_cat).split())
    helper_skill_tokens = set(clean_text(" ".join(helper_skills)).split())
    token_overlap_count = len(category_tokens.intersection(helper_skill_tokens))
    skill_overlap = max(has_exact_category_skill, min(1.0, token_overlap_count / max(1, len(category_tokens))))

    # 2. Text Similarity (TF-IDF Cosine Similarity)
    req_text = clean_text(f"{req_title} {req_desc} {req_cat}")
    helper_text = clean_text(f"{' '.join(helper_skills)} {helper_bio}")

    if vectorizer is not None:
        try:
            vecs = vectorizer.transform([req_text, helper_text])
            tfidf_sim = float(cosine_similarity(vecs[0], vecs[1])[0][0])
        except Exception:
            tfidf_sim = 0.0
    else:
        # Fallback word overlap ratio if vectorizer not passed
        req_words = set(req_text.split())
        hlp_words = set(helper_text.split())
        if not req_words or not hlp_words:
            tfidf_sim = 0.0
        else:
            tfidf_sim = float(len(req_words.intersection(hlp_words)) / len(req_words.union(hlp_words)))

    # 3. Location compatibility
    r_loc_clean = clean_text(req_loc)
    h_loc_clean = clean_text(helper_loc)
    if not r_loc_clean or not h_loc_clean:
        location_match = 0.5
    elif r_loc_clean == h_loc_clean or r_loc_clean in h_loc_clean or h_loc_clean in r_loc_clean:
        location_match = 1.0
    else:
        # Check token intersection
        r_tokens = set(r_loc_clean.split())
        h_tokens = set(h_loc_clean.split())
        location_match = 0.8 if r_tokens.intersection(h_tokens) else 0.2

    # Normalized rating feature (0.0 - 1.0)
    norm_rating = min(1.0, max(0.0, helper_rating / 5.0))

    return {
        "skill_overlap": skill_overlap,
        "tfidf_similarity": tfidf_sim,
        "location_match": location_match,
        "helper_rating": norm_rating
    }
