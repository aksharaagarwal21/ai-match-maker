import os
import numpy as np
from typing import List, Dict
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

# Load sentence transformer model (downloaded once, cached)
print("Loading sentence transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Sentence transformer model loaded.")


def get_embedding(text: str) -> List[float]:
    embedding = model.encode(text, convert_to_tensor=False)
    return embedding.tolist()


def compute_user_text(user: Dict) -> str:
    parts = []
    if user.get("domain"):
        parts.append(f"Domain: {user['domain']}")
    if user.get("skills"):
        parts.append(f"Skills: {user['skills']}")
    if user.get("problem_statement"):
        parts.append(f"Problem: {user['problem_statement']}")
    if user.get("organization"):
        parts.append(f"Organization: {user['organization']}")
    return " | ".join(parts) or "General professional"


async def match_experts(target_user: Dict, all_users: List[Dict], top_k: int = 5) -> List[Dict]:
    """Match a target user with the most similar experts using local cosine similarity."""
    if not all_users:
        return []

    target_text = compute_user_text(target_user)
    target_embedding = np.array(get_embedding(target_text))

    candidate_embeddings = []
    candidates = []

    for user in all_users:
        if str(user.get("id")) == str(target_user.get("id")):
            continue
        user_text = compute_user_text(user)
        embedding = np.array(get_embedding(user_text))
        candidate_embeddings.append(embedding)
        candidates.append(user)

    if not candidates:
        return []

    matrix = np.array(candidate_embeddings)
    similarities = cosine_similarity([target_embedding], matrix)[0]
    ranked_indices = np.argsort(similarities)[::-1][:top_k]

    results = []
    for idx in ranked_indices:
        user = candidates[idx]
        results.append({
            "user_id": user.get("id"),
            "similarity_score": float(similarities[idx]),
            "name": user.get("name"),
            "domain": user.get("domain"),
            "skills": user.get("skills"),
            "organization": user.get("organization"),
            "problem_statement": user.get("problem_statement"),
        })

    return results


async def upsert_user_to_pinecone(user: Dict):
    """No-op — Pinecone not configured, using local similarity."""
    return False
