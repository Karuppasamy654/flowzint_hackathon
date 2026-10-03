# HelpNet AI — Model Training Pipeline

## Training Execution
Model training and evaluation is executed via:
```bash
python ml_service/train_and_eval.py
```

## Steps Executed
1. **Data Preprocessing**: Lowercasing, punctuation stripping, n-gram extraction (1-2).
2. **TF-IDF Vectorization**: Sublinear TF scaling, smooth IDF calculation, L2 normalization.
3. **Intent Model**: Candidate models (Softmax Centroid and Multinomial Naive Bayes) fitted on CLINC150 training split; Multinomial Naive Bayes selected via validation performance.
4. **Helper Ranking Model**: Supervised Pairwise Logistic Regression trained over pair features using Gradient Descent.
5. **Artifact Generation**: Serializes `.json` model parameters to `ml_service/models/` and evaluation reports to `ml_service/reports/`.
