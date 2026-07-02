import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    badge_number = Column(String, nullable=True)
    role = Column(String, default="officer")  # admin, officer
    status = Column(String, default="active")  # active, inactive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    activity_logs = relationship("ActivityLog", back_populates="user")

class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(String, primary_key=True, index=True)  # e.g., CAM-001
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    ip_address = Column(String, nullable=True)
    status = Column(String, default="online")  # online, offline
    health_score = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    violations = relationship("Violation", back_populates="camera")
    detection_logs = relationship("DetectionLog", back_populates="camera")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_type = Column(String, nullable=False)  # car, motorcycle, truck, bus, auto
    brand = Column(String, nullable=True)
    color = Column(String, nullable=True)
    owner_name = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    registration_status = Column(String, default="valid")  # valid, expired
    pollution_status = Column(String, default="valid")  # valid, expired
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    violations = relationship("Violation", back_populates="vehicle")

class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    violation_type = Column(String, nullable=False)  # red_light_jump, wrong_lane, overspeeding, no_helmet, no_seatbelt, triple_riding, using_mobile, illegal_parking, etc.
    date_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    location = Column(String, nullable=False)
    fine_amount = Column(Float, nullable=False)
    evidence_image_path = Column(String, nullable=False)
    evidence_video_path = Column(String, nullable=True)
    bounding_box_data = Column(JSON, nullable=True)
    ocr_confidence = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending, paid, resolved
    officer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="violations")
    camera = relationship("Camera", back_populates="violations")
    payments = relationship("Payment", back_populates="violation")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    payment_method = Column(String, nullable=False)  # upi, card, net_banking, cash
    status = Column(String, default="completed")  # completed, failed
    
    # Relationships
    violation = relationship("Violation", back_populates="payments")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")

class DetectionLog(Base):
    __tablename__ = "detection_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    vehicle_type = Column(String, nullable=False)
    plate_number = Column(String, nullable=True)
    speed_detected = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    camera = relationship("Camera", back_populates="detection_logs")

class SystemSetting(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
