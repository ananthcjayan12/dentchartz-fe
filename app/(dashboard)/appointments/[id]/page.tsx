"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { 
  ArrowLeft, Calendar, Clock, Edit, User, FileText, 
  AlertTriangle, Phone, Mail, MapPin, ClipboardList, 
  Activity, FileSymlink, CreditCard
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToothIcon } from "@/components/icons/ToothIcon";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { patientService, Patient } from "@/services/patient.service";
import { dentalChartService, DentalChart, Tooth, DentalCondition, DentalProcedure } from "@/services/dental-chart.service";
import { DentalChartViewer } from "@/components/dental-chart/DentalChartViewer";
import { ToothDetailPanel } from "@/components/dental-chart/ToothDetailPanel";
import { Separator } from "@/components/ui/separator";

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentClinic } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const appointmentId = params.id;

  // Dental chart states
  const [dentalChart, setDentalChart] = useState<DentalChart | null>(null);
  const [conditions, setConditions] = useState<DentalCondition[]>([]);
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [isLoadingDentalChart, setIsLoadingDentalChart] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id) {
        toast.error("No clinic selected. Please select a clinic first.");
        router.push("/");
        return;
      }
      
      setIsLoading(true);
      try {
        const appointmentData = await appointmentService.getAppointment(
          currentClinic.id.toString(),
          appointmentId
        );
        
        setAppointment(appointmentData);
        
        // Fetch patient data if appointment is loaded
        if (appointmentData) {
          const patientId = getPatientId(appointmentData);
          if (patientId) {
            const patientData = await patientService.getPatient(
              currentClinic.id.toString(),
              patientId.toString()
            );
            setPatient(patientData);
          }
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
        toast.error("Failed to load appointment details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [appointmentId, currentClinic?.id, router]);

  // Fetch dental chart data when the dental chart tab is selected
  const fetchDentalChartData = async () => {
    if (!currentClinic?.id || !patient) return;
    
    setIsLoadingDentalChart(true);
    try {
      // Fetch dental chart
      const chartData = await dentalChartService.getPatientDentalChart(
        currentClinic.id.toString(),
        patient.id
      );
      setDentalChart(chartData);
      
      // Fetch conditions and procedures
      const conditionsData = await dentalChartService.getDentalConditions(
        currentClinic.id.toString()
      );
      setConditions(conditionsData.results);
      
      const proceduresData = await dentalChartService.getDentalProcedures(
        currentClinic.id.toString()
      );
      setProcedures(proceduresData.results);
    } catch (error) {
      console.error("Error fetching dental chart data:", error);
      toast.error("Failed to load dental chart");
    } finally {
      setIsLoadingDentalChart(false);
    }
  };

  const handleToothSelect = (tooth: Tooth) => {
    setSelectedTooth(tooth);
  };

  const handleAddCondition = async (toothNumber: string, conditionData: any) => {
    if (!currentClinic?.id || !patient) return;
    
    try {
      await dentalChartService.addToothCondition(
        currentClinic.id.toString(),
        patient.id,
        toothNumber,
        conditionData
      );
      
      // Refresh dental chart
      fetchDentalChartData();
      
      toast.success("Condition added successfully");
    } catch (error) {
      console.error("Error adding condition:", error);
      toast.error("Failed to add condition");
    }
  };

  const handleCancelAppointment = async () => {
    if (!currentClinic?.id || !appointment) return;
    
    setIsCancelling(true);
    try {
      await appointmentService.cancelAppointment(
        currentClinic.id.toString(),
        appointmentId
      );
      
      toast.success("Appointment cancelled successfully");
      setAppointment({
        ...appointment,
        status: "cancelled",
        status_display: "Cancelled"
      });
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateStatus = async (status: 'scheduled' | 'completed' | 'cancelled' | 'no_show') => {
    if (!currentClinic?.id || !appointment) return;
    
    setIsUpdatingStatus(true);
    try {
      await appointmentService.updateAppointmentStatus(
        currentClinic.id.toString(),
        appointmentId,
        status
      );
      
      const statusDisplay = {
        scheduled: "Scheduled",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "No Show"
      }[status];
      
      setAppointment({
        ...appointment,
        status,
        status_display: statusDisplay
      });
      
      toast.success(`Appointment marked as ${statusDisplay.toLowerCase()}`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get patient name
  const getPatientName = () => {
    if (!appointment) return "";
    
    if (typeof appointment.patient === 'object' && appointment.patient !== null) {
      return appointment.patient.name;
    }
    
    return appointment.patient_name || "";
  };

  // Helper function to get patient ID
  const getPatientId = (appt: Appointment | null) => {
    if (!appt) return "";
    
    if (typeof appt.patient === 'object' && appt.patient !== null) {
      return appt.patient.id;
    }
    
    return appt.patient;
  };

  // Helper function to get dentist name
  const getDentistName = () => {
    if (!appointment) return "";
    
    if (typeof appointment.dentist === 'object' && appointment.dentist !== null) {
      return appointment.dentist.full_name || 
             `${appointment.dentist.first_name || ""} ${appointment.dentist.last_name || ""}`.trim() ||
             appointment.dentist.username;
    }
    
    return appointment.dentist_name || "";
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading appointment details...</p>
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

  const patientDetails = typeof appointment.patient === 'object' ? appointment.patient : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-semibold text-gray-900">Appointment Details</h1>
      </div>
      
      <Tabs defaultValue="details" className="w-full" onValueChange={(value) => {
        if (value === "dental-chart" && patient) {
          fetchDentalChartData();
        }
      }}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Appointment Details</TabsTrigger>
          <TabsTrigger value="dental-chart">Dental Chart</TabsTrigger>
          <TabsTrigger value="treatment-history">Treatment History</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Appointment Information</CardTitle>
                  <Badge className={getStatusBadgeColor(appointment.status)}>
                    {appointment.status_display || appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Patient</h3>
                    <p className="mt-1 text-lg font-medium">
                      {getPatientName()}
                    </p>
                    {patientDetails && (
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        {patientDetails.age && (
                          <p>Age: {patientDetails.age}</p>
                        )}
                        {patientDetails.gender && (
                          <p>Gender: {patientDetails.gender === 'M' ? 'Male' : patientDetails.gender === 'F' ? 'Female' : 'Other'}</p>
                        )}
                        {patientDetails.phone && (
                          <p className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {patientDetails.phone}
                          </p>
                        )}
                        {patientDetails.email && (
                          <p className="flex items-center">
                            <Mail className="mr-1 h-3 w-3" />
                            {patientDetails.email}
                          </p>
                        )}
                      </div>
                    )}
                    <Button variant="link" className="px-0 mt-1" asChild>
                      <Link href={`/patients/${getPatientId(appointment)}`}>
                        View Patient Profile
                      </Link>
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Dentist</h3>
                    <p className="mt-1 text-lg font-medium">
                      Dr. {getDentistName()}
                    </p>
                    {typeof appointment.dentist === 'object' && appointment.dentist.email && (
                      <p className="mt-1 text-sm text-gray-500 flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        {appointment.dentist.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date</h3>
                    <p className="mt-1 flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      {format(parseISO(appointment.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Time</h3>
                    <p className="mt-1 flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                      {appointment.duration_minutes && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({appointment.duration_minutes} min)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {appointment.reason && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Reason for Visit</h3>
                    <p className="mt-1">{appointment.reason}</p>
                  </div>
                )}
                
                {appointment.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                    <p className="mt-1">{appointment.notes}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Appointment History</h3>
                  <div className="space-y-2 text-sm">
                    {appointment.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span>{format(new Date(appointment.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    )}
                    {appointment.updated_at && appointment.updated_at !== appointment.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Updated</span>
                        <span>{format(new Date(appointment.updated_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <Link href={`/appointments/${appointment.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Appointment
                  </Link>
                </Button>
                
                {appointment.status === "scheduled" && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleUpdateStatus("completed")}
                      disabled={isUpdatingStatus}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleUpdateStatus("no_show")}
                      disabled={isUpdatingStatus}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Mark as No Show
                    </Button>
                    
                    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Cancel Appointment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Appointment</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel this appointment? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCancelDialog(false)}
                          >
                            No, Keep It
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleCancelAppointment}
                            disabled={isCancelling}
                          >
                            {isCancelling ? "Cancelling..." : "Yes, Cancel It"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                
                {appointment.status === "cancelled" && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleUpdateStatus("scheduled")}
                    disabled={isUpdatingStatus}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Reschedule Appointment
                  </Button>
                )}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/patients/${getPatientId(appointment)}/dental-chart`}>
                    <ToothIcon className="mr-2 h-4 w-4" />
                    Dental Chart
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/patients/${getPatientId(appointment)}/treatments`}>
                    <Activity className="mr-2 h-4 w-4" />
                    View Treatment History
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dental-chart">
          <Card>
            <CardHeader>
              <CardTitle>Dental Chart for {getPatientName()}</CardTitle>
            </CardHeader>
            <CardContent>
              {!patient ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading patient information...</p>
                </div>
              ) : isLoadingDentalChart ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading dental chart...</p>
                </div>
              ) : dentalChart ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <DentalChartViewer 
                      teeth={[...(dentalChart.permanent_teeth || []), ...(dentalChart.primary_teeth || [])]} 
                      onToothSelect={handleToothSelect} 
                      selectedTooth={selectedTooth}
                    />
                    <Separator className="my-4" />
                    <div className="flex justify-end">
                      <Button variant="outline" asChild>
                        <Link href={`/patients/${getPatientId(appointment)}/dental-chart`}>
                          <FileSymlink className="mr-2 h-4 w-4" />
                          Open Full Dental Chart
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    {selectedTooth ? (
                      <ToothDetailPanel
                        tooth={selectedTooth}
                        conditions={conditions}
                        procedures={procedures}
                        onAddCondition={(conditionData) => {
                          handleAddCondition(selectedTooth.number.toString(), conditionData);
                        }}
                        onUpdateCondition={() => fetchDentalChartData()}
                        onDeleteCondition={() => fetchDentalChartData()}
                        onAddProcedure={() => fetchDentalChartData()}
                        onUpdateProcedure={() => fetchDentalChartData()}
                        onDeleteProcedure={() => fetchDentalChartData()}
                        onAddProcedureNote={() => fetchDentalChartData()}
                        clinicId={currentClinic?.id.toString()}
                        patientId={patient.id}
                        onClose={() => setSelectedTooth(null)}
                      />
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tooth Selected</h3>
                        <p className="text-gray-500">
                          Click on a tooth in the chart to view and edit its details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSymlink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Dental Chart Found</h3>
                  <p className="text-gray-500 mb-4">This patient doesn't have a dental chart yet</p>
                  <Button asChild>
                    <Link href={`/patients/${getPatientId(appointment)}/dental-chart`}>
                      Create Dental Chart
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="treatment-history">
          <Card>
            <CardHeader>
              <CardTitle>Treatment History for {getPatientName()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Treatment History</h3>
                <p className="text-gray-500 mb-4">View the patient's treatment history and records</p>
                <Button asChild>
                  <Link href={`/patients/${getPatientId(appointment)}/treatments`}>
                    View Treatment History
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Record Payment for {getPatientName()}</CardTitle>
            </CardHeader>
            <CardContent>
              {patient ? (
                <div>
                  {showPaymentForm ? (
                    <PaymentForm 
                      patient={patient} 
                      appointment={appointment}
                      isBalancePayment={false}
                      onSuccess={() => {
                        toast.success("Payment recorded successfully");
                        setShowPaymentForm(false);
                      }}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Record Payment</h3>
                      <p className="text-gray-500 mb-4">
                        Record a payment for this appointment
                      </p>
                      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                        <Button onClick={() => setShowPaymentForm(true)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Record New Payment
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/patients/${getPatientId(appointment)}/payments?clinic_id=${currentClinic?.id}`}>
                            View All Payments
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading patient information...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 