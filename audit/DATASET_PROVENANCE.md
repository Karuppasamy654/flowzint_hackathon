# HelpNet AI — Dataset Authenticity & Provenance Audit

This report documents the authenticity, provenance, licensing, integrity, and split characteristics of all data used across the HelpNet AI machine learning pipeline.

---

## 1. Dataset Inventory & Provenance Classification

| Dataset Name | File Path | Provenance Classification | SHA-256 Hash | Records |
| :--- | :--- | :--- | :--- | :--- |
| **CLINC150 Intent Benchmark** | `ml_service/datasets/clinc150_full.json` | **A. VERIFIED OFFICIAL DATA** | `36923c3705a59e08fe9c3883d8bc2dd966ef93e22cb78ac41171782a698d56e0` | 23,700 total (15,000 train / 3,000 val / 4,500 test + 1,200 OOS) |
| **CLINC150 Category Mapping** | `ml_service/datasets/clinc150_mapping.json` | **B. VERIFIED TRANSFORMATION** | `85dfba91b8d5a76985bb049e2dc11dc7541f92e1cefb6717f91754ff3da574d7` | 150 intents mapped to 7 HelpNet domains |
| **HelpNet Interaction Proxy** | `generate_helpnet_matching_dataset()` | **D. SYNTHETIC OR AI-GENERATED** | *In-memory algorithmic generation* (seed 42) | 1,000 records (800 train / 200 test) |

---

## 2. Deep Dive: CLINC150 Benchmark Dataset

### Provenance & Citation
- **Title**: An Evaluation Dataset for Intent Classification and Out-of-Scope Prediction
- **Authors**: Stefan Larson, Anish Mahendran, Joseph J. Peper, Christopher Clarke, Andrew Lee, Parker Hill, Jonathan K. Kummerfeld, Kevin Leach, Michael A. Laurenzano, Lingjia Tang, Jason Mars
- **Publisher**: CLINC, Inc. & University of Michigan (EMNLP 2019)
- **Official Repository**: `https://github.com/clinc/oos-eval`
- **UCI Machine Learning Repository Entry**: `https://archive.ics.uci.edu/dataset/570/clinc150`
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)

### Empirical File Hash Verification
```
Official Upstream Hash: 36923c3705a59e08fe9c3883d8bc2dd966ef93e22cb78ac41171782a698d56e0
Local Repository Hash:   36923c3705a59e08fe9c3883d8bc2dd966ef93e22cb78ac41171782a698d56e0
Exact Match Status:     TRUE (100% Byte-for-byte exact match)
```

### Official Splits vs. Local Counts
- **In-Domain Training**: 15,000 samples (100 per intent × 150 intents)
- **In-Domain Validation**: 3,000 samples (20 per intent × 150 intents)
- **In-Domain Testing**: 4,500 samples (30 per intent × 150 intents)
- **Out-of-Scope (OOS)**: 100 train / 100 val / 1,000 test.
  *Audit Note*: OOS samples (`data['oos_test']`) are **NOT** merged into the in-domain test split. The 4,500 test samples are strictly the in-domain split of CLINC150.

### Forensic Intent Mapping Analysis (`clinc150_mapping.json`)
- **Total entries in file**: 63 intents
- **Valid intents matching official CLINC150 corpus**: **46 intents**
- **Non-existent / hallucinated entries in mapping file**: **17 intents** (`medical_advice`, `health_warning`, `symptoms`, `wellness`, `worry`, `mood`, `ping_device`, `wifi`, `spend_history`, `ingredients`, `song`, `audiobook`, `music`, `artist`, `math`, `dictionary`, `oil_change`).
  - *Impact*: Because `medical_advice`, `symptoms`, `mood`, etc. do not exist in CLINC150, zero samples were mapped to `Medical` or `Mental Health`. These two categories never materialized in the training or evaluation data.
- **Valid Category Intent Allocations**:
  - `Other`: 15 intents ($15 \times 30 = \mathbf{450}$ test samples)
  - `Finance`: 12 intents ($12 \times 30 = \mathbf{360}$ test samples)
  - `Web Dev`: 8 intents ($8 \times 30 = \mathbf{240}$ test samples)
  - `Cooking`: 6 intents ($6 \times 30 = \mathbf{180}$ test samples)
  - `Language Translation`: 2 intents ($2 \times 30 = \mathbf{60}$ test samples)
  - `Teaching`: 2 intents ($2 \times 30 = \mathbf{60}$ test samples)
  - `Music`: 1 intent (`play_music`) ($1 \times 30 = \mathbf{30}$ test samples)
- **Unmapped Intents Fallback**:
  - $150 - 46 = \mathbf{104}$ official CLINC150 intents are not present in the mapping dictionary.
  - In `ml_service/datasets/loader.py`, `INTENT_TO_HELPNET_CATEGORY.get(intent, "Other")` defaults all unmapped intents to `"Other"`.
  - $104 \text{ intents} \times 30 \text{ samples} = \mathbf{3,120}$ test samples assigned to `"Other"`.
- **Total Test Samples in Other**:
  $$\mathbf{450} \text{ (from mapped intents)} + \mathbf{3,120} \text{ (from unmapped intents)} = \mathbf{3,570} \text{ samples (79.33\%)}$$

### Category Distribution Under HelpNet Domain Mapping

```
Category              Train Count      Val Count     Test Count     Total
-------------------------------------------------------------------------
Other                     11,900          2,380          3,570     17,850  (79.33%)
Finance                    1,200            240            360      1,800   (8.00%)
Web Dev                      800            160            240      1,200   (5.33%)
Cooking                      600            120            180        900   (4.00%)
Language Translation         200             40             60        300   (1.33%)
Teaching                     200             40             60        300   (1.33%)
Music                        100             20             30        150   (0.67%)
-------------------------------------------------------------------------
TOTAL                     15,000          3,000          4,500     22,500 (100.00%)
```

---

## 3. Data Leakage & Contamination Audit

An exhaustive exact-match search was conducted across cleaned text representations between all three splits:

- **Train vs. Test Exact Duplicates**: **25 items** out of 4,500 test samples (0.55%).
- **Train vs. Validation Exact Duplicates**: **21 items** out of 3,000 validation samples (0.70%).
- **Root Cause**: These are short generic conversational expressions present in the official upstream CLINC150 dataset published by Larson et al. (e.g. `"later"`, `"i need my account frozen"`, `"whats your name"`, `"see you later"`, `"does applebees have good reviews"`, `"absolutely"`, `"hi how are you"`, `"bye"`, `"no that is wrong"`, `"hola"`).
- **Leakage Finding**: **ZERO leakage was introduced by HelpNet project preprocessing.** Preprocessing strictly isolates fitting of vocabulary and priors to the training split.

---

## 4. Deep Dive: HelpNet Interaction Proxy Dataset

- **Origin**: Procedural cold-start generation in [`ml_service/datasets/loader.py`](file:///f:/helpnet/ml_service/datasets/loader.py).
- **Generation Rule**:
  $$\text{prob} = 0.4 \cdot \text{skill} + 0.3 \cdot \text{tfidf} + 0.2 \cdot \text{loc} + 0.1 \cdot \text{rating}$$
  $$\text{accepted} = \begin{cases} 1 & \text{if prob} > 0.5 \\ 0 & \text{otherwise} \end{cases}$$
- **Provenance Classification**: **D. SYNTHETIC OR AI-GENERATED**
- **Evaluation Validity**: Documented as a synthetic cold-start benchmark. The heuristic baseline achieves 100% accuracy because the dataset generation function mirrors the baseline weighting formula.
