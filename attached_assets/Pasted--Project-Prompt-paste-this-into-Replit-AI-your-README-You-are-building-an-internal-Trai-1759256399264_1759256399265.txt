# 📦 Project Prompt (paste this into Replit AI / your README)

You are building an internal **Training Management System (TMS)** for a manufacturing company. The goal is to record training needs, planning, scheduling, delivery, evidence, feedback, post‑training effectiveness, and reporting for HR audits. **Use the attached screenshots only as functional inspiration, not for cloning the UI.**

---

## 1) Scope & Roles

* **Roles:**

  * *Employee (Trainee)* – view assigned trainings, self‑nominate, give feedback, download certificates.
  * *Manager* – raise training needs for team, approve nominations, evaluate effectiveness (after 60/90 days), view team analytics.
  * *HR Admin* – review training needs, create/plan/schedule trainings (internal/external), mark completion with evidence, manage masters, run reports.
  * *Trainer (Internal/External)* – view sessions to deliver, upload materials/attendance (optional separate login or HR proxy upload).
  * *Auditor (read‑only)* – view evidence and reports.

* **Training Types:** Internal (delivered by employees) and External (delivered by vendors).

* **Key Objects:** Employee, Manager, Training Need, Training Plan, Training Session, Nomination, Attendance, Feedback, Evidence, Vendor, Effectiveness Evaluation, Certificate.

---

## 2) High‑Level Workflow (State Machine)

1. **Need Raised**: Manager or Employee (self) creates `TrainingNeed` → status: `SUBMITTED`.
2. **HR Review**: HR sets status `APPROVED` or `REJECTED` with reason. Approved needs may be linked into a monthly/annual **Training Plan**.
3. **Planned**: HR creates `TrainingPlanItem` (tentative month) → status `PLANNED`.
4. **Scheduled**: HR converts plan item to concrete `TrainingSession` with date, time, venue/meeting link, capacity, trainer, type (internal/external), attachments → status `SCHEDULED`.
5. **Nomination**: Employees/Managers self‑nominate or HR nominates; manager approval optional per policy; waitlist if full.
6. **Conducted**: After session, HR uploads **attendance** and evidence (sign‑sheet scan, photos, vendor invoice, deck). Status `DELIVERED`.
7. **Feedback**: Trainees give rating & comments (portal or offline form upload). Status `FEEDBACK_PENDING` → `FEEDBACK_RECEIVED`.
8. **Effectiveness**: After `X` days (config per session 30/60/90), manager evaluates effectiveness per trainee (rating + notes). Status `EFFECTIVENESS_PENDING` → `CLOSED`.
9. **Certificates**: Optional generation/attachment; visible in employee profile.

> Persist state transitions with timestamps and actor for audit.

---

## 3) Data Model (SQL‑ish)

### Core Masters

* **employees**(id, code, name, email, phone, dept, location, grade, manager_id FK employees.id, active, created_at)
* **users**(id, employee_id FK, role ENUM['EMP','MGR','HR','TRAINER','AUDITOR'], password_hash, last_login)
* **vendors**(id, name, contact_name, email, phone, gst_number, address)
* **trainers**(id, type ENUM['INTERNAL','EXTERNAL'], employee_id FK NULL, vendor_id FK NULL, name, email, phone)
* **skills**(id, name, category ENUM['BEHAV','PROC','TECH','LANG','SAFETY','DOMAIN','OTHER'])

### Needs & Planning

* **training_needs**(id, requested_by_user_id, for_employee_id, skill_id, title, details, preferred_quarter, preferred_month, type ENUM['INTERNAL','EXTERNAL','ANY'], status ENUM['SUBMITTED','APPROVED','REJECTED'], status_reason, created_at, decided_at, decided_by)
* **training_plans**(id, year, name, created_by, created_at)
* **training_plan_items**(id, plan_id, skill_id, title, target_audience_query JSON, tentative_month, expected_hours, type ENUM, status ENUM['PLANNED','CONVERTED','CANCELLED'])

### Scheduling & Delivery

