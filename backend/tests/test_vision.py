import numpy as np
import cv2
from app.services.vision_tracker import CentroidTracker, vision_engine

def test_centroid_tracker():
    tracker = CentroidTracker(max_disappeared=5)
    rects = [(10, 10, 50, 50, "person"), (100, 100, 150, 150, "car")]
    objects = tracker.update(rects)
    assert len(objects) == 2
    assert 1 in objects
    assert 2 in objects

def test_vision_engine_process_frame():
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    tracker = CentroidTracker()
    output, summary = vision_engine.process_frame(frame, tracker)
    assert output is not None
    assert "total_tracked_objects" in summary
