# SmartBiz AI — Architecture & Design Document

## 1. Executive Summary
SmartBiz AI is a full-stack digital assistant and management platform tailored for small and medium enterprises (SMEs). It addresses the pain points of fragmented notebooks, disconnected spreadsheets, forgotten credit balances, and manual customer reminders by providing a single unified system for **Smart Billing POS**, **Customer Credit/Debit Ledgers**, **AI Tool-Calling Assistant**, **Twilio WhatsApp/SMS Marketing & Automation**, and **Executive Analytics**.

```
┌──────────────────────────────────────────────────────────┐
│                   SHOPKEEPER / USER                      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│          React + TypeScript Frontend (Vite)              │
│  - Smart POS Terminal with Instant Phone Auto-Lookup     │
│  - Customer 360° Profile & Financial Ledger View         │
│  - AI Business Agent Conversational Dock                 │
│  - Marketing Studio (Bulk, AI Personalized, Price Alert) │
│  - Interactive WhatsApp Smartphone Simulator             │
└────────────────────────────┬─────────────────────────────┘
                             │ REST API + JWT
                             ▼
┌──────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                    │
│  - Multi-Tenant Auth & Business Isolation                │
│  - Customer Service (Phone Normalization, Serial CUST-X) │
│  - Billing Engine (Secure backend calculations)          │
│  - Ledger Reconciler (Immutable source of truth)         │
│  - AI Tool-Calling Engine (Validated SQL tools)          │
│  - Twilio Dispatcher & Automated Morning Reminders       │
└────────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ PostgreSQL /    │ │  AI Engine      │ │ Twilio API      │
│ SQLite Engine   │ │  (Tool Calling) │ │ (WhatsApp/SMS)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. Core Business Rule: Transaction History as Single Source of Truth
To prevent conflicting balances or manual tampering, customer outstanding balances are always calculated dynamically from the ledger transaction stream:

$$\text{Current Outstanding Balance} = \sum \text{Debits (Purchases)} - \sum \text{Credits (Payments)}$$

When a bill is generated:
1. `Bill` record is saved with subtotal, discount, and total.
2. If partial payment is made, a `Payment` record is created.
3. A `Transaction` is logged with debit = `total_amount`, credit = `amount_paid`, and updated running balance.

When a payment is received:
1. `Payment` record is created.
2. A `Transaction` is logged with debit = `0`, credit = `amount`, and reduced running balance.

---

## 3. Signature Features
1. **Smart Customer Identification by Phone**:
   - Typing 10 digits triggers `/api/v1/customers/lookup?phone=...`.
   - Existing customer $\rightarrow$ Card pops up with ID, Name, Phone, and Outstanding Due.
   - New customer $\rightarrow$ 1-click inline registration modal without page switching.
2. **AI Tool Calling Agent**:
   - Parses natural-language shopkeeper instructions and executes validated backend tools:
     - `get_daily_sales()`
     - `get_outstanding_customers(min_amount)`
     - `get_customer_transactions(customer_name)`
     - `record_payment(customer, amount, method)`
     - `create_bill(customer, items, paid)`
     - `get_product_details(product_name)`
     - `send_customer_reminder(customer)`
3. **AI Personalized Campaigns**:
   - Analyzes each customer's past purchases (e.g. Ravi $\rightarrow$ Basmati Rice, Suresh $\rightarrow$ Jeans) and generates tailored 10% discount messages for 1-click broadcast.
4. **Price Hike Past Buyer Notifications**:
   - When a product's price increases, identifies past buyers and drafts polite price update notices.
5. **Automated Morning Reminders**:
   - Daily scheduler runs at configured time (e.g. 09:00 AM) checking balances $\ge$ minimum threshold and queueing reminders.
