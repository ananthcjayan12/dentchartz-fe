"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { patientService } from "@/services/patient.service";
import paymentService, { Payment } from "@/services/payment.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, CreditCard } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { patient_name: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would have an API endpoint to get all payments
        // For now, we'll simulate by getting patients and then their payments
        const patients = await patientService.getPatients();
        
        let allPayments: (Payment & { patient_name: string })[] = [];
        
        // Get payments for each patient
        for (const patient of patients) {
          const patientPayments = await paymentService.getPatientPayments(patient.id);
          
          // Add patient name to each payment
          const paymentsWithPatientName = patientPayments.map(payment => ({
            ...payment,
            patient_name: `${patient.first_name} ${patient.last_name}`
          }));
          
          allPayments = [...allPayments, ...paymentsWithPatientName];
        }
        
        // Sort by date, newest first
        allPayments.sort((a, b) => 
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        );
        
        setPayments(allPayments);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter payments based on search query
  const filteredPayments = payments.filter(payment => 
    payment.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-1 text-gray-500">View and manage all payment records</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Payments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by patient name"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Amount Paid</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(payment => (
                    <tr key={payment.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/patients/${payment.patient_id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {payment.patient_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1).replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4">${payment.amount_paid.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {payment.is_balance_payment ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Balance Payment
                          </span>
                        ) : payment.balance > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Partial Payment
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Paid in Full
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/patients/${payment.patient_id}/payments/${payment.id}`}
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
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payment records found.</p>
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 