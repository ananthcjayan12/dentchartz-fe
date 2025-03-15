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
const MOCK_PATIENTS: Record<string, Patient> = {
  "1": {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    date_of_birth: "1985-05-15",
    gender: "male",
    address: "123 Main St, Anytown, CA 12345",
    medical_history: "No significant medical history",
    allergies: "None",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "555-987-6543",
    insurance_provider: "HealthPlus Insurance",
    insurance_policy_number: "HP12345678",
    created_at: "2023-01-10T08:00:00Z",
    updated_at: "2023-01-10T08:00:00Z"
  },
  "2": {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: "555-234-5678",
    date_of_birth: "1990-08-22",
    gender: "female",
    address: "456 Oak Ave, Somewhere, NY 67890",
    medical_history: "Asthma",
    allergies: "Penicillin",
    emergency_contact_name: "John Smith",
    emergency_contact_phone: "555-876-5432",
    insurance_provider: "MediCare Plus",
    insurance_policy_number: "MC87654321",
    created_at: "2023-01-15T09:30:00Z",
    updated_at: "2023-01-15T09:30:00Z"
  },
  "3": {
    id: "3",
    first_name: "Michael",
    last_name: "Johnson",
    email: "michael.johnson@example.com",
    phone: "555-345-6789",
    date_of_birth: "1978-11-30",
    gender: "male",
    address: "789 Pine St, Elsewhere, TX 54321",
    medical_history: "Hypertension",
    allergies: "Sulfa drugs",
    emergency_contact_name: "Sarah Johnson",
    emergency_contact_phone: "555-765-4321",
    insurance_provider: "Blue Shield",
    insurance_policy_number: "BS56789012",
    created_at: "2023-01-20T10:15:00Z",
    updated_at: "2023-01-20T10:15:00Z"
  },
  "4": {
    id: "4",
    first_name: "Emily",
    last_name: "Williams",
    email: "emily.williams@example.com",
    phone: "555-456-7890",
    date_of_birth: "1995-03-17",
    gender: "female",
    address: "321 Maple Dr, Nowhere, FL 98765",
    medical_history: "None",
    allergies: "Latex",
    emergency_contact_name: "David Williams",
    emergency_contact_phone: "555-654-3210",
    insurance_provider: "Aetna",
    insurance_policy_number: "AE34567890",
    created_at: "2023-01-25T11:45:00Z",
    updated_at: "2023-01-25T11:45:00Z"
  },
  "5": {
    id: "5",
    first_name: "David",
    last_name: "Brown",
    email: "david.brown@example.com",
    phone: "555-567-8901",
    date_of_birth: "1982-07-08",
    gender: "male",
    address: "654 Cedar Ln, Anyplace, WA 13579",
    medical_history: "Diabetes Type 2",
    allergies: "None",
    emergency_contact_name: "Lisa Brown",
    emergency_contact_phone: "555-543-2109",
    insurance_provider: "United Health",
    insurance_policy_number: "UH90123456",
    created_at: "2023-02-01T13:00:00Z",
    updated_at: "2023-02-01T13:00:00Z"
  },
  "6": {
    id: "6",
    first_name: "Sarah",
    last_name: "Miller",
    email: "sarah.miller@example.com",
    phone: "555-678-9012",
    date_of_birth: "1988-12-05",
    gender: "female",
    address: "987 Birch Rd, Somewhere Else, IL 24680",
    medical_history: "Migraines",
    allergies: "Aspirin",
    emergency_contact_name: "Robert Miller",
    emergency_contact_phone: "555-432-1098",
    insurance_provider: "Cigna",
    insurance_policy_number: "CI67890123",
    created_at: "2023-02-05T14:30:00Z",
    updated_at: "2023-02-05T14:30:00Z"
  },
  "7": {
    id: "7",
    first_name: "James",
    last_name: "Davis",
    email: "james.davis@example.com",
    phone: "555-789-0123",
    date_of_birth: "1975-09-20",
    gender: "male",
    address: "135 Spruce Ave, Elsewhere City, GA 97531",
    medical_history: "Heart disease",
    allergies: "Shellfish",
    emergency_contact_name: "Patricia Davis",
    emergency_contact_phone: "555-321-0987",
    insurance_provider: "Humana",
    insurance_policy_number: "HU45678901",
    created_at: "2023-02-10T15:45:00Z",
    updated_at: "2023-02-10T15:45:00Z"
  },
  "8": {
    id: "8",
    first_name: "Jennifer",
    last_name: "Garcia",
    email: "jennifer.garcia@example.com",
    phone: "555-890-1234",
    date_of_birth: "1992-01-12",
    gender: "female",
    address: "246 Elm St, Nowhere City, AZ 86420",
    medical_history: "Asthma",
    allergies: "Peanuts",
    emergency_contact_name: "Carlos Garcia",
    emergency_contact_phone: "555-210-9876",
    insurance_provider: "Kaiser Permanente",
    insurance_policy_number: "KP23456789",
    created_at: "2023-02-15T16:15:00Z",
    updated_at: "2023-02-15T16:15:00Z"
  },
  "9": {
    id: "9",
    first_name: "Robert",
    last_name: "Martinez",
    email: "robert.martinez@example.com",
    phone: "555-901-2345",
    date_of_birth: "1980-06-25",
    gender: "male",
    address: "579 Walnut Blvd, Anytown, NJ 75319",
    medical_history: "None",
    allergies: "None",
    emergency_contact_name: "Maria Martinez",
    emergency_contact_phone: "555-109-8765",
    insurance_provider: "Anthem",
    insurance_policy_number: "AN12345678",
    created_at: "2023-02-20T17:30:00Z",
    updated_at: "2023-02-20T17:30:00Z"
  },
  "10": {
    id: "10",
    first_name: "Lisa",
    last_name: "Robinson",
    email: "lisa.robinson@example.com",
    phone: "555-012-3456",
    date_of_birth: "1987-04-03",
    gender: "female",
    address: "864 Pineapple Way, Somewhere, OR 31795",
    medical_history: "Hypothyroidism",
    allergies: "Iodine",
    emergency_contact_name: "Thomas Robinson",
    emergency_contact_phone: "555-098-7654",
    insurance_provider: "Molina Healthcare",
    insurance_policy_number: "MH90123456",
    created_at: "2023-02-25T18:45:00Z",
    updated_at: "2023-02-25T18:45:00Z"
  },
  "11": {
    id: "11",
    first_name: "William",
    last_name: "Clark",
    email: "william.clark@example.com",
    phone: "555-123-4567",
    date_of_birth: "1972-10-15",
    gender: "male",
    address: "753 Orange St, Elsewhere, MI 97531",
    medical_history: "High cholesterol",
    allergies: "None",
    emergency_contact_name: "Elizabeth Clark",
    emergency_contact_phone: "555-987-6543",
    insurance_provider: "UnitedHealthcare",
    insurance_policy_number: "UH78901234",
    created_at: "2023-03-01T09:00:00Z",
    updated_at: "2023-03-01T09:00:00Z"
  },
  "12": {
    id: "12",
    first_name: "Elizabeth",
    last_name: "Rodriguez",
    email: "elizabeth.rodriguez@example.com",
    phone: "555-234-5678",
    date_of_birth: "1993-02-28",
    gender: "female",
    address: "159 Lemon Ave, Nowhere, CO 86420",
    medical_history: "None",
    allergies: "Penicillin",
    emergency_contact_name: "Jose Rodriguez",
    emergency_contact_phone: "555-876-5432",
    insurance_provider: "Medicaid",
    insurance_policy_number: "MD56789012",
    created_at: "2023-03-05T10:15:00Z",
    updated_at: "2023-03-05T10:15:00Z"
  }
};

