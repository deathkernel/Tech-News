from app.filters import classify, importance


def test_ai_classification():
    category, companies = classify("OpenAI launches a new LLM API")
    assert category in {"AI", "LLMs", "Developer Tools"}
    assert "OpenAI" in companies


def test_noise_scores_low():
    assert importance("Celebrity giveaway sponsored post") < 4
