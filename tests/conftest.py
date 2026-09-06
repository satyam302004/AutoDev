import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(create_app()) as test_client:
        yield test_client


@pytest.fixture()
def api_client(tmp_path) -> TestClient:
    """TestClient on a fresh temp DB with the agent pipeline driven by FakeLLM."""
    from app.core import db

    db.configure_database(f"sqlite:///{tmp_path}/autodev_test.db")

    from app.core.container import get_container
    from app.llm.base import LLMService
    from tests.fake_llm import FakeLLM
    from tests.samples import ALL_SAMPLES

    get_container().set_llm_service(
        LLMService(provider=FakeLLM(samples=ALL_SAMPLES))
    )

    with TestClient(create_app()) as test_client:
        yield test_client
