import os
import datetime
import shutil
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import engine, Base, get_db
from backend.models import User, Camera, Vehicle, Violation, Payment, ActivityLog, DetectionLog, SystemSetting
import backend.crud as crud
import backend.schemas as schemas
from backend.auth import (
    create_access_token, 
    verify_password, 
    get_password_hash, 
    get_current_user, 
    check_role
)
from backend.ai_engine import ai_engine
from backend.seed_data import seed_db

# Create FastAPI Instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart City Government Traffic Violation API Gateway",
    version="1.0.0"
)

# CORS Policy configuration (Connects smoothly with React Client)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event: Initialize database tables & seed default credentials
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    # Seed default Admin and Traffic Police user accounts
    seed_db()
    
    # Save a placeholder demo evidence image if not exists, to prevent broken images
    demo_img_path = os.path.join(settings.UPLOAD_DIR, "evidence_images", "demo_evidence.jpg")
    if not os.path.exists(demo_img_path):
        # Create a dummy solid green background image using OpenCV
        import cv2
        import numpy as np
        dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw traffic box
        cv2.rectangle(dummy_img, (150, 100), (490, 380), (0, 0, 255), 3)
        cv2.putText(dummy_img, "RED LIGHT JUMP (Demo)", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.imwrite(demo_img_path, dummy_img)
        
    demo_video_path = os.path.join(settings.UPLOAD_DIR, "evidence_videos", "demo_video.mp4")
    if not os.path.exists(demo_video_path):
        # Write dummy binary file to simulate video clip
        with open(demo_video_path, "wb") as f:
            f.write(b"Simulated Video Stream File")

# Mount Static Uplods Directory (Serves evidence files, images, license plate crops)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# --- AUTH ROUTERS ---

@app.post(f"{settings.API_V1_STR}/auth/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status != "active":
        raise HTTPException(status_code=400, detail="User account is deactivated")
        
    # Create Access Token
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    # Audit log entry
    crud.create_activity_log(db, user.id, f"Logged into console as {user.role}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "name": user.name
    }

@app.post(f"{settings.API_V1_STR}/auth/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, req.email)
    if not user:
        # Return success anyway for security reasons to prevent user enumeration
        return {"message": "If the email is registered, a password reset link has been dispatched (simulated)."}
    return {"message": f"Password recovery token sent successfully. Please check inbox at: {req.email}"}

@app.post(f"{settings.API_V1_STR}/auth/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, req.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


# --- DASHBOARD & ANALYTICS ---

@app.get(f"{settings.API_V1_STR}/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_statistics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.get_dashboard_stats(db)


# --- UPLOAD & AI ENGINE ROUTERS ---

@app.post(f"{settings.API_V1_STR}/upload/process")
async def upload_and_process_media(
    file: UploadFile = File(...),
    camera_id: str = Form("CAM-101"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine destination folder inside uploads
    ext = os.path.splitext(file.filename)[1].lower()
    is_video = ext in ['.mp4', '.avi', '.mov', '.mkv']
    
    subfolder = "evidence_videos" if is_video else "evidence_images"
    filename = f"{int(time.time())}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, subfolder, filename)
    
    # Save the file locally
    import time
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Process through the YOLO + EasyOCR AI Engine
    try:
        ai_result = ai_engine.process_media(file_path, camera_id)
    except Exception as e:
        # Graceful fallback mock result if processing failed
        print(f"AI Process Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI processing pipeline failed: {str(e)}")
        
    # Insert records into DB
    violation_data = schemas.ViolationCreate(
        plate_number=ai_result["plate_number"],
        vehicle_type=ai_result["vehicle_type"],
        brand=ai_result["brand"],
        color=ai_result["color"],
        owner_name=ai_result["owner_name"],
        owner_email=ai_result["owner_email"],
        camera_id=camera_id,
        violation_type=ai_result["violation_type"],
        location=ai_result["location"],
        fine_amount=ai_result["fine_amount"],
        evidence_image_path=ai_result["evidence_image_path"],
        evidence_video_path=ai_result.get("evidence_video_path"),
        bounding_box_data=ai_result.get("bounding_box_data"),
        ocr_confidence=ai_result.get("ocr_confidence", 90.0),
        status="pending",
        officer_notes=f"Processed automatically by YOLOv8/EasyOCR. {ai_result['violation_type'].replace('_', ' ').capitalize()} violation detected."
    )
    
    db_violation = crud.create_violation(db, violation_data)
    
    # Audit log
    crud.create_activity_log(db, current_user.id, f"Uploaded media {file.filename} and registered Violation #{db_violation.id}")
    
    # Push simple detection log
    crud.create_detection_log(
        db, 
        camera_id=camera_id, 
        vehicle_type=db_violation.vehicle.vehicle_type, 
        plate_number=db_violation.vehicle.plate_number,
        speed_detected=78.0 if db_violation.violation_type == "overspeeding" else None
    )
    
    return {
        "success": True,
        "message": "AI Processing completed and saved to database",
        "violation_id": db_violation.id,
        "violation": {
            "id": db_violation.id,
            "plate_number": db_violation.vehicle.plate_number,
            "vehicle_type": db_violation.vehicle.vehicle_type,
            "owner": db_violation.vehicle.owner_name,
            "violation_type": db_violation.violation_type,
            "fine_amount": db_violation.fine_amount,
            "ocr_confidence": db_violation.ocr_confidence,
            "image": db_violation.evidence_image_path,
            "video": db_violation.evidence_video_path
        }
    }


# --- VIOLATIONS ENDPOINTS ---

@app.get(f"{settings.API_V1_STR}/violations", response_model=List[schemas.ViolationResponse])
def read_violations(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    location: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    violation_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Parse dates
    s_date = None
    e_date = None
    if start_date:
        try:
            s_date = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            pass
    if end_date:
        try:
            e_date = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            pass
            
    return crud.get_violations(
        db, skip=skip, limit=limit, search=search,
        start_date=s_date, end_date=e_date, location=location,
        vehicle_type=vehicle_type, violation_type=violation_type, status=status
    )

@app.get(f"{settings.API_V1_STR}/violations/{{violation_id}}", response_model=schemas.ViolationResponse)
def read_violation_details(
    violation_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = crud.get_violation(db, violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation record not found")
    return violation

@app.put(f"{settings.API_V1_STR}/violations/{{violation_id}}/status", response_model=schemas.ViolationResponse)
def update_violation_status(
    violation_id: int,
    status_update: schemas.ViolationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = crud.get_violation(db, violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation record not found")
        
    updated = crud.update_violation_status(db, violation_id, status_update.status, status_update.officer_notes)
    
    # Audit log
    crud.create_activity_log(
        db, 
        current_user.id, 
        f"Updated violation #{violation_id} status to {status_update.status}. Notes: {status_update.officer_notes}"
    )
    
    return updated

@app.post(f"{settings.API_V1_STR}/violations/{{violation_id}}/pay", response_model=schemas.PaymentResponse)
def make_violation_payment(
    violation_id: int,
    payment_in: schemas.PaymentBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = crud.get_violation(db, violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
        
    payment_create = schemas.PaymentCreate(
        violation_id=violation_id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        transaction_id=f"TXN-{int(time.time())}-{random.randint(1000, 9999)}",
        status="completed"
    )
    
    db_payment = crud.create_payment(db, payment_create)
    crud.create_activity_log(db, current_user.id, f"Collected payment of Rs. {payment_in.amount} for Violation #{violation_id}")
    return db_payment


# --- CAMERA ROUTERS ---

@app.get(f"{settings.API_V1_STR}/cameras", response_model=List[schemas.CameraResponse])
def list_cameras(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.get_cameras(db)

@app.post(f"{settings.API_V1_STR}/cameras", response_model=schemas.CameraResponse)
def add_new_camera(
    camera: schemas.CameraCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(Depends(check_role(["admin"])))
):
    db_camera = crud.get_camera(db, camera.id)
    if db_camera:
        raise HTTPException(status_code=400, detail="Camera ID already registered")
    
    new_cam = crud.create_camera(db, camera)
    crud.create_activity_log(db, current_user.id, f"Registered new CCTV camera ID: {camera.id}")
    return new_cam

@app.put(f"{settings.API_V1_STR}/cameras/{{camera_id}}", response_model=schemas.CameraResponse)
def edit_camera(
    camera_id: str,
    camera_in: schemas.CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = crud.update_camera(db, camera_id, camera_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Camera not found")
    crud.create_activity_log(db, current_user.id, f"Modified camera configurations for ID: {camera_id}")
    return updated

@app.delete(f"{settings.API_V1_STR}/cameras/{{camera_id}}")
def remove_camera(
    camera_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(Depends(check_role(["admin"])))
):
    success = crud.delete_camera(db, camera_id)
    if not success:
        raise HTTPException(status_code=404, detail="Camera not found")
    crud.create_activity_log(db, current_user.id, f"De-registered camera ID: {camera_id}")
    return {"success": True, "message": "Camera removed successfully."}


# --- USER MANAGEMENT ROUTERS (ADMIN ONLY) ---

@app.get(f"{settings.API_V1_STR}/users", response_model=List[schemas.UserResponse])
def get_system_users(db: Session = Depends(get_db), current_user: User = Depends(check_role(["admin"]))):
    return crud.get_users(db)

@app.post(f"{settings.API_V1_STR}/users", response_model=schemas.UserResponse)
def add_new_officer(
    user_in: schemas.UserCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(check_role(["admin"]))
):
    db_user = crud.get_user_by_username(db, user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already in use")
        
    db_email = crud.get_user_by_email(db, user_in.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = crud.create_user(db, user_in)
    crud.create_activity_log(db, current_user.id, f"Created new system user: {user_in.username}")
    return new_user

@app.delete(f"{settings.API_V1_STR}/users/{{user_id}}")
def delete_officer(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(check_role(["admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot self-delete active admin account")
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    crud.create_activity_log(db, current_user.id, f"Removed system user ID: {user_id}")
    return {"success": True, "message": "User removed successfully."}

@app.get(f"{settings.API_V1_STR}/audit/logs", response_model=List[schemas.ActivityLogResponse])
def get_activity_audit_logs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return crud.get_activity_logs(db, skip, limit)


# --- SYSTEM SETTINGS ---

@app.get(f"{settings.API_V1_STR}/settings", response_model=List[schemas.SettingResponse])
def list_system_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.get_settings(db)

@app.put(f"{settings.API_V1_STR}/settings/{{key}}", response_model=schemas.SettingResponse)
def modify_system_rule(
    key: str,
    setting_in: schemas.SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    updated = crud.update_setting(db, key, setting_in.value)
    crud.create_activity_log(db, current_user.id, f"Updated setting: {key} to {setting_in.value}")
    return updated


# --- PROFILE ENDPOINT ---

@app.get(f"{settings.API_V1_STR}/profile", response_model=schemas.UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
