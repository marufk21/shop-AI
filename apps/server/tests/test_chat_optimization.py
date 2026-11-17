"""Regression checks without database access or Gemini requests."""

import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from langchain_core.messages import AIMessage, HumanMessage

from agents.intent import is_social_message
from agents.specialist.support_agent import create_support_agent
from agents.state import AgentState
from agents.supervisor import supervisor_node


class ChatOptimizationTests(unittest.IsolatedAsyncioTestCase):
    def state(self, message: str) -> AgentState:
        return {
            "messages": [HumanMessage(content=message)],
            "current_agent": None,
            "sources": [],
            "temperature": 0.7,
            "use_rag": True,
            "top_k": 2,
        }

    def test_social_shortcut_does_not_swallow_questions(self) -> None:
        self.assertTrue(is_social_message("Hello!"))
        self.assertTrue(is_social_message("Thank you!"))
        for question in (
            "Hi, do you sell shoes?",
            "Thanks, what is your return policy?",
            "cheaper ones",
            "only in stock",
        ):
            self.assertFalse(is_social_message(question))

    async def test_router_receives_follow_up_context(self) -> None:
        state = self.state("cheaper ones")
        state["messages"] = [
            HumanMessage(content="Show shoes"),
            AIMessage(content="Shoes cost $100"),
            *state["messages"],
        ]
        with patch("agents.supervisor._router_llm") as llm:
            llm.ainvoke = AsyncMock(return_value=AIMessage(content="product"))
            self.assertEqual(await supervisor_node(state), {"current_agent": "product"})
            sent = llm.ainvoke.call_args.args[0]
            self.assertEqual(sent[1:], state["messages"])

    async def test_greeting_skips_router_model(self) -> None:
        with patch("agents.supervisor._router_llm") as llm:
            llm.ainvoke = AsyncMock()
            self.assertEqual(
                await supervisor_node(self.state("Hi!")), {"current_agent": "support"}
            )
            llm.ainvoke.assert_not_awaited()

    async def test_support_retrieval_and_grounding(self) -> None:
        module = "agents.specialist.support_agent"
        for message, use_rag, should_search in (
            ("Hello!", True, False),
            ("What is your return policy?", True, True),
            ("What is your return policy?", False, False),
        ):
            with self.subTest(message=message, use_rag=use_rag):
                with (
                    patch(f"{module}.VectorRepository") as repo,
                    patch(
                        f"{module}.generate_embedding", new_callable=AsyncMock
                    ) as embed,
                    patch(f"{module}.ChatGoogleGenerativeAI") as model,
                ):
                    embed.return_value = [0.1]
                    repo.return_value.search_similar = AsyncMock(return_value=[])
                    model.return_value.ainvoke = AsyncMock(
                        return_value=SimpleNamespace(content="answer")
                    )
                    state = self.state(message)
                    state["use_rag"] = use_rag
                    result = await create_support_agent(None)(state)  # type: ignore[arg-type]
                    self.assertEqual(result["sources"], [])
                    if should_search:
                        repo.return_value.search_similar.assert_awaited_once_with(
                            [0.1], 2
                        )
                        prompt = model.return_value.ainvoke.call_args.args[0][0].content
                        self.assertIn("No store documents were found", prompt)
                        self.assertIn("Never make up information", prompt)
                    else:
                        embed.assert_not_awaited()
                        repo.return_value.search_similar.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
