import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  medical_history?: string;
  created_at: string;
  updated_at: string;
}

// Mock data for testing
const MOCK_PATIENTS: Patient[] = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    date_of_birth: "1985-05-15",
    gender: "male",
    address: "123 Main St, Anytown, USA",
    medical_history: "No significant medical history",
    created_at: "2023-01-15T10:30:00Z",
    updated_at: "2023-01-15T10:30:00Z"
  },
  {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: "555-987-6543",
    date_of_birth: "1990-08-22",
    gender: "female",
    address: "456 Oak Ave, Somewhere, USA",
    medical_history: "Allergic to penicillin",
    created_at: "2023-02-10T14:15:00Z",
    updated_at: "2023-02-10T14:15:00Z"
  },
  {
    id: "3",
    first_name: "Robert",
    last_name: "Johnson",
    email: "robert.johnson@example.com",
    phone: "555-456-7890",
    date_of_birth: "1978-11-30",
    gender: "male",
    address: "789 Pine St, Elsewhere, USA",
    medical_history: "Hypertension",
    created_at: "2023-03-05T09:45:00Z",
    updated_at: "2023-03-05T09:45:00Z"
  },
  {
    id: "4",
    first_name: "Emily",
    last_name: "Williams",
    email: "emily.williams@example.com",
    phone: "555-789-0123",
    date_of_birth: "1995-04-12",
    gender: "female",
    address: "321 Elm St, Nowhere, USA",
    medical_history: "Asthma",
    created_at: "2023-04-20T11:20:00Z",
    updated_at: "2023-04-20T11:20:00Z"
  },
  {
    id: "5",
    first_name: "Michael",
    last_name: "Brown",
    email: "michael.brown@example.com",
    phone: "555-234-5678",
    date_of_birth: "1982-09-08",
    gender: "male",
    address: "654 Maple Ave, Anyplace, USA",
    medical_history: "Diabetes type 2",
    created_at: "2023-05-15T13:10:00Z",
    updated_at: "2023-05-15T13:10:00Z"
  }
];

export const patientService = {
  async getPatients(page = 1, limit = 10, search = ""): Promise<{ data: Patient[], total: number }> {
    if (USE_MOCK_DATA) {
      // Filter patients by search term
      const filteredPatients = search 
        ? MOCK_PATIENTS.filter(patient => 
            `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
            patient.email?.toLowerCase().includes(search.toLowerCase()) ||
            patient.phone?.includes(search)
          )
        : MOCK_PATIENTS;
      
      // Paginate results
      const paginatedPatients = filteredPatients.slice((page - 1) * limit, page * limit);
      
      return {
        data: paginatedPatients,
        total: filteredPatients.length
      };
    }
    
    const response = await axios.get(`${API_URL}/patients/`, {
      params: { page, limit, search },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getPatient(id: string): Promise<Patient> {
    if (USE_MOCK_DATA) {
      const patient = MOCK_PATIENTS.find(p => p.id === id);
      if (!patient) {
        throw new Error("Patient not found");
      }
      return patient;
    }
    
    const response = await axios.get(`${API_URL}/patients/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async createPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    if (USE_MOCK_DATA) {
      const newPatient: Patient = {
        id: (MOCK_PATIENTS.length + 1).toString(),
        ...patientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newPatient;
    }
    
    const response = await axios.post(`${API_URL}/patients/`, patientData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async updatePatient(id: string, patientData: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>): Promise<Patient> {
    if (USE_MOCK_DATA) {
      const patientIndex = MOCK_PATIENTS.findIndex(p => p.id === id);
      if (patientIndex === -1) {
        throw new Error("Patient not found");
      }
      
      const updatedPatient: Patient = {
        ...MOCK_PATIENTS[patientIndex],
        ...patientData,
        updated_at: new Date().toISOString()
      };
      
      return updatedPatient;
    }
    
    const response = await axios.patch(`${API_URL}/patients/${id}/`, patientData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async deletePatient(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      return;
    }
    
    await axios.delete(`${API_URL}/patients/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
  },

  async getPatients(): Promise<Patient[]> {
    if (USE_MOCK_DATA) {
      return Object.values(MOCK_PATIENTS);
    }
    
    try {
      const response = await axios.get(`${API_URL}/patients/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      
      // Ensure we return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching patients:", error);
      return [];
    }
  }
};

export default patientService; 