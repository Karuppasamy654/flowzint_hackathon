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
- **Mapping Methodology & Audit Findings**:
  - The CLINC150 dataset contains exactly 150 unique in-domain intents (30 test examples each = 4,500 test samples).
  - `clinc150_mapping.json` lists 63 intent entries. Forensic audit revealed that **17 of these entries** (e.g. `medical_advice`, `symptoms`, `mood`, `wellness`) do not exist in the official CLINC150 corpus, resulting in zero samples for `Medical` and `Mental Health`.
  - **46 entries** validly match official CLINC150 intents across 7 categories: `Other` (15 intents), `Finance` (12 intents), `Web Dev` (8 intents), `Cooking` (6 intents), `Language Translation` (2 intents), `Teaching` (2 intents), and `Music` (1 intent).
  - The remaining **104 CLINC150 intents** are unlisted in `clinc150_mapping.json` and default to `"Other"` via `INTENT_TO_HELPNET_CATEGORY.get(intent, "Other")`.
  - Consequently, the test split contains $450 + 3,120 = \mathbf{3,570}$ samples in `Other` (79.33%), while the 6 specific domains contain 930 samples (20.67%).
- **Zero-Leakage Assurance**: The TF-IDF vectorizer and both candidate classifiers are fitted exclusively on the training split. Model selection is performed exclusively on the validation split. The 4,500-sample test set remains untouched until final evaluation.

---

### 2. Matching Benchmark Dataset (Pairwise Helper Ranking)
- **Source**: Synthetic Proxy Benchmark Dataset (`random_state=42`).
- **Data Provenance**: Synthetic Proxy Benchmark Dataset — used for cold-start evaluation because sufficient labelled historical HelpNet interaction data is not yet available.
- **Size**: 800 training pairs / 200 test pairs.
- **Features**: `skill_overlap`, `tfidf_similarity`, `location_match`, `helper_rating`.
- **Target Label**: `accepted` (Binary label: 1 if request was accepted/completed by helper, 0 otherwise).
- **Future Learning Plan**: The application logs incoming interaction outcomes via `POST /feedback`. Future retraining will use this domain-specific feedback to evaluate and improve real-world matching performance.
