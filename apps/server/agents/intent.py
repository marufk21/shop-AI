"""Conservative shortcuts for messages that need no catalog or document lookup."""

import re


def is_social_message(content: object) -> bool:
    """Match only standalone greetings/thanks; mixed questions use normal routing."""
    if not isinstance(content, str):
        return False
    normalized = re.sub(r"[^\w\s]", "", content.lower()).strip()
    normalized = " ".join(normalized.split())
    return normalized in {
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "thanks a lot",
        "thank you very much",
        "bye",
        "goodbye",
        "ok",
        "okay",
    }
