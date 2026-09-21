# DICOM Medical Appointment & Imaging Platform

A web application for clinical appointment scheduling and interactive in-browser DICOM medical imaging review.

---

## Project Overview

The platform enables healthcare providers and clinic staff to manage patient appointments, detect scheduling conflicts, and view diagnostic DICOM studies directly in the browser.

### Key Features
- **Appointment Scheduling & Conflict Management:**
  - Book clinic slots with patient information, assigned physician, date, time, and duration presets.
  - Server-side transaction advisory locking (`pg_advisory_xact_lock`) prevents race conditions and double-booking.
  - Client-side conflict detection displays an informative conflict banner with the exact conflicting slot while preserving entered form data.
- **Interactive DICOM Imaging Viewer:**
  - Real-time DICOM file parsing and streaming (supporting MRI, CT, and secondary capture studies).
  - Modality switcher tabs defaulting to the primary diagnostic study (automatically skipping non-diagnostic `"OT"` captures by default).
  - Interactive multi-frame slider with frame counters for multi-slice/cine datasets.
  - Metadata inspector, viewport controls, and loading states.
- **Polished Healthcare UI/UX:**
  - 0.3s fade-out and 0.3s fade-in page transitions.
  - Expandable container card opening/closing animations for DICOM viewers.
  - Split-action appointment cards with dedicated navigation triggers and appointment status management.

### Tech Stack
- **Backend:** NestJS 11, TypeORM 1.1, PostgreSQL 16, Jest, TypeScript.
- **Frontend:** React 19, `@tanstack/react-query`, Tailwind CSS, CornerstoneJS DICOM viewer, date-fns, React Testing Library.

---

## Testing Guide

This project includes automated unit and integration tests (self-contained, no external database required) as well as end-to-end manual verification workflows.

---

### 1. Automated Testing

Both the backend and frontend test suites run with isolated mocks and require no running database or external services.

#### Backend Automated Tests (NestJS / TypeORM)
The backend tests cover services, controllers, error handling, date/doctor queries, transaction advisory locking, and DICOM file streaming.

```bash
cd backend

# Run all unit and integration test suites
npm test

# Run tests with code coverage report
npm run test:cov
```

**Coverage Highlights:**
- **Suites:** 7 passed (App, Doctors, Appointments, ImagingStudies)
- **Tests:** 22 passed
- **Line Coverage:** 100.00%
- **Statement Coverage:** 95.76%

#### Frontend Automated Tests (React / Testing Library)
The frontend tests cover UI components, custom hooks, page rendering, form validation, 409 conflict banners, DICOM parsing, and navigation transitions.

```bash
cd frontend

# Run all component and integration test suites
npm test

# Run tests with code coverage report
npm run test:cov
```

**Coverage Highlights:**
- **Suites:** 14 passed
- **Tests:** 69 passed
- **Covered Areas:** `CreateAppointmentPage`, `AppointmentsPage`, `AppointmentViewerPage`, `RealDcmViewer`, `DcmContainerCard`, `AppointmentCard`, `NavigationContext`, `dateTime`, and `dicomLoader`.

---

### 2. Manual End-to-End Testing (Live Environment)

Follow these steps to run and test the complete application locally.

#### Step 1: Start PostgreSQL Database
Using Docker Compose from the root directory:
```bash
docker compose up -d
```
*Note: Database credentials default to `dcm_user:dcm_pass` on port `5432` as configured in `.env`.*

#### Step 2: Configure & Start Backend
In a new terminal window:
```bash
cd backend
npm install

# Run database migrations to create schema
npm run migration:run

# Seed initial doctors, sample appointments, and DICOM imaging studies
npm run seed

# Start development API server
npm run start:dev
```
The backend API will be available at `http://localhost:3000`.

#### Step 3: Start Frontend
In another terminal window:
```bash
cd frontend
npm install
npm start
```
The web application will open at `http://localhost:3001` (or `http://localhost:3000`).

---

### 3. Step-by-Step Verification Checklist

1. **Appointments Directory (`/`)**:
   - [ ] Verify existing appointments loaded from seed data are visible with doctor name, patient name, date/time, and status pill.
   - [ ] Use the date picker filter to view appointments for specific dates.
   - [ ] Click the left half of any appointment card to navigate into the appointment detail page.
   - [ ] Confirm the 0.3s fade-out transition occurs before navigating, followed by a 0.3s fade-in on the details page.

2. **Appointment Details & DICOM Viewer**:
   - [ ] Verify patient details, assigned doctor, and current status are displayed.
   - [ ] If an imaging study exists (e.g. for MRI appointment):
     - [ ] Verify the DICOM container card smoothly expands with an opening animation.
     - [ ] Verify the viewer selects the primary imaging modality (e.g. `MR` instead of `OT`).
     - [ ] Drag or step through the multi-frame slider to scrub through DICOM slices.
   - [ ] Change appointment status (e.g., mark as `Completed` or `Cancelled`) and confirm the badge updates.
   - [ ] Click "Back to Appointments" and verify the smooth fade transition returns to the list.

3. **Booking a New Appointment & Conflict Detection**:
   - [ ] Click **"+ New Appointment"** on the main appointments page.
   - [ ] Submit an empty form to confirm required field validations trigger with descriptive messages.
   - [ ] **Test Conflict Handling:** Select a doctor and enter a date/time that overlaps with an existing appointment for that same doctor. Click "Schedule Appointment".
     - [ ] Confirm an amber **"Schedule Conflict Detected"** banner appears displaying the conflicting time slot.
     - [ ] Confirm entered patient name, date, time, and duration remain intact without being cleared.
   - [ ] Adjust the time or doctor to a non-conflicting slot and submit.
     - [ ] Confirm successful booking and automatic navigation back to the appointment list showing the new appointment.

---

## Directory Structure

```text
dcm_proj/
├── README.md               # Project documentation and testing guide
├── docker-compose.yml      # Local PostgreSQL container service
├── .env                    # Database configuration environment variables
├── backend/                # NestJS API application
│   ├── src/
│   │   ├── appointments/   # Appointment CRUD & locking logic
│   │   ├── doctors/        # Doctor queries
│   │   ├── imaging-studies/# DICOM study metadata & streaming
│   │   └── entities/       # TypeORM database models
│   └── test/               # Jest backend test setup and mocks
└── frontend/               # React frontend application
    ├── src/
    │   ├── api/            # REST API client
    │   ├── components/     # UI components (Viewer, Cards, Badges)
    │   ├── context/        # Navigation state with fade transitions
    │   ├── pages/          # Appointments, Viewer, and Booking pages
    │   └── utils/          # DateTime and DICOM parsing helpers
    └── public/
```
