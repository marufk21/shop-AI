"""Multi-agent chat controller.

Streams responses from a LangGraph multi-agent graph via Server-Sent
Events (SSE). Each event is a JSON object with a ``type`` field:

- ``agent``  — which specialist is handling the request
- ``token``  — a streaming text token
- ``sources`` — RAG source citations (from the support agent)
- ``[DONE]``  — stream complete
"""

import json
import logging
from collections.abc import AsyncGenerator

from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from agents.graph import build_agent_graph
from agents.state import AgentState
from schemas.chat_schema import ChatRequest, SourceCitation

# Nodes whose tokens should be streamed to the client (skip supervisor)
_STREAMING_NODES = frozenset({"product", "support"})
logger = logging.getLogger(__name__)


class ChatController:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def stream_response(self, request: ChatRequest) -> StreamingResponse:
        async def event_generator() -> AsyncGenerator[str, None]:
            try:
                graph = build_agent_graph(self.db)

                # Build conversation messages from request + history
                messages: list[BaseMessage] = []
                for msg in request.history:
                    if msg.role == "user":
                        messages.append(HumanMessage(content=msg.content))
                    else:
                        messages.append(AIMessage(content=msg.content))
                messages.append(HumanMessage(content=request.message))

                initial_state: AgentState = {
                    "messages": messages,
                    "current_agent": None,
                    "sources": [],
                    "temperature": request.temperature,
                    "use_rag": request.use_rag,
                }

                collected_sources: list[SourceCitation] = []

                async for stream_mode, data in graph.astream(
                    initial_state,
                    stream_mode=["messages", "updates"],
                ):
                    if stream_mode == "updates":
                        node_name = next(iter(data.keys())) if data else None
                        if node_name:
                            yield _sse_event("agent", {"agent": node_name})

                        node_update = data.get(node_name, {}) if node_name else {}
                        if isinstance(node_update, dict) and node_update.get("sources"):
                            for src in node_update["sources"]:
                                collected_sources.append(SourceCitation(**src))

                    elif stream_mode == "messages":
                        chunk, metadata = data
                        node = metadata.get("langgraph_node", "")
                        if node not in _STREAMING_NODES:
                            continue

                        content = chunk.content
                        if isinstance(content, str) and content:
                            yield _sse_event("token", {"content": content})

                if collected_sources:
                    yield _sse_event(
                        "sources",
                        {"sources": [s.model_dump() for s in collected_sources]},
                    )
            except Exception as error:
                logger.exception("Chat response stream failed")
                yield _sse_event(
                    "token",
                    {"content": _chat_error_message(error)},
                )

            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )


def _sse_event(event_type: str, payload: dict[str, object]) -> str:
    """Format a single SSE data line."""

    data = json.dumps({"type": event_type, **payload})
    return f"data: {data}\n\n"


def _chat_error_message(error: Exception) -> str:
    """Return a useful safe message without exposing internal error details."""

    error_text = str(error).lower()
    if "resource_exhausted" in error_text or "429" in error_text:
        return (
            "The AI assistant has reached its Gemini API quota. Please wait "
            "a few minutes, then try again."
        )

    return "Sorry, I couldn't complete that request. Please try again."
