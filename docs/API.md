# HelpNet AI — REST API Documentation

## Endpoints Summary (Base URL: `http://localhost:8000`)

### `GET /health`
Returns service status and whether models are active.
```json
{
  "status": "healthy",
  "service": "HelpNet AI ML Microservice",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### `POST /predict/category`
Request:
```json
{
  "title": "Need help fixing React component state bug",
  "description": "I need a developer to look at my frontend code"
}
```
Response:
```json
{
  "category": "Web Dev",
  "confidence": 0.8542,
  "model_version": "1.0.0",
  "probabilities": { ... }
}
```

### `POST /match`
Request:
```json
{
  "title": "Leaking kitchen sink pipe",
  "description": "Water dripping heavily under sink",
  "category": "Plumbing",
  "location": "Downtown",
  "helpers": [
    {
      "id": "hlp_1",
      "skills": ["Plumbing"],
      "bio": "Licensed plumber 5 years experience",
      "location": "Downtown",
      "rating": 4.9
    }
  ]
}
```
Response:
```json
{
  "model_version": "1.0.0",
  "is_ml_ranking": true,
  "results": [
    {
      "helper_id": "hlp_1",
      "rank": 1,
      "score": 0.942,
      "reasons": ["Direct skill match in Plumbing", "Located in or near your neighborhood", "Excellent community helper rating"],
      "features": { "skill_overlap": 1.0, "tfidf_similarity": 0.45, "location_match": 1.0, "helper_rating": 0.98 }
    }
  ]
}
```

### `POST /feedback`
Collects accepted/completed interaction outcomes for future model retraining.
