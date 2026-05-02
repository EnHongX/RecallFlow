from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, Student, Subject, Question, Card, PracticeRecord, WrongCard


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


def create_test_data(db: Session):
    user = db.execute(select(User).where(User.phone == "13800138000")).scalar_one()
    
    student = Student(
        user_id=user.id,
        name="测试孩子",
        grade="三年级",
        is_current=True,
    )
    db.add(student)
    db.flush()
    
    subject = Subject(
        name="数学",
        code="math",
    )
    db.add(subject)
    db.flush()
    
    question = Question(
        user_id=user.id,
        student_id=student.id,
        subject_id=subject.id,
        type="calculation",
        prompt="1 + 1 = ?",
        answer="2",
        grading_method="manual",
        status="active",
    )
    db.add(question)
    db.flush()
    
    card = Card(
        student_id=student.id,
        question_id=question.id,
        card_type="practice",
        front=question.prompt,
        back=question.answer,
        status="new",
        grading_method=question.grading_method,
    )
    db.add(card)
    db.flush()
    
    db.commit()
    
    return {
        "user": user,
        "student": student,
        "subject": subject,
        "question": question,
        "card": card,
    }


def test_submit_practice_creates_practice_record(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
        student_id = test_data["student"].id
    
    response = client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "learning"
    
    with db_factory() as db:
        record = db.execute(
            select(PracticeRecord).where(PracticeRecord.card_id == card_id)
        ).scalar_one_or_none()
        
        assert record is not None
        assert record.student_id == student_id
        assert record.result == "gotit"


def test_submit_practice_with_again_creates_wrong_card(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
        student_id = test_data["student"].id
    
    response = client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "again"}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "new"
    
    with db_factory() as db:
        wrong_card = db.execute(
            select(WrongCard).where(
                WrongCard.card_id == card_id,
                WrongCard.is_mastered == False
            )
        ).scalar_one_or_none()
        
        assert wrong_card is not None
        assert wrong_card.student_id == student_id
        assert wrong_card.is_mastered == False


def test_submit_practice_with_gotit_does_not_create_wrong_card(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
    
    client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    
    with db_factory() as db:
        wrong_card = db.execute(
            select(WrongCard).where(WrongCard.card_id == card_id)
        ).scalar_one_or_none()
        
        assert wrong_card is None


def test_get_practice_records(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
    
    client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    
    response = client.get("/api/v1/practice-records")
    
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1
    assert records[0]["result"] == "gotit"


def test_get_wrong_cards(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
    
    client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "again"}
    )
    
    response = client.get("/api/v1/wrong-cards")
    
    assert response.status_code == 200
    wrong_cards = response.json()
    assert len(wrong_cards) == 1
    assert wrong_cards[0]["is_mastered"] == False


def test_mark_wrong_card_as_mastered(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
    
    client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "again"}
    )
    
    wrong_cards_response = client.get("/api/v1/wrong-cards")
    wrong_card_id = wrong_cards_response.json()[0]["id"]
    
    master_response = client.post(
        f"/api/v1/wrong-cards/{wrong_card_id}/master"
    )
    
    assert master_response.status_code == 200
    assert master_response.json()["success"] == True
    
    with db_factory() as db:
        wrong_card = db.execute(
            select(WrongCard).where(WrongCard.id == wrong_card_id)
        ).scalar_one_or_none()
        
        assert wrong_card is not None
        assert wrong_card.is_mastered == True
        assert wrong_card.mastered_at is not None


def test_card_status_transitions_gotit(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
    
    response1 = client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    assert response1.json()["status"] == "learning"
    
    response2 = client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    assert response2.json()["status"] == "review"
    
    response3 = client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    assert response3.json()["status"] == "mastered"


def test_card_status_transitions_again(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
    
    client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "gotit"}
    )
    
    response = client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "again"}
    )
    assert response.json()["status"] == "review"


def test_submit_invalid_result(client: TestClient):
    register(client)
    login(client)
    
    db_factory = client.testing_session
    with db_factory() as db:
        test_data = create_test_data(db)
        card_id = test_data["card"].id
    
    response = client.post(
        f"/api/v1/cards/{card_id}/submit",
        json={"result": "invalid"}
    )
    
    assert response.status_code == 400
