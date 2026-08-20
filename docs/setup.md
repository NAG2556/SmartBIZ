# SmartBiz AI — Setup & Local Execution Guide

## Prerequisites
- **Python**: 3.9+ installed
- **Node.js**: 18+ installed

---

## 1. Fast Zero-Friction Setup (Local Machine)

### Step 1: Run FastAPI Backend
```bash
# 1. Navigate to backend
cd backend

# 2. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Verify & Run tests
python test_backend.py

# 5. Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend will be available at: `http://localhost:8000` (Interactive API Docs: `http://localhost:8000/docs`).
*Note: On first startup, the database and demo SME store (`ravi@smartbiz.ai` / `password123`) are automatically created and seeded.*

---

### Step 2: Run React Frontend
```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Frontend will be available at: `http://localhost:3000` (or `http://localhost:5173`).

---

## 2. Instant Demo Login Credentials
- **Email:** `ravi@smartbiz.ai`
- **Password:** `password123`
- *(Or simply click the **"1-Click Demo Login"** button on the sign-in screen!)*

---

## 3. Production Deployment with Docker Compose

To run the entire full-stack system with PostgreSQL in Docker:
```bash
docker-compose up --build
```
