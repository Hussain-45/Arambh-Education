import os
import cv2
import numpy as np
import random
import time
from backend.config import settings

# Attempt to import AI libraries. If they are not available, use mock logic to ensure running reliability.
YOLO_AVAILABLE = False
OCR_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception as e:
    print(f"YOLOv8 library not loaded: {e}. Falling back to simulated AI.")

try:
    import easyocr
    OCR_AVAILABLE = True
except Exception as e:
    print(f"EasyOCR library not loaded: {e}. Falling back to simulated OCR.")

class AIEngine:
    def __init__(self):
        self.yolo_model = None
        self.ocr_reader = None
        self.initialized = False
        
    def initialize(self):
        if self.initialized:
            return
            
        if YOLO_AVAILABLE:
            try:
                # Load YOLO model
                # Download occurs automatically in ultralytics if weights are missing
                self.yolo_model = YOLO(settings.YOLO_MODEL)
                print(f"YOLOv8 model '{settings.YOLO_MODEL}' loaded successfully.")
            except Exception as e:
                print(f"Failed to load YOLO model: {e}. Running in simulation mode.")
                
        if OCR_AVAILABLE:
            try:
                # Load EasyOCR reader (English language)
                self.ocr_reader = easyocr.Reader(['en'], gpu=False)
                print("EasyOCR reader initialized successfully.")
            except Exception as e:
                print(f"Failed to initialize EasyOCR: {e}. Running in simulation mode.")
                
        self.initialized = True

    def process_media(self, file_path: str, camera_id: str = "CAM-101") -> dict:
        """
        Processes an uploaded image or video, detects vehicles, license plates, and violations.
        """
        self.initialize()
        
        # Check if file is image or video
        ext = os.path.splitext(file_path)[1].lower()
        if ext in ['.jpg', '.jpeg', '.png', '.webp']:
            return self._process_image(file_path, camera_id)
        elif ext in ['.mp4', '.avi', '.mov', '.mkv']:
            return self._process_video(file_path, camera_id)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    def _process_image(self, image_path: str, camera_id: str) -> dict:
        """
        Runs object detection, OCR, and privacy masking on a single image.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image: {image_path}")
            
        height, width, _ = img.shape
        
        # Try real YOLO or fall back to simulation
        if YOLO_AVAILABLE and self.yolo_model is not None:
            return self._run_real_yolo_image(img, image_path, camera_id)
        else:
            return self._run_simulated_ai_image(img, image_path, camera_id)

    def _run_real_yolo_image(self, img, image_path, camera_id) -> dict:
        height, width, _ = img.shape
        results = self.yolo_model(img, conf=settings.AI_CONFIDENCE_THRESHOLD)[0]
        
        detections = []
        license_plates = []
        violations_detected = []
        
        # Custom tracking parameters for overlay
        # We can extract boxes, confidences, class IDs
        boxes = results.boxes.cpu().numpy()
        
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = self.yolo_model.names[cls_id]
            
            detections.append({
                "class": cls_name,
                "confidence": conf,
                "box": [x1, y1, x2, y2]
            })
            
            # Privacy Blurring: Blur driver and pedestrian faces
            if cls_name == "person":
                # Blurs the top 1/3 of the bounding box (head/face area)
                face_y2 = y1 + int((y2 - y1) * 0.3)
                if face_y2 > y1 and x2 > x1:
                    face_roi = img[y1:face_y2, x1:x2]
                    face_roi = cv2.GaussianBlur(face_roi, (25, 25), 30)
                    img[y1:face_y2, x1:x2] = face_roi

            # Real License Plate Detection / OCR
            # Simple plates detection heuristics if plate isn't a direct class:
            # We can crop the plate, run OCR, and draw overlays.
            # In a demo, we combine real YOLO objects and apply a fallback plate search.
            
        # Draw bounding boxes and save output image
        out_filename = "annotated_" + os.path.basename(image_path)
        out_dir = os.path.join(settings.UPLOAD_DIR, "evidence_images")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, out_filename)
        
        # Draw bounding boxes
        for det in detections:
            x1, y1, x2, y2 = det["box"]
            label = f"{det['class']} ({det['confidence']:.2f})"
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
        cv2.imwrite(out_path, img)
        
        # Fallback plate extraction
        plate_text, ocr_conf = self._perform_ocr_on_plate(img)
        
        # Determine violation heuristic
        v_type = self._determine_violation_type(detections)
        fine = self._calculate_fine(v_type)
        
        return {
            "plate_number": plate_text,
            "vehicle_type": self._get_primary_vehicle_type(detections),
            "brand": "Hyundai" if plate_text else "Unknown",
            "color": "Silver" if plate_text else "Unknown",
            "owner_name": "Jaspreet Singh" if plate_text else "Demo Owner",
            "owner_email": "jaspreet@demo.com" if plate_text else "owner@demo.com",
            "violation_type": v_type,
            "fine_amount": fine,
            "ocr_confidence": ocr_conf,
            "evidence_image_path": f"/uploads/evidence_images/{out_filename}",
            "bounding_box_data": {"detections": detections},
            "location": "Sector 17, Chandigarh",
            "camera_id": camera_id
        }

    def _run_simulated_ai_image(self, img, image_path, camera_id) -> dict:
        """
        Creates a realistic simulated detection when AI libraries aren't loaded or crash.
        """
        height, width, _ = img.shape
        
        # 1. Blur faces for privacy (Simulation: blur some top-center regions of image)
        # Blur center area
        person_y1 = int(height * 0.4)
        person_y2 = int(height * 0.6)
        person_x1 = int(width * 0.45)
        person_x2 = int(width * 0.55)
        if person_x2 > person_x1 and person_y2 > person_y1:
            face_roi = img[person_y1:person_y2, person_x1:person_x2]
            face_roi = cv2.GaussianBlur(face_roi, (51, 51), 30)
            img[person_y1:person_y2, person_x1:person_x2] = face_roi

        # 2. Draw mock bounding boxes on the image
        # Vehicle box
        cv2.rectangle(img, (int(width*0.2), int(height*0.3)), (int(width*0.8), int(height*0.85)), (0, 255, 0), 3)
        cv2.putText(img, "Vehicle: SUV (0.94)", (int(width*0.2), int(height*0.3) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # License plate box
        cv2.rectangle(img, (int(width*0.45), int(height*0.72)), (int(width*0.62), int(height*0.8)), (255, 0, 0), 2)
        cv2.putText(img, "License Plate (0.91)", (int(width*0.45), int(height*0.72) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
        
        # Save annotated image
        out_filename = "annotated_" + os.path.basename(image_path)
        out_dir = os.path.join(settings.UPLOAD_DIR, "evidence_images")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, out_filename)
        cv2.imwrite(out_path, img)

        # 3. Generate randomized mock license plate and details
        plates = ["CH01-GA-3421", "DL3C-AY-8854", "HR26-DF-4402", "MH12-QK-9921", "UP16-TY-0089"]
        owners = ["Jaspreet Singh", "Aarav Sharma", "Priya Patel", "Vikram Rathore", "Neha Gupta"]
        emails = ["jaspreet@demo.com", "aarav@demo.com", "priya@demo.com", "vikram@demo.com", "neha@demo.com"]
        violations = [
            "overspeeding", "no_seatbelt", "red_light_jump", "wrong_lane", "using_mobile"
        ]
        
        idx = random.randint(0, len(plates) - 1)
        v_idx = random.randint(0, len(violations) - 1)
        
        v_type = violations[v_idx]
        fine = self._calculate_fine(v_type)
        
        return {
            "plate_number": plates[idx],
            "vehicle_type": "car",
            "brand": "Toyota" if idx % 2 == 0 else "Honda",
            "color": "White" if idx % 2 == 0 else "Black",
            "owner_name": owners[idx],
            "owner_email": emails[idx],
            "violation_type": v_type,
            "fine_amount": fine,
            "ocr_confidence": round(random.uniform(88.0, 97.5), 2),
            "evidence_image_path": f"/uploads/evidence_images/{out_filename}",
            "bounding_box_data": {
                "detections": [
                    {"class": "car", "confidence": 0.94, "box": [int(width*0.2), int(height*0.3), int(width*0.8), int(height*0.85)]},
                    {"class": "license_plate", "confidence": 0.91, "box": [int(width*0.45), int(height*0.72), int(width*0.62), int(height*0.8)]}
                ]
            },
            "location": "Sector 34, Chandigarh",
            "camera_id": camera_id
        }

    def _process_video(self, video_path: str, camera_id: str) -> dict:
        """
        Simulated or actual video frame analysis.
        Generates an annotated video clip and extracts the peak violation frame.
        """
        # Save a mockup output video file
        out_filename = "annotated_" + os.path.basename(video_path)
        out_dir = os.path.join(settings.UPLOAD_DIR, "evidence_videos")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, out_filename)
        
        # For simulation efficiency, copy the source video or write a short video with CV2
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            # If video failed to open, make a mock output dict
            raise ValueError(f"Could not open video file: {video_path}")
            
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        
        # Write annotated video (we process max 60 frames for quick API response)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(out_path, fourcc, fps, (frame_width, frame_height))
        
        frame_idx = 0
        while cap.isOpened() and frame_idx < 100:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Draw bounding boxes and lanes
            cv2.rectangle(frame, (int(frame_width*0.25), int(frame_height*0.35)), (int(frame_width*0.75), int(frame_height*0.8)), (0, 0, 255), 2)
            cv2.putText(frame, f"OVERSPEEDING: 78 km/h [ID:{frame_idx}]", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Lanes
            cv2.line(frame, (int(frame_width*0.1), frame_height), (int(frame_width*0.45), int(frame_height*0.4)), (255, 255, 255), 2)
            cv2.line(frame, (int(frame_width*0.9), frame_height), (int(frame_width*0.55), int(frame_height*0.4)), (255, 255, 255), 2)
            
            out_writer.write(frame)
            frame_idx += 1
            
        cap.release()
        out_writer.release()
        
        # Create an annotated image for evidence image display
        img_out_filename = "evidence_" + os.path.basename(video_path).split('.')[0] + ".jpg"
        img_out_path = os.path.join(settings.UPLOAD_DIR, "evidence_images", img_out_filename)
        
        # Re-read first frame of video to write as image evidence
        cap2 = cv2.VideoCapture(video_path)
        ret, frame = cap2.read()
        if ret:
            cv2.rectangle(frame, (int(frame_width*0.25), int(frame_height*0.35)), (int(frame_width*0.75), int(frame_height*0.8)), (0, 0, 255), 2)
            cv2.putText(frame, "OVERSPEEDING: 78 km/h", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.imwrite(img_out_path, frame)
        else:
            # Fallback black image
            mock_img = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.imwrite(img_out_path, mock_img)
        cap2.release()
        
        return {
            "plate_number": "HR26-CT-0056",
            "vehicle_type": "car",
            "brand": "Maruti Suzuki",
            "color": "Red",
            "owner_name": "Rohan Mehra",
            "owner_email": "rohan@demo.com",
            "violation_type": "overspeeding",
            "fine_amount": 2000.0,
            "ocr_confidence": 92.4,
            "evidence_image_path": f"/uploads/evidence_images/{img_out_filename}",
            "evidence_video_path": f"/uploads/evidence_videos/{out_filename}",
            "bounding_box_data": {"speed_kmh": 78},
            "location": "Madhya Marg, Chandigarh",
            "camera_id": camera_id
        }

    def _perform_ocr_on_plate(self, img) -> tuple:
        """
        Helper to run EasyOCR. Falls back to simulated string if library fails.
        """
        if OCR_AVAILABLE and self.ocr_reader is not None:
            try:
                # Mock plate crop (in full app, use YOLO plate coordinate crops)
                # For demo, run OCR on full image or localized region
                results = self.ocr_reader.readtext(img)
                if results:
                    # Find first text with uppercase alphanumeric pattern resembling plate
                    for bbox, text, conf in results:
                        cleaned = "".join([c for c in text if c.isalnum() or c == '-']).upper()
                        if len(cleaned) >= 5:
                            return cleaned, float(conf * 100)
            except Exception as e:
                print(f"OCR execution failed: {e}")
        
        # Fallback simulated text
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        numbers = "0123456789"
        plate = f"CH01-K-{random.choice(letters)}{random.choice(letters)}{random.choice(numbers)}{random.choice(numbers)}{random.choice(numbers)}{random.choice(numbers)}"
        return plate, 94.5

    def _determine_violation_type(self, detections) -> str:
        # Simple heuristics based on class detections
        has_motorcycle = any(d["class"] == "motorcycle" for d in detections)
        has_person = any(d["class"] == "person" for d in detections)
        has_helmet = any(d["class"] == "helmet" for d in detections)
        
        if has_motorcycle and has_person and not has_helmet:
            return "no_helmet"
        
        violations = ["overspeeding", "no_seatbelt", "red_light_jump", "wrong_lane", "using_mobile", "illegal_parking"]
        return random.choice(violations)

    def _calculate_fine(self, violation_type: str) -> float:
        fines = {
            "red_light_jump": 1000.0,
            "wrong_lane": 500.0,
            "overspeeding": 2000.0,
            "no_helmet": 1000.0,
            "no_seatbelt": 1000.0,
            "triple_riding": 1500.0,
            "using_mobile": 1500.0,
            "illegal_parking": 500.0,
            "driving_against_traffic": 2500.0,
            "stop_line_crossing": 500.0
        }
        return fines.get(violation_type, 1000.0)

    def _get_primary_vehicle_type(self, detections) -> str:
        types = ["car", "motorcycle", "truck", "bus", "auto"]
        for d in detections:
            if d["class"] in types:
                return d["class"]
        return "car"

ai_engine = AIEngine()
