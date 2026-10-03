# HelpNet AI - Data Dictionary

| Feature Name | Type | Description | Domain/Values |
|---|---|---|---|
| `request_text` | String | Combined title and description of the user request | Free text |
| `request_category` | Categorical | HelpNet service domain category | Web Dev, Design, Plumbing, Electrician, Teaching, Medical, Legal, Cooking, Carpentry, Mental Health, Music, Finance, Language Translation, Other |
| `urgency` | Categorical | Priority level specified by the seeker | `flexible`, `today`, `urgent` |
| `request_location` | String | Location/neighborhood of seeker | Free text |
| `helper_skills` | List[String] | Array of skills declared in helper profile | Subset of SKILL_CATEGORIES |
| `helper_bio` | String | Self-described biography of helper | Free text |
| `helper_rating` | Float | Average historical rating of helper | 0.0 - 5.0 |
| `helper_location` | String | Primary neighborhood/city of helper | Free text |
| `skill_overlap` | Float | Jaccard / Count overlap between request category/skills and helper skills | 0.0 - 1.0 |
| `tfidf_similarity` | Float | Cosine similarity between TF-IDF vector of request_text and helper_bio + skills | 0.0 - 1.0 |
| `location_match` | Float | Exact or substring token match score for location proximity | 0.0 - 1.0 |
| `accepted` | Binary Target | Label indicating if pair was accepted/completed | 0 or 1 |
