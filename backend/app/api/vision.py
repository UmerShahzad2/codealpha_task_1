import os
import time
import base64
import shutil
from typing import List, Optional, Any
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DetectionSession
from app.services.vision_tracker import vision_engine, CentroidTracker
from app.utils.logger import logger

router = APIRouter(prefix="/api/v1/vision", tags=["VisionTrack"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _generate_mjpeg_stream(source: Any, conf: float, db: Session, source_type: str = "webcam", flip: bool = True):
    tracker = CentroidTracker()
    frame_count = 0
    start_time = time.time()
    total_objects_tracked = 0
    all_class_counts = {}

    if isinstance(source, int) or (isinstance(source, str) and os.path.exists(source)):
        cap = cv2.VideoCapture(source)
    else:
        cap = None

    last_summary = {"total_tracked_objects": 0, "class_counts": {}, "detections": []}
    cached_processed_frame = None

    try:
        while True:
            if cap is not None and cap.isOpened():
                ret, raw_frame = cap.read()
                if not ret:
                    if isinstance(source, str):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    else:
                        break
                if flip and isinstance(source, int):
                    raw_frame = cv2.flip(raw_frame, 1)

                h, w = raw_frame.shape[:2]
                if w > 640:
                    frame = cv2.resize(raw_frame, (640, int(h * (640 / w))))
                else:
                    frame = raw_frame
            else:
                frame_count += 1
                frame = vision_engine.generate_synthetic_frame(frame_count)
                time.sleep(0.02)

            frame_count += 1

            if frame_count % 2 == 0 or cached_processed_frame is None:
                processed_frame, summary = vision_engine.process_frame(frame, tracker, conf_threshold=conf)
                last_summary = summary
                cached_processed_frame = processed_frame
            else:
                processed_frame = cached_processed_frame
                summary = last_summary

            total_objects_tracked = summary.get("total_tracked_objects", 0)
            for k, v in summary.get("class_counts", {}).items():
                all_class_counts[k] = max(all_class_counts.get(k, 0), v)

            elapsed = time.time() - start_time
            fps = round(frame_count / elapsed, 1) if elapsed > 0 else 30.0

            display_frame = processed_frame.copy()
            cv2.putText(display_frame, f"FPS: {fps} | Tracked: {total_objects_tracked}", (20, display_frame.shape[0] - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2)

            ret, buffer = cv2.imencode(".jpg", display_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
            if not ret:
                continue

            frame_bytes = buffer.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

    finally:
        if cap is not None:
            cap.release()

        duration = time.time() - start_time
        if frame_count > 10:
            import json
            session_rec = DetectionSession(
                source_type=source_type,
                duration_seconds=round(duration, 2),
                total_frames=frame_count,
                total_objects_tracked=total_objects_tracked,
                class_counts_json=json.dumps(all_class_counts)
            )
            db.add(session_rec)
            db.commit()

@router.get("/stream/webcam")
def stream_webcam(
    conf: float = Query(0.55, ge=0.1, le=0.9),
    camera_id: int = Query(0, ge=0),
    flip: bool = Query(True),
    db: Session = Depends(get_db)
):
    return StreamingResponse(
        _generate_mjpeg_stream(camera_id, conf, db, source_type=f"webcam_{camera_id}", flip=flip),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/stream/demo")
def stream_demo(
    conf: float = Query(0.55, ge=0.1, le=0.9),
    db: Session = Depends(get_db)
):
    return StreamingResponse(
        _generate_mjpeg_stream("demo", conf, db, source_type="synthetic_demo", flip=False),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/stream/video/{filename}")
def stream_video(
    filename: str,
    conf: float = Query(0.55, ge=0.1, le=0.9),
    db: Session = Depends(get_db)
):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    return StreamingResponse(
        _generate_mjpeg_stream(file_path, conf, db, source_type=f"video_{filename}", flip=False),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.post("/upload-video")
def upload_video(file: UploadFile = File(...)):
    allowed_exts = [".mp4", ".avi", ".webm", ".mov", ".mkv"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file format {ext}. Allowed: {allowed_exts}")

    filename = f"{int(time.time())}_{file.filename}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": "success",
        "filename": filename,
        "original_name": file.filename,
        "stream_url": f"/api/v1/vision/stream/video/{filename}"
    }

@router.post("/detect-image")
def detect_image(
    file: UploadFile = File(...),
    conf: float = Query(0.55, ge=0.1, le=0.9)
):
    contents = file.file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image file format")

    tracker = CentroidTracker()
    processed_frame, summary = vision_engine.process_frame(frame, tracker, conf_threshold=conf)

    ret, buffer = cv2.imencode(".jpg", processed_frame)
    b64_image = base64.b64encode(buffer).decode("utf-8")

    return {
        "status": "success",
        "summary": summary,
        "processed_image_b64": f"data:image/jpeg;base64,{b64_image}"
    }

@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(DetectionSession).order_by(DetectionSession.created_at.desc()).limit(20).all()
    import json
    return [
        {
            "id": s.id,
            "source_type": s.source_type,
            "duration_seconds": s.duration_seconds,
            "total_frames": s.total_frames,
            "total_objects_tracked": s.total_objects_tracked,
            "class_counts": json.loads(s.class_counts_json or "{}"),
            "created_at": s.created_at
        }
        for s in sessions
    ]
