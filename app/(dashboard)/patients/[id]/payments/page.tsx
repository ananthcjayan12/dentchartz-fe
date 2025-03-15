"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { patientService, Patient } from "@/services/patient.service";
import paymentService, { Payment } from "@/services/payment.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default function PatientPaymentsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_treatment_cost: 0,
    total_paid: 0,
    balance_due: 0
  });
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [patientData, paymentsData, summaryData] = await Promise.all([
          patientService.getPatient(params.id),
          paymentService.getPatientPayments(params.id),
          paymentService.getPatientPaymentSummary(params.id)
        ]);
        
        setPatient(patientData);
        setPayments(paymentsData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Error fetching payment data:", error);
        toast.error("Failed to load payment information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Patient not found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push("/patients")}
        >
          Back to Patients
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payment History</h1>
          <p className="mt-1 text-gray-500">View and manage payments for {patient.first_name} {patient.last_name}</p>
        </div>
        <div className="flex space-x-3">
          {summary.balance_due > 0 && (
            <Button asChild variant="destructive">
              <Link href={`/patients/${patient.id}/payments/balance`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Balance (${summary.balance_due.toFixed(2)})
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/patients/${patient.id}/payments/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/patients/${patient.id}`}>
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
              <div className="text-2xl font-semibold text-gray-900">${summary.total_treatment_cost.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Paid</div>
              <div className="text-2xl font-semibold text-green-600">${summary.total_paid.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">Balance Due</div>
              <div className={`text-2xl font-semibold ${summary.balance_due > 0 ? "text-red-600" : "text-gray-900"}`}>
                ${summary.balance_due.toFixed(2)}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Total Amount</th>
                    <th className="px-6 py-3">Amount Paid</th>
                    <th className="px-6 py-3">Balance</th>
                    <th className="px-6 py-3">Notes</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        {payment.payment_method === "cash" ? "Cash" :
                         payment.payment_method === "credit_card" ? "Credit Card" :
                         payment.payment_method === "debit_card" ? "Debit Card" :
                         payment.payment_method === "insurance" ? "Insurance" :
                         payment.payment_method === "bank_transfer" ? "Bank Transfer" :
                         payment.payment_method === "check" ? "Check" : "Other"}
                      </td>
                      <td className="px-6 py-4">
                        {payment.is_balance_payment ? (
                          <span className="text-gray-500">Balance Payment</span>
                        ) : (
                          `$${payment.total_amount.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-6 py-4">${payment.amount_paid.toFixed(2)}</td>
                      <td className={`px-6 py-4 ${payment.balance > 0 ? "text-red-600" : ""}`}>
                        {payment.is_balance_payment ? (
                          <span className="text-green-600">Paid towards balance</span>
                        ) : (
                          `$${payment.balance.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">{payment.notes || "-"}</td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/patients/${patient.id}/payments/${payment.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No payment records found.</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Payment" to record a payment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 