"""
FastAPI REST API Service for HelpNet AI ML Models.
Exposes endpoints for Health, Model Info, Metrics, Category Classification, Helper Matching, and Feedback Collection.
"""

import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml.pure_ml import (
    PureTfidfVectorizer, PureCategoryClassifier, PureMatchingModel,
    PureBaselineMatcher, compute_pair_features, generate_match_reasons, clean_text
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

app = FastAPI(
    title="HelpNet AI Machine Learning Service",
    version="1.0.0",
    description="Microservice providing real ML intent classification, pair feature ranking, and explainable recommendations."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory model instances loaded on startup
vectorizer = PureTfidfVectorizer()
category_classifier = PureCategoryClassifier(vectorizer)
matching_model = PureMatchingModel()
baseline_matcher = PureBaselineMatcher()
model_metadata = {}
classification_report = {}
matching_report = {}
feedback_records = []

@app.on_event("startup")
def load_models_on_startup():
    global vectorizer, category_classifier, matching_model, model_metadata, classification_report, matching_report
    try:
        # Load Vectorizer
        vec_path = os.path.join(MODELS_DIR, "category_vectorizer.json")
        if os.path.exists(vec_path):
            with open(vec_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                vectorizer.vocabulary_ = {k: int(v) for k, v in data["vocabulary"].items()}
                vectorizer.idf_ = {k: float(v) for k, v in data["idf"].items()}
                vectorizer.min_df = data.get("min_df", 2)
                vectorizer.ngram_range = tuple(data.get("ngram_range", (1, 2)))

        # Load Category Model
        cat_path = os.path.join(MODELS_DIR, "category_model.json")
        if os.path.exists(cat_path):
            with open(cat_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                category_classifier.classes_ = data["classes"]
                category_classifier.class_centroids = {
                    c: {int(k): float(v) for k, v in cent.items()}
                    for c, cent in data["class_centroids"].items()
                }

        # Load Matching Model
        match_path = os.path.join(MODELS_DIR, "matching_model.json")
        if os.path.exists(match_path):
            with open(match_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                matching_model.weights = [float(w) for w in data["weights"]]
                matching_model.bias = float(data["bias"])

        # Load Reports and Metadata
        meta_path = os.path.join(MODELS_DIR, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                model_metadata = json.load(f)

        creport_path = os.path.join(REPORTS_DIR, "classification_report.json")
        if os.path.exists(creport_path):
            with open(creport_path, "r", encoding="utf-8") as f:
                classification_report = json.load(f)

        mreport_path = os.path.join(REPORTS_DIR, "matching_report.json")
        if os.path.exists(mreport_path):
            with open(mreport_path, "r", encoding="utf-8") as f:
                matching_report = json.load(f)

        print("✅ Models, Metadata, and Reports loaded successfully into FastAPI service.")
    except Exception as e:
        print(f"Error loading models on startup: {e}")

# --- Pydantic Schemas ---
class PredictCategoryRequest(BaseModel):
    title: str
    description: str

class CategoryResponse(BaseModel):
    category: str
    confidence: float
    model_version: str
    probabilities: dict

class HelperCandidate(BaseModel):
    id: str
    name: Optional[str] = ""
    skills: List[str]
    bio: Optional[str] = ""
    location: Optional[str] = ""
    rating: Optional[float] = 0.0

class MatchRequest(BaseModel):
    title: str
    description: str
    category: str
    urgency: Optional[str] = "flexible"
    location: str
    helpers: List[HelperCandidate]

class RankedHelperResult(BaseModel):
    helper_id: str
    rank: int
    score: float
    reasons: List[str]
    features: dict

class MatchResponse(BaseModel):
    model_version: str
    is_ml_ranking: bool
    results: List[RankedHelperResult]

class FeedbackRequest(BaseModel):
    request_id: str
    helper_id: str
    predicted_score: float
    accepted: bool
    completed: Optional[bool] = False
    rating: Optional[float] = None

# --- REST Endpoints ---
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HelpNet AI ML Microservice",
        "model_loaded": len(category_classifier.classes_) > 0,
        "version": "1.0.0"
    }

@app.get("/model/info")
def get_model_info():
    return model_metadata if model_metadata else {"status": "metadata not loaded"}

@app.get("/metrics")
def get_metrics():
    return {
        "classification": classification_report,
        "matching": matching_report,
        "model_version": model_metadata.get("model_version", "1.0.0")
    }

@app.post("/predict/category", response_model=CategoryResponse)
def predict_category(req: PredictCategoryRequest):
    combined_text = f"{req.title} {req.description}"
    predicted_cat, conf = category_classifier.predict(combined_text)
    all_probas = category_classifier.predict_proba(combined_text)
    
    return CategoryResponse(
        category=predicted_cat,
        confidence=conf,
        model_version="1.0.0",
        probabilities=all_probas
    )

@app.post("/match", response_model=MatchResponse)
def rank_helpers(req: MatchRequest):
    req_dict = {
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "location": req.location,
        "urgency": req.urgency
    }

    results = []
    for h in req.helpers:
        h_dict = {
            "skills": h.skills,
            "bio": h.bio or "",
            "location": h.location or "",
            "rating": h.rating or 0.0
        }
        
        feat_dict = compute_pair_features(req_dict, h_dict, vectorizer)
        score = matching_model.predict_score(feat_dict)
        reasons = generate_match_reasons(feat_dict, h.skills, req.category)

        results.append({
            "helper_id": h.id,
            "score": score,
            "reasons": reasons,
            "features": feat_dict
        })

    # Sort descending by predicted ML score
    results.sort(key=lambda x: x["score"], reverse=True)

    ranked_results = []
    for rank, r in enumerate(results, start=1):
        ranked_results.append(
            RankedHelperResult(
                helper_id=r["helper_id"],
                rank=rank,
                score=r["score"],
                reasons=r["reasons"],
                features=r["features"]
            )
        )

    return MatchResponse(
        model_version="1.0.0",
        is_ml_ranking=True,
        results=ranked_results
    )

@app.post("/feedback")
def collect_feedback(feedback: FeedbackRequest):
    feedback_records.append(feedback.dict())
    return {
        "status": "success",
        "message": "Interaction feedback recorded for future model retraining",
        "total_feedback_count": len(feedback_records)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
