# CodeAlpha_NexusAILab — Enterprise AI Internship Project Suite

Unified AI platform developed for the CodeAlpha Artificial Intelligence Internship. Combines three production-ready AI modules inside a dark AI-lab workspace:

- **LinguaFlow**: Multilingual translation workspace with automatic language detection, speech-to-text, text-to-speech, searchable history, and TXT export.
- **FAQMind**: Intelligent FAQ chatbot powered by TF-IDF vectorization, cosine similarity matching, confidence thresholding, fallback suggestions, and an Admin FAQ CRUD management dashboard.
- **VisionTrack**: Real-time object detection and centroid tracking engine using OpenCV and YOLOv8 with persistent tracking IDs, webcam/video streaming, confidence controls, and telemetry capture.

---

## Technical Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Axios.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, SQLite.
- **AI & NLP**: scikit-learn (TF-IDF Vectorizer), NLTK / regex preprocessing, deep-translator (Google & MyMemory multi-provider fallback).
- **Computer Vision**: OpenCV, Ultralytics YOLOv8, Centroid Euclidean Object Tracker.

---

## CodeAlpha Internship Task Fulfillment

| Module | CodeAlpha Task | Implementation Details | Status |
|---|---|---|---|
| **LinguaFlow** | Language Translation Tool | Text translation, 30+ languages, auto-detection, TTS/STT, search history, TXT export | Completed |
| **FAQMind** | FAQ Chatbot | Preprocessing, TF-IDF, cosine similarity, confidence scoring, Admin CRUD, unmatched logging | Completed |
| **VisionTrack** | Object Detection and Tracking | Real-time webcam & video file stream, YOLO detection, centroid track IDs (#1, #2), FPS telemetry | Completed |

---

## Folder Structure

```
CodeAlpha_NexusAILab/
├── backend/
│   ├── app/
│   │   ├── api/            # Translation, FAQ, Chatbot, Vision, Analytics, Health routes
│   │   ├── services/       # TranslationService, NLPEngine, VisionEngine & CentroidTracker
│   │   ├── config.py       # Pydantic settings configuration
│   │   ├── database.py     # SQLite connection & session management
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   ├── schemas.py      # Pydantic request/response validation schemas
│   │   └── main.py         # FastAPI application factory & startup auto-seeding
│   ├── data/               # Seed FAQs (nexus_faqs.json) & SQLite database
│   ├── tests/              # Pytest automated unit tests
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Application runner script
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Layout, StatCard, Modal, Toast
│   │   ├── pages/          # Dashboard, LinguaFlow, FAQMind, VisionTrack, History, Analytics, Settings
│   │   ├── services/       # Axios API client
│   │   ├── types/          # TypeScript interfaces
│   │   ├── App.tsx         # Main router & state provider
│   │   └── index.css       # Tailwind CSS design system
│   ├── package.json        # Frontend node dependencies
│   └── vite.config.ts      # Vite dev server configuration with API proxy
├── docs/                   # Architecture documentation
├── scripts/                # Windows PowerShell setup script & standalone seeding script
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
└── README.md               # Main project documentation
```

---

## Quickstart Guide for Windows

### Option A: Automated PowerShell Setup

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup_windows.ps1
```

### Option B: Manual Setup

1. **Backend Setup**:
   ```powershell
   cd backend
   python -m venv ..\env
   ..\env\Scripts\activate
   pip install -r requirements.txt
   python ..\scripts\seed_faqs.py
   python run.py
   ```
   Backend will launch at `http://127.0.0.1:8000`. API Swagger documentation will be available at `http://127.0.0.1:8000/docs`.

2. **Frontend Setup**:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will launch at `http://localhost:5173`.

---

## API Endpoint Reference

- `GET /api/v1/health`: System health diagnostic endpoint.
- `POST /api/v1/translate`: Translate text & persist record.
- `GET /api/v1/translate/history`: Fetch translation history.
- `GET /api/v1/faqs`: List FAQs with search and category filters.
- `POST /api/v1/faqs`: Add new FAQ item and rebuild NLP vector matrix.
- `POST /api/v1/chatbot/query`: Match user query against FAQ vector index.
- `GET /api/v1/vision/stream/demo`: MJPEG synthetic stream for video telemetry.
- `GET /api/v1/vision/stream/webcam`: MJPEG live webcam stream endpoint.
- `POST /api/v1/vision/upload-video`: Upload video file for object tracking.
- `GET /api/v1/analytics`: Aggregate statistics across all platform modules.

---

## Running Automated Tests

Run backend unit tests with `pytest`:

```powershell
..\env\Scripts\activate
pytest backend/tests
```

---

## Verification & Quality Assurance

- **Zero Emojis Policy**: Maintained clean, professional enterprise UI typography and Lucide iconography throughout.
- **Zero Decorative Comments**: Clean code structure following strict senior developer guidelines.
- **Robust Failure Resilience**: Auto-fallback to synthetic feeds when camera hardware is unavailable, and multi-provider fallback for translation.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
