# Overview

ManufacTMS is a comprehensive Training Management System designed specifically for manufacturing environments. The application provides compliance training management, certification tracking, audit requirement management, and regulatory compliance reporting. It features a modern web interface built with React and TypeScript, backed by a Node.js/Express server with PostgreSQL database storage.

# Recent Changes (November 13, 2025)

## Responsive Design Implementation
- **Mobile-First Approach**: All 9 main pages now fully responsive across mobile (375px+), tablet (768px+), and desktop (1920px+) breakpoints
- **Responsive Patterns**:
  - Desktop tables convert to mobile card views using `hidden md:block` and `md:hidden` utilities
  - Headers and button groups stack vertically on mobile (`flex-col sm:flex-row`)
  - Buttons expand to full-width on mobile (`w-full sm:w-auto`)
  - Grid layouts adapt across breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
  - Responsive spacing (`p-4 sm:p-6`) and typography (`text-xl sm:text-2xl`)
- **Pages Updated**: Dashboard, Training Catalog, Training Calendar, Training Needs, Employee Records, Employee Management, Nominations, Training Plans, Skills, Vendors, Trainers, Compliance Reports
- **Design Consistency**: Follows Material Design 3 principles from design_guidelines.md
- **Accessibility**: All data-testid attributes preserved for testing; mobile-optimized touch targets

## Known Issues
- **React Warnings**: Console shows "Invalid hook call" and "missing keys" warnings on Dashboard load
  - Application functions correctly despite warnings
  - Warnings appear to be pre-existing, not introduced by responsive design changes
  - Recommend investigation and resolution before production deployment

## Role-Aware Training Approval Workflows (September 30, 2025)
- **Submission Source Tracking**: Added `submissionSource` field to training_needs table (EMPLOYEE or MANAGER)
  - Automatically set based on requester's role when creating training needs
  - Manager-initiated requests require single-stage HR approval only
  - Employee-initiated requests use two-stage approval (Manager → HR)
- **Approval Flow Logic**: Backend enforces different approval paths based on submissionSource
  - Managers cannot approve their own submissions
  - HR can approve both manager-initiated and employee-initiated needs
- **UI Adaptation**: Training Needs page dynamically shows/hides approval buttons based on user role and submission source

## Nomination Seat Capacity Checking
- **Capacity Enforcement**: POST /api/nominations validates maxParticipants before creating nominations
  - Counts existing enrollments + approved/pending nominations
  - Returns "Seat is full, please contact HR" message when capacity reached
- **Error Handling**: Toast notifications automatically display capacity errors to users

## Schema Adjustments
- **Title Field**: Made nullable (not required in form, skill name serves as identifier)
- **Type Field**: Defaults to 'ANY' in backend when not provided by form
- **Status Queries**: Backend supports comma-separated status values for HR admin views (e.g., "MGR_APPROVED,SUBMITTED")

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with centralized route registration
- **File Uploads**: Multer middleware for handling training materials and documentation
- **Session Management**: Express sessions with PostgreSQL storage
- **Error Handling**: Centralized error handling middleware with structured error responses

## Database Architecture
- **Database**: PostgreSQL with Neon serverless connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Code-first schema definition with migration support
- **Tables**: Comprehensive schema including:
  - **Core**: users, training catalog, sessions, enrollments, feedback, audit logs
  - **Workflow**: training needs, training plans, plan items, nominations
  - **Masters**: skills, vendors, trainers
  - **Compliance**: compliance requirements, effectiveness evaluations, evidence attachments
- **Relationships**: Proper foreign key relationships between entities for data integrity
- **State Management**: Support for complete workflow states (SUBMITTED → APPROVED → PLANNED → SCHEDULED → DELIVERED → CLOSED)

## Authentication & Authorization
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Security**: HTTP-only cookies with secure settings for production
- **User Management**: Role-based access control (employee, manager, hr_admin)
- **Token Handling**: Automatic token refresh and session management

## File Management
- **Storage**: Local file system storage in uploads directory
- **File Types**: Support for documents (PDF, DOC, DOCX), presentations (PPT, PPTX), and images
- **Size Limits**: 10MB maximum file size with type validation
- **Organization**: Timestamped file naming for uniqueness

## Development Environment
- **Hot Reload**: Vite HMR for instant development feedback
- **Error Overlay**: Runtime error modal for debugging
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Path Aliases**: Configured import aliases for clean code organization

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connection**: WebSocket-based connections for serverless compatibility

## Authentication Services
- **Replit Auth**: OpenID Connect identity provider
- **Session Store**: PostgreSQL session storage with automatic cleanup

## UI Libraries
- **Radix UI**: Headless UI primitives for accessibility and behavior
- **Lucide React**: Consistent icon library
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities

## Development Tools
- **Vite Plugins**: React support, runtime error overlay, and Replit-specific tooling
- **Drizzle Kit**: Database migration and schema management tools
- **TypeScript**: Static type checking and IntelliSense support

## Production Dependencies
- **Express Middleware**: CORS, body parsing, static file serving
- **Security**: Helmet for security headers, session security configuration
- **File Processing**: Multer for multipart form data handling
- **Query Client**: TanStack Query for efficient data fetching and caching