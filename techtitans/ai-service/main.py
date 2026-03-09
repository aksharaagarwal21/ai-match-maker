import os
import hashlib
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from agents.translator import translate_message, detect_and_simplify
from agents.facilitator import get_facilitation_prompt, generate_summary
from agents.matchmaker import match_experts, upsert_user_to_pinecone

load_dotenv()

app = FastAPI(
    title="TechTitans AI Service",
    description="AI agents for translation, matchmaking, and facilitation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ───────────────────────────────────────────────

class TranslateRequest(BaseModel):
    message: str
    sender_domain: str
    receiver_domain: str

class TranslateResponse(BaseModel):
    original: str
    translated: str
    sender_domain: str
    receiver_domain: str

class Message(BaseModel):
    user_name: Optional[str] = "User"
    sender_domain: Optional[str] = "Unknown"
    message: str

class Participant(BaseModel):
    name: Optional[str] = "User"
    domain: Optional[str] = "Unknown"

class FacilitateRequest(BaseModel):
    conversation: List[Message]
    participants: List[Participant]
    topic: Optional[str] = "Cross-domain collaboration"

class FacilitateResponse(BaseModel):
    suggestion: str

class UserProfile(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = ""
    domain: Optional[str] = ""
    skills: Optional[str] = ""
    organization: Optional[str] = ""
    problem_statement: Optional[str] = ""

class MatchRequest(BaseModel):
    target_user: UserProfile
    all_users: List[UserProfile]
    top_k: Optional[int] = 5

class MatchResult(BaseModel):
    user_id: Optional[int]
    similarity_score: float
    name: Optional[str] = ""
    domain: Optional[str] = ""
    skills: Optional[str] = ""
    organization: Optional[str] = ""
    problem_statement: Optional[str] = ""

class MatchResponse(BaseModel):
    matches: List[MatchResult]

class SummarizeRequest(BaseModel):
    conversation: List[Message]
    participants: List[Participant]
    topic: Optional[str] = "Cross-domain collaboration"

class SummarizeResponse(BaseModel):
    summary: str
    hash: str

class UpsertUserRequest(BaseModel):
    user: UserProfile


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "TechTitans AI Service"}


@app.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    """Translate domain-specific jargon between professional domains."""
    try:
        translated = await translate_message(
            message=req.message,
            sender_domain=req.sender_domain,
            receiver_domain=req.receiver_domain,
        )
        return TranslateResponse(
            original=req.message,
            translated=translated,
            sender_domain=req.sender_domain,
            receiver_domain=req.receiver_domain,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-jargon")
async def detect_jargon(req: TranslateRequest):
    """Detect and explain technical jargon in a message."""
    try:
        result = await detect_and_simplify(req.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/facilitate", response_model=FacilitateResponse)
async def facilitate(req: FacilitateRequest):
    """Generate a brainstorming facilitation prompt."""
    try:
        conversation_dicts = [m.model_dump() for m in req.conversation]
        participants_dicts = [p.model_dump() for p in req.participants]
        suggestion = await get_facilitation_prompt(
            conversation=conversation_dicts,
            participants=participants_dicts,
            topic=req.topic,
        )
        return FacilitateResponse(suggestion=suggestion)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match", response_model=MatchResponse)
async def match(req: MatchRequest):
    """Match a user with similar experts using embedding similarity."""
    try:
        target_dict = req.target_user.model_dump()
        all_dicts = [u.model_dump() for u in req.all_users]
        matches = await match_experts(
            target_user=target_dict,
            all_users=all_dicts,
            top_k=req.top_k,
        )
        return MatchResponse(matches=[MatchResult(**m) for m in matches])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    """Generate a session summary and return its hash."""
    try:
        conversation_dicts = [m.model_dump() for m in req.conversation]
        participants_dicts = [p.model_dump() for p in req.participants]
        summary = await generate_summary(
            conversation=conversation_dicts,
            participants=participants_dicts,
            topic=req.topic,
        )
        summary_hash = hashlib.sha256(summary.encode()).hexdigest()
        return SummarizeResponse(summary=summary, hash=summary_hash)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upsert-user")
async def upsert_user(req: UpsertUserRequest):
    """Upsert a user embedding to Pinecone."""
    success = await upsert_user_to_pinecone(req.user.model_dump())
    return {"success": success}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
