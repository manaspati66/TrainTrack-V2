# ManufacTMS Design Guidelines

## Design Approach
**Design System**: Material Design 3 adapted for enterprise data-heavy applications
**Rationale**: Manufacturing environments require clarity, efficiency, and familiar patterns. Material Design's robust component library and proven enterprise patterns provide the foundation for a professional, functional system.

## Typography
- **Primary Font**: Inter (via Google Fonts CDN)
- **Hierarchy**:
  - Page Titles: text-3xl font-semibold (30px)
  - Section Headers: text-xl font-semibold (20px)
  - Card Titles: text-lg font-medium (18px)
  - Body Text: text-base (16px)
  - Secondary/Meta: text-sm (14px)
  - Table Headers: text-sm font-medium uppercase tracking-wide

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (p-4, m-6, gap-8)
- Mobile: p-4, gap-4
- Tablet: p-6, gap-6
- Desktop: p-8, gap-8

**Grid Structure**:
- Desktop: 12-column grid with fixed sidebar (256px)
- Tablet: Collapsible drawer navigation
- Mobile: Bottom tab bar + hamburger menu

## Core Components

### Navigation
**Desktop Sidebar** (fixed, 256px):
- Logo/brand at top
- Primary nav items with icons (Dashboard, Training Programs, Certifications, Employees, Audits, Reports)
- User profile section at bottom
- Collapse toggle button

**Mobile Navigation**:
- Top app bar with hamburger menu and page title
- Bottom navigation for 4-5 primary actions
- Slide-out drawer for secondary navigation

### Dashboard Layout
**Widget Grid System**:
- Desktop: 3-4 columns using grid-cols-4
- Tablet: 2 columns using md:grid-cols-2
- Mobile: Single column stacked

**Dashboard Cards**:
- Stat cards: Icon + number + label + trend indicator
- Chart cards: Title + visualization + time period selector
- Alert cards: Warning icon + priority indicator + action button
- Quick action cards: Icon + title + description + CTA

### Data Tables
**Responsive Strategy**:
- Desktop: Full table with all columns visible
- Tablet: Hide less critical columns, add horizontal scroll
- Mobile: Card-based layout - each row becomes expandable card with key info visible, details on tap

**Table Features**:
- Sticky header row
- Row hover states
- Inline action buttons (Edit, View, Delete)
- Bulk selection checkboxes
- Sort indicators on column headers
- Pagination controls (items per page selector)
- Search/filter bar above table

### Forms
**Touch-Optimized Design**:
- Minimum touch target: 44px height
- Generous input spacing: gap-6
- Large, clear labels above inputs
- Floating action button for primary submit
- Stepper for multi-step forms

**Form Layout**:
- Desktop: 2-column layout for related fields
- Mobile: Single column, full-width inputs
- Required field indicators (asterisk)
- Inline validation with clear error messages
- Helper text below inputs where needed

### Status Indicators
**Certification/Training Status**:
- Badge components with icons
- Color-coded (success, warning, error, info states)
- Certification expiry countdown pills
- Progress bars for course completion

## Icons
**Library**: Material Icons via CDN
**Usage**: 24px standard, 20px compact contexts, consistent throughout

## Animations
**Minimal, Purposeful Only**:
- Page transitions: 200ms ease
- Drawer slide: 300ms ease-out
- Loading spinners for async operations
- No decorative animations

## Images
**Login/Landing Page** (if separate from dashboard):
- Large hero image: Manufacturing floor or training facility (1920x1080)
- Image treatment: Slight dark overlay (opacity-60) for text contrast
- Position: Full-width background behind login form
- Alternative: Split-screen layout - image 60% left, login form 40% right

**Dashboard**: No hero images - immediate access to data and tools

**Employee Profiles**: Circular avatar images (128px)

**Certification Thumbnails**: Small document/badge icons (48px)

## Specialized Components

**Audit Timeline**: Vertical timeline with milestone markers, dates, and status indicators

**Training Calendar**: Month/week view with color-coded training sessions, click-to-details

**Compliance Dashboard**: Circular progress indicators showing completion percentages, stacked bar charts for department comparisons

**Certificate Viewer**: Modal overlay with PDF preview, download button, share functionality