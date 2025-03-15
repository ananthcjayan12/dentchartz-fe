import axios from "axios";
import { Patient } from "./patient.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface PaymentItem {
  id: string;
  payment_id: string;
  description: string;
  amount: number;
  treatment_id?: string;
}

export interface Payment {
  id: string;
  patient_id: string;
  appointment_id?: string;
  payment_date: string;
  payment_method: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  notes?: string;
  is_balance_payment: boolean;
  items: PaymentItem[];
  created_at: string;
}

// Mock data
const MOCK_PAYMENTS: Payment[] = [
  {
    id: "payment_1",
    patient_id: "1", // Make sure this matches an existing patient ID
    payment_date: new Date().toISOString(),
    payment_method: "cash",
    total_amount: 250.00,
    amount_paid: 150.00,
    balance: 100.00,
    notes: "Initial consultation and cleaning",
    is_balance_payment: false,
    items: [
      {
        id: "item_1",
        payment_id: "payment_1",
        description: "Dental Consultation",
        amount: 100.00
      },
      {
        id: "item_2",
        payment_id: "payment_1",
        description: "Teeth Cleaning",
        amount: 150.00
      }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: "payment_2",
    patient_id: "2", // Make sure this matches an existing patient ID
    payment_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    payment_method: "credit_card",
    total_amount: 500.00,
    amount_paid: 500.00,
    balance: 0.00,
    notes: "Full payment for root canal",
    is_balance_payment: false,
    items: [
      {
        id: "item_3",
        payment_id: "payment_2",
        description: "Root Canal Treatment",
        amount: 500.00
      }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "payment_3",
    patient_id: "1", // Same as first payment to show balance payment
    payment_date: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    payment_method: "cash",
    total_amount: 0.00, // Balance payments don't add to total
    amount_paid: 50.00,
    balance: 50.00, // Remaining balance after this payment
    notes: "Partial payment of outstanding balance",
    is_balance_payment: true,
    items: [
      {
        id: "item_4",
        payment_id: "payment_3",
        description: "Outstanding Balance Payment",
        amount: 50.00
      }
    ],
    created_at: new Date(Date.now() - 43200000).toISOString()
  }
];

const MOCK_PAYMENT_ITEMS: PaymentItem[] = [
  {
    id: "item_1",
    payment_id: "payment_1",
    description: "Dental Consultation",
    amount: 100.00
  },
  {
    id: "item_2",
    payment_id: "payment_1",
    description: "Teeth Cleaning",
    amount: 150.00
  },
  {
    id: "item_3",
    payment_id: "payment_2",
    description: "Root Canal Treatment",
    amount: 500.00
  },
  {
    id: "item_4",
    payment_id: "payment_3",
    description: "Outstanding Balance Payment",
    amount: 50.00
  }
];

const paymentService = {
  // Get all payments for a patient
  async getPatientPayments(patientId: string): Promise<Payment[]> {
    if (USE_MOCK_DATA) {
      return MOCK_PAYMENTS.filter(payment => payment.patient_id === patientId)
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    }
    
    const response = await axios.get(
      `${API_URL}/patients/${patientId}/payments/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  // Get a specific payment
  async getPayment(paymentId: string): Promise<Payment> {
    if (USE_MOCK_DATA) {
      const payment = MOCK_PAYMENTS.find(p => p.id === paymentId);
      if (!payment) throw new Error("Payment not found");
      
      return {
        ...payment,
        items: MOCK_PAYMENT_ITEMS.filter(item => item.payment_id === paymentId)
      };
    }
    
    const response = await axios.get(
      `${API_URL}/payments/${paymentId}/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  // Create a new payment
  async createPayment(
    patientId: string, 
    data: {
      appointment_id?: string;
      payment_method: string;
      total_amount: number;
      amount_paid: number;
      notes?: string;
      is_balance_payment: boolean;
      items: { description: string; amount: number; treatment_id?: string }[];
    }
  ): Promise<Payment> {
    if (USE_MOCK_DATA) {
      const newPayment: Payment = {
        id: `pay_${Date.now()}`,
        patient_id: patientId,
        appointment_id: data.appointment_id,
        payment_date: new Date().toISOString(),
        payment_method: data.payment_method,
        total_amount: data.total_amount,
        amount_paid: data.amount_paid,
        balance: data.total_amount - data.amount_paid,
        notes: data.notes,
        is_balance_payment: data.is_balance_payment,
        items: [],
        created_at: new Date().toISOString()
      };
      
      MOCK_PAYMENTS.push(newPayment);
      
      // Create payment items
      const items = data.items.map((item, index) => {
        const paymentItem: PaymentItem = {
          id: `item_${Date.now()}_${index}`,
          payment_id: newPayment.id,
          description: item.description,
          amount: item.amount,
          treatment_id: item.treatment_id
        };
        
        MOCK_PAYMENT_ITEMS.push(paymentItem);
        return paymentItem;
      });
      
      return { ...newPayment, items };
    }
    
    const response = await axios.post(
      `${API_URL}/patients/${patientId}/payments/`,
      data,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  // Get payment summary for a patient
  async getPatientPaymentSummary(patientId: string): Promise<{
    total_treatment_cost: number;
    total_paid: number;
    balance_due: number;
  }> {
    if (USE_MOCK_DATA) {
      const payments = MOCK_PAYMENTS.filter(p => p.patient_id === patientId);
      
      const total_treatment_cost = payments.reduce((sum, payment) => 
        sum + (payment.is_balance_payment ? 0 : payment.total_amount), 0);
      
      const total_paid = payments.reduce((sum, payment) => sum + payment.amount_paid, 0);
      
      // Calculate the current balance due
      // For patient 1, this should be 50.00 (100.00 original balance - 50.00 balance payment)
      const balance_due = Math.max(0, total_treatment_cost - total_paid);
      
      return {
        total_treatment_cost,
        total_paid,
        balance_due
      };
    }
    
    const response = await axios.get(
      `${API_URL}/patients/${patientId}/payment-summary/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  }
};

export default paymentService; 