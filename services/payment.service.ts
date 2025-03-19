import { apiGet, apiPost, apiPatch, apiDelete } from "./api.utils";

export interface Payment {
  id: string | number;
  patient: {
    id: string;
    name: string;
  } | number;
  patient_name?: string;
  appointment?: {
    id: string;
    date: string;
  };
  payment_date: string;
  total_amount: number | string;
  amount_paid: number | string;
  balance: number | string;
  payment_method: string;
  payment_method_display: string;
  is_balance_payment?: boolean;
  notes?: string;
  created_by: {
    id: string;
    username: string;
    full_name: string;
  } | number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
  items?: PaymentItem[];
}

export interface PaymentItem {
  id?: string;
  description: string;
  amount: number;
  treatment?: string;
  treatment_description?: string;
}

export interface CreatePaymentData {
  patient_id: string;
  appointment_id?: string;
  payment_date: string;
  total_amount: number;
  amount_paid: number;
  payment_method: string;
  notes?: string;
  payment_items: {
    description: string;
    amount: number;
    treatment_id?: string;
  }[];
}

export interface PaymentSummary {
  total_billed: number | string;
  total_paid: number | string;
  balance_due: number | string;
  last_payment_date?: string;
}

export interface PaymentListResponse {
  results: Payment[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const paymentService = {
  // Get all payments for a clinic/patient
  getPatientPayments: async (
    clinicId: string,
    patientId: string,
    page = 1,
    limit = 10
  ): Promise<PaymentListResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      patient_id: patientId
    }).toString();
    
    return apiGet(`/clinics/${clinicId}/payments/?${queryParams}`);
  },
  
  // Get payment summary for a patient
  getPatientPaymentSummary: async (
    clinicId: string,
    patientId: string
  ): Promise<PaymentSummary> => {
    return apiGet(`/clinics/${clinicId}/patients/${patientId}/payment-summary/`);
  },
  
  // Get patient balance
  getPatientBalance: async (
    clinicId: string,
    patientId: string
  ): Promise<{
    total_amount: number;
    total_paid: number;
    balance: number;
  }> => {
    return apiGet(`/clinics/${clinicId}/patients/${patientId}/balance/`);
  },
  
  // Get a single payment by ID
  getPayment: async (
    clinicId: string,
    paymentId: string
  ): Promise<Payment> => {
    return apiGet(`/clinics/${clinicId}/payments/${paymentId}/`);
  },
  
  // Create a new payment
  createPayment: async (
    clinicId: string,
    data: CreatePaymentData
  ): Promise<Payment> => {
    return apiPost(`/clinics/${clinicId}/payments/`, data);
  },
  
  // Update an existing payment
  updatePayment: async (
    clinicId: string,
    paymentId: string,
    data: Partial<CreatePaymentData>
  ): Promise<Payment> => {
    return apiPatch(`/clinics/${clinicId}/payments/${paymentId}/`, data);
  },
  
  // Delete a payment
  deletePayment: async (
    clinicId: string,
    paymentId: string
  ): Promise<void> => {
    return apiDelete(`/clinics/${clinicId}/payments/${paymentId}/`);
  },
  
  // Get all payments for a clinic with optional date filtering
  getClinicPayments: async (
    clinicId: string,
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<PaymentListResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    return apiGet(`/clinics/${clinicId}/payments/?${queryParams}`);
  }
};

export default paymentService; 