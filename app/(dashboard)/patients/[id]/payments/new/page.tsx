"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { patientService, Patient } from "@/services/patient.service";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { toast } from "sonner";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const fromChart = searchParams.get("from_chart") === "true";
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const patientData = await patientService.getPatient(params.id);
        setPatient(patientData);
        
        if (appointmentId) {
          const appointmentData = await appointmentService.getAppointment(appointmentId);
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
  }, [params.id, appointmentId]);
  
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
          <h1 className="text-3xl font-semibold text-gray-900">Add Payment</h1>
          <p className="mt-1 text-gray-500">Record a new payment for {patient.first_name} {patient.last_name}</p>
        </div>
        <Button asChild variant="outline">
          {fromChart ? (
            <Link href={`/patients/${patient.id}/dental-chart`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dental Chart
            </Link>
          ) : appointment ? (
            <Link href={`/appointments/${appointment.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Appointment
            </Link>
          ) : (
            <Link href={`/patients/${patient.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patient
            </Link>
          )}
        </Button>
      </div>
      
      <PaymentForm 
        patient={patient} 
        appointment={appointment || undefined} 
      />
    </div>
  );
} 