export const patientService = {
  async getPatients(page = 1, limit = 10, search = ""): Promise<{ data: Patient[], total: number }> {
    if (USE_MOCK_DATA) {
      // Get all patients as an array
      const allPatients = Object.values(MOCK_PATIENTS);
      
      // Filter by search query if provided
      const filteredPatients = search 
        ? allPatients.filter(patient => 
            patient.first_name.toLowerCase().includes(search.toLowerCase()) ||
            patient.last_name.toLowerCase().includes(search.toLowerCase()) ||
            patient.email?.toLowerCase().includes(search.toLowerCase()) ||
            patient.phone?.includes(search)
          )
        : allPatients;
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
      
      return {
        data: paginatedPatients,
        total: filteredPatients.length
      };
    }
    
    try {
      const response = await axios.get(`${API_URL}/patients/`, {
        params: { page, limit, search },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      
      // Ensure we return an array for data
      return {
        data: Array.isArray(response.data.data) ? response.data.data : [],
        total: response.data.total || 0
      };
    } catch (error) {
      console.error("Error fetching patients:", error);
      return { data: [], total: 0 };
    }
  },
  
  async getPatient(id: string): Promise<Patient> {
    if (USE_MOCK_DATA) {
      const patient = MOCK_PATIENTS[id];
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
        id: (Object.keys(MOCK_PATIENTS).length + 1).toString(),
        ...patientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      MOCK_PATIENTS[newPatient.id] = newPatient;
      
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
      const patient = MOCK_PATIENTS[id];
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      const updatedPatient: Patient = {
        ...patient,
        ...patientData,
        updated_at: new Date().toISOString()
      };
      
      MOCK_PATIENTS[id] = updatedPatient;
      
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
      delete MOCK_PATIENTS[id];
      return;
    }
    
    await axios.delete(`${API_URL}/patients/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
  },

  async getAllPatients(): Promise<Patient[]> {
    if (USE_MOCK_DATA) {
      return Object.values(MOCK_PATIENTS);
    }
    
    try {
      const response = await axios.get(`${API_URL}/patients/all/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      
      // Ensure we return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching all patients:", error);
      return [];
    }
  }
};

export default patientService; 