import datetime
import random
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import User, Camera, Vehicle, Violation, SystemSetting
from backend.auth import get_password_hash

def seed_db():
    # Recreate tables (safe for local sqlite/postgres)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).first():
            print("Database already seeded.")
            return

        print("Seeding database...")

        # 1. Users
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            name="Traffic Admin",
            email="admin@smartcity.gov.in",
            badge_number="ADMIN-001",
            role="admin",
            status="active"
        )
        officer = User(
            username="officer",
            password_hash=get_password_hash("officer123"),
            name="Officer Jaspreet",
            email="jaspreet@smartcity.gov.in",
            badge_number="PB-03-934",
            role="officer",
            status="active"
        )
        db.add(admin)
        db.add(officer)

        # 2. Cameras
        cams = [
            Camera(id="CAM-101", name="Madhya Marg Crossing", location="Madhya Marg, Sector 26", latitude=30.7398, longitude=76.7827, ip_address="192.168.1.101", status="online", health_score=98),
            Camera(id="CAM-102", name="Sector 17 Plaza", location="Sector 17 Bus Stand Junction", latitude=30.7423, longitude=76.7790, ip_address="192.168.1.102", status="online", health_score=95),
            Camera(id="CAM-103", name="Himalaya Marg Chowk", location="Himalaya Marg, Sector 34", latitude=30.7315, longitude=76.7681, ip_address="192.168.1.103", status="online", health_score=99),
            Camera(id="CAM-104", name="Tribune Chowk Flyover", location="Tribune Chowk, Sector 29", latitude=30.7061, longitude=76.7938, ip_address="192.168.1.104", status="offline", health_score=72),
            Camera(id="CAM-105", name="Jan Marg Entry Lane", location="Jan Marg, Sector 10", latitude=30.7511, longitude=76.7902, ip_address="192.168.1.105", status="online", health_score=100)
        ]
        for cam in cams:
            db.add(cam)

        # 3. Settings
        settings_data = [
            SystemSetting(key="ai_confidence_threshold", value="0.25", description="Minimum confidence for object detection"),
            SystemSetting(key="speed_limit_kmh", value="60.0", description="Speed limit threshold for overspeeding"),
            SystemSetting(key="email_notifications", value="true", description="Enable automated email notifications to vehicle owners"),
            SystemSetting(key="fine_red_light", value="1000.0", description="Fine amount for red light jumping"),
            SystemSetting(key="fine_overspeeding", value="2000.0", description="Fine amount for overspeeding"),
            SystemSetting(key="fine_no_helmet", value="1000.0", description="Fine amount for riding without helmet"),
            SystemSetting(key="fine_no_seatbelt", value="1000.0", description="Fine amount for driving without seatbelt"),
            SystemSetting(key="fine_illegal_parking", value="500.0", description="Fine amount for illegal parking")
        ]
        for s in settings_data:
            db.add(s)

        # 4. Vehicles
        vehicles = [
            Vehicle(plate_number="CH01-GA-3421", vehicle_type="car", brand="Honda City", color="White", owner_name="Jaspreet Singh", owner_email="jaspreet@demo.com", registration_status="valid", pollution_status="valid"),
            Vehicle(plate_number="DL3C-AY-8854", vehicle_type="car", brand="Hyundai Creta", color="Black", owner_name="Aarav Sharma", owner_email="aarav@demo.com", registration_status="valid", pollution_status="valid"),
            Vehicle(plate_number="HR26-DF-4402", vehicle_type="motorcycle", brand="Royal Enfield", color="Silver", owner_name="Priya Patel", owner_email="priya@demo.com", registration_status="valid", pollution_status="expired"),
            Vehicle(plate_number="MH12-QK-9921", vehicle_type="car", brand="Suzuki Swift", color="Red", owner_name="Vikram Rathore", owner_email="vikram@demo.com", registration_status="expired", pollution_status="valid"),
            Vehicle(plate_number="UP16-TY-0089", vehicle_type="truck", brand="Tata 407", color="Yellow", owner_name="Neha Gupta", owner_email="neha@demo.com", registration_status="valid", pollution_status="valid")
        ]
        for v in vehicles:
            db.add(v)
            
        db.commit() # Commit to get vehicle and camera IDs

        # 5. Violations
        # Generate some mock historical violations
        violation_types = ["red_light_jump", "wrong_lane", "overspeeding", "no_helmet", "no_seatbelt", "using_mobile"]
        descriptions = {
            "red_light_jump": "Crossed stop line 2.4s after light turned red",
            "wrong_lane": "Driving in dedicated BRTS bus lane",
            "overspeeding": "Recorded speed: 78 km/h in 60 km/h zone",
            "no_helmet": "Rider detected without protective headgear",
            "no_seatbelt": "Front seat passenger detected without seatbelt worn",
            "using_mobile": "Driver using mobile phone device while in motion"
        }
        
        fines = {
            "red_light_jump": 1000.0,
            "wrong_lane": 500.0,
            "overspeeding": 2000.0,
            "no_helmet": 1000.0,
            "no_seatbelt": 1000.0,
            "using_mobile": 1500.0
        }
        
        locations = [
            "Madhya Marg, Sector 26",
            "Sector 17 Bus Stand Junction",
            "Himalaya Marg, Sector 34",
            "Tribune Chowk, Sector 29",
            "Jan Marg, Sector 10"
        ]

        now = datetime.datetime.utcnow()
        for i in range(12):
            v_type = random.choice(violation_types)
            cam = random.choice(cams)
            veh = random.choice(vehicles)
            
            # Days offset to spread out logs
            days_offset = random.randint(0, 15)
            hours_offset = random.randint(0, 23)
            minutes_offset = random.randint(0, 59)
            v_time = now - datetime.timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset)
            
            # Status distribution
            v_status = "paid" if i % 3 == 0 else ("resolved" if i % 5 == 0 else "pending")
            
            violation = Violation(
                vehicle_id=veh.id,
                camera_id=cam.id,
                violation_type=v_type,
                date_time=v_time,
                location=cam.location,
                fine_amount=fines.get(v_type, 1000.0),
                evidence_image_path="/uploads/evidence_images/demo_evidence.jpg", # Placeholder path
                evidence_video_path="/uploads/evidence_videos/demo_video.mp4" if v_type == "overspeeding" else None,
                bounding_box_data={"simulated": True, "details": descriptions[v_type]},
                ocr_confidence=round(random.uniform(85.0, 99.0), 2),
                status=v_status,
                officer_notes=f"System verified. {descriptions[v_type]}."
            )
            db.add(violation)
            
        db.commit()
        print("Database seeded successfully with demo records.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
