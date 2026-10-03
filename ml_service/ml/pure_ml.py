"""
Pure Python ML algorithms implementation for TF-IDF Vectorization,
Naive Bayes & Centroid Intent Classifiers, Supervised Pairwise Logistic Regression,
Pair Feature Extraction, Scoring, Explanations, and Metrics Evaluation.

Zero external C/compiled dependencies required. Full precision ML pipeline.
"""

import math
import re
import string
import json
import os

# ----------------------------------------------------
# 1. Text Preprocessing & Tokenization
# ----------------------------------------------------
def clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    return re.sub(r"\s+", " ", text).strip()

def get_ngrams(tokens: list, min_n=1, max_n=2) -> list:
    ngrams = []
    n_tokens = len(tokens)
    for n in range(min_n, max_n + 1):
        for i in range(n_tokens - n + 1):
            ngrams.append(" ".join(tokens[i:i + n]))
    return ngrams

# ----------------------------------------------------
# 2. Pure Python TF-IDF Vectorizer
# ----------------------------------------------------
class PureTfidfVectorizer:
    def __init__(self, min_df=1, ngram_range=(1, 2)):
        self.min_df = min_df
        self.ngram_range = ngram_range
        self.vocabulary_ = {}
        self.idf_ = {}

    def fit(self, raw_documents):
        doc_counts = {}
        N = len(raw_documents)
        
        for doc in raw_documents:
            tokens = clean_text(doc).split()
            ngrams = set(get_ngrams(tokens, self.ngram_range[0], self.ngram_range[1]))
            for term in ngrams:
                doc_counts[term] = doc_counts.get(term, 0) + 1

        vocab = [term for term, count in doc_counts.items() if count >= self.min_df]
        vocab.sort()
        self.vocabulary_ = {term: idx for idx, term in enumerate(vocab)}
        
        for term in vocab:
            df = doc_counts[term]
            self.idf_[term] = math.log((1 + N) / (1 + df)) + 1.0

        return self

    def transform_doc(self, doc: str) -> dict:
        tokens = clean_text(doc).split()
        ngrams = get_ngrams(tokens, self.ngram_range[0], self.ngram_range[1])
        tf_raw = {}
        for term in ngrams:
            if term in self.vocabulary_:
                tf_raw[term] = tf_raw.get(term, 0) + 1

        vector = {}
        norm_sq = 0.0
        for term, count in tf_raw.items():
            tf = 1.0 + math.log(count)
            val = tf * self.idf_[term]
            vector[self.vocabulary_[term]] = val
            norm_sq += val * val

        norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        return {idx: val / norm for idx, val in vector.items()}

    def transform(self, raw_documents) -> list:
        return [self.transform_doc(doc) for doc in raw_documents]

def cosine_similarity_dict(v1: dict, v2: dict) -> float:
    dot = 0.0
    for idx, val in v1.items():
        if idx in v2:
            dot += val * v2[idx]
    return dot

# ----------------------------------------------------
# 3. Pure Python Multiclass Intent Classifiers
# ----------------------------------------------------
class PureCategoryClassifier:
    """Softmax Centroid Classifier"""
    def __init__(self, vectorizer: PureTfidfVectorizer):
        self.vectorizer = vectorizer
        self.class_centroids = {}
        self.classes_ = []

    def fit(self, raw_documents: list, y_labels: list):
        self.classes_ = sorted(list(set(y_labels)))
        doc_vectors = self.vectorizer.transform(raw_documents)
        
        class_vec_sums = {c: {} for c in self.classes_}
        class_counts = {c: 0 for c in self.classes_}

        for vec, label in zip(doc_vectors, y_labels):
            class_counts[label] += 1
            for idx, val in vec.items():
                class_vec_sums[label][idx] = class_vec_sums[label].get(idx, 0.0) + val

        for c in self.classes_:
            cnt = max(1, class_counts[c])
            centroid = {idx: val / cnt for idx, val in class_vec_sums[c].items()}
            norm_sq = sum(v * v for v in centroid.values())
            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            self.class_centroids[c] = {idx: v / norm for idx, v in centroid.items()}

    def predict_proba(self, raw_document: str) -> dict:
        vec = self.vectorizer.transform_doc(raw_document)
        scores = {}
        for c in self.classes_:
            sim = cosine_similarity_dict(vec, self.class_centroids[c])
            scores[c] = math.exp(sim * 5.0)
            
        total = sum(scores.values())
        if total == 0:
            return {c: 1.0 / len(self.classes_) for c in self.classes_}
        return {c: round(v / total, 4) for c, v in scores.items()}

    def predict(self, raw_document: str) -> tuple:
        probas = self.predict_proba(raw_document)
        best_cat = max(probas.items(), key=lambda x: x[1])
        return best_cat[0], best_cat[1]

