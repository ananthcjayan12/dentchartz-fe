import { apiGet, apiPost, apiPatch, apiDelete } from "./api.utils";

export interface Payment {
  id: string;
  patient: {
    id: string;
    name: string;
  };
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSummary {
  total_billed: number;
  total_paid: number;
  balance_due: number;
  last_payment_date?: string;
}

export interface PaymentListResponse {
  results: Payment[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const paymentService = {
  // Get all payments for a patient
  getPatientPayments: async (
    clinicId: string,
    patientId: string,
    page = 1,
    limit = 10
  ): Promise<PaymentListResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    }).toString();
    
    return apiGet(`/clinics/${clinicId}/patients/${patientId}/payments/?${queryParams}`);
  },
  
  // Get payment summary for a patient
  getPatientPaymentSummary: async (
    clinicId: string,
    patientId: string
  ): Promise<PaymentSummary> => {
    return apiGet(`/clinics/${clinicId}/patients/${patientId}/payment-summary/`);
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
    patientId: string,
    paymentData: Omit<Payment, 'id' | 'patient' | 'created_at' | 'updated_at'>
  ): Promise<Payment> => {
    return apiPost(`/clinics/${clinicId}/patients/${patientId}/payments/`, paymentData);
  },
  
  // Update an existing payment
  updatePayment: async (
    clinicId: string,
    paymentId: string,
    paymentData: Partial<Payment>
  ): Promise<Payment> => {
    return apiPatch(`/clinics/${clinicId}/payments/${paymentId}/`, paymentData);
  },
  
  // Delete a payment
  deletePayment: async (
    clinicId: string,
    paymentId: string
  ): Promise<void> => {
    return apiDelete(`/clinics/${clinicId}/payments/${paymentId}/`);
  }
};

export default paymentService; 