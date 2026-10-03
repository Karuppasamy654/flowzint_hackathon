"""
Pure Python HTTP Web Server for HelpNet AI ML Service.
Zero external framework dependencies. Implements standard REST API endpoints
handling JSON requests and responses over HTTP.
"""

import http.server
import socketserver
import json
import os
from urllib.parse import urlparse

from ml.pure_ml import (
    PureTfidfVectorizer, PureCategoryClassifier, PureNaiveBayesClassifier, PureMatchingModel,
    PureBaselineMatcher, compute_pair_features, generate_match_reasons, clean_text
)

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

# Model singletons
vectorizer = PureTfidfVectorizer()
category_classifier = PureCategoryClassifier(vectorizer)
matching_model = PureMatchingModel()
baseline_matcher = PureBaselineMatcher()

model_metadata = {}
classification_report = {}
matching_report = {}
feedback_records = []

def init_models():
    global vectorizer, category_classifier, matching_model, model_metadata, classification_report, matching_report
    try:
        vec_path = os.path.join(MODELS_DIR, "category_vectorizer.json")
        if os.path.exists(vec_path):
            with open(vec_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                vectorizer.vocabulary_ = {k: int(v) for k, v in data["vocabulary"].items()}
                vectorizer.idf_ = {k: float(v) for k, v in data["idf"].items()}
                vectorizer.min_df = data.get("min_df", 2)
                vectorizer.ngram_range = tuple(data.get("ngram_range", (1, 2)))

        cat_path = os.path.join(MODELS_DIR, "category_model.json")
        if os.path.exists(cat_path):
            with open(cat_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                mtype = data.get("model_type", "")
                if mtype == "multinomial_naive_bayes" or "class_priors" in data:
                    nb_instance = PureNaiveBayesClassifier(vectorizer)
                    nb_instance.classes_ = data["classes"]
                    nb_instance.class_priors = {c: float(v) for c, v in data["class_priors"].items()}
                    nb_instance.feature_log_probs = {
                        c: {int(k): float(v) for k, v in feats.items()}
                        for c, feats in data["feature_log_probs"].items()
                    }
                    category_classifier = nb_instance
                else:
                    cat_instance = PureCategoryClassifier(vectorizer)
                    cat_instance.classes_ = data["classes"]
                    cat_instance.class_centroids = {
                        c: {int(k): float(v) for k, v in cent.items()}
                        for c, cent in data["class_centroids"].items()
                    }
                    category_classifier = cat_instance

        match_path = os.path.join(MODELS_DIR, "matching_model.json")
        if os.path.exists(match_path):
            with open(match_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                matching_model.weights = [float(w) for w in data["weights"]]
                matching_model.bias = float(data["bias"])

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

        print("[OK] HelpNet AI ML Service models loaded successfully.")
    except Exception as e:
        print(f"Error initializing models: {e}")

class MLServiceHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._send_json({
                "status": "healthy",
                "service": "HelpNet AI ML Microservice",
                "model_loaded": len(category_classifier.classes_) > 0,
                "version": "1.0.0"
            })
        elif path == "/model/info":
            self._send_json(model_metadata if model_metadata else {"status": "metadata not loaded"})
        elif path == "/metrics":
            self._send_json({
                "classification": classification_report,
                "matching": matching_report,
                "model_version": model_metadata.get("model_version", "1.0.0")
            })
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def do_POST(self):
        path = urlparse(self.path).path
        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except Exception:
            self._send_json({"error": "Invalid JSON"}, status=400)
            return

        if path == "/predict/category":
            title = body.get("title", "")
            desc = body.get("description", "")
            combined_text = f"{title} {desc}"
            
            predicted_cat, conf = category_classifier.predict(combined_text)
            all_probas = category_classifier.predict_proba(combined_text)
            
            self._send_json({
                "category": predicted_cat,
                "confidence": conf,
                "model_version": "1.0.0",
                "probabilities": all_probas
            })

        elif path == "/match":
            title = body.get("title", "")
            desc = body.get("description", "")
            category = body.get("category", "")
            location = body.get("location", "")
            urgency = body.get("urgency", "flexible")
            helpers = body.get("helpers", [])

            req_dict = {
                "title": title,
                "description": desc,
                "category": category,
                "location": location,
                "urgency": urgency
            }

            results = []
            for h in helpers:
                h_dict = {
                    "skills": h.get("skills", []),
                    "bio": h.get("bio", ""),
                    "location": h.get("location", ""),
                    "rating": float(h.get("rating", 0.0))
                }
                feat_dict = compute_pair_features(req_dict, h_dict, vectorizer)
                score = matching_model.predict_score(feat_dict)
                reasons = generate_match_reasons(feat_dict, h.get("skills", []), category)

                results.append({
                    "helper_id": h.get("id"),
                    "score": score,
                    "reasons": reasons,
                    "features": feat_dict
                })

            results.sort(key=lambda x: x["score"], reverse=True)

            ranked_results = []
            for rank, r in enumerate(results, start=1):
                ranked_results.append({
                    "helper_id": r["helper_id"],
                    "rank": rank,
                    "score": r["score"],
                    "reasons": r["reasons"],
                    "features": r["features"]
                })

            self._send_json({
                "model_version": "1.0.0",
                "is_ml_ranking": True,
                "results": ranked_results
            })

        elif path == "/feedback":
            feedback_records.append(body)
            self._send_json({
                "status": "success",
                "message": "Interaction feedback recorded for future model retraining",
                "total_feedback_count": len(feedback_records)
            })

        else:
            self._send_json({"error": "Not Found"}, status=404)

def run_server():
    init_models()
    server_address = ("0.0.0.0", PORT)
    httpd = socketserver.TCPServer(server_address, MLServiceHandler)
    print(f"HelpNet AI ML Microservice running on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
