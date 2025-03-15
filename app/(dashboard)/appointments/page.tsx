"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { patientService } from "@/services/patient.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Search, ChevronLeft, ChevronRight, Edit, Eye, Trash2, Clock, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") || 1));
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");
  const [limit] = useState(10);

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, searchQuery, statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, total } = await appointmentService.getAppointments(
        currentPage, 
        limit, 
        {
          search: searchQuery,
          status: statusFilter === "all" ? undefined : statusFilter,
          date: dateFilter || undefined
        }
      );
      
      // Fetch patient details for each appointment
      const appointmentsWithPatients = await Promise.all(
        data.map(async (appointment) => {
          try {
            const patient = await patientService.getPatient(appointment.patient_id);
            return { ...appointment, patient };
          } catch (error) {
            return appointment;
          }
        })
      );
      
      setAppointments(appointmentsWithPatients);
      setTotalAppointments(total);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrlParams();
    fetchAppointments();
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    updateUrlParams({ status: value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
    updateUrlParams({ date: e.target.value });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams({ page: page.toString() });
  };

  const updateUrlParams = (params: Record<string, string> = {}) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (searchQuery) newParams.set("search", searchQuery);
    else newParams.delete("search");
    
    if (statusFilter && statusFilter !== "all") newParams.set("status", statusFilter);
    else newParams.delete("status");
    
    if (dateFilter) newParams.set("date", dateFilter);
    else newParams.delete("date");
    
    newParams.set("page", (params.page || currentPage.toString()));
    
    // Override with any new params
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    
    router.push(`/appointments?${newParams.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      try {
        await appointmentService.deleteAppointment(id);
        toast.success("Appointment deleted successfully");
        fetchAppointments();
      } catch (error) {
        console.error("Error deleting appointment:", error);
        toast.error("Failed to delete appointment");
      }
    }
  };

  const getStatusBadgeClass = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalAppointments / limit);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Appointments</h1>
          <p className="mt-2 text-sm text-gray-500">Manage your appointments</p>
        </div>
        <Button onClick={() => router.push("/appointments/new")}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Appointment List</CardTitle>
          <div className="mt-3 flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search appointments..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-40">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-40">
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    className="pl-9 w-full"
                    value={dateFilter}
                    onChange={handleDateChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No appointments found</p>
              <Button variant="link" onClick={() => router.push("/appointments/new")}>
                Schedule a new appointment
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Patient</th>
                      <th scope="col" className="px-6 py-3">Date & Time</th>
                      <th scope="col" className="px-6 py-3">Doctor</th>
                      <th scope="col" className="px-6 py-3">Type</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {appointment.patient ? (
                            <Link href={`/patients/${appointment.patient_id}`} className="hover:underline">
                              {appointment.patient.first_name} {appointment.patient.last_name}
                            </Link>
                          ) : (
                            `Patient ID: ${appointment.patient_id}`
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            <span>{format(new Date(`${appointment.date}T${appointment.time}`), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center mt-1 text-gray-500">
                            <Clock className="mr-2 h-4 w-4 text-gray-400" />
                            <span>{format(new Date(`${appointment.date}T${appointment.time}`), 'h:mm a')}</span>
                            <span className="ml-1">({appointment.duration} min)</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {appointment.doctor_name || `Doctor ID: ${appointment.doctor_id}`}
                        </td>
                        <td className="px-6 py-4 capitalize">
                          {appointment.type.replace(/-/g, ' ')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="icon" asChild>
                              <Link href={`/appointments/${appointment.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                            <Button variant="outline" size="icon" asChild>
                              <Link href={`/appointments/${appointment.id}/edit`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDelete(appointment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * limit, totalAppointments)}
                        </span>{" "}
                        of <span className="font-medium">{totalAppointments}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 