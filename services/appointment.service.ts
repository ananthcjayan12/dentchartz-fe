import { apiGet, apiPost, apiPatch, apiDelete } from "./api.utils";
import { Patient } from "@/services/patient.service";

export interface Appointment {
  id: string;
  patient: {
    id: number | string;
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
    email?: string;
  } | string | number;
  patient_name?: string;
  dentist: {
    id: number | string;
    username: string;
    full_name: string;
    email?: string;
  } | string | number;
  dentist_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  status_display?: string;
  duration_minutes?: number;
  reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  selected?: boolean;
  patient_name?: string;
  appointment_id?: string;
}

export interface AppointmentListResponse {
  results: Appointment[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface Dentist {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface DentistListResponse {
  results: Dentist[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const appointmentService = {
  // Get all appointments with pagination and filtering
  getAppointments: async (
    clinicId: string, 
    page = 1, 
    filters: { 
      date?: string;
      start_date?: string;
      end_date?: string;
      patient_id?: string;
      dentist_id?: string;
      status?: string;
      search?: string;
    } = {},
    limit = 10
  ): Promise<AppointmentListResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    }).toString();
    
    return apiGet(`/clinics/${clinicId}/appointments/?${queryParams}`);
  },
  
  // Get a single appointment by ID
  getAppointment: async (clinicId: string, appointmentId: string): Promise<Appointment> => {
    return apiGet(`/clinics/${clinicId}/appointments/${appointmentId}/`);
  },
  
  // Create a new appointment
  createAppointment: async (
    clinicId: string,
    appointmentData: {
      patient_id: string;
      dentist_id: string;
      date: string;
      start_time: string;
      end_time: string;
      reason?: string;
      notes?: string;
    }
  ): Promise<Appointment> => {
    return apiPost(`/clinics/${clinicId}/appointments/`, appointmentData);
  },
  
  // Update an existing appointment
  updateAppointment: async (
    clinicId: string,
    appointmentId: string, 
    appointmentData: Partial<{
      date: string;
      start_time: string;
      end_time: string;
      reason: string;
      notes: string;
    }>
  ): Promise<Appointment> => {
    return apiPatch(`/clinics/${clinicId}/appointments/${appointmentId}/`, appointmentData);
  },
  
  // Cancel an appointment
  cancelAppointment: async (
    clinicId: string,
    appointmentId: string
  ): Promise<Appointment> => {
    return apiPost(`/clinics/${clinicId}/appointments/${appointmentId}/cancel/`);
  },
  
  // Update appointment status
  updateAppointmentStatus: async (
    clinicId: string,
    appointmentId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<Appointment> => {
    return apiPost(`/clinics/${clinicId}/appointments/${appointmentId}/update_status/`, { status });
  },
  
  // Delete an appointment
  deleteAppointment: async (clinicId: string, appointmentId: string): Promise<void> => {
    return apiDelete(`/clinics/${clinicId}/appointments/${appointmentId}/`);
  },
  
  // Get available time slots for a specific date and dentist
  getAvailableTimeSlots: async (
    clinicId: string,
    date: string,
    dentistId: string,
    selectedTime?: string
  ): Promise<TimeSlot[]> => {
    const queryParams = new URLSearchParams({
      dentist: dentistId,
      date: date
    });
    
    if (selectedTime) {
      queryParams.append('selected_time', selectedTime);
    }
    
    const response = await apiGet(`/clinics/${clinicId}/time-slots/?${queryParams.toString()}`);
    return response.time_slots.map((slot: any) => ({
      time: slot.time,
      available: slot.available,
      selected: slot.selected || false,
      patient_name: slot.patient_name,
      appointment_id: slot.appointment_id
    }));
  },
  
  // Get appointments for a specific patient
  getPatientAppointments: async (
    clinicId: string,
    patientId: string,
    page = 1,
    limit = 10
  ): Promise<AppointmentListResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      patient_id: patientId
    }).toString();
    
    return apiGet(`/clinics/${clinicId}/appointments/?${queryParams}`);
  },
  
  // Get all patients for appointment form
  getPatients: async (
    clinicId: string,
    search = "",
    limit = 10
  ): Promise<Patient[]> => {
    const queryParams = new URLSearchParams({
      search,
      limit: limit.toString()
    }).toString();
    
    const response = await apiGet(`/clinics/${clinicId}/patients/?${queryParams}`);
    return response.results;
  },
  
  // Get all dentists for appointment form
  getDentists: async (
    clinicId: string
  ): Promise<Dentist[]> => {
    const response = await apiGet(`/clinics/${clinicId}/dentists/`);
    return response.results;
  },
  
  // Search patients for autocomplete
  searchPatients: async (
    clinicId: string,
    query: string
  ): Promise<Patient[]> => {
    if (!query) return [];
    
    const queryParams = new URLSearchParams({
      search: query,
      limit: "5" // Limit results for autocomplete
    }).toString();
    
    const response = await apiGet(`/clinics/${clinicId}/patients/?${queryParams}`);
    return response.results;
  }
};

export default appointmentService; 