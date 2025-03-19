"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { patientService, Patient } from "@/services/patient.service";
import { paymentService, PaymentSummary } from "@/services/payment.service";
import { toast } from "sonner";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BalancePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { currentClinic } = useAuth();
  
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_billed: 0,
    total_paid: 0,
    balance_due: 0,
    last_payment_date: undefined
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id || !patientId) {
        toast.error("No clinic selected");
        return;
      }

      setIsLoading(true);
      try {
        const [patientData, summaryData] = await Promise.all([
          patientService.getPatient(currentClinic.id, patientId),
          paymentService.getPatientPaymentSummary(currentClinic.id, patientId)
        ]);
        
        setPatient(patientData);
        
        // Ensure summary data is properly formatted with numeric values
        const formattedSummary: PaymentSummary = {
          total_billed: typeof summaryData.total_billed === 'string' 
            ? parseFloat(summaryData.total_billed) 
            : (summaryData.total_billed || 0),
          total_paid: typeof summaryData.total_paid === 'string' 
            ? parseFloat(summaryData.total_paid) 
            : (summaryData.total_paid || 0),
          balance_due: typeof summaryData.balance_due === 'string' 
            ? parseFloat(summaryData.balance_due) 
            : (summaryData.balance_due || 0),
          last_payment_date: summaryData.last_payment_date
        };
        
        setSummary(formattedSummary);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load patient information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId, currentClinic?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Patient not found</p>
        <Button variant="link" asChild>
          <Link href="/patients">Back to patients</Link>
        </Button>
      </div>
    );
  }

  if (summary.balance_due <= 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Pay Balance</h1>
            <p className="mt-1 text-gray-500">Record a balance payment for {patient.name}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/patients/${patientId}/payments?clinic_id=${currentClinic?.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Link>
          </Button>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-medium text-green-800 mb-2">No Balance Due</h2>
          <p className="text-green-700 mb-4">This patient has no outstanding balance to pay.</p>
          <Button asChild variant="outline">
            <Link href={`/patients/${patientId}/payments?clinic_id=${currentClinic?.id}`}>
              Return to Payments
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Pay Balance</h1>
          <p className="mt-1 text-gray-500">Record a balance payment for {patient.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/patients/${patientId}/payments?clinic_id=${currentClinic?.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Link>
        </Button>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium text-amber-800 mb-2">Balance Payment</h2>
        <p className="text-amber-700">
          Current balance due: <span className="font-bold">${summary.balance_due.toFixed(2)}</span>
        </p>
      </div>

      <PaymentForm 
        patient={patient} 
        isBalancePayment={true}
        balanceAmount={summary.balance_due}
      />
    </div>
  );
} 