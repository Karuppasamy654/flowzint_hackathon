# HelpNet AI 🤝

> **Subtitle**: Intelligent Community Assistance and ML-Based Human-Need Matching Platform  
> **Tagline**: *"Describe your need. Understand the request. Find the right person."*

HelpNet AI transforms community assistance by coupling modern peer-to-peer web infrastructure with a **genuine, end-to-end Machine Learning & AI pipeline**.

---

## 🌟 Core Features

- **NLP Request Intent Classification**: Automatically classifies user help descriptions into service domains (`Web Dev`, `Plumbing`, `Electrician`, `Finance`, `Medical`, `Teaching`, `Cooking`, etc.).
- **ML Helper Ranking**: Pairwise feature engineering (`skill_overlap`, `tfidf_similarity`, `location_match`, `helper_rating`) powered by a trained Logistic Regression ranking model.
- **Explainable AI Matching**: Feature-derived reasons explaining why each helper was recommended.
- **Feedback Collection Loop**: Logs interaction outcomes for future model retraining.
- **Real-Time WebSockets**: Instant updates via Supabase Realtime broadcast.
- **Admin ML Dashboard**: Full model evaluation metrics inspection at `/admin/ml` and `/admin/ml/models`.

---

## 🏗️ System Architecture

```
                 USER
                  |
                  v
          NEXT.JS WEBSITE
                  |
                  v
           HELP REQUEST
                  |
                  v
          NEXT.JS API
                  |
                  v
         PYTHON FASTAPI / HTTP (Port 8000)
                  |
      +-----------+-----------+
      |                       |
      v                       v
REQUEST CLASSIFIER       HELPER MATCHING
|                       |
v                       v
Category/Intent        ML Ranking Score
|                       |
+-----------+-----------+
|
v
TOP-K HELPERS
|
v
EXPLANATION
|
v
HELPNET DATABASE
|
v
USER FEEDBACK
|
v
FUTURE MODEL TRAINING
```

---

## 📊 Dataset & Benchmark Provenance

1. **CLINC150 Benchmark Corpus** (`https://github.com/clinc/oos-eval`):
   - Used for training and evaluating the NLP intent classification model.
   - 22,500 utterances across 150 intents mapped systematically to HelpNet categories.
   - 15,000 Train / 3,000 Val / 4,500 Test samples.
2. **HelpNet Interaction Schema**:
   - Pairwise interaction features evaluated against actual helper acceptance outcomes.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Existing Backend**: Next.js API Routes, MongoDB Atlas, Mongoose, NextAuth.js v5.
- **Realtime**: Supabase Realtime WebSockets.
- **ML Microservice**: Python 3, Pure Python ML Algorithms / FastAPI HTTP Server, Pytest.

---

## 🚀 Quick Start & Running Locally

### 1. Install Dependencies
```bash
# Node.js dependencies
npm install

# Python ML environment tests
pytest ml_service/tests
```

### 2. Train Models & Generate Artifacts
```bash
python ml_service/train_and_eval.py
```

### 3. Start Python ML Service (Port 8000)
```bash
python ml_service/server.py
```

### 4. Start Next.js Application (Port 3000)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application and [http://localhost:3000/admin/ml](http://localhost:3000/admin/ml) for the ML Admin Dashboard.

---

## 🧪 Testing

```bash
# Run Python unit tests
pytest ml_service/tests
```

---

## 📂 Documentation

Detailed technical documentation is available in `docs/`:
- [`docs/ML_ARCHITECTURE.md`](file:///f:/helpnet/docs/ML_ARCHITECTURE.md)
- [`docs/DATASET.md`](file:///f:/helpnet/docs/DATASET.md)
- [`docs/MODEL_TRAINING.md`](file:///f:/helpnet/docs/MODEL_TRAINING.md)
- [`docs/MODEL_EVALUATION.md`](file:///f:/helpnet/docs/MODEL_EVALUATION.md)
- [`docs/API.md`](file:///f:/helpnet/docs/API.md)
