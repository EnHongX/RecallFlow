from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings
from app.database import Base, get_db
from app.main import app
from app.models import User
from app.utils import verify_password


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        test_client.testing_session = TestingSessionLocal
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def register(client: TestClient, phone: str = "13800138000", password: str = "password123"):
    return client.post("/api/v1/auth/register", json={"phone": phone, "password": password})


def login(client: TestClient, phone: str = "13800138000", password: str = "password123"):
    return client.post("/api/v1/auth/login", json={"phone": phone, "password": password})


def test_register_creates_user_with_hashed_password(client: TestClient):
    response = register(client)

    assert response.status_code == 200
    assert response.json()["phone"] == "13800138000"
    assert "password_hash" not in response.json()

    db_factory = client.testing_session
    with db_factory() as db:
        user = db.execute(select(User).where(User.phone == "13800138000")).scalar_one()
        assert user.password_hash != "password123"
        assert verify_password("password123", user.password_hash)


def test_register_rejects_duplicate_phone(client: TestClient):
    register(client)

    response = register(client)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "AUTH_003"


def test_register_rejects_short_password(client: TestClient):
    response = register(client, password="1234567")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "AUTH_002"


def test_register_rejects_invalid_phone(client: TestClient):
    response = register(client, phone="123")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "AUTH_001"


def test_login_sets_http_only_cookie(client: TestClient):
    register(client)

    response = login(client)

    assert response.status_code == 200
    set_cookie = response.headers["set-cookie"]
    assert f"{get_settings().cookie_name}=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie


def test_login_rejects_wrong_password(client: TestClient):
    register(client)

    response = login(client, password="wrong-password")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_004"


def test_me_requires_login(client: TestClient):
    response = client.get("/api/v1/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_005"


def test_me_returns_current_user_from_cookie(client: TestClient):
    register(client)
    login(client)

    response = client.get("/api/v1/me")

    assert response.status_code == 200
    assert response.json()["phone"] == "13800138000"


def test_logout_clears_cookie(client: TestClient):
    register(client)
    login(client)

    response = client.post("/api/v1/auth/logout")

    assert response.status_code == 200
    set_cookie = response.headers["set-cookie"]
    assert f"{get_settings().cookie_name}=" in set_cookie
    assert "Max-Age=0" in set_cookie
