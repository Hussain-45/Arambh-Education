import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
from backend.config import settings

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_login_success():
    # Attempt login with default admin seed
    # Test client uses override DB which is initialized during startup event, 
    # but since metadata is created/dropped per test fixture, we seed manually if empty.
    from backend.seed_data import seed_db
    from backend.database import SessionLocal
    
    # Run seed on test engine
    db = TestingSessionLocal()
    from backend.models import User
    from backend.auth import get_password_hash
    admin = User(
        username="admin",
        password_hash=get_password_hash("admin123"),
        name="Traffic Admin",
        email="admin@smartcity.gov.in",
        role="admin",
        status="active"
    )
    db.add(admin)
    db.commit()
    db.close()
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["username"] == "admin"

def test_login_failure():
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_get_cameras_unauthorized():
    response = client.get(f"{settings.API_V1_STR}/cameras")
    assert response.status_code == 401 # Should require JWT Bearer header
