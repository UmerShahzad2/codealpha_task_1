# Technical Architecture — Nexus AI Lab

## Overview

Nexus AI Lab is structured as a decoupled monorepo comprising a Python FastAPI REST backend, a React TypeScript frontend, and an integrated SQLite data tier.

```
+-----------------------------------------------------------------------+
|                             REACT FRONTEND                            |
| (Vite + TypeScript + Tailwind CSS + Recharts + Lucide Icons)           |
+-----------------------------------+-----------------------------------+
                                    | REST / HTTP API & MJPEG Stream
                                    v
+-----------------------------------------------------------------------+
|                            FASTAPI BACKEND                            |
|                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | LinguaFlow Engine |  | FAQMind Engine    |  | VisionTrack Engine|  |
|  | (deep-translator) |  | (TF-IDF Cosine)   |  | (OpenCV + YOLO)   |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|                                                                       |
+-----------------------------------+-----------------------------------+
                                    | SQLAlchemy ORM
                                    v
+-----------------------------------------------------------------------+
|                            SQLITE DATABASE                            |
| (TranslationHistory, FAQItem, ChatSession, ChatMessage, Detection)    |
+-----------------------------------------------------------------------+
```

## NLP FAQ Pipeline Architecture

The FAQMind engine operates via an explainable, deterministic vector space model:

1. **Preprocessing**: Input queries undergo lowercasing, punctuation stripping, tokenization, and stop-word filtering.
2. **Feature Extraction**: TF-IDF (Term Frequency-Inverse Document Frequency) vectorization with unigram and bigram feature ranges (`ngram_range=(1, 2)`).
3. **Similarity Calculation**: Cosine similarity is computed between the query vector and pre-indexed FAQ document vectors.
4. **Threshold Evaluation**:
   - `Similarity >= Threshold` (default 0.45): Returns matched answer, intent category, confidence score, and top 3 related FAQ suggestions.
   - `Similarity < Threshold`: Triggers fallback handling, logs query into `UnmatchedQuery` table, and returns top 3 related FAQ suggestions.

## VisionTrack Computer Vision Engine

VisionTrack processes video inputs frame-by-frame:

1. **Object Detection**: YOLOv8 neural network inference computes bounding box coordinates `[x1, y1, x2, y2]`, class labels, and confidence metrics.
2. **Centroid Tracking**: Bounding box centers `(cX, cY)` are tracked across consecutive frames. Euclidean distance minimization assigns persistent track IDs (`#1`, `#2`, ...).
3. **MJPEG Streaming**: Processed frames are drawn with bounding boxes, labels, and tracking telemetry overlay before being encoded to JPEG bytes and streamed via FastAPI `StreamingResponse`.

## Database Schema Design

- `translation_history`: Persists source text, target text, language codes, character count, and provider used.
- `faq_items`: Stores FAQ questions, answers, categories, keywords, and creation timestamps.
- `chat_sessions` & `chat_messages`: Maintains multi-turn conversation logs and intent confidence metrics.
- `unmatched_queries`: Tracks low-confidence user queries for administrator review and knowledge base expansion.
- `detection_sessions`: Records video stream metrics, frame totals, tracked object counts, and per-class breakdowns.
