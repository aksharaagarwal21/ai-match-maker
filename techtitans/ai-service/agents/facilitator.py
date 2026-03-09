import os
import random
from dotenv import load_dotenv

load_dotenv()

def _get_llm(temperature=0.7):
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY", ""),
        temperature=temperature,
    )

FACILITATE_TEMPLATE = """You are an AI brainstorming facilitator for cross-disciplinary innovation sessions.
Based on the conversation below, suggest ONE focused open-ended question to keep collaboration productive.
Focus on: bridging knowledge gaps, clarifying requirements, identifying next steps.
Return ONLY the question, nothing else. Maximum 2 sentences.

Topic: {topic}
Participants: {participants}
Conversation (last 15 messages):
{conversation}"""

SUMMARY_TEMPLATE = """Create a structured summary of this collaboration session. Include:
1. Main problem being solved
2. Key insights shared
3. Technical approaches discussed
4. Action items identified
5. Agreed next steps

Topic: {topic}
Participants: {participants}

Full conversation:
{conversation}"""

FALLBACK_SUGGESTIONS = [
    "What specific outcome are you both hoping to achieve by the end of this session?",
    "Can you describe the biggest technical constraint you're each facing right now?",
    "What data or evidence would you need to validate this idea in your domain?",
    "How would you measure success for this collaboration in 6 months?",
    "What assumptions are you each making that the other might question?",
]


async def get_facilitation_prompt(conversation: list, participants: list, topic: str) -> str:
    try:
        conv_text = "\n".join([
            f"[{m.get('sender_domain','?')}] {m.get('user_name','User')}: {m.get('message','')}"
            for m in conversation[-15:]
        ]) or "No messages yet."

        participant_text = ", ".join([
            f"{p.get('name','User')} ({p.get('domain','Unknown')})"
            for p in participants
        ]) or "Multiple experts"

        from langchain_core.prompts import ChatPromptTemplate
        llm = _get_llm()
        prompt = ChatPromptTemplate.from_template(FACILITATE_TEMPLATE)
        chain = prompt | llm
        result = await chain.ainvoke({
            "conversation": conv_text,
            "participants": participant_text,
            "topic": topic or "Cross-domain collaboration",
        })
        return result.content.strip()
    except Exception as e:
        print(f"Facilitation error: {e}")
        return random.choice(FALLBACK_SUGGESTIONS)


async def generate_summary(conversation: list, participants: list, topic: str) -> str:
    try:
        conv_text = "\n".join([
            f"[{m.get('sender_domain','?')}] {m.get('user_name','User')}: {m.get('message','')}"
            for m in conversation
        ]) or "No messages recorded."

        participant_text = ", ".join([
            f"{p.get('name','User')} ({p.get('domain','Unknown')})"
            for p in participants
        ]) or "Multiple experts"

        from langchain_core.prompts import ChatPromptTemplate
        llm = _get_llm(temperature=0.3)
        prompt = ChatPromptTemplate.from_template(SUMMARY_TEMPLATE)
        chain = prompt | llm
        result = await chain.ainvoke({
            "conversation": conv_text,
            "participants": participant_text,
            "topic": topic or "Cross-domain collaboration",
        })
        return result.content.strip()
    except Exception as e:
        print(f"Summary error: {e}")
        return f"Collaboration session on: {topic}. {len(conversation)} messages exchanged."
