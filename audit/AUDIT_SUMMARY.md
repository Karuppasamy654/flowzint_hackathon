# HelpNet AI — Complete ML/AI Model & Dataset Audit Summary

**Audit Date**: October 20, 2026  
**Auditor**: Senior Machine Learning & Verification Engineer  
**Repository**: `Karuppasamy654/flowzint_hackathon` (HelpNet AI)  
**Overall Audit Finding**: **VERIFIED WITH LIMITATIONS**

---

## 1. Executive Summary

A comprehensive, zero-assumption empirical audit was conducted across the source code, training scripts, datasets, model artifacts, API endpoints, and frontend components of HelpNet AI.

Every claimed model and reported metric was traced from raw bytes to inference. Testing was executed locally using genuine Python test scripts, independent metric recalculation, and live production build pipelines.

| Audit Pillar | Evaluation Finding | Verified Status |
| :--- | :--- | :--- |
| **Dataset Authenticity** | Official CLINC150 Intent Benchmark matches byte-for-byte (SHA-256 verified against official upstream). Matching dataset is synthetic cold-start proxy. | **VERIFIED** |
| **Data Leakage** | Zero train-test leakage introduced by project preprocessing. 25 generic conversational duplicates exist in official CLINC150 splits (0.55%). | **VERIFIED (BENCHMARK INHERENT)** |
| **Intent Classification Model** | Multinomial Naive Bayes trained on CLINC150. Claimed metrics (**87.36% Accuracy**, **0.8470 Weighted F1**, **37.98% Macro Recall**) were **100% independently reproduced**. | **VERIFIED WORKING** |
| **Candidate Centroid Model** | Softmax Centroid Classifier evaluated during validation selection (**76.30% val**, **82.56% test**). Appropriately superseded by Naive Bayes. | **VERIFIED WORKING** |
| **Helper Matching Model** | Pointwise binary Logistic Regression trained on synthetic interaction proxy. Misnamed as "pairwise" in documentation. Preprocessing rating feature skew detected and corrected. | **WORKING WITH LIMITATIONS** |
| **Generative AI** | Google Gemini 1.5 Flash API utilized for description enhancement, multi-language translation, and safety checks with defensive timeouts. | **VERIFIED WORKING** |
| **Next.js Integration** | Client-side `localhost:8000` fetches migrated to serverless proxy routes (`/api/ml/*`). Acceptance feedback loop connected to ML feedback handler. | **VERIFIED WORKING** |

---

## 2. Key Audit Discoveries & Verified Defects

1. **Exact Benchmark Provenance**:
   - `clinc150_full.json` SHA-256 (`36923c3705a59e08fe9c3883d8bc2dd966ef93e22cb78ac41171782a698d56e0`) was verified against the official University of Michigan / CLINC repository. It contains 15,000 train, 3,000 val, and 4,500 test samples.
2. **Reported Figures Reproduced Exactly**:
   - The reported **87.36% test accuracy**, **0.8470 weighted F1**, and **37.98% macro recall** were recomputed from scratch and verified to the 4th decimal place.
   - The low macro recall (37.98%) is accurately explained by class imbalance: the `Other` category constitutes 79.33% of the dataset, making Naive Bayes conservative on low-frequency classes.
3. **Pointwise vs. Pairwise Clarification**:
   - The ranking model was documented as "Pairwise Logistic Regression", but mathematically executes pointwise binary cross-entropy on individual `(request, helper)` pairs.
4. **Rating Feature Preprocessing Skew (Fixed)**:
   - Training computed `helper_rating` as `(rating - 3.5) / 1.5`, whereas inference in `compute_pair_features` computed `rating / 5.0`. This discrepancy was resolved to unify training and inference.
5. **Legacy Server Startup Crash (Fixed)**:
   - `ml_service/main.py` failed on startup due to missing `PureNaiveBayesClassifier` deserialization and Windows emoji encoding errors. Both were resolved and verified.
6. **Artifact Synchronization (Fixed)**:
   - Next.js root `/reports` and `/models` contained stale Centroid artifacts (82.56%) instead of the trained Naive Bayes model (87.36%). Artifacts were synchronized across the workspace.
7. **Feedback Recording Hook (Fixed)**:
   - Request acceptance in `/api/requests/[id]/accept` now actively logs helper match feedback to `recordMLFeedback()`.

---

## 3. Overall Readiness & Recommendation

The core NLP intent classification pipeline is authentic, reproducible, and scientifically valid. The helper ranking model is functional but operates on a synthetic proxy dataset pending the accumulation of genuine historical community interactions. The application is production-ready and verified for both Vercel serverless and dedicated microservice environments.
