import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import User, Camera, Vehicle, Violation, Payment, ActivityLog, DetectionLog, SystemSetting
from backend.schemas import UserCreate, UserUpdate, CameraCreate, CameraUpdate, ViolationCreate, PaymentCreate
from backend.auth import get_password_hash

# Users
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    db_user = User(
        username=user.username,
        email=user.email,
        name=user.name,
        badge_number=user.badge_number,
        role=user.role,
        status=user.status,
        password_hash=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_in: UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        db_user.password_hash = get_password_hash(update_data["password"])
        del update_data["password"]
        
    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# Cameras
def get_camera(db: Session, camera_id: str):
    return db.query(Camera).filter(Camera.id == camera_id).first()

def get_cameras(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Camera).offset(skip).limit(limit).all()

def create_camera(db: Session, camera: CameraCreate):
    db_camera = Camera(**camera.dict())
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera

def update_camera(db: Session, camera_id: str, camera_in: CameraUpdate):
    db_camera = get_camera(db, camera_id)
    if not db_camera:
        return None
    for field, value in camera_in.dict(exclude_unset=True).items():
        setattr(db_camera, field, value)
    db.commit()
    db.refresh(db_camera)
    return db_camera

def delete_camera(db: Session, camera_id: str):
    db_camera = get_camera(db, camera_id)
    if db_camera:
        db.delete(db_camera)
        db.commit()
        return True
    return False

# Vehicles
def get_vehicle(db: Session, vehicle_id: int):
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

def get_vehicle_by_plate(db: Session, plate_number: str):
    return db.query(Vehicle).filter(func.lower(Vehicle.plate_number) == plate_number.lower()).first()

def create_vehicle(db: Session, vehicle_data: Dict[str, Any]):
    db_vehicle = Vehicle(**vehicle_data)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

# Violations
def get_violation(db: Session, violation_id: int):
    return db.query(Violation).filter(Violation.id == violation_id).first()

def get_violations(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    location: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    violation_type: Optional[str] = None,
    status: Optional[str] = None
):
    query = db.query(Violation).join(Vehicle)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Vehicle.plate_number.ilike(search_filter)) |
            (Vehicle.owner_name.ilike(search_filter)) |
            (Violation.location.ilike(search_filter)) |
            (Violation.violation_type.ilike(search_filter))
        )
        
    if start_date:
        query = query.filter(Violation.date_time >= datetime.datetime.combine(start_date, datetime.time.min))
    if end_date:
        query = query.filter(Violation.date_time <= datetime.datetime.combine(end_date, datetime.time.max))
    if location:
        query = query.filter(Violation.location == location)
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    if violation_type:
        query = query.filter(Violation.violation_type == violation_type)
    if status:
        query = query.filter(Violation.status == status)
        
    return query.order_by(Violation.date_time.desc()).offset(skip).limit(limit).all()

def create_violation(db: Session, violation: ViolationCreate):
    # Check if vehicle exists, otherwise create a demo vehicle
    db_vehicle = get_vehicle_by_plate(db, violation.plate_number)
    if not db_vehicle:
        db_vehicle = create_vehicle(db, {
            "plate_number": violation.plate_number.upper(),
            "vehicle_type": violation.vehicle_type,
            "brand": violation.brand or "Unknown",
            "color": violation.color or "Unknown",
            "owner_name": violation.owner_name,
            "owner_email": violation.owner_email,
            "registration_status": "valid",
            "pollution_status": "valid"
        })
        
    db_violation = Violation(
        vehicle_id=db_vehicle.id,
        camera_id=violation.camera_id,
        violation_type=violation.violation_type,
        date_time=datetime.datetime.utcnow(),
        location=violation.location,
        fine_amount=violation.fine_amount,
        evidence_image_path=violation.evidence_image_path,
        evidence_video_path=violation.evidence_video_path,
        bounding_box_data=violation.bounding_box_data,
        ocr_confidence=violation.ocr_confidence,
        status=violation.status,
        officer_notes=violation.officer_notes
    )
    db.add(db_violation)
    db.commit()
    db.refresh(db_violation)
    return db_violation

def update_violation_status(db: Session, violation_id: int, status: str, notes: Optional[str] = None):
    db_violation = get_violation(db, violation_id)
    if db_violation:
        db_violation.status = status
        if notes is not None:
            db_violation.officer_notes = notes
        db.commit()
        db.refresh(db_violation)
    return db_violation

# Payments
def create_payment(db: Session, payment: PaymentCreate):
    db_payment = Payment(**payment.dict())
    db.add(db_payment)
    
    # Update violation status to paid
    db_violation = get_violation(db, payment.violation_id)
    if db_violation:
        db_violation.status = "paid"
        
    db.commit()
    db.refresh(db_payment)
    return db_payment

