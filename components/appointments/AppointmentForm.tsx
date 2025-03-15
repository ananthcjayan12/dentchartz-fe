"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Clock, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { patientService, Patient } from "@/services/patient.service";
import { doctorService, Doctor } from "@/services/doctor.service";
import { TimeSlotPicker } from "@/components/appointments/TimeSlotPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PatientForm } from "@/components/patients/PatientForm";

interface AppointmentFormProps {
  appointment?: Appointment;
  onSuccess?: () => void;
}

export function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(
    appointment ? new Date(appointment.date) : new Date()
  );
  const [time, setTime] = useState<string>(
    appointment ? format(new Date(appointment.date), "HH:mm") : ""
  );
  const [patientId, setPatientId] = useState<string>(appointment?.patient_id || "");
  const [doctorId, setDoctorId] = useState<string>(appointment?.doctor_id || "");
  const [reason, setReason] = useState<string>(appointment?.reason || "");
  const [notes, setNotes] = useState<string>(appointment?.notes || "");
  const [status, setStatus] = useState<string>(appointment?.status || "scheduled");
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [patientSearch, setPatientSearch] = useState<string>("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (date && doctorId) {
      fetchBookedSlots();
    }
  }, [date, doctorId]);

  useEffect(() => {
    if (!patients || !Array.isArray(patients)) {
      setFilteredPatients([]);
      return;
    }
    
    if (patientSearch) {
      const filtered = patients.filter(
        patient => 
          patient.first_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          patient.last_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          patient.email.toLowerCase().includes(patientSearch.toLowerCase()) ||
          patient.phone.includes(patientSearch)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([...patients]);
    }
  }, [patientSearch, patients]);

  const fetchData = async () => {
    try {
      const [patientsData, doctorsData] = await Promise.all([
        patientService.getAllPatients(),
        doctorService.getDoctors()
      ]);
      
      // Ensure patientsData is an array
      const patientsArray = Array.isArray(patientsData) ? patientsData : [];
      setPatients(patientsArray);
      setFilteredPatients(patientsArray);
      
      // Ensure doctorsData is an array
      const doctorsArray = Array.isArray(doctorsData) ? doctorsData : [];
      setDoctors(doctorsArray);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load form data");
      // Set empty arrays as fallback
      setPatients([]);
      setFilteredPatients([]);
      setDoctors([]);
    }
  };

  const fetchBookedSlots = async () => {
    if (!date || !doctorId) return;
    
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const appointments = await appointmentService.getAppointmentsByDoctorAndDate(doctorId, formattedDate);
      
      // Format appointments for the time slot picker
      const slots = appointments
        .filter(apt => apt.id !== appointment?.id) // Exclude current appointment when editing
        .map(apt => {
          const aptDate = new Date(apt.date);
          return {
            startTime: format(aptDate, "HH:mm"),
            endTime: format(new Date(aptDate.getTime() + 30 * 60000), "HH:mm"), // Assuming 30 min appointments
            appointmentId: apt.id,
            patientName: `${apt.patient_first_name} ${apt.patient_last_name}`
          };
        });
      
      setBookedSlots(slots);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      toast.error("Failed to load appointment slots");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !patientId || !doctorId || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Combine date and time
      const appointmentDate = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      appointmentDate.setHours(hours, minutes);
      
      const appointmentData = {
        date: appointmentDate.toISOString(),
        patient_id: patientId,
        doctor_id: doctorId,
        reason,
        notes,
        status
      };
      
      if (appointment) {
        // Update existing appointment
        await appointmentService.updateAppointment(appointment.id, appointmentData);
        toast.success("Appointment updated successfully");
      } else {
        // Create new appointment
        await appointmentService.createAppointment(appointmentData);
        toast.success("Appointment created successfully");
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/appointments");
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Failed to save appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPatientSuccess = (newPatient: Patient) => {
    // Add the new patient to the list and select it
    setPatients(prev => [...prev, newPatient]);
    setPatientId(newPatient.id);
    setShowNewPatientDialog(false);
    toast.success("Patient created successfully");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="patient-search">Search Patient</Label>
                      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="h-8 gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            New Patient
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Add New Patient</DialogTitle>
                          </DialogHeader>
                          <PatientForm onSuccess={handleNewPatientSuccess} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="relative mt-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="patient-search"
                        placeholder="Search by name, email or phone"
                        className="pl-9"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patient">Select Patient</Label>
                    <Select value={patientId} onValueChange={setPatientId}>
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(filteredPatients) && filteredPatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name} - {patient.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {Array.isArray(filteredPatients) && filteredPatients.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No patients found
                    </div>
                  )}
                  
                  {patientId && (
                    <div className="rounded-md bg-muted p-3">
                      <div className="flex items-start space-x-3">
                        <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {patients.find(p => p.id === patientId)?.first_name}{" "}
                            {patients.find(p => p.id === patientId)?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {patients.find(p => p.id === patientId)?.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <Select value={doctorId} onValueChange={(value) => {
                      setDoctorId(value);
                      setTime(""); // Reset time when doctor changes
                    }}>
                      <SelectTrigger id="doctor">
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate);
                            setTime(""); // Reset time when date changes
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {date && doctorId && (
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <TimeSlotPicker
                        date={date}
                        bookedSlots={bookedSlots}
                        value={time}
                        onChange={setTime}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Visit</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any additional notes about the appointment"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
              )}
              {appointment ? "Update" : "Create"} Appointment
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
} 