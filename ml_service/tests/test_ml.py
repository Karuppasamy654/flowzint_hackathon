import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.pure_ml import (
    PureTfidfVectorizer, PureCategoryClassifier, PureMatchingModel,
    PureBaselineMatcher, compute_pair_features, clean_text
)

def test_preprocessing():
    assert clean_text("  Hello World!  ") == "hello world"
    assert clean_text("") == ""

def test_vectorizer_and_classifier():
    docs = [
        "Need help fixing React frontend website code",
        "Leaking water pipe under kitchen sink",
        "Electrician needed for circuit breaker panel"
    ]
    labels = ["Web Dev", "Plumbing", "Electrician"]

    vec = PureTfidfVectorizer()
    vec.fit(docs)
    clf = PureCategoryClassifier(vec)
    clf.fit(docs, labels)

    pred, conf = clf.predict("React bug fix on website")
    assert pred == "Web Dev"
    assert conf > 0.0

def test_matching_model():
    req = {
        "title": "Fix React website",
        "description": "Frontend bug in React component",
        "category": "Web Dev",
        "location": "Downtown"
    }
    helper = {
        "skills": ["Web Dev", "Design"],
        "bio": "Expert React and Next.js developer",
        "location": "Downtown",
        "rating": 4.8
    }
    feats = compute_pair_features(req, helper)
    assert feats["skill_overlap"] == 1.0
    assert feats["location_match"] == 1.0

    model = PureMatchingModel()
    score = model.predict_score(feats)
    assert 0.0 <= score <= 1.0

def test_naive_bayes_serialization_and_reloading():
    from ml.pure_ml import PureNaiveBayesClassifier
    docs = [
        "Need help fixing React frontend website code",
        "Leaking water pipe under kitchen sink",
        "Electrician needed for circuit breaker panel"
    ]
    labels = ["Web Dev", "Plumbing", "Electrician"]

    vec = PureTfidfVectorizer().fit(docs)
    clf = PureNaiveBayesClassifier(vec)
    clf.fit(docs, labels)

    pred1, conf1 = clf.predict("React bug fix on website")

    # Serialize & reload
    import json
    data = {
        "model_type": "multinomial_naive_bayes",
        "classes": clf.classes_,
        "class_priors": clf.class_priors,
        "feature_log_probs": {c: {str(k): v for k, v in feats.items()} for c, feats in clf.feature_log_probs.items()}
    }
    loaded_data = json.loads(json.dumps(data))

    reloaded_clf = PureNaiveBayesClassifier(vec)
    reloaded_clf.classes_ = loaded_data["classes"]
    reloaded_clf.class_priors = {c: float(v) for c, v in loaded_data["class_priors"].items()}
    reloaded_clf.feature_log_probs = {c: {int(k): float(v) for k, v in feats.items()} for c, feats in loaded_data["feature_log_probs"].items()}

    pred2, conf2 = reloaded_clf.predict("React bug fix on website")

    assert pred1 == pred2 == "Web Dev"
    assert abs(conf1 - conf2) < 1e-6

