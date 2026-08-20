# SmartBiz AI — REST API Reference

All protected endpoints require the HTTP Header:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

Base URL: `/api/v1`

---

## 1. Authentication & Profile
- `POST /api/v1/auth/register` — Register new business owner account.
- `POST /api/v1/auth/login` — Login with email/phone & password.
- `GET /api/v1/auth/me` — Retrieve current authenticated store profile.
- `PUT /api/v1/auth/me` — Update store parameters, currency, and automated reminder schedule.

---

## 2. Customer Management
- `GET /api/v1/customers/lookup?phone=9876543210` — Instant customer identification by phone number.
- `GET /api/v1/customers/?search=&only_outstanding=true` — List customers with filters.
- `POST /api/v1/customers/` — Register new customer with auto-generated serial (`CUST-0001`).
- `GET /api/v1/customers/{id}` — Get single customer profile.
- `PUT /api/v1/customers/{id}` — Update customer details.
- `DELETE /api/v1/customers/{id}` — Deactivate customer.
- `GET /api/v1/customers/{id}/ledger` — Get full financial transaction history timeline.

---

## 3. Products & Services
- `GET /api/v1/products/?category=&search=` — List catalog items.
- `GET /api/v1/products/categories` — List distinct categories.
- `POST /api/v1/products/` — Create new product or service.
- `GET /api/v1/products/{id}` — Get product details.
- `PUT /api/v1/products/{id}` — Update product details.
- `DELETE /api/v1/products/{id}` — Remove product.
- `GET /api/v1/products/{id}/price-hike-preview?new_price=X` — Discover past buyers and preview alert message.

---

## 4. Smart Billing POS
- `POST /api/v1/bills/` — Create invoice, compute line subtotals, adjust inventory, record payment, and log ledger entry.
- `GET /api/v1/bills/?customer_id=` — List bills.
- `GET /api/v1/bills/{id}` — Get single bill and item breakdown.

---

## 5. Payments & Collections
- `POST /api/v1/payments/` — Record customer payment and reconcile balance.
- `GET /api/v1/payments/?customer_id=` — List customer payment records.

---

## 6. Financial Transactions (Ledger)
- `GET /api/v1/transactions/?customer_id=&transaction_type=` — List all ledger entries.

---

## 7. AI Assistant
- `POST /api/v1/ai/chat` — Execute natural language business instructions with tool calling.

---

## 8. Campaigns & Twilio Communication
- `GET /api/v1/campaigns/` — List past campaigns.
- `POST /api/v1/campaigns/` — Create & dispatch bulk announcement.
- `GET /api/v1/campaigns/ai-personalized-offers` — Generate AI personalized recommendations by purchase history.
- `POST /api/v1/messages/send` — Direct WhatsApp / SMS message dispatch.
- `GET /api/v1/messages/logs` — Message audit log.
- `POST /api/v1/reminders/trigger-now` — Trigger automated morning payment reminders.

---

## 9. Business Analytics
- `GET /api/v1/analytics/dashboard` — Today's sales, collection, credit, and totals.
- `GET /api/v1/analytics/sales-trends?days=7` — Daily sales & collection trend data.
- `GET /api/v1/analytics/top-customers` — Top customers by spend and credit.
- `GET /api/v1/analytics/top-products` — Best selling products.
- `GET /api/v1/analytics/credit-aging` — Customer credit aging buckets.
