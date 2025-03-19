"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Search, Plus, User, Users } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { appointmentService, Appointment, Dentist } from "@/services/appointment.service";
import { Patient } from "@/services/patient.service";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/patients/PatientForm";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  dentist_id: z.string().min(1, "Dentist is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

interface AppointmentFormProps {
  appointment?: Appointment;
  onSuccess?: () => void;
  preSelectedPatientId?: string;
}

export function AppointmentForm({ appointment, onSuccess, preSelectedPatientId }: AppointmentFormProps) {
  const router = useRouter();
  const { currentClinic } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean; patientName?: string; appointmentId?: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointment?.date ? new Date(appointment.date) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    appointment ? appointment.start_time.substring(0, 5) : ""
  );
  const [patientId, setPatientId] = useState<string>(
    preSelectedPatientId || (appointment?.patient.id || "")
  );
  const [dentistId, setDentistId] = useState<string>(appointment?.dentist.id || "");
  const [status, setStatus] = useState<string>(appointment?.status || "scheduled");
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_id: preSelectedPatientId || (appointment?.patient.id || ""),
      dentist_id: appointment?.dentist.id || "",
      date: appointment?.date ? new Date(appointment.date) : new Date(),
      start_time: appointment?.start_time || "",
      end_time: appointment?.end_time || "",
      reason: appointment?.reason || "",
      notes: appointment?.notes || "",
    },
  });

  // Filter patients based on search
  useEffect(() => {
    if (patientSearch) {
      const filtered = patients.filter(
        patient => 
          patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          (patient.email && patient.email.toLowerCase().includes(patientSearch.toLowerCase())) ||
          (patient.phone && patient.phone.includes(patientSearch))
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patientSearch, patients]);

  // Load patients and dentists on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id) return;
      
      setIsLoading(true);
      try {
        const [patientsData, dentistsData] = await Promise.all([
          appointmentService.getPatients(currentClinic.id.toString()),
          appointmentService.getDentists(currentClinic.id.toString())
        ]);
        
        setPatients(patientsData);
        setFilteredPatients(patientsData);
        setDentists(dentistsData);
        
        // If we have a preSelectedPatientId, find that patient and ensure it's selected
        if (preSelectedPatientId) {
          const selectedPatient = patientsData.find(
            patient => patient.id.toString() === preSelectedPatientId
          );
          
          if (selectedPatient) {
            setPatientId(selectedPatient.id.toString());
            form.setValue("patient_id", selectedPatient.id.toString());
            
            // Optionally scroll to the selected patient in the list
            // This would need a ref implementation to work fully
          }
        }
        
        console.log("Patients loaded:", patientsData);
        console.log("Dentists loaded:", dentistsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load patients and dentists");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentClinic?.id, form, preSelectedPatientId]);

  // Load available time slots when date or dentist changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!currentClinic?.id || !dentistId || !selectedDate) return;
      
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const slots = await appointmentService.getAvailableTimeSlots(
          currentClinic.id.toString(),
          formattedDate,
          dentistId.toString(),
          selectedTime
        );
        
        setAvailableTimeSlots(slots);
      } catch (error) {
        console.error("Error fetching time slots:", error);
        toast.error("Failed to load available time slots");
      }
    };
    
    fetchTimeSlots();
  }, [currentClinic?.id, dentistId, selectedDate, selectedTime]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      form.setValue("date", date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    
    // Calculate end time (30 minutes after start time)
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    
    form.setValue("start_time", time);
    form.setValue("end_time", endTime);
  };

  const handleNewPatientSuccess = (newPatient: Patient) => {
    setPatients(prev => [...prev, newPatient]);
    setPatientId(newPatient.id);
    form.setValue("patient_id", newPatient.id);
    setNewPatientDialogOpen(false);
    toast.success("New patient added successfully");
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!currentClinic?.id) {
      toast.error("No clinic selected");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const appointmentData = {
        patient_id: data.patient_id,
        dentist_id: data.dentist_id,
        date: format(data.date, "yyyy-MM-dd"),
        start_time: data.start_time,
        end_time: data.end_time,
        reason: data.reason,
        notes: data.notes
      };
      
      if (appointment) {
        // Update existing appointment
        const updatedAppointment = await appointmentService.updateAppointment(
          currentClinic.id.toString(),
          appointment.id,
          appointmentData
        );
        
        // If status changed, update status
        if (status !== appointment.status) {
          await appointmentService.updateAppointmentStatus(
            currentClinic.id.toString(),
            appointment.id,
            status as 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          );
        }
        
        toast.success("Appointment updated successfully");
      } else {
        // Create new appointment
        await appointmentService.createAppointment(
          currentClinic.id.toString(),
          appointmentData
        );
        
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
      setIsSubmitting(false);
    }
  };

  if (!currentClinic?.id) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 mb-4">Please select a clinic to schedule appointments</p>
          <Button onClick={() => router.push("/")}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Patient Selection */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Patient Information</h3>
              <p className="text-sm text-gray-500 mb-4">
                Select an existing patient or add a new one
              </p>
              
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          placeholder="Search patients..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Dialog open={newPatientDialogOpen} onOpenChange={setNewPatientDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" type="button">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add New Patient</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <PatientForm 
                              onSuccess={handleNewPatientSuccess}
                              onCancel={() => setNewPatientDialogOpen(false)}
                              mode="dialog"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <ScrollArea className="h-[300px]">
                        <div className="p-1">
                          {isLoading ? (
                            <div className="flex justify-center items-center h-full py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <div
                                key={patient.id}
                                className={cn(
                                  "flex items-center p-3 rounded-md cursor-pointer transition-colors",
                                  patientId === patient.id.toString()
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                )}
                                onClick={() => {
                                  setPatientId(patient.id.toString());
                                  field.onChange(patient.id.toString());
                                }}
                              >
                                <div className="flex-shrink-0 mr-3">
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{patient.name}</p>
                                  <div className="flex items-center text-sm">
                                    {patient.phone && (
                                      <span className="truncate">{patient.phone}</span>
                                    )}
                                    {patient.gender && (
                                      <Badge variant="outline" className="ml-2">
                                        {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : patientSearch ? (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p>No patients found matching "{patientSearch}"</p>
                              <Button 
                                variant="link" 
                                onClick={() => setNewPatientDialogOpen(true)}
                                className="mt-2"
                              >
                                Add new patient
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p>No patients available</p>
                              <Button 
                                variant="link" 
                                onClick={() => setNewPatientDialogOpen(true)}
                                className="mt-2"
                              >
                                Add new patient
                              </Button>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Right Column - Appointment Details */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Appointment Details</h3>
              <p className="text-sm text-gray-500 mb-4">
                Select the dentist, date, and time for the appointment
              </p>
              
              {/* Dentist Selection */}
              <FormField
                control={form.control}
                name="dentist_id"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Dentist</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setDentistId(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dentist" />
                      </SelectTrigger>
                      <SelectContent>
                        {dentists.map((dentist) => (
                          <SelectItem key={dentist.id} value={dentist.id}>
                            {dentist.first_name} {dentist.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Selection */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Date</FormLabel>
                    <div className="flex space-x-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={handleDateChange}
                            disabled={(date) =>
                              date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 3))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Slots */}
              <FormItem>
                <FormLabel>Time Slot</FormLabel>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {availableTimeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      className={cn(
                        "h-10",
                        !slot.available && "bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100"
                      )}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </FormItem>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Additional Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit</FormLabel>
                  <Textarea {...field} placeholder="Enter the reason for the appointment" />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <Textarea {...field} placeholder="Add any additional notes" />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Scheduling...
              </>
            ) : (
              'Schedule Appointment'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 