"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { patientService, Patient } from "@/services/patient.service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Calendar, Phone, Mail, MapPin, Clock, User } from "lucide-react";
import { ToothIcon } from "@/components/icons/ToothIcon";
import { toast } from "sonner";
import { PatientPaymentCard } from "@/components/payments/PatientPaymentCard";

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentClinic } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const patientId = params.id;

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    if (!currentClinic?.id) {
      toast.error("No clinic selected. Please select a clinic first.");
      router.push("/");
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await patientService.getPatient(
        currentClinic.id.toString(),
        patientId
      );
      setPatient(data);
    } catch (error) {
      console.error("Error fetching patient:", error);
      toast.error("Failed to load patient details");
      router.push("/patients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!patient || !currentClinic?.id) return;
    
    if (confirm(`Are you sure you want to delete ${patient.name}?`)) {
      try {
        await patientService.deletePatient(
          currentClinic.id.toString(),
          patient.id
        );
        toast.success("Patient deleted successfully");
        router.push("/patients");
      } catch (error) {
        console.error("Error deleting patient:", error);
        toast.error("Failed to delete patient");
      }
    }
  };

  if (!currentClinic?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Patient Details</h1>
          <p className="mt-1 text-gray-500">View and manage patient information</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">Please select a clinic to view patient details</p>
            <Button onClick={() => router.push("/")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              {patient.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Patient ID: {patient.id}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/patients/${patient.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" asChild className="ml-2">
            <Link href={`/patients/${params.id}/dental-chart`}>
              <ToothIcon className="h-4 w-4 mr-2" />
              Dental Chart
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-base text-gray-900 flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  {patient.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Age</h3>
                <p className="mt-1 text-base text-gray-900">
                  {patient.age || "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                <p className="mt-1 text-base text-gray-900">
                  {patient.gender === "M" ? "Male" : 
                   patient.gender === "F" ? "Female" : 
                   patient.gender === "O" ? "Other" : "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                <p className="mt-1 text-base text-gray-900 flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-gray-400" />
                  {patient.phone || "Not provided"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-base text-gray-900 flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  {patient.email || "Not provided"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                <p className="mt-1 text-base text-gray-900 flex items-start">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-1" />
                  <span>{patient.address || "Not provided"}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient History */}
        <Card>
          <CardHeader>
            <CardTitle>Patient History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Chief Complaint</h3>
              <p className="mt-1 text-base text-gray-900">
                {patient.chief_complaint || "No chief complaint recorded"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Medical History</h3>
              <p className="mt-1 text-base text-gray-900">
                {patient.medical_history || "No medical history recorded"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Drug Allergies</h3>
              <p className="mt-1 text-base text-gray-900">
                {patient.drug_allergies || "No drug allergies recorded"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Previous Dental Work</h3>
              <p className="mt-1 text-base text-gray-900">
                {patient.previous_dental_work || "No previous dental work recorded"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Patient Since</h3>
              <p className="mt-1 text-base text-gray-900 flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {new Date(patient.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments and Treatments sections would go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-6">No recent appointments</p>
            <div className="mt-4 text-center">
              <Button asChild>
                <Link href={`/appointments/new?patientId=${patient.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treatment History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-6">No treatment history available</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <PatientPaymentCard patient={patient} />
      </div>
    </div>
  );
} 