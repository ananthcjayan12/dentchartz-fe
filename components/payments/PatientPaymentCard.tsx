"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Patient } from "@/services/patient.service";
import paymentService, { Payment } from "@/services/payment.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CreditCard, Plus, ArrowRight } from "lucide-react";

interface PatientPaymentCardProps {
  patient: Patient;
}

export function PatientPaymentCard({ patient }: PatientPaymentCardProps) {
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
        const [paymentsData, summaryData] = await Promise.all([
          paymentService.getPatientPayments(patient.id),
          paymentService.getPatientPaymentSummary(patient.id)
        ]);
        
        // Only show the most recent 3 payments
        setPayments(paymentsData.slice(0, 3));
        setSummary(summaryData);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patient.id]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Payment Information</CardTitle>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/patients/${patient.id}/payments/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Treatment Cost</p>
            <p className="text-2xl font-bold">${summary.total_treatment_cost.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Total Paid</p>
            <p className="text-2xl font-bold">${summary.total_paid.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-lg ${summary.balance_due > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${summary.balance_due > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              Balance Due
            </p>
            <p className={`text-2xl font-bold ${summary.balance_due > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              ${summary.balance_due.toFixed(2)}
            </p>
            {summary.balance_due > 0 && (
              <Button variant="destructive" className="w-full mt-2" asChild>
                <Link href={`/patients/${patient.id}/payments/balance`}>
                  Pay Balance
                </Link>
              </Button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-medium mb-4">Recent Payments</h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map(payment => (
              <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">
                    {format(new Date(payment.payment_date), "MMM d, yyyy")} - {payment.is_balance_payment ? "Balance Payment" : `${payment.items.length} item(s)`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1).replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${payment.amount_paid.toFixed(2)}</p>
                  {!payment.is_balance_payment && payment.balance > 0 && (
                    <p className="text-sm text-red-600">Balance: ${payment.balance.toFixed(2)}</p>
                  )}
                </div>
                <Link 
                  href={`/patients/${patient.id}/payments/${payment.id}`}
                  className="ml-4 text-indigo-600 hover:text-indigo-900"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            ))}
            
            <div className="text-center pt-2">
              <Button variant="outline" asChild>
                <Link href={`/patients/${patient.id}/payments`}>
                  View All Payments
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payment records found.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Payment" to record a payment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 