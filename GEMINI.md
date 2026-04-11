# 🧬 GEMINI Project Context: YouthPulse

YouthPulse is a full-stack web application designed for the automated collection, analysis, and visualization of sociological survey data, specifically focused on monitoring youth needs. It leverages AI (Google Gemini) to analyze open-ended survey responses and generate descriptive content.

---

## 🏗️ Architecture & Technology Stack

### Backend: FastAPI (Python)
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) for building high-performance REST APIs.
- **Database:** [MongoDB](https://www.mongodb.com/) (using `pymongo`) for storing survey schemas and responses.
- **AI Integration:** [Google Generative AI](https://ai.google.dev/) (`google-genai`) for text analysis and summarization.
- **Data Processing:** [Pandas](https://pandas.pydata.org/) and [Matplotlib](https://matplotlib.org/) for statistical analysis and chart generation.
- **Reporting:** [fpdf2](https://py-pdf.github.io/fpdf2/) for automated PDF report generation.

### Frontend: React (TypeScript + Vite)
- **Build Tool:** [Vite](https://vitejs.dev/) for fast development and optimized builds.
- **Styling:** [Bootstrap](https://getbootstrap.com/) (via `react-bootstrap`) for UI components.
- **Visualization:** [Plotly.js](https://plotly.com/javascript/) for interactive charts and dashboards.
- **Icons:** [Lucide React](https://lucide.dev/).
- **API Client:** [Axios](https://axios-http.com/) for communication with the FastAPI backend.

---

## 🚀 Getting Started

### Environment Configuration
1. Copy `.env.example` to `.env` in the root directory.
2. Mandatory variables:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `MONGO_URI`: Connection string for MongoDB (defaults to `mongodb://mongodb:27017/` in Docker).

### Running with Docker (Recommended)
```bash
docker-compose up --build
```
- **Frontend:** http://localhost:80
- **Backend API:** http://localhost/api/

### Running Locally (Windows)
Execute the `run_all.bat` script in the root directory. It will:
1. Verify the `.env` file and required software (Python, Node.js).
2. Set up a Python virtual environment and install backend dependencies.
3. Install frontend dependencies.
4. Launch both Backend and Frontend in separate windows.

**Local URLs:**
- **Frontend:** http://localhost:5173
- **Backend:** http://127.0.0.1:8000

---

## 📁 Key Directories & Files

### `/backend`
- `main.py`: Entry point for the FastAPI application.
- `app/routers/`: API route definitions (`surveys.py`, `admin.py`).
- `app/utils/`: core logic for DB, AI, and PDF processing.
- `requirements.txt`: Python dependencies.

### `/frontend`
- `src/api.ts`: Centralized Axios API client.
- `src/pages/`: Main view components (Dashboard, Editor, Admin, etc.).
- `src/components/`: Reusable UI elements.
- `package.json`: NPM scripts and dependencies.

---

## 🛠️ Development Conventions

### Backend
- **Type Safety:** Use Pydantic models for request/response validation.
- **Routing:** Follow RESTful principles; prefix survey routes with `/api/surveys` and administrative tasks with `/api/admin`.
- **AI Logic:** Encapsulate AI prompts and calls within `app/utils/ai_helper.py`.

### Frontend
- **Hooks:** Prefer functional components and standard React hooks.
- **Styling:** Use React-Bootstrap components supplemented by custom CSS in `index.css`.
- **API Calls:** Always use the `api` instance from `src/api.ts` to ensure consistent base URLs and headers.

### General
- **Environment:** Use `import.meta.env.VITE_API_URL` for the API endpoint on the frontend.
- **Portability:** Maintain the Docker-ready configuration in `docker-compose.yml`.
