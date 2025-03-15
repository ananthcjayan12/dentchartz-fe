"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { patientService, Patient } from "@/services/patient.service";
import paymentService, { Payment } from "@/services/payment.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";

export default function PaymentDetailPage({ params }: { params: { id: string; paymentId: string } }) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [patientData, paymentData] = await Promise.all([
          patientService.getPatient(params.id),
          paymentService.getPayment(params.paymentId)
        ]);
        
        setPatient(patientData);
        setPayment(paymentData);
      } catch (error) {
        console.error("Error fetching payment data:", error);
        toast.error("Failed to load payment information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id, params.paymentId]);
  
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
  
  if (!patient || !payment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Payment not found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push(`/patients/${params.id}/payments`)}
        >
          Back to Payments
        </Button>
      </div>
    );
  }
  
  // Format payment method for display
  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "cash": return "Cash";
      case "credit_card": return "Credit Card";
      case "debit_card": return "Debit Card";
      case "insurance": return "Insurance";
      case "bank_transfer": return "Bank Transfer";
      case "check": return "Check";
      default: return "Other";
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payment Details</h1>
          <p className="mt-1 text-gray-500">
            Payment from {format(new Date(payment.payment_date), "MMMM d, yyyy")} for {patient.first_name} {patient.last_name}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button asChild variant="outline">
            <Link href="#" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/patients/${patient.id}/payments`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(payment.payment_date), "MMMM d, yyyy")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getPaymentMethodDisplay(payment.payment_method)}
                  </dd>
                </div>
                {payment.appointment_id && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Appointment</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <Link 
                        href={`/appointments/${payment.appointment_id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Appointment
                      </Link>
                    </dd>
                  </div>
                )}
                {payment.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{payment.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Payment Summary</h3>
              <dl className="space-y-2">
                {!payment.is_balance_payment && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                    <dd className="text-sm font-medium text-gray-900">${payment.total_amount.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
                  <dd className="text-sm font-medium text-green-600">${payment.amount_paid.toFixed(2)}</dd>
                </div>
                {!payment.is_balance_payment && (
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <dt className="text-sm font-medium text-gray-500">Remaining Balance</dt>
                    <dd className={`text-sm font-medium ${payment.balance > 0 ? "text-red-600" : "text-gray-900"}`}>
                      ${payment.balance.toFixed(2)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Items */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Items</CardTitle>
        </CardHeader>
        <CardContent>
          {payment.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.items.map(item => (
                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 text-right">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                {!payment.is_balance_payment && (
                  <tfoot>
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-6 py-4">Total</td>
                      <td className="px-6 py-4 text-right">${payment.total_amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No payment items found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 