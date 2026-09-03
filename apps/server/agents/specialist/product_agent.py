"""Product specialist agent.

Handles product search, filtering, comparison, and recommendation
requests using tool-calling against the product catalog.
"""

import logging
from collections.abc import Awaitable, Callable

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import BaseTool
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from agents.state import AgentState
from agents.tools import get_product_tools
from core.config import settings

AgentNode = Callable[[AgentState], Awaitable[dict[str, object]]]
logger = logging.getLogger(__name__)

PRODUCT_AGENT_PROMPT = """\
You are the Product Specialist for ShopAI e-commerce.

Your job:
1. Search and filter products based on customer requests using the
   search_products tool.
2. Recommend products based on preferences using the recommend_products
   tool.
3. Compare products when asked.
4. Provide product details (price, category, availability).

Always use the tools to get real data from the catalog. Never make up
product information.

Relevance rules:
- Keep recommendations strictly relevant to the customer's requested
  product type, brand, category, and stated preferences.
- If a search or recommendation tool returns no matches, clearly say
  that no matching products are currently available. Do not recommend
  unrelated catalog items as an alternative.

Follow-up recommendation rules:
- Treat requests such as "show cheaper options", "only in stock", and
  "more like this" as follow-ups to the products discussed earlier in the
  conversation. Keep the same product type, category, and preferences.
- For cheaper options, use the previous result prices to set max_price and
  call a product tool with sort_by="price_low_to_high".
- For only-in-stock options, call a product tool with in_stock=true.
- For more-like-this options, use the previous product's category and
  relevant name or style terms in the next product-tool call.

Formatting rules:
- For product search and recommendation results, start with one short
  sentence, then show at most three products unless the customer asks for
  more.
- Put each product on exactly one numbered line in this format:
  1. **Product name** - $Price | Stock availability
- Only include a category or description when it helps answer the request;
  do not repeat it for every product.
- Use the exact names, prices, and stock counts returned by the tool.
- Keep all other replies clean and concise with line breaks for readability.
"""


def create_product_agent(db: AsyncSession) -> AgentNode:
    """Return an async graph node that handles product queries."""

    tools = get_product_tools(db)
    tools_by_name: dict[str, BaseTool] = {t.name: t for t in tools}

    async def product_agent_node(state: AgentState) -> dict[str, object]:
        temperature: float = state.get("temperature", 0.7)

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            api_key=SecretStr(settings.gemini_api_key),
            temperature=temperature,
            streaming=True,
        ).bind_tools(tools)

        messages: list[BaseMessage] = [
            SystemMessage(content=PRODUCT_AGENT_PROMPT),
            *state["messages"],
        ]

        ai_response: AIMessage = await llm.ainvoke(messages)

        # If the LLM wants to call tools, execute them and re-invoke
        if ai_response.tool_calls:
            messages.append(ai_response)
            for tool_call in ai_response.tool_calls:
                tool_name = tool_call["name"]
                tool = tools_by_name.get(tool_name)
                if tool is None:
                    result = "The requested catalog action is unavailable."
                    logger.error("Product agent requested unknown tool: %s", tool_name)
                else:
                    try:
                        result = await tool.ainvoke(tool_call["args"])
                    except Exception:
                        logger.exception("Product catalog tool failed: %s", tool_name)
                        result = "The product catalog is temporarily unavailable."
                messages.append(
                    ToolMessage(
                        content=str(result),
                        tool_call_id=tool_call["id"],
                    )
                )

            ai_response = await llm.ainvoke(messages)

        return {"messages": [ai_response]}

    return product_agent_node
