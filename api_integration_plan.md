# DentChartzz API Integration Plan

## Overview
This document outlines the step-by-step plan to integrate the DentChartzz frontend with the backend API. We'll follow a methodical approach, starting with authentication and progressing through each major feature.

## Integration Phases

### Phase 1: Authentication ✅
- [x] Configure API base URL and environment variables
- [x] Implement login API integration
- [x] Set up token management (storage, refresh, expiry)
- [x] Create authentication middleware
- [x] Test authentication flow end-to-end

### Phase 2: Multi-Clinic Support ✅
- [x] Implement clinic selection in user interface
- [x] Add clinic context to authentication system
- [x] Create clinic switching functionality
- [x] Ensure all API requests include current clinic context
- [x] Test multi-clinic workflows

### Phase 3: Patient Management ✅
- [x] Implement patient listing API
- [x] Create patient details API integration
- [x] Set up patient creation/update APIs
- [x] Implement patient search functionality
- [x] Implement patient deletion with confirmation
- [x] Add proper error handling for form validation
- [x] Test patient CRUD operations

### Phase 4: Appointment System
- [x] Implement appointment listing API
- [x] Create appointment details API integration
- [x] Set up appointment creation/update APIs
- [x] Implement calendar view data fetching
- [x] Test appointment scheduling workflow

### Phase 5: Dental Chart
- [ ] Implement dental chart retrieval API
- [ ] Set up tooth condition/procedure APIs
- [ ] Create treatment recording functionality
- [ ] Implement chart history tracking
- [ ] Test dental charting workflow

### Phase 6: Payment System
- [ ] Implement payment listing API
- [ ] Create payment details API integration
- [ ] Set up payment creation APIs
- [ ] Implement balance payment functionality
- [ ] Test payment recording workflow

## API Endpoints and Data Structures

### Authentication Endpoints
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/logout/` - User logout
- `POST /api/v1/auth/token/refresh/` - Refresh JWT token

### Clinic Endpoints
- `GET /api/v1/clinics/` - List user's clinics
- `GET /api/v1/clinics/{id}/` - Get clinic details
- `POST /api/v1/clinics/set-current/` - Set user's current clinic

### Patient Endpoints
- `GET /api/v1/clinics/{clinic_id}/patients/` - List all patients
- `GET /api/v1/clinics/{clinic_id}/patients/{id}/` - Get patient details
- `POST /api/v1/clinics/{clinic_id}/patients/` - Create a new patient
- `PATCH /api/v1/clinics/{clinic_id}/patients/{id}/` - Update a patient
- `DELETE /api/v1/clinics/{clinic_id}/patients/{id}/` - Delete a patient

### Appointment Endpoints
- `GET /api/v1/clinics/{clinic_id}/appointments/` - List all appointments
- `GET /api/v1/clinics/{clinic_id}/appointments/{id}/` - Get appointment details
- `POST /api/v1/clinics/{clinic_id}/appointments/` - Create a new appointment
- `PATCH /api/v1/clinics/{clinic_id}/appointments/{id}/` - Update an appointment
- `DELETE /api/v1/clinics/{clinic_id}/appointments/{id}/` - Delete an appointment
- `GET /api/v1/clinics/{clinic_id}/appointments/available-slots/` - Get available time slots

### Dental Chart Endpoints
- `GET /api/v1/clinics/{clinic_id}/patients/{patient_id}/dental-chart/` - Get patient's dental chart
- `GET /api/v1/clinics/{clinic_id}/dental-conditions/` - Get all dental conditions
- `GET /api/v1/clinics/{clinic_id}/dental-procedures/` - Get all dental procedures
- `POST /api/v1/clinics/{clinic_id}/patients/{patient_id}/dental-chart/tooth/{tooth_number}/condition/` - Add condition to tooth
- `POST /api/v1/clinics/{clinic_id}/patients/{patient_id}/dental-chart/tooth/{tooth_number}/procedure/` - Add procedure to tooth
- `GET /api/v1/clinics/{clinic_id}/patients/{patient_id}/dental-chart/history/` - Get chart history

### Payment Endpoints
- `GET /api/v1/clinics/{clinic_id}/patients/{patient_id}/payments/` - List patient's payments
- `GET /api/v1/clinics/{clinic_id}/payments/{id}/` - Get payment details
- `POST /api/v1/clinics/{clinic_id}/patients/{patient_id}/payments/` - Create a new payment
- `GET /api/v1/clinics/{clinic_id}/patients/{patient_id}/payment-summary/` - Get patient payment summary

## Implementation Strategy

1. **Service Layer Updates**:
   - Update each service file to use the real API endpoints
   - Maintain mock data for development/testing
   - Use environment variables to toggle between real and mock data

2. **Error Handling**:
   - Implement consistent error handling across all API calls
   - Create reusable error handling utilities
   - Add appropriate user feedback for API failures

3. **Loading States**:
   - Add loading indicators for all API operations
   - Implement skeleton loaders for better UX

4. **Testing Strategy**:
   - Test each API integration individually
   - Create end-to-end tests for critical workflows
   - Verify error handling and edge cases

## Progress Updates

### 2023-11-15
- Completed authentication integration
- Added clinic selector to user navigation
- Implemented clinic switching functionality in the UI

### 2023-11-16
- Created API utility functions for clinic context
- Implemented patient listing with search and pagination
- Updated all API services to include clinic context

### 2023-11-17
- Completed patient CRUD operations
- Implemented nested API structure for clinic-specific patients
- Added detailed error handling for patient forms
- Created pagination component for patient listing

## Next Steps

1. Complete Phase 5: Dental Chart
   - Implement dental chart retrieval API
   - Set up tooth condition/procedure APIs
   - Create treatment recording functionality
   - Implement chart history tracking
   - Test dental charting workflow

2. Complete Phase 6: Payment System
   - Implement payment listing API
   - Create payment details API integration
   - Set up payment creation APIs
   - Implement balance payment functionality
   - Test payment recording workflow

3. Develop user and staff management
   - Implement user profile view/edit
   - Add user role management
   - Create staff management for clinic owners

4. Optimize performance and user experience
   - Implement data caching where appropriate
   - Add loading states and skeletons
   - Optimize API requests with pagination and filtering
   - Implement lazy loading for components 