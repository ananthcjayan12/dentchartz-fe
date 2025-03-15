import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialty: string;
  license_number: string;
  created_at: string;
  updated_at: string;
}

// Mock data for testing
const MOCK_DOCTORS: Record<string, Doctor> = {
  "1": {
    id: "1",
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.johnson@dentchartzz.com",
    phone: "555-123-4567",
    specialty: "General Dentistry",
    license_number: "DDS12345",
    created_at: "2023-01-15T08:00:00Z",
    updated_at: "2023-01-15T08:00:00Z"
  },
  "2": {
    id: "2",
    first_name: "Michael",
    last_name: "Chen",
    email: "michael.chen@dentchartzz.com",
    phone: "555-987-6543",
    specialty: "Orthodontics",
    license_number: "DDS67890",
    created_at: "2023-01-15T09:30:00Z",
    updated_at: "2023-01-15T09:30:00Z"
  },
  "3": {
    id: "3",
    first_name: "Emily",
    last_name: "Rodriguez",
    email: "emily.rodriguez@dentchartzz.com",
    phone: "555-456-7890",
    specialty: "Pediatric Dentistry",
    license_number: "DDS54321",
    created_at: "2023-01-16T10:15:00Z",
    updated_at: "2023-01-16T10:15:00Z"
  },
  "4": {
    id: "4",
    first_name: "David",
    last_name: "Wilson",
    email: "david.wilson@dentchartzz.com",
    phone: "555-789-0123",
    specialty: "Oral Surgery",
    license_number: "DDS09876",
    created_at: "2023-01-17T11:45:00Z",
    updated_at: "2023-01-17T11:45:00Z"
  }
};

export const doctorService = {
  async getDoctors(): Promise<Doctor[]> {
    if (USE_MOCK_DATA) {
      return Object.values(MOCK_DOCTORS);
    }
    
    const response = await axios.get(`${API_URL}/doctors/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getDoctor(id: string): Promise<Doctor> {
    if (USE_MOCK_DATA) {
      const doctor = MOCK_DOCTORS[id];
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      return { ...doctor };
    }
    
    const response = await axios.get(`${API_URL}/doctors/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async createDoctor(doctorData: Omit<Doctor, "id" | "created_at" | "updated_at">): Promise<Doctor> {
    if (USE_MOCK_DATA) {
      const id = `${Date.now()}`;
      const now = new Date().toISOString();
      
      const newDoctor: Doctor = {
        id,
        ...doctorData,
        created_at: now,
        updated_at: now
      };
      
      MOCK_DOCTORS[id] = newDoctor;
      return { ...newDoctor };
    }
    
    const response = await axios.post(
      `${API_URL}/doctors/`,
      doctorData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  async updateDoctor(id: string, doctorData: Partial<Omit<Doctor, "id" | "created_at" | "updated_at">>): Promise<Doctor> {
    if (USE_MOCK_DATA) {
      const doctor = MOCK_DOCTORS[id];
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      
      const updatedDoctor = {
        ...doctor,
        ...doctorData,
        updated_at: new Date().toISOString()
      };
      
      MOCK_DOCTORS[id] = updatedDoctor;
      return { ...updatedDoctor };
    }
    
    const response = await axios.patch(
      `${API_URL}/doctors/${id}/`,
      doctorData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  async deleteDoctor(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      if (!MOCK_DOCTORS[id]) {
        throw new Error("Doctor not found");
      }
      
      delete MOCK_DOCTORS[id];
      return;
    }
    
    await axios.delete(`${API_URL}/doctors/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
  },
  
  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    if (USE_MOCK_DATA) {
      return Object.values(MOCK_DOCTORS).filter(
        doctor => doctor.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }
    
    const response = await axios.get(`${API_URL}/doctors/specialty/${specialty}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getAppointmentsByDoctor(doctorId: string): Promise<any[]> {
    if (USE_MOCK_DATA) {
      // This would typically be handled by the appointment service
      return [];
    }
    
    const response = await axios.get(`${API_URL}/doctors/${doctorId}/appointments/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  }
};

export default doctorService; 