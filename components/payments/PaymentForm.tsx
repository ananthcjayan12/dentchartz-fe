"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Patient } from "@/services/patient.service";
import { Appointment } from "@/services/appointment.service";
import paymentService from "@/services/payment.service";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";

interface PaymentFormProps {
  patient: Patient;
  appointment?: Appointment;
  isBalancePayment?: boolean;
  balanceDue?: number;
}

export function PaymentForm({ patient, appointment, isBalancePayment = false, balanceDue = 0 }: PaymentFormProps) {
  const router = useRouter();
  
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [totalAmount, setTotalAmount] = useState(isBalancePayment ? balanceDue : 0);
  const [amountPaid, setAmountPaid] = useState(isBalancePayment ? balanceDue : 0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentItems, setPaymentItems] = useState<{ id: string; description: string; amount: number }[]>(
    isBalancePayment ? [{ id: "balance", description: "Outstanding Balance Payment", amount: balanceDue }] : []
  );
  
  // Calculate remaining balance
  const remainingBalance = totalAmount - amountPaid;
  
  // Add a new payment item
  const addPaymentItem = () => {
    setPaymentItems([
      ...paymentItems,
      { id: `item_${Date.now()}`, description: "", amount: 0 }
    ]);
  };
  
  // Remove a payment item
  const removePaymentItem = (id: string) => {
    setPaymentItems(paymentItems.filter(item => item.id !== id));
  };
  
  // Update a payment item
  const updatePaymentItem = (id: string, field: "description" | "amount", value: string | number) => {
    setPaymentItems(
      paymentItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  // Calculate total amount whenever payment items change
  useEffect(() => {
    if (!isBalancePayment) {
      const total = paymentItems.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0);
      setTotalAmount(total);
    }
  }, [paymentItems, isBalancePayment]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentItems.length === 0) {
      toast.error("Please add at least one payment item");
      return;
    }
    
    if (totalAmount <= 0) {
      toast.error("Total amount must be greater than zero");
      return;
    }
    
    if (amountPaid < 0) {
      toast.error("Amount paid cannot be negative");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await paymentService.createPayment(patient.id, {
        appointment_id: appointment?.id,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        notes: notes,
        is_balance_payment: isBalancePayment,
        items: paymentItems.map(item => ({
          description: item.description,
          amount: parseFloat(item.amount.toString())
        }))
      });
      
      toast.success("Payment recorded successfully");
      
      // Redirect back to patient detail page
      router.push(`/patients/${patient.id}`);
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isBalancePayment ? "Balance Payment" : "Payment Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select 
              value={paymentMethod} 
              onValueChange={setPaymentMethod}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Payment Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Payment Items</Label>
              {!isBalancePayment && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addPaymentItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
            
            {paymentItems.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
                  <div className="col-span-7">Description</div>
                  <div className="col-span-4">Amount</div>
                  <div className="col-span-1"></div>
                </div>
                
                {paymentItems.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-7">
                      <Input
                        value={item.description}
                        onChange={(e) => updatePaymentItem(item.id, "description", e.target.value)}
                        placeholder="Enter description"
                        disabled={isBalancePayment}
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updatePaymentItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                          className="pl-7"
                          step="0.01"
                          min="0"
                          disabled={isBalancePayment}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {!isBalancePayment && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removePaymentItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                No payment items added. Click "Add Item" to add a payment item.
              </div>
            )}
          </div>
          
          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-md space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">${totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount-paid">Amount Paid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                <Input
                  id="amount-paid"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-medium">Remaining Balance:</span>
              <span className={`text-lg font-bold ${remainingBalance > 0 ? "text-red-600" : ""}`}>
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes about this payment"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || paymentItems.length === 0 || totalAmount <= 0}
          >
            {isSubmitting ? "Recording Payment..." : "Record Payment"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 