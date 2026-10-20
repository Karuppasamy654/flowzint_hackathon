# HelpNet AI — Verified Defects & Corrective Actions Log

This document tracks all defects, inconsistencies, and edge-case bugs identified during the empirical audit, along with their root causes, corrective actions, and verification evidence.

---

## Defect 1: Rating Feature Preprocessing Skew

- **Severity**: Medium (Statistical Feature Drift)
- **Component**: [`ml_service/datasets/loader.py`](file:///f:/helpnet/ml_service/datasets/loader.py) and [`ml_service/train_and_eval.py`](file:///f:/helpnet/ml_service/train_and_eval.py)
- **Defect Description**:
  - In `loader.py` and `train_and_eval.py`, training normalized `helper_rating` via:
    `float((row["helper_rating"] - 3.5) / 1.5)`
  - In `ml/pure_ml.py` (`compute_pair_features`), inference normalized `helper_rating` via:
    `min(1.0, max(0.0, helper_rating / 5.0))`
  - A helper with rating 4.5 had feature value $0.6667$ at training time, but $0.9000$ at inference time.
- **Root Cause**: Inconsistent feature scaling formula between synthetic dataset generation and inference preprocessing.
- **Correction Applied**: Updated `loader.py` and `train_and_eval.py` to use `helper_rating / 5.0` consistently across training, evaluation, and inference.
- **Verification**: Verified via `pytest` and re-running `train_and_eval.py`. Weights now reflect identical scale.

---

## Defect 2: Startup Crash in Legacy `ml_service/main.py`

- **Severity**: High (Service Unusable)
- **Component**: [`ml_service/main.py`](file:///f:/helpnet/ml_service/main.py)
- **Defect Description**:
  - `main.py` crashed on startup with `KeyError: 'class_centroids'` when loading the trained `category_model.json`.
  - Windows console crashed with `UnicodeEncodeError: 'charmap' codec can't encode character '\u2705'`.
- **Root Cause**:
  - `main.py` was hardcoded to load the old Softmax Centroid model structure, whereas `train_and_eval.py` selected and saved the Naive Bayes model (`class_priors`, `feature_log_probs`).
- **Correction Applied**:
  - Updated `main.py` to detect `model_type` and instantiate `PureNaiveBayesClassifier` or `PureCategoryClassifier` dynamically.
  - Replaced Unicode emoji with ASCII `[OK]` logging.
- **Verification**: Executed `python -c "from main import load_models_on_startup; load_models_on_startup()"` — outputs `[OK] Models, Metadata, and Reports loaded successfully into FastAPI service.` with exit code 0.

---

## Defect 3: Desynchronized Root Models and Reports

- **Severity**: Medium (Data Drift in UI)
- **Component**: Root [`models/`](file:///f:/helpnet/models) and [`reports/`](file:///f:/helpnet/reports)
- **Defect Description**:
  - Root `models/category_model.json` was the older Centroid model (82.56%), while `ml_service/models/category_model.json` was the Naive Bayes model (87.36%).
  - Next.js serverless routes (`/api/ml/*`) import from the root directories, serving stale reports to the Admin ML Dashboard.
- **Root Cause**: Model retraining saved artifacts to `ml_service/models` without updating the root application directories.
- **Correction Applied**: Synchronized all updated models (`category_model.json`, `metadata.json`, `matching_model.json`) and evaluation reports (`classification_report.json`, `confusion_matrix.json`, `matching_report.json`) to the root directories.
- **Verification**: Next.js build verified; `/api/ml/metrics` now serves the verified 87.36% Naive Bayes evaluation reports.

---

## Defect 4: Disconnected ML Feedback Collection Hook

- **Severity**: Low (Missed Telemetry)
- **Component**: [`app/api/requests/[id]/accept/route.ts`](file:///f:/helpnet/app/api/requests/%5Bid%5D/accept/route.ts)
- **Defect Description**:
  - The ML client included `recordMLFeedback()`, and the microservice exposed `POST /feedback`, but the request acceptance handler never invoked it.
- **Root Cause**: Hook was implemented on the client and server sides but never called from the API route.
- **Correction Applied**: Added an asynchronous `recordMLFeedback(...)` call within the acceptance handler to log accepted helper IDs and predicted match scores.
- **Verification**: Verified via Next.js type-checking and production build.

---

## Defect 5: Broken Legacy Script `train_category.py`

- **Severity**: Low (Legacy Script Failure)
- **Component**: [`ml_service/ml/train_category.py`](file:///f:/helpnet/ml_service/ml/train_category.py)
- **Defect Description**: Failed with `ModuleNotFoundError: No module named 'datasets'` and attempted DataFrame operations on a `PureDataset` object.
- **Correction Applied**: Added `sys.path` insertion, converted `dataset.rows` into a `pandas.DataFrame`, and documented it as a secondary scikit-learn reference script.
- **Verification**: Script imports and runs cleanly.
