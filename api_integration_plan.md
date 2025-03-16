# DentChartzz API Integration Plan

## Overview
This document outlines the step-by-step plan to integrate the DentChartzz frontend with the backend API. We'll follow a methodical approach, starting with authentication and progressing through each major feature.

## Integration Phases

### Phase 1: Authentication
- [x] Configure API base URL and environment variables
- [ ] Implement login API integration
- [ ] Set up token management (storage, refresh, expiry)
- [ ] Create authentication middleware
- [ ] Test authentication flow end-to-end

### Phase 2: Patient Management
- [ ] Implement patient listing API
- [ ] Create patient details API integration
- [ ] Set up patient creation/update APIs
- [ ] Implement patient search functionality
- [ ] Test patient CRUD operations

### Phase 3: Appointment System
- [ ] Implement appointment listing API
- [ ] Create appointment details API integration
- [ ] Set up appointment creation/update APIs
- [ ] Implement calendar view data fetching
- [ ] Test appointment scheduling workflow

### Phase 4: Dental Chart
- [ ] Implement dental chart retrieval API
- [ ] Set up tooth condition/procedure APIs
- [ ] Create treatment recording functionality
- [ ] Implement chart history tracking
- [ ] Test dental charting workflow

### Phase 5: Payment System
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

### Patient Endpoints
- `GET /api/v1/patients/` - List all patients
- `GET /api/v1/patients/{id}/` - Get patient details
- `POST /api/v1/patients/` - Create a new patient
- `PATCH /api/v1/patients/{id}/` - Update a patient
- `DELETE /api/v1/patients/{id}/` - Delete a patient

### Appointment Endpoints
- `GET /api/v1/appointments/` - List all appointments
- `GET /api/v1/appointments/{id}/` - Get appointment details
- `POST /api/v1/appointments/` - Create a new appointment
- `PATCH /api/v1/appointments/{id}/` - Update an appointment
- `DELETE /api/v1/appointments/{id}/` - Delete an appointment

### Dental Chart Endpoints
- `GET /api/v1/patients/{id}/dental-chart/` - Get patient's dental chart
- `GET /api/v1/dental-conditions/` - Get all dental conditions
- `GET /api/v1/dental-procedures/` - Get all dental procedures
- `POST /api/v1/patients/{id}/dental-chart/tooth/{tooth_number}/condition/` - Add condition to tooth
- `POST /api/v1/patients/{id}/dental-chart/tooth/{tooth_number}/procedure/` - Add procedure to tooth
- `GET /api/v1/patients/{id}/dental-chart/history/` - Get chart history

### Payment Endpoints
- `GET /api/v1/patients/{id}/payments/` - List patient's payments
- `GET /api/v1/payments/{id}/` - Get payment details
- `POST /api/v1/patients/{id}/payments/` - Create a new payment
- `GET /api/v1/patients/{id}/payment-summary/` - Get patient payment summary

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

## Next Steps

1. Begin with Phase 1: Authentication
2. For each API endpoint:
   - Document expected request/response format
   - Update the corresponding service function
   - Test the integration
   - Move to the next endpoint 