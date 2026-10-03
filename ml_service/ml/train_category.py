import os
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report

from datasets.loader import load_or_download_clinc150
from ml.preprocessing import clean_text

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

def train_and_evaluate_category_models():
    print("--- Phase 4: Training & Evaluating Request Category Classifier ---")
    df = load_or_download_clinc150()
    
    # Preprocess text
    df["clean_text"] = df["text"].apply(clean_text)
    
    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "val"].copy()
    test_df = df[df["split"] == "test"].copy()

    # TF-IDF Vectorization
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )
    
    X_train = vectorizer.fit_transform(train_df["clean_text"])
    y_train = train_df["helpnet_category"]
    
    X_val = vectorizer.transform(val_df["clean_text"])
    y_val = val_df["helpnet_category"]

    X_test = vectorizer.transform(test_df["clean_text"])
    y_test = test_df["helpnet_category"]

    candidate_models = {
        "Logistic Regression": LogisticRegression(random_state=42, max_iter=1000),
        "Linear SVM": LinearSVC(random_state=42),
        "Naive Bayes": MultinomialNB()
    }

    comparison_results = {}
    best_model_name = None
    best_f1 = -1.0
    best_clf = None

    for name, clf in candidate_models.items():
        clf.fit(X_train, y_train)
        preds_val = clf.predict(X_val)
        
        acc = accuracy_score(y_val, preds_val)
        precision, recall, f1, _ = precision_recall_fscore_support(y_val, preds_val, average="weighted")

        comparison_results[name] = {
            "validation_accuracy": round(float(acc), 4),
            "validation_precision": round(float(precision), 4),
            "validation_recall": round(float(recall), 4),
            "validation_f1": round(float(f1), 4)
        }

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_clf = clf

    print(f"Best Model Selected: {best_model_name} (Val F1: {best_f1:.4f})")

    # Evaluate Best Model on UNTOUCHED Test Set
    test_preds = best_clf.predict(X_test)
    test_acc = accuracy_score(y_test, test_preds)
    test_p, test_r, test_f1, _ = precision_recall_fscore_support(y_test, test_preds, average="weighted")
    cm = confusion_matrix(y_test, test_preds)
    labels = list(np.unique(y_test))

    test_metrics = {
        "selected_model": best_model_name,
        "test_accuracy": round(float(test_acc), 4),
        "test_precision": round(float(test_p), 4),
        "test_recall": round(float(test_r), 4),
        "test_macro_f1": round(float(precision_recall_fscore_support(y_test, test_preds, average="macro")[2]), 4),
        "test_weighted_f1": round(float(test_f1), 4),
        "labels": labels,
        "confusion_matrix": cm.tolist(),
        "model_comparison": comparison_results
    }

    # Save artifact files
    joblib.dump(best_clf, os.path.join(MODELS_DIR, "category_model.joblib"))
    joblib.dump(vectorizer, os.path.join(MODELS_DIR, "category_vectorizer.joblib"))

    with open(os.path.join(REPORTS_DIR, "category_report.json"), "w") as f:
        json.dump(test_metrics, f, indent=2)

    metadata = {
        "model_version": "1.0.0",
        "model_type": best_model_name,
        "trained_at": pd.Timestamp.now().isoformat(),
        "dataset": "CLINC150 Benchmark (Mapped to HelpNet Categories)",
        "training_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "metrics": test_metrics
    }

    with open(os.path.join(MODELS_DIR, "category_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("Category model saved successfully.")
    return test_metrics

if __name__ == "__main__":
    train_and_evaluate_category_models()
