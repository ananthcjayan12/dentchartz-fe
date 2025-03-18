"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-900">Schedule New Appointment</h1>
        <Button asChild variant="outline">
          <Link href="/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Link>
        </Button>
      </div>
      
      <AppointmentForm 
        preSelectedPatientId={patientId || undefined} 
        onSuccess={() => router.push("/appointments")}
      />
    </div>
  );
} 