# Logs
def create_activity_log(db: Session, user_id: int, action: str, ip_address: Optional[str] = None):
    log = ActivityLog(user_id=user_id, action=action, ip_address=ip_address)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_activity_logs(db: Session, skip: int = 0, limit: int = 100):
    logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).offset(skip).limit(limit).all()
    # Add username helper
    result = []
    for log in logs:
        item = {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp,
            "user_name": log.user.name if log.user else "System"
        }
        result.append(item)
    return result

def create_detection_log(db: Session, camera_id: str, vehicle_type: str, plate_number: Optional[str] = None, speed_detected: Optional[float] = None):
    log = DetectionLog(camera_id=camera_id, vehicle_type=vehicle_type, plate_number=plate_number, speed_detected=speed_detected)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_detection_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(DetectionLog).order_by(DetectionLog.timestamp.desc()).offset(skip).limit(limit).all()

# Settings
def get_settings(db: Session) -> List[SystemSetting]:
    return db.query(SystemSetting).all()

def update_setting(db: Session, key: str, value: str):
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if db_setting:
        db_setting.value = value
    else:
        db_setting = SystemSetting(key=key, value=value)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

# Dashboard Statistics
def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0
    total_violations = db.query(func.count(Violation.id)).scalar() or 0
    
    today = datetime.date.today()
    todays_violations = db.query(func.count(Violation.id)).filter(
        Violation.date_time >= datetime.datetime.combine(today, datetime.time.min)
    ).scalar() or 0
    
    unpaid_fines = db.query(func.sum(Violation.fine_amount)).filter(Violation.status == "pending").scalar() or 0.0
    paid_fines = db.query(func.sum(Violation.fine_amount)).filter(Violation.status == "paid").scalar() or 0.0
    
    # Violations by Type
    by_type_query = db.query(Violation.violation_type, func.count(Violation.id)).group_by(Violation.violation_type).all()
    by_type = {v_type: count for v_type, count in by_type_query}
    
    # Violations by Status
    by_status_query = db.query(Violation.status, func.count(Violation.id)).group_by(Violation.status).all()
    by_status = {status: count for status, count in by_status_query}
    
    # Camera Status counts
    cameras_online = db.query(func.count(Camera.id)).filter(Camera.status == "online").scalar() or 0
    cameras_offline = db.query(func.count(Camera.id)).filter(Camera.status == "offline").scalar() or 0
    camera_counts = {"online": cameras_online, "offline": cameras_offline}
    
    # Recent Activity (last 10 violations)
    recent = db.query(Violation).order_by(Violation.date_time.desc()).limit(10).all()
    recent_activity = []
    for r in recent:
        recent_activity.append({
            "id": r.id,
            "plate_number": r.vehicle.plate_number,
            "violation_type": r.violation_type,
            "location": r.location,
            "date_time": r.date_time.isoformat(),
            "status": r.status,
            "fine_amount": r.fine_amount
        })
        
    # Monthly Trend (last 6 months)
    monthly_trend = []
    # Fill in mock/real data depending on historical records
    for i in range(5, -1, -1):
        month_date = today - datetime.timedelta(days=i*30)
        start_of_month = datetime.datetime(month_date.year, month_date.month, 1)
        if month_date.month == 12:
            end_of_month = datetime.datetime(month_date.year + 1, 1, 1)
        else:
            end_of_month = datetime.datetime(month_date.year, month_date.month + 1, 1)
            
        count = db.query(func.count(Violation.id)).filter(
            Violation.date_time >= start_of_month,
            Violation.date_time < end_of_month
        ).scalar() or 0
        
        monthly_trend.append({
            "month": start_of_month.strftime("%b %Y"),
            "violations": count
        })
        
    # Hourly Trend (last 24 hours of detections / violations)
    hourly_trend = []
    for hour in range(24):
        # Return mock / standard distribution or query DB
        hourly_trend.append({
            "hour": f"{hour:02d}:00",
            "violations": int((func.sin(hour/3.0) + 1.2) * 5) # generates a smooth daily curve for demo
        })
        
    return {
        "total_vehicles": total_vehicles,
        "total_violations": total_violations,
        "todays_violations": todays_violations,
        "unpaid_fines_sum": float(unpaid_fines),
        "paid_fines_sum": float(paid_fines),
        "violations_by_type": by_type,
        "violations_by_status": by_status,
        "recent_activity": recent_activity,
        "monthly_trend": monthly_trend,
        "hourly_trend": hourly_trend,
        "camera_status": camera_counts
    }