class PureNaiveBayesClassifier:
    """Multinomial Naive Bayes Classifier"""
    def __init__(self, vectorizer: PureTfidfVectorizer):
        self.vectorizer = vectorizer
        self.class_priors = {}
        self.feature_log_probs = {}
        self.classes_ = []

    def fit(self, raw_documents: list, y_labels: list):
        self.classes_ = sorted(list(set(y_labels)))
        N = len(y_labels)
        doc_vectors = self.vectorizer.transform(raw_documents)
        vocab_size = len(self.vectorizer.vocabulary_)

        class_word_counts = {c: {} for c in self.classes_}
        class_total_words = {c: 0.0 for c in self.classes_}

        for vec, label in zip(doc_vectors, y_labels):
            self.class_priors[label] = self.class_priors.get(label, 0) + 1
            for idx, val in vec.items():
                class_word_counts[label][idx] = class_word_counts[label].get(idx, 0.0) + val
                class_total_words[label] += val

        for c in self.classes_:
            self.class_priors[c] = math.log(self.class_priors[c] / N)
            self.feature_log_probs[c] = {}
            denom = class_total_words[c] + vocab_size
            for idx in self.vectorizer.vocabulary_.values():
                count = class_word_counts[c].get(idx, 0.0)
                self.feature_log_probs[c][idx] = math.log((count + 1.0) / denom)

    def predict(self, raw_document: str) -> tuple:
        vec = self.vectorizer.transform_doc(raw_document)
        log_scores = {}
        for c in self.classes_:
            score = self.class_priors[c]
            for idx, val in vec.items():
                score += val * self.feature_log_probs[c].get(idx, -10.0)
            log_scores[c] = score

        best_cat = max(log_scores.items(), key=lambda x: x[1])
        return best_cat[0], round(math.exp(max(-10, min(0, best_cat[1]))), 4)

# ----------------------------------------------------
# 4. Pair Feature Extraction
# ----------------------------------------------------
def compute_pair_features(request_data: dict, helper_data: dict, vectorizer: PureTfidfVectorizer = None) -> dict:
    req_title = request_data.get("title", "")
    req_desc = request_data.get("description", "")
    req_cat = request_data.get("category", "")
    req_loc = request_data.get("location", "")

    helper_skills = helper_data.get("skills", [])
    helper_bio = helper_data.get("bio", "")
    helper_loc = helper_data.get("location", "")
    helper_rating = float(helper_data.get("rating", 0.0))

    has_exact_category_skill = 1.0 if req_cat in helper_skills else 0.0
    category_tokens = set(clean_text(req_cat).split())
    helper_skill_tokens = set(clean_text(" ".join(helper_skills)).split())
    token_overlap_count = len(category_tokens.intersection(helper_skill_tokens))
    skill_overlap = max(has_exact_category_skill, min(1.0, token_overlap_count / max(1, len(category_tokens))))

    req_text = clean_text(f"{req_title} {req_desc} {req_cat}")
    helper_text = clean_text(f"{' '.join(helper_skills)} {helper_bio}")

    if vectorizer is not None:
        try:
            v1 = vectorizer.transform_doc(req_text)
            v2 = vectorizer.transform_doc(helper_text)
            tfidf_sim = float(cosine_similarity_dict(v1, v2))
        except Exception:
            tfidf_sim = 0.0
    else:
        req_words = set(req_text.split())
        hlp_words = set(helper_text.split())
        if not req_words or not hlp_words:
            tfidf_sim = 0.0
        else:
            tfidf_sim = float(len(req_words.intersection(hlp_words)) / len(req_words.union(hlp_words)))

    r_loc_clean = clean_text(req_loc)
    h_loc_clean = clean_text(helper_loc)
    if not r_loc_clean or not h_loc_clean:
        location_match = 0.5
    elif r_loc_clean == h_loc_clean or r_loc_clean in h_loc_clean or h_loc_clean in r_loc_clean:
        location_match = 1.0
    else:
        r_tokens = set(r_loc_clean.split())
        h_tokens = set(h_loc_clean.split())
        location_match = 0.8 if r_tokens.intersection(h_tokens) else 0.2

    norm_rating = min(1.0, max(0.0, helper_rating / 5.0))

    return {
        "skill_overlap": round(float(skill_overlap), 4),
        "tfidf_similarity": round(float(tfidf_sim), 4),
        "location_match": round(float(location_match), 4),
        "helper_rating": round(float(norm_rating), 4)
    }

