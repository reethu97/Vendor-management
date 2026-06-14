# Vendor Management System

Backend + database + admin dashboard that powers a **Webex AI Agent vendor service line**:
vendor validation → empanelment queries → document dispatch → OTP identity verification → outstanding payments & schedules.

Built with Node.js (Express) and **SQLite via Node's built-in `node:sqlite`** — zero native
dependencies, so it runs anywhere Node 22+ is installed (laptop, VM, Render, Railway, EC2).

---

## Quick start

```bash
npm install        # installs express + cors only
npm start          # http://localhost:3000
```

- **Admin dashboard:** http://localhost:3000 (vendors, empanelments, documents, invoices, agent audit log)
- **API tester** tab in the dashboard walks the full 7-step call journey, including OTP
- Database file is created and seeded automatically at `data/vendors.db`
  (delete it to re-seed)

**Demo vendor for the full journey:** `VND1001 — TechServe Solutions`
(active, empaneled for *Cisco Collaboration* at *Infosys*, 4 documents on file, 3 outstanding invoices with payment schedules)

To expose it to Webex Connect during a POC, tunnel it: `ngrok http 3000` and use the
ngrok URL in your Connect HTTP nodes.

---

## Database schema

| Table | Purpose |
|---|---|
| `vendors` | Master record — registered email and mobile are the ONLY channels the agent uses |
| `empanelments` | vendor × OEM product × customer matrix with status and validity |
| `document_requirements` | docs required per OEM/customer combo (`customer='*'` = universal) |
| `vendor_documents` | files on record the agent can dispatch (file_url → Connect Email node) |
| `invoices` | AR records per vendor |
| `payment_schedules` | installments per invoice (scheduled / released / on_hold, NEFT/RTGS, UTR) |
| `otp_sessions` | OTP + short-lived session token store (the identity gate) |
| `interaction_log` | audit trail of every agent API call — compliance-friendly |

---

## Agent-facing API (`POST /api/agent/*`, JSON)

These map 1:1 to the **Actions** you register in AI Agent Studio. Each is called by a
Webex Connect flow (Inbound Webhook → HTTP node → this API → JSON response back to agent).

### 1. `validate-vendor`
```json
{ "vendor_id": "VND1001" }            // or { "phone": "+919810012345" } for ANI lookup
→ { "valid": true, "vendor_name": "...", "email_masked": "ac******@techserve.in", ... }
```
Suspended/blacklisted vendors return `valid:false` with a reason.

### 2. `check-empanelment`
```json
{ "vendor_id": "VND1001", "oem_product": "Cisco Collab", "customer": "Infosys" }
→ { "empanelment_status": "empaneled", "valid_till": "2027-03-31",
    "required_documents": [...], "missing_documents": [...],
    "documents_speech": "GST Registration Certificate, PAN Card, ..." }
```
Fuzzy matching on product/customer ("Cisco Collab" matches "Cisco Collaboration").
`documents_speech` is pre-formatted for the agent to read aloud.

### 3. `request-document`
```json
{ "vendor_id": "VND1001", "document_type": "GST" }
→ { "sent": true, "file_url": "...", "to_email": "accounts@techserve.in",
    "email_masked": "ac******@techserve.in" }
```
**Connect does the actual sending**: map `file_url` + `to_email` into an Email node.
In the AI Agent action response mapping, expose only `email_masked` to the LLM — never `to_email`.

### 4. `send-otp`
```json
{ "vendor_id": "VND1001" }
→ { "otp_sent": true, "otp_for_delivery": "482913", "sms_to": "+919810012345",
    "phone_masked": "+********2345", "expires_in_minutes": 5 }
```
**Important:** `otp_for_delivery` and `sms_to` are for the **Connect SMS node only**.
Do NOT map them into the agent's action output — the LLM must never see the code.
OTP: 6 digits, 5-minute expiry, 3 attempts max, regenerating resets the session.

### 5. `verify-otp`
```json
{ "vendor_id": "VND1001", "otp_code": "482913" }
→ { "verified": true, "session_token": "a1b2c3...", "valid_for_minutes": 15 }
```
Wrong code → `attempts_remaining`. After 3 failures → `locked:true` (route to human agent).

### 6. `outstanding-payments` — **token required**
```json
{ "vendor_id": "VND1001", "session_token": "a1b2c3..." }
→ { "authorized": true, "count": 3, "invoices": [...],
    "summary_speech": "There are 3 pending invoices: invoice I N V 2 4 0 0 7 for twelve lakh fifty thousand rupees, due 8 June 2026; ..." }
```
Without a valid token → **HTTP 401**. The gate is enforced in the backend, not just the prompt.
Speech fields use Indian numbering (lakh/crore) and spaced-out invoice IDs for clean TTS.

### 7. `payment-schedule` — **token required**
```json
{ "vendor_id": "VND1001", "invoice_id": "INV24007", "session_token": "a1b2c3..." }
→ { "installments": [...], "schedule_speech": "Installment 1 of six lakh twenty five thousand rupees is scheduled for 30 June 2026 by NEFT. ..." }
```

---

## Admin API (`/api/admin/*`)

Full CRUD used by the dashboard — also usable directly:

- `GET|POST /api/admin/vendors`, `PUT|DELETE /api/admin/vendors/:id`
- `GET|POST /api/admin/empanelments`, `PUT|DELETE .../:id`
- `GET|POST|DELETE /api/admin/document-requirements`
- `GET|POST|DELETE /api/admin/vendor-documents`
- `GET|POST /api/admin/invoices`, `PUT|DELETE .../:id`
- `POST|DELETE /api/admin/payment-schedules`
- `GET /api/admin/interaction-log` — what the AI agent did, when, and the outcome
- `GET /api/admin/stats`

---

## Wiring into Webex Connect + AI Agent Studio

For each agent Action, build a Connect flow: **Inbound Webhook → HTTP node (this API) → [Email/SMS node if needed] → JSON response**.

| AI Agent Action | Connect flow does | Extra node |
|---|---|---|
| `validate_vendor` | POST `/api/agent/validate-vendor` | — |
| `check_empanelment` | POST `/api/agent/check-empanelment` | — |
| `send_document` | POST `/api/agent/request-document`, then email `file_url` to `to_email` | **Email node** |
| `send_otp` | POST `/api/agent/send-otp`, then SMS `otp_for_delivery` to `sms_to` | **SMS node** |
| `verify_otp` | POST `/api/agent/verify-otp` | — |
| `get_outstanding_payments` | POST `/api/agent/outstanding-payments` (pass session_token) | — |
| `get_payment_schedule` | POST `/api/agent/payment-schedule` (pass session_token) | — |

The agent must carry `session_token` from `verify_otp` into the two payment actions —
declare it as an input parameter on those actions and instruct the agent to pass the
token it received.

## Production hardening checklist (before this leaves POC)

- [ ] Put an API key / mTLS between Connect and this API (e.g. `x-api-key` header check middleware)
- [ ] Serve over HTTPS (reverse proxy / platform TLS)
- [ ] Replace seeded vendors with real master data (CSV import or ERP sync)
- [ ] Point `file_url`s at your real document repository (SharePoint/S3 signed URLs)
- [ ] Rate-limit `/api/agent/send-otp` per vendor (currently unlimited regeneration)
- [ ] Add authentication to the admin dashboard and `/api/admin/*`
- [ ] Back up `data/vendors.db` (it's a single file — trivial to snapshot)
