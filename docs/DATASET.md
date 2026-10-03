# HelpNet AI — Dataset Documentation & Provenance

## Dataset Provenance Overview

### 1. CLINC150 Benchmark Dataset (Request Intent Classification)
- **Source**: Public OOS Evaluation Dataset ([https://github.com/clinc/oos-eval](https://github.com/clinc/oos-eval))
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Size**: 22,500 total utterances across 150 original intent classes.
- **Splits**:
  - Train: 15,000 samples
  - Validation: 3,000 samples
  - Test: 4,500 samples (Untouched during vectorizer fitting and model selection)
- **Mapping File**: `ml_service/datasets/clinc150_mapping.json`
- **Mapping Methodology**: All 150 CLINC150 intents are mapped deterministically to 7 active HelpNet domain service categories (`Cooking`, `Finance`, `Language Translation`, `Music`, `Teaching`, `Web Dev`, and `Other` for remaining general intents). No categories or samples were silently discarded.
- **Zero-Leakage Assurance**: The TF-IDF vectorizer and both candidate classifiers are fitted exclusively on the training split. Model selection is performed exclusively on the validation split. The 4,500-sample test set remains untouched until final evaluation.

---

### 2. Matching Benchmark Dataset (Pairwise Helper Ranking)
- **Source**: Synthetic Proxy Benchmark Dataset (`random_state=42`).
- **Data Provenance**: Synthetic Proxy Benchmark Dataset — used for cold-start evaluation because sufficient labelled historical HelpNet interaction data is not yet available.
- **Size**: 800 training pairs / 200 test pairs.
- **Features**: `skill_overlap`, `tfidf_similarity`, `location_match`, `helper_rating`.
- **Target Label**: `accepted` (Binary label: 1 if request was accepted/completed by helper, 0 otherwise).
- **Future Learning Plan**: The application logs incoming interaction outcomes via `POST /feedback`. Future retraining will use this domain-specific feedback to evaluate and improve real-world matching performance.
