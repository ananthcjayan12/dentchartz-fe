"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { patientService, Patient } from "@/services/patient.service";
import { paymentService, Payment } from "@/services/payment.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentClinic } = useAuth();
  
  const patientId = params.id as string;
  const paymentId = params.paymentId as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id || !patientId || !paymentId) {
        toast.error("Missing required information");
        return;
      }

      setIsLoading(true);
      try {
        const [patientData, paymentData] = await Promise.all([
          patientService.getPatient(currentClinic.id, patientId),
          paymentService.getPayment(currentClinic.id, paymentId)
        ]);
        
        setPatient(patientData);
        setPayment(paymentData);
      } catch (error) {
        console.error("Error fetching payment data:", error);
        toast.error("Failed to load payment details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId, paymentId, currentClinic?.id]);

  const handleDelete = async () => {
    if (!currentClinic?.id || !paymentId) return;
    
    setIsDeleting(true);
    try {
      await paymentService.deletePayment(currentClinic.id, paymentId);
      toast.success("Payment deleted successfully");
      router.push(`/patients/${patientId}/payments?clinic_id=${currentClinic.id}`);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format currency values safely
  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    if (typeof value === 'string') return parseFloat(value).toFixed(2);
    return value.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!payment || !patient) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Payment not found</p>
        <Button variant="link" asChild>
          <Link href={`/patients/${patientId}/payments?clinic_id=${currentClinic?.id}`}>Back to payments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payment Details</h1>
          <p className="mt-1 text-gray-500">View payment information for {patient.name}</p>
        </div>
        <div className="flex space-x-3">
          <Button asChild variant="outline">
            <Link href={`/patients/${patientId}/payments?clinic_id=${currentClinic?.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/patients/${patientId}/payments/${paymentId}/edit?clinic_id=${currentClinic?.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the payment record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Payment Date</h3>
              <p className="mt-1 text-lg text-gray-900">
                {format(new Date(payment.payment_date), "MMMM d, yyyy")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
              <p className="mt-1 text-lg text-gray-900">
                {payment.payment_method_display}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="mt-1 text-lg text-gray-900">
                ${formatCurrency(payment.total_amount)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Amount Paid</h3>
              <p className="mt-1 text-lg text-green-600 font-medium">
                ${formatCurrency(payment.amount_paid)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Balance</h3>
              <p className={`mt-1 text-lg font-medium ${parseFloat(formatCurrency(payment.balance)) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ${formatCurrency(payment.balance)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="mt-1">
                {payment.is_balance_payment ? (
                  <Badge>Balance Payment</Badge>
                ) : parseFloat(formatCurrency(payment.balance)) > 0 ? (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Partial Payment
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Paid in Full
                  </Badge>
                )}
              </div>
            </div>
            {payment.notes && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 text-gray-900 whitespace-pre-line">
                  {payment.notes}
                </p>
              </div>
            )}
          </div>

          {payment.items && payment.items.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payment.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${formatCurrency(payment.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 