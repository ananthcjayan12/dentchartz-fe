import axios from "axios";
import { Patient } from "./patient.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface Appointment {
  id: string;
  patient_id: string;
  patient?: Patient;
  doctor_id: string;
  doctor_name?: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'check-up' | 'cleaning' | 'filling' | 'extraction' | 'root-canal' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Mock data for testing
const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    patient_id: "1",
    doctor_id: "1",
    doctor_name: "Dr. Sarah Johnson",
    date: "2023-07-15",
    time: "09:00",
    duration: 30,
    status: "completed",
    type: "check-up",
    notes: "Regular check-up, no issues found",
    created_at: "2023-07-01T10:30:00Z",
    updated_at: "2023-07-15T09:30:00Z"
  },
  {
    id: "2",
    patient_id: "2",
    doctor_id: "1",
    doctor_name: "Dr. Sarah Johnson",
    date: "2023-07-16",
    time: "10:30",
    duration: 60,
    status: "completed",
    type: "filling",
    notes: "Filled cavity on lower right molar",
    created_at: "2023-07-02T14:15:00Z",
    updated_at: "2023-07-16T11:30:00Z"
  },
  {
    id: "3",
    patient_id: "3",
    doctor_id: "2",
    doctor_name: "Dr. Michael Chen",
    date: "2023-07-17",
    time: "14:00",
    duration: 45,
    status: "cancelled",
    type: "extraction",
    notes: "Patient cancelled due to illness",
    created_at: "2023-07-03T09:45:00Z",
    updated_at: "2023-07-16T08:30:00Z"
  },
  {
    id: "4",
    patient_id: "4",
    doctor_id: "2",
    doctor_name: "Dr. Michael Chen",
    date: "2023-07-18",
    time: "11:15",
    duration: 30,
    status: "scheduled",
    type: "check-up",
    notes: "First visit for new patient",
    created_at: "2023-07-10T11:20:00Z",
    updated_at: "2023-07-10T11:20:00Z"
  },
  {
    id: "5",
    patient_id: "5",
    doctor_id: "1",
    doctor_name: "Dr. Sarah Johnson",
    date: new Date().toISOString().split('T')[0], // Today
    time: "15:45",
    duration: 60,
    status: "scheduled",
    type: "root-canal",
    notes: "Patient reported severe pain",
    created_at: "2023-07-12T13:10:00Z",
    updated_at: "2023-07-12T13:10:00Z"
  }
];

// Mock doctors for testing
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialization: "General Dentistry"
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialization: "Orthodontics"
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialization: "Pediatric Dentistry"
  }
];

export const appointmentService = {
  async getAppointments(
    page = 1, 
    limit = 10, 
    filters: { 
      patientId?: string, 
      doctorId?: string, 
      status?: string, 
      date?: string,
      search?: string
    } = {}
  ): Promise<{ data: Appointment[], total: number }> {
    if (USE_MOCK_DATA) {
      // Filter appointments based on criteria
      let filteredAppointments = [...MOCK_APPOINTMENTS];
      
      if (filters.patientId) {
        filteredAppointments = filteredAppointments.filter(a => a.patient_id === filters.patientId);
      }
      
      if (filters.doctorId) {
        filteredAppointments = filteredAppointments.filter(a => a.doctor_id === filters.doctorId);
      }
      
      if (filters.status) {
        filteredAppointments = filteredAppointments.filter(a => a.status === filters.status);
      }
      
      if (filters.date) {
        filteredAppointments = filteredAppointments.filter(a => a.date === filters.date);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredAppointments = filteredAppointments.filter(a => {
          const doctor = MOCK_DOCTORS.find(d => d.id === a.doctor_id);
          return doctor?.name.toLowerCase().includes(searchLower) || 
                 a.type.toLowerCase().includes(searchLower) ||
                 a.notes?.toLowerCase().includes(searchLower);
        });
      }
      
      // Sort by date and time (most recent first)
      filteredAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Paginate results
      const startIndex = (page - 1) * limit;
      const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + limit);
      
      return {
        data: paginatedAppointments,
        total: filteredAppointments.length
      };
    }
    
    const response = await axios.get(`${API_URL}/appointments/`, {
      params: { 
        page, 
        limit, 
        patient_id: filters.patientId,
        doctor_id: filters.doctorId,
        status: filters.status,
        date: filters.date,
        search: filters.search
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getAppointment(id: string): Promise<Appointment> {
    if (USE_MOCK_DATA) {
      const appointment = MOCK_APPOINTMENTS.find(a => a.id === id);
      if (!appointment) {
        throw new Error("Appointment not found");
      }
      return appointment;
    }
    
    const response = await axios.get(`${API_URL}/appointments/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    if (USE_MOCK_DATA) {
      const newAppointment: Appointment = {
        id: (MOCK_APPOINTMENTS.length + 1).toString(),
        ...appointmentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newAppointment;
    }
    
    const response = await axios.post(`${API_URL}/appointments/`, appointmentData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async updateAppointment(id: string, appointmentData: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>): Promise<Appointment> {
    if (USE_MOCK_DATA) {
      const appointmentIndex = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (appointmentIndex === -1) {
        throw new Error("Appointment not found");
      }
      
      const updatedAppointment: Appointment = {
        ...MOCK_APPOINTMENTS[appointmentIndex],
        ...appointmentData,
        updated_at: new Date().toISOString()
      };
      
      return updatedAppointment;
    }
    
    const response = await axios.patch(`${API_URL}/appointments/${id}/`, appointmentData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async deleteAppointment(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      return;
    }
    
    await axios.delete(`${API_URL}/appointments/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
  },
  
  async getDoctors(): Promise<Doctor[]> {
    if (USE_MOCK_DATA) {
      return MOCK_DOCTORS;
    }
    
    const response = await axios.get(`${API_URL}/doctors/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getTodaysAppointments(): Promise<Appointment[]> {
    if (USE_MOCK_DATA) {
      const today = new Date().toISOString().split('T')[0];
      return MOCK_APPOINTMENTS.filter(a => a.date === today && a.status === 'scheduled');
    }
    
    const response = await axios.get(`${API_URL}/appointments/today/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getAppointmentsByDoctorAndDate(doctorId: string, date: string): Promise<Appointment[]> {
    if (USE_MOCK_DATA) {
      return Object.values(MOCK_APPOINTMENTS)
        .filter(appointment => 
          appointment.doctor_id === doctorId && 
          appointment.date.startsWith(date)
        );
    }
    
    const response = await axios.get(
      `${API_URL}/appointments/doctor/${doctorId}/date/${date}/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  }
};

export default appointmentService; 