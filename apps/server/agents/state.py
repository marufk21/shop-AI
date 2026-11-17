"""LangGraph state definition for the multi-agent e-commerce chatbot."""

from typing import Annotated, NotRequired, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """State shared across all agents in the graph.

    Attributes:
        messages: Conversation history, uses ``add_messages`` reducer so
            new messages are appended instead of overwritten.
        current_agent: Which specialist the supervisor routed to
            (``"product"``, ``"support"``, or ``None``).
        sources: RAG source citations extracted by the support agent.
        temperature: LLM temperature passed from the chat request.
        use_rag: Whether the support agent should consult document vectors.
    """

    messages: Annotated[list[BaseMessage], add_messages]
    current_agent: str | None
    sources: list[dict[str, object]]
    temperature: float
    use_rag: bool
    top_k: NotRequired[int]