* **training_sessions**(id, plan_item_id NULL, title, description, type ENUM['INTERNAL','EXTERNAL'], mode ENUM['CLASSROOM','ONLINE','HYBRID'], start_dt, end_dt, location, meeting_link, capacity, trainer_id, vendor_cost, cost_center, evidence_folder_url, status ENUM['SCHEDULED','DELIVERED','CLOSED'])
* **nominations**(id, session_id, employee_id, source ENUM['SELF','MANAGER','HR'], status ENUM['PENDING','APPROVED','REJECTED','WAITLIST'], decided_by, decided_at)
* **attendance**(id, session_id, employee_id, present BOOL, minutes_attended INT, signed_by_trainer BOOL, evidence_file_url)
* **feedback_forms**(id, session_id, employee_id, rating INT 1-5, comments TEXT, channel ENUM['PORTAL','OFFLINE_UPLOAD','QR_FORM'], submitted_at)
* **effectiveness_reviews**(id, session_id, employee_id, manager_id, due_dt, rating INT 1-5, comments TEXT, submitted_at)
* **attachments**(id, session_id, kind ENUM['AGENDA','DECK','PHOTO','SIGN_SHEET','CERT','INVOICE','OTHER'], file_url, uploaded_by, uploaded_at)
* **certificates**(id, employee_id, session_id, file_url, issued_at)
* **audit_log**(id, actor_user_id, entity, entity_id, action, from_state, to_state, meta JSON, created_at)

Indexes: by year/month, dept, trainer, type, employee, to support reports.

---

## 4) API (FastAPI style)

### Auth

* POST `/auth/login` → JWT

### Masters

* GET `/employees?manager_id=&dept=&q=`
* GET/POST `/vendors` | `/trainers`

### Needs & Planning

* POST `/needs` (self/manager)
* GET `/needs?status=&my_team=true`
* PATCH `/needs/{id}:approve|reject`
* POST `/plans` and POST `/plans/{id}/items`
* GET `/plans/{id}`

### Scheduling & Nominations

* POST `/sessions` (from plan item or ad‑hoc)
* GET `/sessions?month=&dept=&type=&status=`
* POST `/sessions/{id}/nominate` (self or HR for others)
* PATCH `/nominations/{id}:approve|reject|waitlist`
* POST `/sessions/{id}/attendance:upload` (CSV and file attachments)
* POST `/sessions/{id}/attachments` (evidence files)

### Feedback & Effectiveness

* POST `/sessions/{id}/feedback` (JWT or public token)
* POST `/sessions/{id}/effectiveness` (manager only)
* GET `/sessions/{id}/effectiveness?status=pending` (manager dashboard)

### Reports

* GET `/reports/plan-vs-actual?year=&month=&dept=` → totals: planned hours, conducted hours, participants, completion rate.
* GET `/reports/hours?granularity=month|year&by=employee|dept|trainer`
* GET `/reports/compliance?pending_feedback=&pending_effectiveness=`

All endpoints **audit** actor + time; support pagination and CSV export.

---

## 5) UI (React/Tailwind; don’t clone screenshots)

### HR Admin

* **Needs Review Queue** (approve/reject; bulk actions; comments).
* **Annual Plan Builder** (drag items to months; filter by category; capacity planning).
* **Scheduler** (create sessions; assign trainer; cap; publish; send invites; print attendance sheet).
* **Delivery Console** (upload attendance, evidence; mark delivered; generate certificates).
* **Effectiveness Tracker** (list of sessions where the review window opened; reminders).
* **Reports** (Plan vs Actual, Hours by month/employee/dept/trainer, Internal vs External split, Costs summary, Compliance dashboards).

### Manager

* **Raise Training Need** for employee(s) or team.
* **Team Calendar** + nomination approvals.
* **Effectiveness Pending** widget with due dates.

### Employee

* **My Trainings** (upcoming/past), self‑nomination, **Feedback** form, certificates.

### Auditor (read‑only)

* Evidence browser by session with immutable audit log.

---

## 6) Feedback for Non‑system Employees (Hybrid)

* Generate **QR codes** per session linking to a public form with a **one‑time token** (7‑digit short code printed on attendance sheet). HR can also submit on behalf of a trainee using this token.
* Provide **printable feedback form (PDF)** template with session ID + token; HR scans to PDF and uploads. A reconciliation screen maps scans to employees (present list pre‑filled) and captures rating.
* Bulk CSV import supported: `employee_code,rating,comments`.
* Kiosk mode: single device where employees input code + rating quickly.

---

## 7) Notifications & SLAs

