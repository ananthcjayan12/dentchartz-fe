"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { patientService, Patient } from "@/services/patient.service";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentClinic } = useAuth();
  
  const patientId = params.id as string;
  const appointmentId = searchParams.get('appointment_id');
  const fromChart = searchParams.get('from_chart') === 'true';
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id || !patientId) {
        toast.error("No clinic selected");
        return;
      }

      setIsLoading(true);
      try {
        const patientData = await patientService.getPatient(currentClinic.id, patientId);
        setPatient(patientData);
        
        if (appointmentId) {
          const appointmentData = await appointmentService.getAppointment(currentClinic.id, appointmentId);
          setAppointment(appointmentData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load patient information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId, appointmentId, currentClinic?.id]);

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
          <h1 className="text-3xl font-semibold text-gray-900">Add Payment</h1>
          <p className="mt-1 text-gray-500">Record a new payment for {patient.name}</p>
        </div>
        <Button asChild variant="outline">
          {fromChart ? (
            <Link href={`/patients/${patientId}/dental-chart?clinic_id=${currentClinic?.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dental Chart
            </Link>
          ) : (
            <Link href={`/patients/${patientId}/payments?clinic_id=${currentClinic?.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Link>
          )}
        </Button>
      </div>

      <PaymentForm 
        patient={patient} 
        appointment={appointment} 
        isBalancePayment={false} 
      />
    </div>
  );
} 