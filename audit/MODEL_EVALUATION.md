# HelpNet AI — Independent Model Evaluation & Replication Report

This report presents the independent, empirical recomputation of all evaluation metrics reported for HelpNet AI.

---

## 1. Intent Classification: Independent Metric Replication

The official untouched test split of 4,500 samples was evaluated using the fitted `PureNaiveBayesClassifier`.

| Metric | Reported Figure | Independently Recomputed | Status | Match Discrepancy |
| :--- | :---: | :---: | :---: | :---: |
| **Test Accuracy** | **87.36%** | **87.36%** (3,931 / 4,500) | **VERIFIED** | 0.00% |
| **Weighted F1 Score** | **0.8470** | **0.8470** | **VERIFIED** | 0.0000 |
| **Macro Recall** | **37.98%** | **37.98%** | **VERIFIED** | 0.00% |
| **Macro Precision** | **97.46%** | **97.46%** | **VERIFIED** | 0.00% |
| **Macro F1 Score** | **0.4732** | **0.4732** | **VERIFIED** | 0.0000 |

### Class-by-Class Breakdown (4,500 Test Samples)

| Category | True Samples (Support) | Correct (TP) | False Pos (FP) | False Neg (FN) | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cooking** | 180 | 78 | 1 | 102 | 98.73% | 43.33% | 0.6023 |
| **Finance** | 360 | 140 | 3 | 220 | 97.90% | 38.89% | 0.5567 |
| **Language Translation** | 60 | 4 | 0 | 56 | 100.00% | 6.67% | 0.1250 |
| **Music** | 30 | 3 | 0 | 27 | 100.00% | 10.00% | 0.1818 |
| **Other** | 3,570 | 3,566 | 564 | 4 | 86.34% | 99.89% | 0.9262 |
| **Teaching** | 60 | 7 | 0 | 53 | 100.00% | 11.67% | 0.2090 |
| **Web Dev** | 240 | 133 | 1 | 107 | 99.25% | 55.42% | 0.7112 |
| **TOTAL / OVERALL** | **4,500** | **3,931** | **569** | **569** | **Macro: 97.46%** | **Macro: 37.98%** | **Weighted: 0.8470** |

### Confusion Matrix (7 × 7)

```
                     Predicted Category
Actual Category      Cook   Fin   Lang   Mus   Other  Teach  WebDev
-------------------------------------------------------------------
Cooking                78     0      0     0     101      0       1
Finance                 0   140      0     0     220      0       0
Language Translation    0     0      4     0      56      0       0
Music                   0     0      0     3      27      0       0
Other                   1     3      0     0   3,566      0       0
Teaching                0     0      0     0      53      7       0
Web Dev                 0     0      0     0     107      0     133
```

### Scientific Finding on Metric Discrepancy & Macro Recall
- **Why is Precision so high (97.46%)?** When Naive Bayes predicts a specific category like `Language Translation`, `Music`, or `Teaching`, it is virtually 100% correct.
- **Why is Recall low (37.98%)?** The dominant `Other` class (79.33% prior probability) pulls ambiguous or short utterances toward `Other`. 563 out of the 569 false negatives were categorized as `Other`.
- **Verdict**: The reported figures (**87.36% accuracy, 0.8470 weighted F1, 37.98% macro recall**) are completely authentic, mathematically verified, and reflect the real empirical performance of Naive Bayes under this benchmark distribution.

---

## 2. Helper Matching Model Performance

- **Evaluated Split**: 200 held-out synthetic test pairs.
- **Learned Logistic Model Benchmark Accuracy**: **88.50%** (177 / 200 correct predictions).
- **Heuristic Baseline Accuracy**: **100.00%** (200 / 200 correct predictions).
- **Assessment**: The synthetic data generation perfectly matches the heuristic weights, giving the baseline 100% accuracy. The learned model successfully captures the synthetic decision boundary to 88.50% accuracy. Real user retraining is required for meaningful post-cold-start benchmarking.
