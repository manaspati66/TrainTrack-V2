# ManufacTMS Technical Documentation

**Version:** 1.0  
**Last Updated:** September 30, 2025  
**Application:** Manufacturing Training Management System (ManufacTMS)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Documentation](#api-documentation)
7. [Feature Modules](#feature-modules)
8. [Frontend Components](#frontend-components)
9. [Development Guidelines](#development-guidelines)
10. [Deployment](#deployment)

---

## System Overview

ManufacTMS is a comprehensive Training Management System designed for manufacturing environments. It provides end-to-end training lifecycle management including:

- Training catalog and session management
- Employee training needs identification and approval workflow
- Training planning and scheduling
- Self-nomination and manager approval system
- Compliance tracking and reporting
- Skills, vendors, and trainer master data management
- Role-based access control (Employee, Manager, HR Admin)

### Key Capabilities

- **Compliance Management**: Track training requirements, certifications, and regulatory compliance
- **Workflow Automation**: Multi-stage approval workflows for training needs
- **Resource Management**: Manage trainers, vendors, and training facilities
- **Reporting**: Comprehensive compliance and training effectiveness reports
- **Mobile Responsive**: Full functionality across desktop, tablet, and mobile devices

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  React 18 + TypeScript + TanStack Query + Wouter        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/REST
┌────────────────────▼────────────────────────────────────┐
│               Backend Server (Node.js)                   │
│  Express.js + TypeScript + Drizzle ORM                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
│  PostgreSQL  │ │  Replit │ │ File Storage│
│   (Neon)     │ │   Auth  │ │   (Local)   │
└──────────────┘ └─────────┘ └─────────────┘
```

### Application Layers

1. **Presentation Layer** (Client)
   - React components with Radix UI primitives
   - TanStack Query for server state management
   - Wouter for client-side routing
   - Tailwind CSS for styling

2. **Business Logic Layer** (Server)
   - Express.js REST API endpoints
   - Request validation with Zod schemas
   - Role-based authorization middleware
   - Session management

3. **Data Access Layer**
   - Drizzle ORM for type-safe database operations
   - Storage interface abstraction (`IStorage`)
   - Database implementation (`DatabaseStorage`)

4. **Data Layer**
   - PostgreSQL database (Neon serverless)
   - Local file system for training materials

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool and dev server |
| TanStack Query | 5.x | Server state management |
| Wouter | 3.x | Client-side routing |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Schema validation |
| Radix UI | Latest | Accessible UI primitives |
| Tailwind CSS | 3.x | Utility-first CSS |
| Lucide React | Latest | Icon library |
| date-fns | Latest | Date manipulation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime environment |
| Express.js | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | Latest | Type-safe database ORM |
| Drizzle Kit | Latest | Database migration tool |
| Passport | Latest | Authentication middleware |
| OpenID Client | Latest | OIDC integration |
| Multer | Latest | File upload handling |
| Express Session | Latest | Session management |

### Database & Storage

| Technology | Purpose |
|------------|---------|
| PostgreSQL (Neon) | Primary database |
| connect-pg-simple | PostgreSQL session store |
| Local File System | Training material storage |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESBuild | Fast JavaScript bundler |
| TSX | TypeScript execution |
| Vite HMR | Hot module replacement |
| Git | Version control |

---

## Database Schema

### Core Tables

#### 1. Users Table
```typescript
users {
  id: varchar (primary key)
  email: varchar (unique)
  firstName: varchar
  lastName: varchar
  role: varchar (employee, manager, hr_admin)
  department: varchar
  position: varchar
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. Training Catalog
```typescript
trainingCatalog {
  id: serial (primary key)
  title: varchar
  description: text
  category: varchar
  duration: integer (hours)
  compulsory: boolean
  validityPeriod: integer (days)
  prerequisites: text[]
  tags: text[]
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 3. Training Sessions
```typescript
trainingSessions {
  id: serial (primary key)
  catalogId: integer → trainingCatalog.id
  sessionDate: timestamp
  duration: integer
  location: varchar
  mode: varchar (ONLINE, OFFLINE, HYBRID)
  trainerId: integer → trainers.id
  maxAttendees: integer
  status: varchar (SCHEDULED, COMPLETED, CANCELLED)
  materialPath: varchar
  feedback: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 4. Training Enrollments
```typescript
trainingEnrollments {
  id: serial (primary key)
  sessionId: integer → trainingSessions.id
  employeeId: varchar → users.id
  enrollmentDate: timestamp
  status: varchar (ENROLLED, COMPLETED, ABSENT, WITHDRAWN)
  attendanceMarked: boolean
  certificateIssued: boolean
  score: integer
  feedback: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 5. Skills (Master Data)
```typescript
skills {
  id: serial (primary key)
  name: varchar
  description: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 6. Vendors (Master Data)
```typescript
vendors {
  id: serial (primary key)
  name: varchar
  contactPerson: varchar
  email: varchar
  phone: varchar
  address: text
  specialization: varchar
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 7. Trainers (Master Data)
```typescript
trainers {
  id: serial (primary key)
  name: varchar
  email: varchar
  phone: varchar
  qualification: text
  specialization: varchar
  type: varchar (INTERNAL, EXTERNAL)
  vendorId: integer → vendors.id (optional)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Workflow Tables

#### 8. Training Needs
```typescript
trainingNeeds {
  id: serial (primary key)
  employeeId: varchar → users.id
  skillId: integer → skills.id
  justification: text
  urgency: varchar (LOW, MEDIUM, HIGH)
  expectedDuration: integer
  preferredMode: varchar
  status: varchar (SUBMITTED, APPROVED, REJECTED, PLANNED)
  approvedBy: varchar → users.id
  approvedAt: timestamp
  rejectionReason: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 9. Training Plans
```typescript
trainingPlans {
  id: serial (primary key)
  year: integer
  name: varchar
  description: text
  createdBy: varchar → users.id
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 10. Training Plan Items
```typescript
trainingPlanItems {
  id: serial (primary key)
  planId: integer → trainingPlans.id
  skillId: integer → skills.id (optional)
  title: varchar
  targetAudienceQuery: jsonb
  tentativeMonth: varchar
  expectedHours: integer
  type: varchar (INTERNAL, EXTERNAL)
  status: varchar (PLANNED, CONVERTED, CANCELLED)
  convertedToSessionId: integer → trainingSessions.id
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 11. Nominations
```typescript
nominations {
  id: serial (primary key)
  sessionId: integer → trainingSessions.id
  employeeId: varchar → users.id
  source: varchar (SELF, MANAGER, HR)
  status: varchar (PENDING, APPROVED, REJECTED, WAITLIST)
  decidedBy: varchar → users.id
  decidedAt: timestamp
  reason: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Compliance & Audit Tables

#### 12. Compliance Requirements
```typescript
complianceRequirements {
  id: serial (primary key)
  name: varchar
  description: text
  regulatoryBody: varchar
  frequencyMonths: integer
  applicableRoles: text[]
  mandatoryTrainings: integer[] (catalogIds)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 13. Effectiveness Evaluations
```typescript
effectivenessEvaluations {
  id: serial (primary key)
  enrollmentId: integer → trainingEnrollments.id
  evaluationType: varchar
  evaluatedBy: varchar → users.id
  evaluatedAt: timestamp
  score: integer
  observations: text
  improvements: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 14. Evidence Attachments
```typescript
evidenceAttachments {
  id: serial (primary key)
  evaluationId: integer → effectivenessEvaluations.id
  filePath: varchar
  fileName: varchar
  fileType: varchar
  uploadedAt: timestamp
}
```

#### 15. Audit Logs
```typescript
auditLogs {
  id: serial (primary key)
  entityType: varchar
  entityId: varchar
  action: varchar
  performedBy: varchar → users.id
  changes: jsonb
  ipAddress: varchar
  userAgent: text
  timestamp: timestamp
}
```

### Database Relations

- Users → TrainingEnrollments (one-to-many)
- Users → TrainingNeeds (one-to-many)
- Users → Nominations (one-to-many)
- TrainingCatalog → TrainingSessions (one-to-many)
- TrainingSessions → TrainingEnrollments (one-to-many)
- TrainingSessions → Nominations (one-to-many)
- Skills → TrainingNeeds (one-to-many)
- Skills → TrainingPlanItems (one-to-many)
- Vendors → Trainers (one-to-many)
- Trainers → TrainingSessions (one-to-many)
- TrainingPlans → TrainingPlanItems (one-to-many)
- TrainingEnrollments → EffectivenessEvaluations (one-to-many)
- EffectivenessEvaluations → EvidenceAttachments (one-to-many)

---

## Authentication & Authorization

### Authentication Provider

**Replit Auth (OpenID Connect)**
- Provider: `javascript_log_in_with_replit==1.0.0`
- Protocol: OpenID Connect (OIDC)
- Session Storage: PostgreSQL via `connect-pg-simple`
- Session Duration: Configurable (default: 24 hours)

### User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Employee | `employee` | View training catalog, enroll, submit training needs, self-nominate |
| Manager | `manager` | All employee permissions + approve training needs, approve nominations, manage resources |
| HR Admin | `hr_admin` | All manager permissions + employee management, system configuration |

### Authorization Matrix

| Feature | Employee | Manager | HR Admin |
|---------|----------|---------|----------|
| View Training Catalog | ✅ | ✅ | ✅ |
| Enroll in Training | ✅ | ✅ | ✅ |
| Submit Training Need | ✅ | ✅ | ✅ |
| Approve Training Needs | ❌ | ✅ | ✅ |
| Create/Edit Skills | ❌ | ✅ | ✅ |
| Create/Edit Vendors | ❌ | ✅ | ✅ |
| Create/Edit Trainers | ❌ | ✅ | ✅ |
| Create Training Plans | ❌ | ✅ | ✅ |
| Self-Nominate | ✅ | ✅ | ✅ |
| Approve Nominations | ❌ | ✅ | ✅ |
| View Employee Records | ❌ | ✅ | ✅ |
| Manage Employees | ❌ | ❌ | ✅ |
| View Compliance Reports | ❌ | ✅ | ✅ |

### Session Management

- **Storage**: PostgreSQL table `sessions`
- **Cookie**: HTTP-only, secure (production), SameSite policy
- **Middleware**: `express-session` with `connect-pg-simple`
- **Automatic Cleanup**: Expired sessions removed on startup

---

## API Documentation

### Authentication Endpoints

#### Login
```
GET /login
Description: Initiates OIDC authentication flow
Redirects to: Replit Auth provider
```

#### Logout
```
POST /logout
Description: Destroys session and logs out user
Response: { success: true }
```

#### Current User
```
GET /api/user
Description: Returns currently authenticated user
Response: User object with role and profile
Authorization: Required
```

### Training Catalog Endpoints

#### Get All Training Programs
```
GET /api/training-catalog
Description: Retrieve all training programs
Authorization: Required
Response: Array of training catalog items
```

#### Create Training Program
```
POST /api/training-catalog
Description: Create new training program
Authorization: Required (HR Admin)
Body: {
  title: string
  description: string
  category: string
  duration: number
  compulsory: boolean
  validityPeriod: number
  prerequisites: string[]
  tags: string[]
}
Response: Created training catalog item
```

### Training Sessions Endpoints

#### Get All Sessions
```
GET /api/training-sessions
Description: Retrieve all training sessions
Authorization: Required
Query Params: 
  - status: filter by status
  - upcoming: boolean
Response: Array of training sessions with relations
```

#### Create Session
```
POST /api/training-sessions
Description: Create new training session
Authorization: Required (HR Admin)
Body: {
  catalogId: number
  sessionDate: string (ISO date)
  duration: number
  location: string
  mode: "ONLINE" | "OFFLINE" | "HYBRID"
  trainerId: number
  maxAttendees: number
}
Response: Created training session
```

### Enrollment Endpoints

#### Get Enrollments
```
GET /api/enrollments
Description: Get enrollments (filtered by role)
Authorization: Required
Query Params:
  - sessionId: filter by session
  - employeeId: filter by employee
Response: Array of enrollments with relations
```

#### Enroll in Session
```
POST /api/enrollments
Description: Enroll employee in training session
Authorization: Required
Body: {
  sessionId: number
  employeeId: string (optional, defaults to current user)
}
Response: Created enrollment
```

#### Update Enrollment Status
```
PATCH /api/enrollments/:id
Description: Update enrollment status and details
Authorization: Required (Manager/HR Admin)
Body: {
  status: string
  attendanceMarked: boolean
  certificateIssued: boolean
  score: number
  feedback: string
}
Response: Updated enrollment
```

### Training Needs Endpoints

#### Get Training Needs
```
GET /api/training-needs
Description: Get training needs (filtered by role)
Authorization: Required
Query Params:
  - status: filter by status
  - employeeId: filter by employee
Response: Array of training needs with skill relation
```

#### Submit Training Need
```
POST /api/training-needs
Description: Submit new training need
Authorization: Required
Body: {
  skillId: number
  justification: string
  urgency: "LOW" | "MEDIUM" | "HIGH"
  expectedDuration: number
  preferredMode: string
}
Response: Created training need
```

#### Approve Training Need
```
PATCH /api/training-needs/:id/approve
Description: Approve a training need
Authorization: Required (Manager/HR Admin)
Response: Updated training need
```

#### Reject Training Need
```
PATCH /api/training-needs/:id/reject
Description: Reject a training need
Authorization: Required (Manager/HR Admin)
Body: {
  rejectionReason: string
}
Response: Updated training need
```

### Skills Management Endpoints

#### Get All Skills
```
GET /api/skills
Description: Retrieve all skills
Authorization: Required
Response: Array of skills
```

#### Create Skill
```
POST /api/skills
Description: Create new skill
Authorization: Required (Manager/HR Admin)
Body: {
  name: string
  description: string
}
Response: Created skill
```

#### Update Skill
```
PUT /api/skills/:id
Description: Update existing skill
Authorization: Required (Manager/HR Admin)
Body: {
  name: string
  description: string
}
Response: Updated skill
```

### Vendors Management Endpoints

#### Get All Vendors
```
GET /api/vendors
Description: Retrieve all vendors
Authorization: Required
Response: Array of vendors
```

#### Create Vendor
```
POST /api/vendors
Description: Create new vendor
Authorization: Required (Manager/HR Admin)
Body: {
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  specialization: string
}
Response: Created vendor
```

#### Update Vendor
```
PUT /api/vendors/:id
Description: Update existing vendor
Authorization: Required (Manager/HR Admin)
Body: Same as create
Response: Updated vendor
```

### Trainers Management Endpoints

#### Get All Trainers
```
GET /api/trainers
Description: Retrieve all trainers with vendor relation
Authorization: Required
Response: Array of trainers
```

#### Create Trainer
```
POST /api/trainers
Description: Create new trainer
Authorization: Required (Manager/HR Admin)
Body: {
  name: string
  email: string
  phone: string
  qualification: string
  specialization: string
  type: "INTERNAL" | "EXTERNAL"
  vendorId: number (optional)
}
Response: Created trainer
```

#### Update Trainer
```
PUT /api/trainers/:id
Description: Update existing trainer
Authorization: Required (Manager/HR Admin)
Body: Same as create
Response: Updated trainer
```

### Training Plans Endpoints

#### Get All Plans
```
GET /api/training-plans
Description: Retrieve all training plans
Authorization: Required
Response: Array of training plans with items count
```

#### Create Plan
```
POST /api/training-plans
Description: Create new training plan
Authorization: Required
Body: {
  year: number
  name: string
  description: string
}
Response: Created training plan
```

#### Get Plan Items
```
GET /api/training-plans/:id/items
Description: Get items for specific training plan
Authorization: Required
Response: Array of plan items with skill relation
```

#### Add Plan Item
```
POST /api/training-plans/:id/items
Description: Add item to training plan
Authorization: Required
Body: {
  skillId: number (optional)
  title: string
  tentativeMonth: string
  expectedHours: number
  type: "INTERNAL" | "EXTERNAL"
}
Response: Created plan item
```

### Nominations Endpoints

#### Get Nominations
```
GET /api/nominations
Description: Get nominations (filtered by role)
Authorization: Required
Query Params:
  - sessionId: filter by session
  - employeeId: filter by employee
Response: Array of nominations with relations
```

#### Create Nomination
```
POST /api/nominations
Description: Create self-nomination
Authorization: Required
Body: {
  sessionId: number
  source: "SELF" | "MANAGER" | "HR"
}
Response: Created nomination
```

#### Approve Nomination
```
PATCH /api/nominations/:id/approve
Description: Approve a nomination
Authorization: Required (Manager/HR Admin)
Response: Updated nomination
```

#### Reject Nomination
```
PATCH /api/nominations/:id/reject
Description: Reject a nomination
Authorization: Required (Manager/HR Admin)
Body: {
  reason: string
}
Response: Updated nomination
```

#### Waitlist Nomination
```
PATCH /api/nominations/:id/waitlist
Description: Move nomination to waitlist
Authorization: Required (Manager/HR Admin)
Body: {
  reason: string (optional)
}
Response: Updated nomination
```

### Employee Management Endpoints

#### Get All Employees
```
GET /api/employees
Description: Get all employees
Authorization: Required (Manager/HR Admin)
Response: Array of user objects
```

#### Create Employee
```
POST /api/employees
Description: Create new employee
Authorization: Required (HR Admin)
Body: User object
Response: Created user
```

#### Update Employee
```
PUT /api/employees/:id
Description: Update employee details
Authorization: Required (HR Admin)
Body: User object (partial)
Response: Updated user
```

### Dashboard Endpoints

#### Employee Dashboard Stats
```
GET /api/dashboard/employee/:id
Description: Get employee-specific dashboard data
Authorization: Required
Response: {
  totalTrainings: number
  completedTrainings: number
  upcomingTrainings: number
  complianceScore: number
  pendingNominations: number
  recentEnrollments: Enrollment[]
}
```

#### Employee Compliance Status
```
GET /api/dashboard/employee-compliance/:id
Description: Get compliance status for employee
Authorization: Required
Response: Compliance requirement status
```

### Compliance Reports Endpoints

#### Get Compliance Overview
```
GET /api/compliance/overview
Description: Get overall compliance statistics
Authorization: Required (Manager/HR Admin)
Response: Compliance metrics
```

#### Get Department Compliance
```
GET /api/compliance/department
Description: Get compliance by department
Authorization: Required (Manager/HR Admin)
Response: Array of department compliance data
```

---

## Feature Modules

### 1. Dashboard

**Location**: `client/src/pages/dashboard.tsx`

**Purpose**: Personalized landing page showing role-specific metrics

**Features**:
- Employee view: Personal training stats, upcoming sessions, compliance status
- Manager view: Team overview, pending approvals, training effectiveness
- HR Admin view: Organization-wide metrics, system health

**Key Components**:
- Stat cards with icons
- Recent enrollments list
- Quick action buttons
- Compliance gauge chart

---

### 2. Training Catalog

**Location**: `client/src/pages/training-catalog.tsx`

**Purpose**: Browse and view available training programs

**Features**:
- Grid/list view of training programs
- Category filtering
- Search by title or tags
- Compulsory training indicator
- Duration and validity period display

**User Actions**:
- View training details
- Check prerequisites
- See upcoming sessions
- Quick enroll button

---

### 3. Training Calendar

**Location**: `client/src/pages/training-calendar.tsx`

**Purpose**: View scheduled training sessions in calendar format

**Features**:
- Monthly calendar view
- Session cards with key details
- Filter by status (scheduled, completed, cancelled)
- Mode indicators (online/offline/hybrid)
- Enrollment count vs. capacity

**User Actions**:
- Navigate months
- Click session for details
- Enroll in sessions
- View trainer information

---

### 4. Training Needs

**Location**: `client/src/pages/training-needs.tsx`

**Purpose**: Manage training need identification and approval workflow

**Features**:
- Submit new training need form
  - Skill selection dropdown
  - Justification textarea
  - Urgency level (Low/Medium/High)
  - Expected duration
  - Preferred mode
- View submitted needs with status
- Status filter (All, Submitted, Approved, Rejected, Planned)
- Manager/HR approval section with pending count badge
- Rejection dialog with reason

**Workflow States**:
1. **SUBMITTED**: Initial state after employee submission
2. **APPROVED**: Manager/HR admin approved the need
3. **REJECTED**: Manager/HR admin rejected with reason
4. **PLANNED**: Included in training plan

**Role-Based Features**:
- Employees: Submit and view own needs
- Managers: Approve/reject needs, view pending approvals
- HR Admins: Same as managers

---

### 5. Skills Management

**Location**: `client/src/pages/skills.tsx`

**Purpose**: Master data management for skills taxonomy

**Features**:
- Grid display of skill cards
- Search by skill name
- Create new skill (Manager/HR only)
  - Skill name (required)
  - Description (optional)
- Edit existing skill (Manager/HR only)
- View-only for employees

**Use Cases**:
- Referenced in training needs
- Linked to training plan items
- Skills gap analysis
- Employee skill profiling

---

### 6. Vendors Management

**Location**: `client/src/pages/vendors.tsx`

**Purpose**: Manage external training vendors

**Features**:
- Card layout with vendor details
- Search by name, contact, or specialization
- Create vendor (Manager/HR only)
  - Vendor name (required)
  - Contact person
  - Email
  - Phone
  - Address
  - Specialization
- Edit vendor (Manager/HR only)
- Specialization badges

**Use Cases**:
- Link to external trainers
- Track vendor relationships
- Vendor performance evaluation
- External training coordination

---

### 7. Trainers Management

**Location**: `client/src/pages/trainers.tsx`

**Purpose**: Manage internal and external trainer profiles

**Features**:
- Card layout with trainer profiles
- Search by name, qualification, or specialization
- Type badges (Internal/External)
- Create trainer (Manager/HR only)
  - Trainer name (required)
  - Type selection (Internal/External)
  - Email
  - Phone
  - Qualifications
  - Specialization
  - Vendor association (for external trainers)
- Edit trainer (Manager/HR only)
- View vendor details for external trainers

**Use Cases**:
- Assign trainers to sessions
- Track trainer availability
- Trainer specialization matching
- Internal/external resource planning

---

### 8. Training Plans

**Location**: `client/src/pages/training-plans.tsx`

**Purpose**: Annual training planning and scheduling

**Features**:
- Master-detail interface
  - Left: Plans list with year filter
  - Right: Selected plan details with items
- Create training plan (All users)
  - Year (2020-2050)
  - Plan name
  - Description
- Year filter dropdown
- Add training items to plan (All users)
  - Training title (required)
  - Type (Internal/External)
  - Related skill (optional)
  - Expected hours
  - Tentative month (January-December)
- Status badges (Planned/Converted/Cancelled)
- Item details display:
  - Training title
  - Type badge
  - Status badge
  - Tentative month
  - Expected hours
  - Related skill (if any)

**Workflow**:
1. Create annual training plan
2. Add training items throughout the year
3. Items can be converted to actual sessions
4. Track planning vs. execution

**Role-Based Features**:
- Employees: View plans
- Managers/HR: Create plans and add items

---

### 9. Nominations

**Location**: `client/src/pages/nominations.tsx`

**Purpose**: Self-nomination and manager approval system

**Features**:
- Tabbed interface
  - **Available Sessions Tab**: Sessions available for nomination
    - Shows scheduled sessions
    - Filters out already nominated sessions
    - Session cards with date, duration, enrollment count
    - Self-nominate button
  - **Nominations Tab**: 
    - "My Nominations" for employees
    - "All Nominations" for managers/HR
- Self-nomination flow
  - Select session
  - Confirmation dialog
  - Automatic status: PENDING
- Manager approval workflow (Manager/HR only)
  - Approve button
  - Reject button with reason dialog
  - Waitlist button with optional reason
- Status badges with icons
  - PENDING (yellow, hourglass icon)
  - APPROVED (green, checkmark icon)
  - REJECTED (red, X icon)
  - WAITLIST (orange, alert icon)
- Source badges (SELF/MANAGER/HR)
- Reason display for rejection/waitlist

**Workflow States**:
1. **PENDING**: Initial state after nomination
2. **APPROVED**: Manager approved, eligible for enrollment
3. **REJECTED**: Manager rejected with reason
4. **WAITLIST**: Moved to waitlist (e.g., session full)

**Role-Based Features**:
- Employees: Self-nominate, view own nominations
- Managers: View all nominations, approve/reject/waitlist

---

### 10. Employee Records

**Location**: `client/src/pages/employee-records.tsx`

**Purpose**: View employee training history and records

**Features**:
- Employee list/search
- Training history per employee
- Certification status
- Compliance tracking
- Performance metrics

**Access**: Managers and HR Admins only

---

### 11. Employee Management

**Location**: `client/src/pages/employee-management.tsx`

**Purpose**: HR administration of employee profiles

**Features**:
- Create new employees
- Edit employee details
- Assign roles
- Department management
- Activate/deactivate accounts

**Access**: HR Admins only

---

### 12. Compliance Reports

**Location**: `client/src/pages/compliance-reports.tsx`

**Purpose**: Regulatory compliance tracking and reporting

**Features**:
- Compliance overview dashboard
- Department-wise compliance
- Regulatory requirement tracking
- Training effectiveness metrics
- Export reports

**Access**: Managers and HR Admins only

---

## Frontend Components

### Layout Components

#### Sidebar Navigation
**Location**: `client/src/components/sidebar.tsx`

**Features**:
- Role-based menu filtering
- Active route highlighting
- Pending approvals badge (managers)
- Mobile responsive hamburger menu
- User profile section
- Logout functionality

**Menu Structure**:
```typescript
{
  path: string
  icon: LucideIcon
  label: string
  roles: string[] // employee, manager, hr_admin
}
```

### UI Components (Radix UI + shadcn/ui)

Located in: `client/src/components/ui/`

| Component | Purpose |
|-----------|---------|
| Button | Primary interaction element |
| Card | Content container with header/content/footer |
| Dialog | Modal dialogs for forms and confirmations |
| Form | Form wrapper with validation |
| Input | Text input fields |
| Textarea | Multi-line text input |
| Select | Dropdown selection |
| Badge | Status and category indicators |
| Tabs | Tabbed content sections |
| Label | Form field labels |
| Toast | Success/error notifications |

### Custom Hooks

#### useAuth
**Location**: `client/src/hooks/useAuth.ts`

**Purpose**: Authentication state management

**Returns**:
```typescript
{
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

#### useToast
**Location**: `client/src/hooks/use-toast.ts`

**Purpose**: Toast notification system

**Usage**:
```typescript
toast({
  title: "Success",
  description: "Operation completed",
  variant: "default" | "destructive"
})
```

---

## Development Guidelines

### Project Structure

```
workspace/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   ├── App.tsx          # Root component with routing
│   │   ├── index.css        # Global styles
│   │   └── main.tsx         # Application entry point
│   └── index.html
├── server/                   # Backend Express application
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Storage interface
│   ├── storage-db.ts        # Database storage implementation
│   ├── vite.ts              # Vite middleware setup
│   └── multerConfig.ts      # File upload configuration
├── shared/                   # Shared code between client/server
│   └── schema.ts            # Drizzle schema definitions
├── uploads/                  # File storage directory
├── drizzle.config.ts        # Drizzle configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── tailwind.config.ts       # Tailwind CSS configuration
```

### Coding Standards

#### TypeScript
- Strict mode enabled
- No implicit any
- Explicit return types for functions
- Interface for object shapes
- Type for unions and aliases

#### React Components
- Functional components with hooks
- TypeScript for prop types
- Data-testid attributes for testing
- Proper key props for lists
- Error boundaries for critical sections

#### API Design
- RESTful conventions
- Consistent response format
- Proper HTTP status codes
- Request validation with Zod
- Role-based authorization checks

#### Database Operations
- Use Drizzle ORM (no raw SQL unless necessary)
- Type-safe queries
- Proper transaction handling
- Migration with `npm run db:push`
- Never change primary key ID types

### Environment Variables

**Development** (`.env` file):
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
ISSUER_URL=https://replit.com
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret

# Session
SESSION_SECRET=your-session-secret

# Application
NODE_ENV=development
PORT=5000
```

**Production**: Set via Replit Secrets

### Database Migrations

```bash
# Push schema changes to database
npm run db:push

# Force push (if data loss warning)
npm run db:push --force

# Generate migration SQL (optional)
npm run db:generate
```

**Important Rules**:
1. Never manually write SQL migrations
2. Never change primary key ID types
3. Use `npm run db:push` for schema sync
4. Always backup before force push

### Testing

#### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Role-based access control
- [ ] CRUD operations
- [ ] Form validation
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Browser compatibility

#### Automated Testing (Future)
- Unit tests: Jest + React Testing Library
- Integration tests: Playwright
- API tests: Supertest
- E2E tests: Playwright with OIDC mocking

### Git Workflow

1. Feature branches: `feature/feature-name`
2. Bug fixes: `bugfix/issue-description`
3. Commit messages: Conventional commits
4. Pull requests: Required for main branch
5. Code review: At least one approval

---

## Deployment

### Replit Deployment (Publishing)

**Prerequisites**:
- Replit workspace configured
- PostgreSQL database created
- Environment secrets set

**Steps**:
1. Ensure all tests pass
2. Verify workflow runs successfully
3. Check database connection
4. Set production environment variables
5. Use "Publish" button in Replit
6. Monitor deployment logs
7. Verify published app URL

**Published App Features**:
- Auto-scaling
- HTTPS enabled
- Custom domain support (optional)
- Automatic health checks
- Zero-downtime deployments

### Environment Configuration

**Required Secrets**:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `CLIENT_ID`: OAuth client ID
- `CLIENT_SECRET`: OAuth client secret

**Optional Configuration**:
- `MAX_FILE_SIZE`: Upload limit (default: 10MB)
- `SESSION_MAX_AGE`: Session duration (default: 24h)
- `CORS_ORIGIN`: CORS allowed origins

### Monitoring

**Application Logs**:
- Access via Replit console
- Error tracking in server logs
- Browser console for client errors

**Database Monitoring**:
- Connection pool stats
- Query performance
- Storage usage

**Performance Metrics**:
- API response times
- Page load times
- Database query times

---

## Future Development Roadmap

### Planned Features

1. **Advanced Reporting**
   - Custom report builder
   - Data visualization
   - Export to Excel/PDF
   - Scheduled reports

2. **Learning Management**
   - Online course integration
   - Video training support
   - Quiz and assessments
   - Certificate generation

3. **Mobile Application**
   - Native iOS/Android apps
   - Push notifications
   - Offline mode
   - QR code attendance

4. **Integration APIs**
   - HRIS integration
   - Learning platforms (LMS)
   - Calendar sync (Google/Outlook)
   - SSO providers

5. **Enhanced Workflows**
   - Multi-level approvals
   - Automated reminders
   - Training prerequisites
   - Skill-based recommendations

6. **Analytics Dashboard**
   - Training ROI analysis
   - Employee engagement metrics
   - Trend analysis
   - Predictive analytics

### Technical Improvements

1. **Performance Optimization**
   - Server-side pagination
   - Query optimization
   - Caching layer (Redis)
   - CDN for static assets

2. **Testing Infrastructure**
   - Unit test coverage
   - Integration tests
   - E2E test automation
   - Performance testing

3. **Security Enhancements**
   - Rate limiting
   - Input sanitization
   - CSRF protection
   - Security audit logging

4. **DevOps**
   - CI/CD pipeline
   - Automated deployments
   - Database backups
   - Disaster recovery plan

---

## Support & Maintenance

### Common Issues

**Issue**: Users can't login
**Solution**: Check OIDC configuration, verify session storage

**Issue**: Data not appearing after creation
**Solution**: Check query invalidation, verify API response

**Issue**: File upload fails
**Solution**: Check file size limits, verify multer configuration

**Issue**: Role-based access not working
**Solution**: Verify user role in database, check middleware

### Database Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Performance Tuning

1. Add database indexes on frequently queried columns
2. Optimize N+1 queries with proper relations
3. Implement pagination for large datasets
4. Use query result caching where appropriate
5. Monitor and optimize slow queries

---

## Appendix

### Glossary

- **CRUD**: Create, Read, Update, Delete
- **OIDC**: OpenID Connect authentication protocol
- **ORM**: Object-Relational Mapping
- **HMR**: Hot Module Replacement
- **SSO**: Single Sign-On
- **HRIS**: Human Resource Information System
- **LMS**: Learning Management System

### Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npm run db:push          # Push schema to database
npm run db:push --force  # Force push schema
npm run db:generate      # Generate migration SQL
npm run db:studio        # Open Drizzle Studio

# Dependency Management
npm install <package>    # Install package
npm update              # Update dependencies
npm audit               # Security audit
```

### Resources

- [React Documentation](https://react.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TanStack Query Documentation](https://tanstack.com/query/)
- [Replit Documentation](https://docs.replit.com/)

---

**Document Version**: 1.0  
**Last Updated**: September 30, 2025  
**Maintained By**: Development Team  
**Review Cycle**: Quarterly
