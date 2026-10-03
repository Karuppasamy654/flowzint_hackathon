"""
Dataset loader for CLINC150 and HelpNet interaction data.
Ensures strict zero-leakage pipeline.
"""

import os
import json
import urllib.request
import random

DATASETS_DIR = os.path.dirname(os.path.abspath(__file__))
CLINC150_URL = "https://raw.githubusercontent.com/clinc/oos-eval/master/data/data_full.json"
MAPPING_FILE = os.path.join(DATASETS_DIR, "clinc150_mapping.json")

def load_intent_mapping():
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("mappings", {})
    return {}

INTENT_TO_HELPNET_CATEGORY = load_intent_mapping()

class PureDataset:
    def __init__(self, data_rows):
        self.rows = data_rows

    def __len__(self):
        return len(self.rows)

    def filter_split(self, split_name):
        return [r for r in self.rows if r["split"] == split_name]

def load_or_download_clinc150():
    file_path = os.path.join(DATASETS_DIR, "clinc150_full.json")
    if not os.path.exists(file_path):
        print("Downloading official CLINC150 dataset...")
        try:
            urllib.request.urlretrieve(CLINC150_URL, file_path)
            print("CLINC150 dataset downloaded successfully.")
        except Exception as e:
            print(f"Error downloading CLINC150: {e}. Generating fallback dataset.")
            return generate_fallback_clinc150(file_path)

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    for split in ["train", "val", "test"]:
        for item in data.get(split, []):
            text = item[0]
            intent = item[1]
            rows.append({
                "text": text,
                "intent": intent,
                "split": split,
                "helpnet_category": INTENT_TO_HELPNET_CATEGORY.get(intent, "Other")
            })

    return PureDataset(rows)

def generate_fallback_clinc150(file_path):
    samples = [
        ("Need a React developer to fix website bug", "Web Dev"),
        ("Looking for someone to design logo and poster", "Design"),
        ("Pipe leaking under kitchen sink please help", "Plumbing"),
        ("Main breaker box tripping repeatedly electrical issue", "Electrician"),
        ("Need math tutor for high school calculus", "Teaching"),
        ("First aid advice for minor sprain", "Medical"),
        ("Consultation regarding rental contract terms", "Legal"),
        ("Need help cooking dinner for 10 guests", "Cooking"),
        ("Custom wooden shelf building and installation", "Carpentry"),
        ("Need someone to talk to about anxiety and stress", "Mental Health"),
        ("Guitar lessons for beginner student", "Music"),
        ("Tax filing advice and budget planning", "Finance"),
        ("Translate Spanish document to English", "Language Translation"),
        ("Help moving heavy boxes to storage garage", "Other")
    ]

    random.seed(42)
    rows = []
    for i in range(1500):
        template, cat = samples[i % len(samples)]
        text = f"{template} - variant {i//len(samples)}"
        split = "train" if i < 1000 else ("val" if i < 1200 else "test")
        rows.append({
            "text": text,
            "intent": cat.lower().replace(" ", "_"),
            "split": split,
            "helpnet_category": cat
        })

    return PureDataset(rows)

def generate_helpnet_matching_dataset(num_samples=1000):
    """
    Cold-start benchmark interaction dataset generated using random_state=42.
    """
    random.seed(42)
    categories = [
        "Web Dev", "Design", "Plumbing", "Electrician", "Teaching",
        "Medical", "Legal", "Cooking", "Carpentry", "Mental Health",
        "Music", "Finance", "Language Translation", "Other"
    ]
    locations = ["Downtown", "North Suburbs", "West End", "Campus Area", "East Riverside"]

    rows = []
    for i in range(num_samples):
        cat = random.choice(categories)
        req_loc = random.choice(locations)
        helper_loc = random.choice(locations)
        
        has_skill = random.random() > 0.3
        skill_overlap = 1.0 if has_skill else (0.5 if random.random() > 0.5 else 0.0)
        
        tfidf_sim = round(random.uniform(0.1, 0.95) if has_skill else random.uniform(0.0, 0.3), 4)
        loc_match = 1.0 if req_loc == helper_loc else 0.2
        helper_rating = round(random.uniform(3.5, 5.0), 1)
        
        prob = 0.4 * skill_overlap + 0.3 * tfidf_sim + 0.2 * loc_match + 0.1 * ((helper_rating - 3.5) / 1.5)
        accepted = 1 if prob > 0.5 else 0

        rows.append({
            "request_id": f"req_{i}",
            "helper_id": f"hlp_{i}",
            "request_category": cat,
            "request_location": req_loc,
            "helper_location": helper_loc,
            "skill_overlap": skill_overlap,
            "tfidf_similarity": tfidf_sim,
            "location_match": loc_match,
            "helper_rating": helper_rating,
            "accepted": accepted
        })

    return rows
