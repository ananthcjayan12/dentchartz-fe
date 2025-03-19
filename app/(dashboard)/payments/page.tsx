"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { patientService } from "@/services/patient.service";
import paymentService, { Payment, PaymentListResponse } from "@/services/payment.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Search, CreditCard, Filter, Calendar } from "lucide-react";
import { PaymentList } from "@/components/payments/PaymentList";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function PaymentsPage() {
  const { currentClinic } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (currentClinic?.id) {
      fetchPayments();
    }
  }, [currentClinic?.id, dateFilter, dateRange]);

  const fetchPayments = async () => {
    if (!currentClinic?.id) {
      toast.error("No clinic selected");
      return;
    }

    setIsLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      // Set date range based on filter
      if (dateFilter === "current_month") {
        const now = new Date();
        startDate = format(startOfMonth(now), "yyyy-MM-dd");
        endDate = format(endOfMonth(now), "yyyy-MM-dd");
      } else if (dateFilter === "last_month") {
        const lastMonth = subMonths(new Date(), 1);
        startDate = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        endDate = format(endOfMonth(lastMonth), "yyyy-MM-dd");
      } else if (dateFilter === "custom" && dateRange.from && dateRange.to) {
        startDate = format(dateRange.from, "yyyy-MM-dd");
        endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      // Fetch all payments for the clinic with optional date filtering
      const response: PaymentListResponse = await paymentService.getClinicPayments(
        currentClinic.id,
        1,
        100,
        startDate,
        endDate
      );

      setPayments(response.results || []);

      // Calculate totals
      let totalBilledAmount = 0;
      let totalPaidAmount = 0;
      let totalDueAmount = 0;

      (response.results || []).forEach(payment => {
        // Calculate total billed
        const billed = typeof payment.total_amount === 'string' 
          ? parseFloat(payment.total_amount) 
          : (payment.total_amount || 0);
        
        totalBilledAmount += isNaN(billed) ? 0 : billed;
        
        // Calculate total paid
        const paid = typeof payment.amount_paid === 'string' 
          ? parseFloat(payment.amount_paid) 
          : (payment.amount_paid || 0);
        
        totalPaidAmount += isNaN(paid) ? 0 : paid;
        
        // Calculate total due (balance)
        const due = typeof payment.balance === 'string' 
          ? parseFloat(payment.balance) 
          : (payment.balance || 0);
        
        totalDueAmount += isNaN(due) ? 0 : due;
      });
      
      setTotalBilled(totalBilledAmount);
      setTotalPaid(totalPaidAmount);
      setTotalDue(totalDueAmount);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter payments based on search query
  const filteredPayments = payments.filter(payment => {
    // If patient is a number, use patient_name
    if (typeof payment.patient === 'number' && payment.patient_name) {
      return payment.patient_name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // If patient is an object with name property
    else if (payment.patient && typeof payment.patient === 'object' && payment.patient.name) {
      return payment.patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return false;
  });

  // Format currency values safely
  const formatCurrency = (value: number): string => {
    return value.toFixed(2);
  };

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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>All Payments</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by patient name"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select 
                value={dateFilter} 
                onValueChange={(value) => {
                  setDateFilter(value);
                  if (value === "custom") {
                    setShowDatePicker(true);
                  } else {
                    setShowDatePicker(false);
                  }
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              {showDatePicker && (
                <DateRangePicker
                  value={dateRange}
                  onChange={(range) => {
                    setDateRange(range);
                  }}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {filteredPayments.length > 0 ? (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
                        <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Billed</h3>
                        <p className="text-2xl font-bold text-gray-900">${formatCurrency(totalBilled)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Paid</h3>
                        <p className="text-2xl font-bold text-green-600">${formatCurrency(totalPaid)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Due</h3>
                        <p className={`text-2xl font-bold ${totalDue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          ${formatCurrency(totalDue)}
                        </p>
                      </div>
                      <div className="md:col-span-4">
                        <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
                        <p className="text-lg font-medium text-gray-900">
                          {dateFilter === "all" ? "All Time" : 
                           dateFilter === "current_month" ? "Current Month" :
                           dateFilter === "last_month" ? "Last Month" :
                           dateRange.from && dateRange.to ? 
                             `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}` :
                             "Custom Range"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <PaymentList 
                    payments={filteredPayments} 
                    showPatientName={true} 
                    clinicId={currentClinic?.id || ''} 
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payment records found.</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
                  )}
                  {dateFilter !== "all" && (
                    <p className="text-sm text-gray-400 mt-1">Try a different date range.</p>
                  )}
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setDateFilter("all");
                      setShowDatePicker(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 