"""
VeroQ Middleware — Auto-shield LLM responses in any framework.

Drop-in wrappers that verify every LLM output automatically.

Usage:

    # OpenAI wrapper — swap one import
    from veroq.middleware import openai_shield
    client = openai_shield(openai.OpenAI())
    response = client.chat.completions.create(model="gpt-4o", messages=[...])
    # response now has .veroq_shield with trust_score, corrections, receipts

    # Any LLM wrapper
    from veroq.middleware import shield_wrap
    verified = shield_wrap(my_llm_call, source="my-model")
"""

from .shield import shield, ShieldResult


def shield_wrap(text, source=None, agent_id=None, max_claims=5, block_if_untrusted=False):
    """Shield any text — convenience wrapper for middleware use.

    Args:
        text: LLM output text to verify.
        source: LLM provider name for leaderboard tracking.
        agent_id: Optional agent ID for memory integration.
        max_claims: Max claims to extract (1-10, default 5).
        block_if_untrusted: Raise on contradicted claims.

    Returns:
        ShieldResult with trust_score, corrections, verified_text.
    """
    if not text or len(str(text).strip()) < 20:
        return ShieldResult({"text": str(text), "claims": [], "overall_confidence": 1.0, "overall_verdict": "no_claims"})
    return shield(str(text), source=source, agent_id=agent_id, max_claims=max_claims, block_if_untrusted=block_if_untrusted)


def openai_shield(client, source="openai", agent_id=None, max_claims=5):
    """Wrap an OpenAI client to auto-shield every chat completion.

    Usage::

        import openai
        from veroq.middleware import openai_shield

        client = openai_shield(openai.OpenAI())
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "What's NVIDIA's revenue?"}]
        )
        # Access original response normally
        print(response.choices[0].message.content)
        # Access shield results
        print(response.veroq_shield.trust_score)
        print(response.veroq_shield.corrections)

    Args:
        client: An OpenAI client instance.
        source: Source name for leaderboard tracking (default: "openai").
        agent_id: Optional agent ID for memory.
        max_claims: Max claims to verify per response.

    Returns:
        Wrapped client with auto-shielding on chat completions.
    """

    class ShieldedCompletions:
        def __init__(self, original):
            self._original = original

        def create(self, **kwargs):
            response = self._original.create(**kwargs)
            # Extract text from response
            try:
                text = response.choices[0].message.content or ""
                model = getattr(response, "model", source)
                if len(text.strip()) >= 20:
                    response.veroq_shield = shield(text, source=model or source, agent_id=agent_id, max_claims=max_claims)
                else:
                    response.veroq_shield = ShieldResult({"text": text, "claims": [], "overall_confidence": 1.0, "overall_verdict": "no_claims"})
            except Exception:
                response.veroq_shield = ShieldResult({"text": "", "claims": [], "overall_confidence": 0, "overall_verdict": "error"})
            return response

    class ShieldedChat:
        def __init__(self, original):
            self.completions = ShieldedCompletions(original.completions)

    class ShieldedClient:
        def __init__(self, original):
            self._original = original
            self.chat = ShieldedChat(original.chat)

        def __getattr__(self, name):
            return getattr(self._original, name)

    return ShieldedClient(client)


def anthropic_shield(client, source="anthropic", agent_id=None, max_claims=5):
    """Wrap an Anthropic client to auto-shield every message.

    Usage::

        import anthropic
        from veroq.middleware import anthropic_shield

        client = anthropic_shield(anthropic.Anthropic())
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": "What's NVIDIA's revenue?"}]
        )
        print(response.content[0].text)
        print(response.veroq_shield.trust_score)
    """

    class ShieldedMessages:
        def __init__(self, original):
            self._original = original

        def create(self, **kwargs):
            response = self._original.create(**kwargs)
            try:
                text = response.content[0].text if response.content else ""
                model = getattr(response, "model", source)
                if len(text.strip()) >= 20:
                    response.veroq_shield = shield(text, source=model or source, agent_id=agent_id, max_claims=max_claims)
                else:
                    response.veroq_shield = ShieldResult({"text": text, "claims": [], "overall_confidence": 1.0, "overall_verdict": "no_claims"})
            except Exception:
                response.veroq_shield = ShieldResult({"text": "", "claims": [], "overall_confidence": 0, "overall_verdict": "error"})
            return response

    class ShieldedClient:
        def __init__(self, original):
            self._original = original
            self.messages = ShieldedMessages(original.messages)

        def __getattr__(self, name):
            return getattr(self._original, name)

    return ShieldedClient(client)
