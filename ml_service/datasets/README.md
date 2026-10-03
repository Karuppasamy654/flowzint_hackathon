# HelpNet AI Datasets

## Overview
HelpNet AI utilizes real public benchmark datasets alongside domain-specific schemas for training, evaluation, and baseline comparisons.

---

## DATASET 1: CLINC150 (Benchmark Intent Classification)
- **Source**: [https://github.com/clinc/oos-eval](https://github.com/clinc/oos-eval)
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Purpose**: Public benchmark dataset used for developing, tuning, and evaluating the natural language request intent classification pipeline.
- **Records**: 22,500 total utterances (15,000 in-scope across 150 intent classes + out-of-scope utterances).
- **Splits**: 
  - Train: 15,000
  - Validation: 3,000
  - Test: 4,500
- **Disclaimer**: CLINC150 is used strictly as a benchmark dataset for standard NLP intent classification evaluation. Production HelpNet categories (e.g. Web Dev, Plumbing, Electrician) are mapped systematically from intent clusters.

---

## DATASET 2: HELPNET DOMAIN DATASET
- **Source**: HelpNet Application Database (`HelpRequest` and `User` entities).
- **Purpose**: Pairwise request-helper matching and ranking.
- **Features**:
  - `request_id`, `helper_id`
  - `request_text`, `request_category`, `urgency`, `request_location`
  - `helper_skills`, `helper_bio`, `helper_location`, `helper_rating`
  - `skill_overlap`, `tfidf_similarity`, `location_match`, `category_match`
  - `accepted` (Binary label: 1 if request was accepted by helper / successfully completed, 0 otherwise)
- **Cold-Start Strategy**: When genuine interaction records are sparse (< 100 interaction records), a heuristic baseline match model calculates deterministic compatibility scores, while logging incoming interactions for future retraining.

---

## DATASET 3: MOVIELENS (Recommendation Benchmark - Reference)
- **Source**: [https://grouplens.org/datasets/movielens/](https://grouplens.org/datasets/movielens/)
- **License**: Non-commercial usage license from GroupLens.
- **Purpose**: Offline study of collaborative filtering and ranking metrics (Precision@K, MRR).
