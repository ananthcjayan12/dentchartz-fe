"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { patientService, Patient } from "@/services/patient.service";
import paymentService from "@/services/payment.service";
import { toast } from "sonner";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BalancePaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [balanceDue, setBalanceDue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [patientData, summaryData] = await Promise.all([
          patientService.getPatient(params.id),
          paymentService.getPatientPaymentSummary(params.id)
        ]);
        
        setPatient(patientData);
        setBalanceDue(summaryData.balance_due);
        
        if (summaryData.balance_due <= 0) {
          toast.info("This patient has no outstanding balance");
          router.push(`/patients/${params.id}/payments`);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load patient information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
          <h1 className="text-3xl font-semibold text-gray-900">Pay Outstanding Balance</h1>
          <p className="mt-1 text-gray-500">
            Record a payment towards {patient.first_name} {patient.last_name}'s outstanding balance of ${balanceDue.toFixed(2)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/patients/${patient.id}/payments`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Link>
        </Button>
      </div>
      
      <PaymentForm 
        patient={patient} 
        isBalancePayment={true} 
        balanceDue={balanceDue} 
      />
    </div>
  );
} 