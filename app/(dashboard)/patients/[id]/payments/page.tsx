"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { patientService, Patient } from "@/services/patient.service";
import { paymentService, Payment, PaymentSummary } from "@/services/payment.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { PaymentList } from "@/components/payments/PaymentList";

export default function PatientPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentClinic } = useAuth();
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_billed: 0,
    total_paid: 0,
    balance_due: 0,
    last_payment_date: undefined
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id || !patientId) {
        toast.error("No clinic selected");
        return;
      }

      setIsLoading(true);
      try {
        const [patientData, paymentsData, summaryData] = await Promise.all([
          patientService.getPatient(currentClinic.id, patientId),
          paymentService.getPatientPayments(currentClinic.id, patientId),
          paymentService.getPatientPaymentSummary(currentClinic.id, patientId)
        ]);
        
        setPatient(patientData);
        setPayments(paymentsData.results || []);
        
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
        console.error("Error fetching payment data:", error);
        toast.error("Failed to load payment information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId, currentClinic?.id]);

  // Format currency values safely
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    return value.toFixed(2);
  };

  const getUrl = (path: string) => {
    if (!currentClinic?.id) return '#';
    return `${path}?clinic_id=${currentClinic.id}`;
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payment History</h1>
          <p className="mt-1 text-gray-500">View and manage payments for {patient.name}</p>
        </div>
        <div className="flex space-x-3">
          {summary.balance_due > 0 && (
            <Button variant="destructive" asChild>
              <Link href={`/patients/${patientId}/payments/balance?clinic_id=${currentClinic?.id}`}>
                Pay Balance
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/patients/${patientId}/payments/new?clinic_id=${currentClinic?.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={getUrl(`/patients/${patientId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patient
            </Link>
          </Button>
        </div>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Amount Billed</div>
              <div className="text-2xl font-semibold text-gray-900">${formatCurrency(summary.total_billed)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Paid</div>
              <div className="text-2xl font-semibold text-green-600">${formatCurrency(summary.total_paid)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Balance Due</div>
              <div className={`text-2xl font-semibold ${summary.balance_due > 0 ? "text-red-600" : "text-gray-900"}`}>
                ${formatCurrency(summary.balance_due)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <PaymentList payments={payments} clinicId={currentClinic?.id || ''} />
          ) : (
            <div className="text-center py-10">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No payment records found</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/patients/${patientId}/payments/new?clinic_id=${currentClinic?.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Payment
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 