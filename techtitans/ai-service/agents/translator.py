import os
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────────────────────
# Lazy-load LLM so the service starts even without a valid key
# ──────────────────────────────────────────────────────────────
def _get_llm():
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY", ""),
        temperature=0.3,
    )


TRANSLATE_TEMPLATE = """You are an expert cross-domain technical translator.
Rewrite the message below in plain language that a professional in {receiver_domain} can understand.
The sender is a specialist in {sender_domain}.

Rules:
- Keep the meaning exactly the same
- Replace domain-specific jargon with plain explanations
- Return ONLY the translated message, no preamble

Message: {message}"""

JARGON_TEMPLATE = """Analyze the message and respond ONLY with a JSON object (no markdown):
{{"has_jargon": true/false, "simplified": "simplified version", "terms": [{{"term": "t", "explanation": "e"}}]}}

Message: {message}"""


async def translate_message(message: str, sender_domain: str, receiver_domain: str) -> str:
    if sender_domain.lower() == receiver_domain.lower():
        return message
    try:
        from langchain_core.prompts import ChatPromptTemplate
        llm = _get_llm()
        prompt = ChatPromptTemplate.from_template(TRANSLATE_TEMPLATE)
        chain = prompt | llm
        result = await chain.ainvoke({
            "message": message,
            "sender_domain": sender_domain,
            "receiver_domain": receiver_domain,
        })
        return result.content.strip()
    except Exception as e:
        print(f"Translation error: {e}")
        return message


async def detect_and_simplify(message: str) -> dict:
    try:
        import json
        from langchain_core.prompts import ChatPromptTemplate
        llm = _get_llm()
        prompt = ChatPromptTemplate.from_template(JARGON_TEMPLATE)
        chain = prompt | llm
        result = await chain.ainvoke({"message": message})
        text = result.content.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception:
        return {"has_jargon": False, "simplified": message, "terms": []}
