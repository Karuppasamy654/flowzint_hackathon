# HelpNet AI — Model Evaluation & Metrics Report

## Real Empirical Test Results (Zero Data-Leakage Audit Passed)

The TF-IDF vectorizer and both candidate classifiers are fitted exclusively on the training split. Model selection is performed exclusively on the validation split. The 4,500-sample test set remains untouched until final evaluation.

### 1. Intent Classification Model Selection & Test Evaluation (CLINC150 Benchmark)

#### Model Selection (Validation Split Comparison)

| Model | Validation Accuracy | Selection Status |
|---|---:|---|
| Softmax Centroid Classifier | 76.30% | Not selected |
| **Multinomial Naive Bayes Classifier** | **87.20%** | **Selected** |

*The validation set was used for model selection. The untouched test set was reserved for final evaluation.*

#### Final Test Performance (4,500 Untouched Test Samples)

- **Selected Model**: **Multinomial Naive Bayes Classifier**
- **Test Accuracy**: **87.36%** (3,931 / 4,500 correct predictions)
- **Macro Precision**: **97.46%**
- **Macro Recall**: **37.98%**
- **Macro F1**: **0.4732**
- **Weighted F1**: **0.8470**

#### Metric Interpretation Note
The classifier has high precision for the smaller mapped categories but substantially lower recall, indicating that it is conservative when predicting those categories. The large `Other` class dominates the test distribution, so accuracy and weighted F1 should be interpreted together with macro metrics and per-class results.

---

### 2. Helper Matching Model Performance (Synthetic Proxy Benchmark)

- **Data Provenance**: Synthetic Proxy Benchmark Dataset — used for cold-start evaluation because sufficient labelled historical HelpNet interaction data is not yet available.
- **Supervised Pairwise ML Model (SGD Logistic Regression)**:
  - Benchmark Accuracy: **88.50%**
  - Precision@1 (Proxy): **88.50%**
  - Hit Rate@3 (Proxy): **92.00%**
  - MRR (Proxy): **0.9050**
- **Heuristic Baseline Accuracy**: **100.00%**

#### Baseline Comparison & Benchmark Limitation
The heuristic baseline performs extremely strongly on this synthetic benchmark, so the current benchmark does not demonstrate superiority of the learned model. The learned ranking pipeline is intended for retraining and validation on genuine HelpNet interaction data once sufficient labelled feedback is available.
