# HelpNet AI — Complete Model Inventory

This document registers every Artificial Intelligence and Machine Learning model, classifier, ranker, and generative agent discovered in the repository.

---

## Model 1: Sublinear N-Gram TF-IDF Vectorizer

- **Identifier**: `PureTfidfVectorizer`
- **Implementation**: [`ml_service/ml/pure_ml.py`](file:///f:/helpnet/ml_service/ml/pure_ml.py)
- **Library / Dependencies**: Pure Python Standard Library (`math`, `re`, `string`, `json`) — Zero external C dependencies.
- **Task**: Text tokenization and feature extraction for request intent classification and request-helper profile similarity.
- **Input**: Raw text (request titles, descriptions, profile bios, skills).
- **Output**: L2 Euclidean-normalized sparse dictionary `{feature_index: tfidf_weight}`.
- **Hyperparameters**:
  - `ngram_range`: (1, 2) [unigrams + bigrams]
  - `min_df`: 2 (terms occurring fewer than 2 times across the corpus are pruned)
  - `sublinear_tf`: True ($1 + \log(\text{tf})$)
  - `smooth_idf`: True ($\log\frac{1 + N}{1 + \text{df}} + 1.0$)
- **Training Source**: Fit exclusively on 15,000 CLINC150 training split documents.
- **Saved Artifact**:
  - [`ml_service/models/category_vectorizer.json`](file:///f:/helpnet/ml_service/models/category_vectorizer.json) (725,918 bytes)
  - Vocabulary Size: 13,019 unique terms.
- **Status**: **VERIFIED WORKING**

---

## Model 2: Multinomial Naive Bayes Intent Classifier (Selected Production Model)

- **Identifier**: `PureNaiveBayesClassifier`
- **Implementation**: [`ml_service/ml/pure_ml.py`](file:///f:/helpnet/ml_service/ml/pure_ml.py)
- **Library / Dependencies**: Pure Python.
- **Task**: Multi-class categorization of incoming community assistance requests into 7 domains: `Cooking`, `Finance`, `Language Translation`, `Music`, `Other`, `Teaching`, `Web Dev`.
- **Mathematical Formulation**:
  - Class Log-Priors: $\log P(C) = \log\frac{N_c}{N}$
  - Laplace-Smoothed Word Log-Probabilities: $\log P(w \mid C) = \log\frac{\text{count}_{w,c} + 1.0}{\sum_w \text{count}_{w,c} + |V|}$
  - Calibrated Posterior: Temperature-normalized Softmax over log-scores.
- **Training Procedure**: Trained on 15,000 CLINC150 training samples mapped to HelpNet categories.
- **Validation Selection**: Evaluated on 3,000 validation samples — achieved **87.20% validation accuracy**, surpassing the Softmax Centroid model (76.30%).
- **Untouched Test Evaluation**:
  - **Accuracy**: **87.36%** (3,931 / 4,500 correct)
  - **Weighted F1**: **0.8470**
  - **Macro Precision**: **97.46%**
  - **Macro Recall**: **37.98%**
  - **Macro F1**: **0.4732**
- **Saved Artifact**: [`ml_service/models/category_model.json`](file:///f:/helpnet/ml_service/models/category_model.json) (2,957,327 bytes).
- **API Consumers**:
  - Python Microservice: `POST /predict/category` in [`ml_service/server.py`](file:///f:/helpnet/ml_service/server.py).
  - Next.js API: [`app/api/ai/predict-category/route.ts`](file:///f:/helpnet/app/api/ai/predict-category/route.ts).
- **Status**: **VERIFIED WORKING**

---

## Model 3: Softmax Centroid Classifier (Evaluated Candidate)

- **Identifier**: `PureCategoryClassifier`
- **Implementation**: [`ml_service/ml/pure_ml.py`](file:///f:/helpnet/ml_service/ml/pure_ml.py)
- **Library / Dependencies**: Pure Python.
- **Task**: Multi-class categorization candidate.
- **Mathematical Formulation**:
  - Class Centroids: Mean of training vectors per class, L2-normalized: $\mu_c = \frac{\sum_{i \in c} v_i}{\|\sum v_i\|_2}$.
  - Scoring: Cosine similarity scaled by temperature factor 5.0 with Softmax confidence.
- **Evaluation**: 76.30% validation accuracy / 82.56% test accuracy.
- **Role**: Preserved as candidate baseline in evaluation registry.
- **Status**: **VERIFIED WORKING (NOT SELECTED FOR PRODUCTION)**

---

## Model 4: Pointwise Logistic Regression Helper Ranking Model

- **Identifier**: `PureMatchingModel`
- **Implementation**: [`ml_service/ml/pure_ml.py`](file:///f:/helpnet/ml_service/ml/pure_ml.py)
- **Library / Dependencies**: Pure Python.
- **Task**: Rank candidate helpers based on a 4-dimensional feature vector:
  1. `skill_overlap` (0.0 to 1.0)
  2. `tfidf_similarity` (0.0 to 1.0)
  3. `location_match` (0.2 to 1.0)
  4. `helper_rating` (0.0 to 1.0)
- **Mathematical Formulation**:
  - Linear Logit: $z = \sum_{j=1}^4 w_j x_j + b$
  - Probability: $\sigma(z) = \frac{1}{1 + e^{-z}}$
  - Trained via Batch Gradient Descent minimizing Binary Cross-Entropy Loss ($lr=0.1$, $epochs=300$).
- **Learned Weights**:
  - $w = [2.5847, 1.6186, 0.3126, 0.1900]$
  - $b = -1.5992$
- **Training Data**: 800 synthetic interaction proxy records.
- **Test Performance**: 88.50% accuracy on 200 synthetic test samples.
- **Saved Artifact**: [`ml_service/models/matching_model.json`](file:///f:/helpnet/ml_service/models/matching_model.json).
- **API Consumers**: `POST /match` in [`ml_service/server.py`](file:///f:/helpnet/ml_service/server.py), called by [`app/api/requests/route.ts`](file:///f:/helpnet/app/api/requests/route.ts).
- **Audit Findings**:
  - Pointwise binary cross-entropy, mislabeled as "Pairwise" in earlier documentation.
  - Preprocessing rating normalization skew identified and harmonized.
- **Status**: **WORKING WITH LIMITATIONS (SYNTHETIC PROXY BENCHMARK)**

---

## Model 5: Heuristic Baseline Matcher

- **Identifier**: `PureBaselineMatcher`
- **Implementation**: [`ml_service/ml/pure_ml.py`](file:///f:/helpnet/ml_service/ml/pure_ml.py)
- **Task**: Rule-based benchmark comparator.
- **Scoring**: $0.4 \cdot \text{skill} + 0.3 \cdot \text{tfidf} + 0.2 \cdot \text{loc} + 0.1 \cdot \text{rating}$.
- **Performance**: 100.00% benchmark accuracy on the synthetic proxy dataset.
- **Status**: **VERIFIED WORKING**

---

## Model 6: Explainable AI Match Reason Generator

- **Identifier**: `generate_match_reasons`
- **Implementation**: [`ml_service/ml/pure_ml.py`](file:///f:/helpnet/ml_service/ml/pure_ml.py)
- **Task**: Generates deterministic, feature-attributed rationale strings for helper recommendations.
- **Status**: **VERIFIED WORKING**

---

## Model 7: Google Gemini 1.5 Flash Foundation LLM

- **Identifier**: `gemini-1.5-flash`
- **Implementation**: [`lib/gemini.ts`](file:///f:/helpnet/lib/gemini.ts)
- **Tasks**:
  - Request Enhancement & Clarity Scoring ([`/api/ai/enhance-request`](file:///f:/helpnet/app/api/ai/enhance-request/route.ts))
  - Content Safety Moderation ([`/api/ai/safety-check`](file:///f:/helpnet/app/api/ai/safety-check/route.ts))
  - Multilingual Translation ([`/api/ai/translate-message`](file:///f:/helpnet/app/api/ai/translate-message/route.ts))
  - Chat Reply Suggestions ([`/api/ai/suggest-replies`](file:///f:/helpnet/app/api/ai/suggest-replies/route.ts))
- **Status**: **VERIFIED WORKING**