* Email/Teams alerts for: nomination approvals, schedule publish, feedback due (T+0, T+2 days), effectiveness due (T+60/90), and overdue digests.
* Config table: default effectiveness window (days), feedback SLA, reminder cadence.

---

## 8) Security & Audit

* Role‑based access control (RBAC) enforced at API and UI.
* All state changes → `audit_log` with before/after snapshots.
* Evidence files stored in S3/Cloud storage with signed URLs; virus scan on upload.
* PII minimization; logs exclude comments unless necessary.

---

## 9) Reports (Minimum Set)

* **Plan vs Actual** (year/month, dept, trainer, type): planned sessions/hours vs delivered; variance %; participants vs capacity; cancellation reasons.
* **Hours by Employee/Dept/Trainer** (month & YTD).
* **Internal vs External Split** (counts, hours, cost).
* **Compliance**: % feedback received, % effectiveness completed, overdue counts.
* **Attendance Quality**: average minutes attended, no‑show rate.

All reports exportable to CSV and pivotable; include drill‑down to sessions.

---

## 10) Tech Stack & Project Setup

* **Backend**: FastAPI + SQLAlchemy, PostgreSQL (SQLite for dev), Alembic migrations, JWT auth.
* **Frontend**: React (Vite) + Tailwind; component lib ok; form validation with React Hook Form + Zod.
* **File Storage**: local in dev; S3 compatible in prod.
* **Infra**: Replit for dev; Dockerfile; makefile tasks.
* **Testing**: PyTest (backend), Playwright (frontend). Seed script with demo data.

---

## 11) Milestones & Acceptance Criteria

### M1: CRUD + Auth (1–2 weeks)

* Users/Employees/Vendors/Trainers CRUD
* Login, RBAC, seed data

**Accept:** Create employee, login as HR/Manager/Employee; RBAC enforced.

### M2: Needs → Plan → Schedule (2 weeks)

* Need submission/approval
* Plan board (tentative month)
* Create sessions from plan

**Accept:** Need approved → plan item created → session scheduled with capacity.

### M3: Nominations & Delivery (1–2 weeks)

* Nomination flow + approvals/waitlist
* Attendance upload (CSV) & evidence files

**Accept:** After session end, HR uploads attendance and scans; session marked delivered.

### M4: Feedback & Effectiveness (1–2 weeks)

* Portal form + QR/token public form
* Effectiveness queue for managers with due dates

**Accept:** Feedback % shows; after 60/90 days manager submits effectiveness → session closes.

### M5: Reporting & Audit (1–2 weeks)

* Plan vs Actual, Hours, Compliance dashboards
* Export CSV; audit log viewer

**Accept:** Reports match seed data; audit trail present for all transitions.

---

## 12) Sample SQL (starter)

```sql
CREATE TABLE training_sessions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('INTERNAL','EXTERNAL')) NOT NULL,
  mode TEXT CHECK (mode IN ('CLASSROOM','ONLINE','HYBRID')) NOT NULL,
  start_dt TIMESTAMP NOT NULL,
  end_dt TIMESTAMP NOT NULL,
  capacity INT,
  trainer_id INT,
  status TEXT CHECK (status IN ('SCHEDULED','DELIVERED','CLOSED')) NOT NULL DEFAULT 'SCHEDULED'
);
```

---

## 13) UX Notes (from screenshots, but do **not** clone)

* Dashboard cards for: Needs awaiting review, Upcoming sessions, Feedback pending, Effectiveness pending.
* Calendar views (month/week) for plan & schedule.
* Progress bars for capacity filled; badges for categories.
* Keep forms short with sensible defaults; allow bulk select/import.

---

## 14) Seeds & Demo Data

* 200 employees across 5 depts; 30 managers; 1 HR admin; 5 trainers; 3 vendors; 10 skills.
* 12 plan items for the year; 8 sessions conducted with varied attendance/feedback/effectiveness status.

---

## 15) Out of Scope (for now)

* LMS content hosting, SCORM.
* Complex budgeting/approvals beyond basic cost capture.
* Multi‑language (single locale first).

---

### Deliverables

* Working app with above flows, seeded demo, and CI checks passing.
* README with setup, environment variables, and import/export samples.

---

# Attachments for functional reference

The provided screenshots illustrate HRIS/TMS dashboards, calendars, nomination lists, and reporting widgets. Use them **only** to understand typical functionality and sequencing; **do not replicate the UI or branding**.
