"""Supervisor (router) agent for the multi-agent graph.

Reads the user's intent and routes to the appropriate specialist:
``"product"`` for search / browse / recommend, ``"support"`` for
policies / FAQs / general conversation.
"""

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr

from agents.intent import is_social_message
from agents.state import AgentState
from core.config import settings

SUPERVISOR_PROMPT = """\
You are the supervisor of a multi-agent e-commerce support system for ShopAI.

Analyze the customer's message and decide which specialist agent should
handle it.

Available agents:
- "product" — For searching, browsing, filtering, comparing, or recommending
  products. Also for questions about prices, availability, or categories.
- "support" — For questions about store policies (shipping, returns, privacy),
  FAQs, general conversation, greetings, or anything not product-related.

Respond with ONLY the agent name: "product" or "support".
Use the recent conversation to interpret follow-ups such as "cheaper ones",
"only in stock", or "more like this". A new explicit topic takes precedence.
"""

_router_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=SecretStr(settings.gemini_api_key),
    temperature=0,
    max_retries=2,
)

VALID_AGENTS = frozenset({"product", "support"})


async def supervisor_node(state: AgentState) -> dict[str, str]:
    """Classify intent and set ``current_agent`` in the state."""

    last_message: BaseMessage = state["messages"][-1]
    if is_social_message(last_message.content):
        return {"current_agent": "support"}
    response = await _router_llm.ainvoke(
        [SystemMessage(content=SUPERVISOR_PROMPT), *state["messages"][-7:]]
    )
    decision = str(response.content).strip().lower()

    if decision not in VALID_AGENTS:
        decision = "support"

    return {"current_agent": decision}