# ----------------------------------------------------
# 5. Pure Python Supervised Logistic Regression Matching Model
# ----------------------------------------------------
class PureMatchingModel:
    """Supervised Pairwise Logistic Regression with Gradient Descent"""
    def __init__(self):
        # Initial weights before SGD optimization
        self.weights = [0.0, 0.0, 0.0, 0.0]
        self.bias = 0.0

    def fit(self, X_features: list, y_labels: list, lr=0.1, epochs=300):
        N = len(X_features)
        if N == 0:
            return
        
        # Reset weights for SGD optimization
        self.weights = [0.5, 0.5, 0.5, 0.5]
        self.bias = -1.0
        
        for _ in range(epochs):
            dw = [0.0] * 4
            db = 0.0
            for feat, label in zip(X_features, y_labels):
                z = sum(w * f for w, f in zip(self.weights, feat)) + self.bias
                sig = 1.0 / (1.0 + math.exp(-max(-10, min(10, z))))
                err = sig - label
                for j in range(4):
                    dw[j] += err * feat[j]
                db += err
                
            for j in range(4):
                self.weights[j] -= lr * (dw[j] / N)
            self.bias -= lr * (db / N)

    def predict_score(self, feature_dict: dict) -> float:
        feat = [
            feature_dict.get("skill_overlap", 0.0),
            feature_dict.get("tfidf_similarity", 0.0),
            feature_dict.get("location_match", 0.0),
            feature_dict.get("helper_rating", 0.0)
        ]
        z = sum(w * f for w, f in zip(self.weights, feat)) + self.bias
        prob = 1.0 / (1.0 + math.exp(-max(-15, min(15, z))))
        return round(float(prob), 4)

# ----------------------------------------------------
# 6. Baseline Matcher
# ----------------------------------------------------
class PureBaselineMatcher:
    def predict_score(self, feature_dict: dict) -> float:
        score = (
            0.4 * feature_dict.get("skill_overlap", 0.0) +
            0.3 * feature_dict.get("tfidf_similarity", 0.0) +
            0.2 * feature_dict.get("location_match", 0.0) +
            0.1 * feature_dict.get("helper_rating", 0.0)
        )
        return round(float(score), 4)

# ----------------------------------------------------
# 7. Explanation Generator
# ----------------------------------------------------
def generate_match_reasons(feature_dict: dict, helper_skills: list, req_category: str) -> list:
    reasons = []
    if feature_dict.get("skill_overlap", 0.0) >= 0.8:
        reasons.append(f"Direct skill match in {req_category}")
    elif feature_dict.get("skill_overlap", 0.0) > 0.3:
        reasons.append(f"Has related skills: {', '.join(helper_skills[:2])}")

    if feature_dict.get("tfidf_similarity", 0.0) >= 0.35:
        reasons.append("High contextual text relevance to request description")

    if feature_dict.get("location_match", 0.0) >= 0.8:
        reasons.append("Located in or near your neighborhood")

    if feature_dict.get("helper_rating", 0.0) >= 0.8:
        reasons.append("Excellent community helper rating")

    if not reasons:
        reasons.append("Available helper in community directory")

    return reasons
