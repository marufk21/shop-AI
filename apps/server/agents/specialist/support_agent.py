"""Support specialist agent.

Handles questions about store policies, shipping, returns, privacy,
and general conversation using RAG (retrieval-augmented generation)
from the document vector store.
"""

from collections.abc import Awaitable, Callable

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from agents.intent import is_social_message
from agents.state import AgentState
from core.config import settings
from db.vector_repository import VectorRepository
from utils.embedding import generate_embedding

AgentNode = Callable[[AgentState], Awaitable[dict[str, object]]]

SUPPORT_AGENT_PROMPT = """\
You are a helpful AI customer support assistant for ShopAI.

Answer customer questions based on the provided context from store
documents (policies, product manuals, FAQs). Be concise, friendly, and
accurate. If the context doesn't contain the answer, say so honestly
and suggest contacting support. Never make up information that isn't in
the provided context.

Formatting rules:
- Write in clean, well-structured plain text. Never use Markdown syntax
  like **bold**, *italic*, or `code`.
- Use line breaks to separate paragraphs for readability.
- When listing items, use a dash (-) at the start of each line followed
  by a space. Put each list item on its own line with a blank line before
  and after the list.
- For emphasis, use SHOPAI-style labels like [Important], [Note], or
  [Tip] at the start of a paragraph.
- Keep headers or section titles on their own line, followed by a blank
  line before the content.

Relevant context:
{context}
"""

SUPPORT_AGENT_NO_RAG_PROMPT = """\
You are a helpful AI customer support assistant for ShopAI.

Be concise, friendly, and accurate. If you don't know the answer, say
so honestly and suggest contacting support.

Formatting rules:
- Write in clean, well-structured plain text. Never use Markdown syntax
  like **bold**, *italic*, or `code`.
- Use line breaks to separate paragraphs for readability.
- When listing items, use a dash (-) at the start of each line followed
  by a space.
- For emphasis, use labels like [Important], [Note], or [Tip].
"""


def create_support_agent(db: AsyncSession) -> AgentNode:
    """Return an async graph node that handles support queries."""

    vector_repo = VectorRepository(db)

    async def support_agent_node(state: AgentState) -> dict[str, object]:
        temperature: float = state.get("temperature", 0.7)
        use_rag: bool = state.get("use_rag", True)

        sources: list[dict[str, object]] = []
        system_content = SUPPORT_AGENT_NO_RAG_PROMPT

        if use_rag and not is_social_message(state["messages"][-1].content):
            user_message = state["messages"][-1]
            query = str(user_message.content)
            query_embedding = await generate_embedding(query)
            results = await vector_repo.search_similar(
                query_embedding, state.get("top_k", 5)
            )

            context = ""
            seen: set[str] = set()
            for chunk, doc, score in results:
                context += f"--- {doc.name} ---\n{chunk.content}\n\n"
                if doc.name not in seen:
                    sources.append(
                        {
                            "document_name": doc.name,
                            "excerpt": chunk.content[:200],
                            "relevance_score": round(score, 4),
                        }
                    )
                    seen.add(doc.name)

            system_content = SUPPORT_AGENT_PROMPT.format(
                context=context or "No store documents were found for this question."
            )

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            api_key=SecretStr(settings.gemini_api_key),
            temperature=temperature,
            streaming=True,
        )

        messages: list[BaseMessage] = [
            SystemMessage(content=system_content),
            *state["messages"],
        ]

        ai_response = await llm.ainvoke(messages)

        return {"messages": [ai_response], "sources": sources}

    return support_agent_node
