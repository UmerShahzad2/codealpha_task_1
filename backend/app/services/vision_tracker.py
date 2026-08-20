import os
import time
import math
from collections import OrderedDict
from typing import List, Dict, Any, Tuple, Optional
import cv2
import numpy as np
from app.utils.logger import logger
from app.config import settings

COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
    "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
    "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
    "hair drier", "toothbrush"
]

class CentroidTracker:
    def __init__(self, max_disappeared: int = 15):
        self.next_object_id = 1
        self.objects = OrderedDict()
        self.disappeared = OrderedDict()
        self.object_classes = OrderedDict()
        self.max_disappeared = max_disappeared

    def register(self, centroid: Tuple[int, int], class_name: str):
        self.objects[self.next_object_id] = centroid
        self.disappeared[self.next_object_id] = 0
        self.object_classes[self.next_object_id] = class_name
        self.next_object_id += 1

    def deregister(self, object_id: int):
        del self.objects[object_id]
        del self.disappeared[object_id]
        if object_id in self.object_classes:
            del self.object_classes[object_id]

    def update(self, rects: List[Tuple[int, int, int, int, str]]) -> Dict[int, Tuple[Tuple[int, int], str]]:
        if len(rects) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return {obj_id: (centroid, self.object_classes[obj_id]) for obj_id, centroid in self.objects.items()}

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        input_classes = []
        for i, (startX, startY, endX, endY, cls_name) in enumerate(rects):
            cX = int((startX + endX) / 2.0)
            cY = int((startY + endY) / 2.0)
            input_centroids[i] = (cX, cY)
            input_classes.append(cls_name)

        if len(self.objects) == 0:
            for i in range(0, len(input_centroids)):
                self.register(tuple(input_centroids[i]), input_classes[i])
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())

            D = np.zeros((len(object_centroids), len(input_centroids)), dtype="float")
            for i in range(len(object_centroids)):
                for j in range(len(input_centroids)):
                    D[i, j] = math.hypot(object_centroids[i][0] - input_centroids[j][0], object_centroids[i][1] - input_centroids[j][1])

            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue
                if D[row, col] > 150:
                    continue

                object_id = object_ids[row]
                self.objects[object_id] = tuple(input_centroids[col])
                self.disappeared[object_id] = 0
                self.object_classes[object_id] = input_classes[col]

                used_rows.add(row)
                used_cols.add(col)

            unused_rows = set(range(0, D.shape[0])).difference(used_rows)
            unused_cols = set(range(0, D.shape[1])).difference(used_cols)

            if D.shape[0] >= D.shape[1]:
                for row in unused_rows:
                    object_id = object_ids[row]
                    self.disappeared[object_id] += 1
                    if self.disappeared[object_id] > self.max_disappeared:
                        self.deregister(object_id)
            else:
                for col in unused_cols:
                    self.register(tuple(input_centroids[col]), input_classes[col])

        return {obj_id: (centroid, self.object_classes[obj_id]) for obj_id, centroid in self.objects.items()}

class VisionEngine:
    def __init__(self):
        self.yolo_model = None
        self._load_yolo_model()

    def _load_yolo_model(self):
        try:
            from ultralytics import YOLO
            model_path = settings.YOLO_MODEL_PATH
            self.yolo_model = YOLO(model_path)
            logger.info("YOLOv8 model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not initialize YOLO model directly: {str(e)}. Using fallback vision pipeline.")
            self.yolo_model = None

    def process_frame(
        self,
        frame: np.ndarray,
        tracker: CentroidTracker,
        conf_threshold: float = 0.5
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        height, width = frame.shape[:2]
        rects = []
        detections_info = []

        if self.yolo_model is not None:
            try:
                infer_img = cv2.resize(frame, (320, 240))
                scale_x = width / 320.0
                scale_y = height / 240.0

                results = self.yolo_model(infer_img, conf=conf_threshold, imgsz=320, verbose=False)[0]
                for box in results.boxes:
                    bx1, by1, bx2, by2 = map(float, box.xyxy[0].tolist())
                    x1, y1 = int(bx1 * scale_x), int(by1 * scale_y)
                    x2, y2 = int(bx2 * scale_x), int(by2 * scale_y)
                    conf = float(box.conf[0].item())
                    cls_id = int(box.cls[0].item())
                    cls_name = COCO_CLASSES[cls_id] if cls_id < len(COCO_CLASSES) else f"class_{cls_id}"

                    rects.append((x1, y1, x2, y2, cls_name))
                    detections_info.append({
                        "class_name": cls_name,
                        "confidence": round(conf, 2),
                        "bbox": [x1, y1, x2, y2]
                    })
            except Exception as e:
                logger.error(f"YOLO frame processing error: {str(e)}")



        tracked_objects = tracker.update(rects)

        output_frame = frame.copy()
        class_counts = {}
        for (startX, startY, endX, endY, cls_name) in rects:
            class_counts[cls_name] = class_counts.get(cls_name, 0) + 1
            cv2.rectangle(output_frame, (startX, startY), (endX, endY), (0, 220, 130), 2)

        for obj_id, (centroid, cls_name) in tracked_objects.items():
            text = f"ID #{obj_id}: {cls_name}"
            cv2.putText(output_frame, text, (centroid[0] - 20, centroid[1] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
            cv2.circle(output_frame, (centroid[0], centroid[1]), 4, (0, 255, 255), -1)

        summary = {
            "object_count": len(rects),
            "total_tracked_objects": tracker.next_object_id - 1,
            "class_counts": class_counts,
            "detections": detections_info
        }

        return output_frame, summary

    def generate_synthetic_frame(self, frame_count: int, width: int = 640, height: int = 480) -> np.ndarray:
        frame = np.zeros((height, width, 3), dtype=np.uint8)

        for y in range(height):
            v = int(20 + 25 * (y / height))
            frame[y, :] = (v, v + 10, v + 25)

        t = frame_count * 0.05
        p_x = int(width / 2 + math.sin(t) * (width / 3))
        p_y = int(height / 2 + math.cos(t * 0.7) * (height / 4))

        c_x = int(width / 2 + math.cos(t * 1.2) * (width / 3))
        c_y = int(height / 2 + math.sin(t * 0.9) * (height / 4))

        cv2.circle(frame, (p_x, p_y), 30, (255, 120, 0), -1)
        cv2.rectangle(frame, (c_x - 50, c_y - 30), (c_x + 50, c_y + 30), (0, 180, 255), -1)

        cv2.putText(frame, "NEXUS VISIONTRACK DEMO FEED", (20, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (240, 240, 240), 2)

        return frame

vision_engine = VisionEngine()
