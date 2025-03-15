"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { patientService, Patient } from "@/services/patient.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AppointmentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointment();
  }, [params.id]);

  const fetchAppointment = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getAppointment(params.id);
      setAppointment(data);
      
      // Fetch patient details
      if (data.patient_id) {
        const patientData = await patientService.getPatient(data.patient_id);
        setPatient(patientData);
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast.error("Failed to load appointment details");
      router.push("/appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    
    if (confirm("Are you sure you want to delete this appointment?")) {
      try {
        await appointmentService.deleteAppointment(appointment.id);
        toast.success("Appointment deleted successfully");
        router.push("/appointments");
      } catch (error) {
        console.error("Error deleting appointment:", error);
        toast.error("Failed to delete appointment");
      }
    }
  };

  const handleStatusChange = async (status: Appointment['status']) => {
    if (!appointment) return;
    
    try {
      await appointmentService.updateAppointment(appointment.id, { status });
      setAppointment({ ...appointment, status });
      toast.success(`Appointment marked as ${status}`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'no-show':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Appointment not found</p>
        <Button variant="link" asChild>
          <Link href="/appointments">Back to appointments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/appointments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(`${appointment.date}T${appointment.time}`), 'MMMM d, yyyy')} at {format(new Date(`${appointment.date}T${appointment.time}`), 'h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/appointments/${appointment.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appointment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="mt-2 flex items-center">
                {getStatusIcon(appointment.status)}
                <span className="ml-2 text-base font-medium capitalize">{appointment.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={appointment.status === 'scheduled' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('scheduled')}
                >
                  Scheduled
                </Button>
                <Button 
                  size="sm" 
                  variant={appointment.status === 'completed' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('completed')}
                >
                  Completed
                </Button>
                <Button 
                  size="sm" 
                  variant={appointment.status === 'cancelled' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('cancelled')}
                >
                  Cancelled
                </Button>
                <Button 
                  size="sm" 
                  variant={appointment.status === 'no-show' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('no-show')}
                >
                  No Show
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <p className="mt-1 text-base text-gray-900 flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {format(new Date(`${appointment.date}T${appointment.time}`), 'MMMM d, yyyy')}
              </p>
              <p className="mt-1 text-base text-gray-900 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                {format(new Date(`${appointment.date}T${appointment.time}`), 'h:mm a')} ({appointment.duration} minutes)
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Doctor</h3>
              <p className="mt-1 text-base text-gray-900 flex items-center">
                <User className="mr-2 h-4 w-4 text-gray-400" />
                {appointment.doctor_name || `Doctor ID: ${appointment.doctor_id}`}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Appointment Type</h3>
              <p className="mt-1 text-base text-gray-900 capitalize">
                {appointment.type.replace(/-/g, ' ')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-1 text-base text-gray-900">
                {appointment.notes || "No notes available"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {patient ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-base text-gray-900">
                    <Link href={`/patients/${patient.id}`} className="hover:underline flex items-center">
                      <User className="mr-2 h-4 w-4 text-gray-400" />
                      {patient.first_name} {patient.last_name}
                    </Link>
                  </p>
                </div>
                {patient.email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-base text-gray-900">{patient.email}</p>
                  </div>
                )}
                {patient.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 text-base text-gray-900">{patient.phone}</p>
                  </div>
                )}
                {patient.date_of_birth && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                    <p className="mt-1 text-base text-gray-900">
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="pt-4">
                  <Button variant="outline" asChild>
                    <Link href={`/patients/${patient.id}`}>
                      View Patient Profile
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Patient information not available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 