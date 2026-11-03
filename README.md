# CineFlow | Video Editing Agency Management System

A full-stack, enterprise-grade video editing agency management web application built with **React, TypeScript, Tailwind CSS, Node.js, Express, SQLite, and Prisma ORM**.

---

## 1. System Overview & Core Invariants

CineFlow provides three strictly segregated user portals:
1. **Admin**: Central authority with complete access over client accounts, video editor roster, project approvals, assignments, multi-stage submission reviews, automated finance reconciliation, and immutable audit logs.
2. **Editor**: Workspace restricted strictly to assigned video projects. Editors can view creative briefs, access raw footage, start editing, and submit rendered master links for admin review.
3. **Client**: Frictionless portal to request new video edits, track production timelines, review cuts, and download final masters.

### Centralized Privacy & Zero-Leakage Architecture
- **Clients never see editor identities**, personal information, emails, phone numbers, or editor pay rates.
- **Editors never see client emails**, phone numbers, client billing amounts, or other editors on the roster.
- **No direct client-editor communication**: Dedicated live chat and project messages flow strictly between Client <-> Admin and Editor <-> Admin.
- **Backend-enforced privacy filtering**: Sanitization is enforced at the database and API serialization level (`privacySanitizer.ts`), not merely in the frontend.

### Multi-Currency & Budget Negotiation
- Clients can choose their currency (**Rupees ₹ INR** or **Dollars $ USD**) and set their proposed project budget.
- Admin reviews the client's proposed budget and can approve it or negotiate/counter-quote with a dedicated quote note.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript, Helmet, Cookie-Parser, Morgan, Zod
- **Database & ORM**: SQLite (`dev.db`), Prisma ORM
- **Authentication**: Secure HTTP-only session cookies (`agency_session`) with signed JSON Web Tokens
- **Theme Engine**: Light and dark mode with persistent `localStorage` selection

---

## 3. Seed Accounts & Credentials

The SQLite database comes pre-seeded with realistic production data across all three roles:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Alex Mercer | `admin@videoagency.com` | `AdminPassword123!` | Agency Owner (Full Admin Access) |
| **Editor** | Liam Vance | `editor1@videoagency.com` | `EditorPass123!` | Senior Editor (YouTube & Commercials) |
| **Editor** | Maya Chen | `editor2@videoagency.com` | `EditorPass123!` | Short-form Specialist (Reels & TikTok) |
| **Client** | Sarah Jenkins | `client1@techflow.io` | `ClientPass123!` | TechFlow SaaS Solutions |
| **Client** | Marcus Brody | `client2@apexfitness.com` | `ClientPass123!` | Apex Fitness Media |

> **Tip:** The sign-in page includes **one-click demo login buttons** to instantly test each role without re-typing credentials.

---

## 4. Key Functional Features

### Admin Portal
- **Overview Dashboard**: High-level metrics for Active, Completed, Pending, and Overdue projects; automated calculation of Outstanding Client Payments, Outstanding Editor Payments, and Agency Realized Profit.
- **Client Management**: Create, view, edit notes, and activate/deactivate client accounts.
- **Editor Talent Roster**: Track skills, portfolio reels, pay rates, project history, and activate/deactivate editors.
- **Projects Management**: Complete project lifecycle with status transitions:
  `NEW_REQUEST` → `PENDING_APPROVAL` → `ASSIGNED` → `IN_PROGRESS` → `SUBMITTED_FOR_REVIEW` → `REVISION_REQUIRED` → `APPROVED` → `COMPLETED`
- **Finance & Payments**: Separate client collections and editor disbursements with support for multiple partial payments. Automatic reconciliation:
  $$\text{Outstanding Client Payments} = \text{Total Client Invoiced} - \text{Client Payments Received}$$
  $$\text{Outstanding Editor Payments} = \text{Total Editor Agreed} - \text{Editor Payments Made}$$
  $$\text{Agency Profit} = \text{Client Payments Received} - \text{Editor Payments Made}$$
- **Audit Logs**: Immutable log of administrative assignments, status updates, client creations, and payments.

### Editor Portal
- Filter by Assigned, In Progress, Submitted, and Completed projects.
- One-click status update (`Start Editing`).
- Work submission form (Google Drive master link + editor notes).
- Actionable revision instructions when feedback is submitted by Admin.

### Client Portal
- Submit new video editing requests with category, deadline, raw footage link, and creative brief.
- Track production status and view final master delivery links once approved.
- Direct messaging with agency management.

---

## 5. Getting Started & Running Locally

### Prerequisites
- Node.js v18+ and npm installed

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend client runs on `http://localhost:5173`.
Proxy is configured in `vite.config.ts` so `/api` requests route seamlessly to port 5000.

---

## 6. API Documentation Summary

### Authentication
- `POST /api/auth/login`: Authenticate and issue secure `agency_session` HTTP-only cookie.
- `POST /api/auth/logout`: Invalidate session cookie.
- `GET /api/auth/me`: Retrieve current authenticated profile.

### Admin
- `GET /api/admin/overview`: System stats, metrics, recent projects, upcoming deadlines.
- `GET /api/admin/clients`: List all clients with financial summaries.
- `POST /api/admin/clients`: Create client account.
- `PUT /api/admin/clients/:id`: Update client info or status.
- `GET /api/admin/editors`: List all editors with skill tags and earnings.
- `POST /api/admin/editors`: Create editor account.
- `PUT /api/admin/editors/:id`: Update editor info or status.
- `GET /api/admin/audit-logs`: Paginated audit log records.

### Projects
- `GET /api/projects`: List projects filtered and sanitized by the caller's role.
- `GET /api/projects/:id`: Get project details with role-based field redactions.
- `POST /api/projects`: Admin manually creates a new project.
- `POST /api/projects/:id/assign`: Admin assigns/reassigns editor and agreed payout.
- `POST /api/projects/:id/approve-request`: Admin approves client request with quote.
- `POST /api/projects/:id/submit-work`: Editor submits render link (moves to `SUBMITTED_FOR_REVIEW`).
- `POST /api/projects/:id/review-submission`: Admin approves or requests revisions.
- `POST /api/projects/:id/complete`: Admin marks complete and delivers final master link.
- `POST /api/projects/:id/messages`: Post message into intermediated thread (`ADMIN_CLIENT` or `ADMIN_EDITOR`).

### Finance
- `GET /api/payments/overview`: Aggregated profit, collections, and project financial breakdown.
- `POST /api/payments`: Record a client payment or editor payout transaction.

### Notifications
- `GET /api/notifications`: Retrieve current user notifications and unread badge count.
- `PUT /api/notifications/:id/read`: Mark single notification as read.
- `PUT /api/notifications/read-all`: Mark all notifications as read.

