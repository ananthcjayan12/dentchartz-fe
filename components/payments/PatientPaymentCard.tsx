"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { paymentService, Payment, PaymentSummary } from "@/services/payment.service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Patient } from "@/services/patient.service";
import { CreditCard, Plus, ArrowRight } from "lucide-react";

interface PatientPaymentCardProps {
  patient: Patient;
}

export function PatientPaymentCard({ patient }: PatientPaymentCardProps) {
  const { currentClinic } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_billed: 0,
    total_paid: 0,
    balance_due: 0,
    last_payment_date: undefined
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id || !patient?.id) return;
      
      setIsLoading(true);
      try {
        const [paymentsResponse, summaryData] = await Promise.all([
          paymentService.getPatientPayments(currentClinic.id, patient.id, 1, 5),
          paymentService.getPatientPaymentSummary(currentClinic.id, patient.id)
        ]);
        
        setPayments(paymentsResponse.results || []);
        
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patient?.id, currentClinic?.id]);

  const getPaymentUrl = (path: string) => {
    if (!currentClinic?.id) return '#';
    const baseUrl = `/patients/${patient.id}/payments`;
    const clinicParam = `clinic_id=${currentClinic.id}`;
    
    if (path === '') {
      return `${baseUrl}?${clinicParam}`;
    }
    
    return `${baseUrl}/${path}?${clinicParam}`;
  };

  // Format currency values safely
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    return value.toFixed(2);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Payment Information</CardTitle>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={getPaymentUrl('new')}>
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
            <p className="text-2xl font-bold">${formatCurrency(summary.total_billed)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Total Paid</p>
            <p className="text-2xl font-bold">${formatCurrency(summary.total_paid)}</p>
          </div>
          <div className={`p-4 rounded-lg ${summary.balance_due > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${summary.balance_due > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              Balance Due
            </p>
            <p className={`text-2xl font-bold ${summary.balance_due > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              ${formatCurrency(summary.balance_due)}
            </p>
            {summary.balance_due > 0 && (
              <Button variant="destructive" className="w-full mt-2" asChild>
                <Link href={getPaymentUrl('balance')}>
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
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">
                    {format(new Date(payment.payment_date), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.payment_method_display}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${typeof payment.amount_paid === 'number' ? payment.amount_paid.toFixed(2) : payment.amount_paid}</p>
                </div>
                <Link 
                  href={getPaymentUrl(payment.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
            <div className="text-center mt-4">
              <Button variant="outline" asChild>
                <Link href={getPaymentUrl('')}>
                  View All Payments
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No payment records found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={getPaymentUrl('new')}>
                <Plus className="mr-2 h-4 w-4" />
                Record First Payment
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 