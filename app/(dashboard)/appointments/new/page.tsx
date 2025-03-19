"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  
  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Schedule New Appointment</h1>
          <p className="text-gray-500 mt-1">Create a new appointment for a patient</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentForm 
            preSelectedPatientId={patientId || undefined} 
            onSuccess={() => router.push("/appointments")}
          />
        </CardContent>
      </Card>
    </div>
  );
} 