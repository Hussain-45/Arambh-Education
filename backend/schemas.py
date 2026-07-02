from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    name: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    name: str
    badge_number: Optional[str] = None
    role: str
    status: str = "active"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    badge_number: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# Forgot Password Schema
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str

# Camera Schemas
class CameraBase(BaseModel):
    id: str
    name: str
    location: str
    latitude: float
    longitude: float
    ip_address: Optional[str] = None
    status: str = "online"
    health_score: int = 100

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ip_address: Optional[str] = None
    status: Optional[str] = None
    health_score: Optional[int] = None

class CameraResponse(CameraBase):
    created_at: datetime

    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleBase(BaseModel):
    plate_number: str
    vehicle_type: str
    brand: Optional[str] = None
    color: Optional[str] = None
    owner_name: str
    owner_email: str
    registration_status: str = "valid"
    pollution_status: str = "valid"

class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Violation Schemas
class ViolationBase(BaseModel):
    vehicle_id: int
    camera_id: str
    violation_type: str
    date_time: datetime
    location: str
    fine_amount: float
    evidence_image_path: str
    evidence_video_path: Optional[str] = None
    bounding_box_data: Optional[Dict[str, Any]] = None
    ocr_confidence: float = 0.0
    status: str = "pending"
    officer_notes: Optional[str] = None

class ViolationCreate(BaseModel):
    plate_number: str
    vehicle_type: str
    brand: Optional[str] = None
    color: Optional[str] = None
    owner_name: str
    owner_email: str
    camera_id: str
    violation_type: str
    location: str
    fine_amount: float
    evidence_image_path: str
    evidence_video_path: Optional[str] = None
    bounding_box_data: Optional[Dict[str, Any]] = None
    ocr_confidence: float = 0.0
    status: str = "pending"
    officer_notes: Optional[str] = None

class ViolationStatusUpdate(BaseModel):
    status: str
    officer_notes: Optional[str] = None

class ViolationResponse(ViolationBase):
    id: int
    created_at: datetime
    vehicle: VehicleResponse
    camera: CameraResponse

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    violation_id: int
    amount: float
    payment_method: str
    status: str = "completed"

class PaymentCreate(PaymentBase):
    transaction_id: str

class PaymentResponse(PaymentBase):
    id: int
    payment_date: datetime
    transaction_id: str

    class Config:
        from_attributes = True

# Logs Schemas
class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    ip_address: Optional[str] = None
    timestamp: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class DetectionLogResponse(BaseModel):
    id: int
    camera_id: str
    vehicle_type: str
    plate_number: Optional[str] = None
    speed_detected: Optional[float] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Setting Schemas
class SettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class SettingUpdate(BaseModel):
    value: str

# Dashboard & Analytics Widgets Schemas
class DashboardStats(BaseModel):
    total_vehicles: int
    total_violations: int
    todays_violations: int
    unpaid_fines_sum: float
    paid_fines_sum: float
    violations_by_type: Dict[str, int]
    violations_by_status: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    monthly_trend: List[Dict[str, Any]]
    hourly_trend: List[Dict[str, Any]]
    camera_status: Dict[str, int]
