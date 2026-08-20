# SmartBiz AI — AI-Powered Business Assistant for SMEs

> **“Your business remembers everything, so you don't have to.”**

**SmartBiz AI** is a full-stack digital business assistant and modern management platform tailored for small and medium enterprises (grocery stores, apparel shops, electronics stores, hardware stores, stationery shops, and repair services).

It replaces notebooks, Excel sheets, scattered WhatsApp chats, and manual credit tracking with a single unified system for **Smart POS Billing**, **Customer Phone-Number Identification**, **Credit & Debit Ledgers (Source of Truth)**, **AI Tool-Calling Assistant**, **Twilio WhatsApp/SMS Campaigns**, and **Business Analytics**.

---

## Key Features & Highlights

### 1. Smart Customer Phone Identification (Signature Feature)
- Enter the customer's phone number on the POS billing screen.
- **Customer Found:** Automatically identifies `Customer ID (CUST-0042)`, Name, Phone, and Current Outstanding Balance (`₹2,500`).
- **Customer Not Found:** Instant 1-click inline customer registration without page reloads or broken checkout flow.
- Automatically normalizes phone numbers to prevent duplicate customer records.

### 2. Smart Billing POS Terminal
- Fast line items addition with catalog search or custom ad-hoc products.
- Secure backend calculations for subtotals, discounts, and split payments.
- Automatic credit calculation: `Total Bill - Amount Paid = Credit Added to Customer Ledger`.
- Generates professional invoice receipts with **Print** and **1-Click WhatsApp Invoice Share**.

### 3. Customer 360° Profile & Financial Ledger
- Tracks customer financial history with running balance timeline.
- Single source of truth calculation: $\sum \text{Purchases} - \sum \text{Payments} = \text{Current Balance}$.
- 1-click **Record Payment** (Cash, UPI, Card, Bank Transfer) with automated balance reconciliation.

### 4. AI Business Assistant (Tool Calling)
- Interprets natural language commands and executes validated database tools:
  - *"How much did I sell today?"* $\rightarrow$ Computes today's sales, collections, and credit.
  - *"Who owes me more than ₹1,000?"* $\rightarrow$ Returns filtered debtor list.
  - *"Show Ravi's transactions"* $\rightarrow$ Fetches customer ledger.
  - *"Record that Ravi paid ₹500 in UPI"* $\rightarrow$ Executes payment recording & updates balance.
  - *"What is the price of Basmati Rice?"* $\rightarrow$ Fetches product catalog stock and pricing.
  - *"Send payment reminder to Suresh"* $\rightarrow$ Dispatches personalized WhatsApp reminder.

### 5. Twilio WhatsApp & SMS Suite
- **Bulk Announcements:** Broadcast offers to all customers or filtered segments.
- **AI Personalized Offers:** Analyzes purchase history (e.g. Ravi $\rightarrow$ Rice, Anil $\rightarrow$ Electronics) and drafts tailored 10% discount messages for 1-click dispatch.
- **Price-Hike Notifications:** When changing product prices, discovers past buyers and prepares polite adjustment notices.
- **Automated Morning Reminders:** Daily scheduler scans overdue balances and sends friendly morning reminders.
- **Live WhatsApp Simulator:** Interactive phone mock previewing how messages appear to customers.

### 6. Executive Dashboard & Analytics
- Live KPI cards: Today's Sales, Today's Collection, Total Outstanding Credit, Active Customers.
- Sales vs Collection vs Credit Trends Bar Chart.
- Customer Credit Aging Buckets (0-15 Days, 16-30 Days, 30+ Days).
- Best-selling products and revenue contribution report.

---

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Glassmorphism Design System.
- **Backend:** Python 3.11, FastAPI, Pydantic, SQLAlchemy ORM, SQLite / PostgreSQL, JWT Authentication.
- **AI Engine:** AI Agent with tool/function calling executor & NLP intent parser.
- **Communication:** Twilio SMS & WhatsApp API + In-App Sandbox Simulator.
- **Task Scheduling:** APScheduler for automated morning reminders.

---

## Quick Start (Local Run)

### 1. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python test_backend.py      # Run test verification
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at: `http://localhost:3000`.

### Demo Login Credentials
- **Email:** `ravi@smartbiz.ai`
- **Password:** `password123`
- *(Or click the **1-Click Demo Login** button on the sign-in screen!)*

---

## Project Structure

```text
smartbiz-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers (auth, customers, products, bills, payments, ai, campaigns, reminders)
│   │   ├── core/            # Config, Database engine, Security (JWT & bcrypt), Dependencies
│   │   ├── models/          # SQLAlchemy DB models (User, Customer, Product, Bill, Payment, Transaction, Message, Campaign)
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Customer, Billing, Payment, Product, Analytics, AI Tool Calling, Twilio, Reminder, Seed services
│   │   └── main.py          # FastAPI entrypoint, lifespan, CORS & scheduler
│   ├── requirements.txt
│   └── test_backend.py      # Backend verification script
├── frontend/
│   ├── src/
│   │   ├── components/      # SmartPOS, PhoneLookupCard, LedgerModal, AIChatInterface, CampaignStudio, etc.
│   │   ├── context/         # AuthContext & NotificationContext (Toasts)
│   │   ├── pages/           # Dashboard, Billing, Customers, Products, Payments, Transactions, AI, Campaigns, Reports, Settings, Auth
│   │   ├── services/        # Axios API client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── index.css        # Glassmorphism & custom styles
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── setup.md
├── docker-compose.yml
└── README.md
```
