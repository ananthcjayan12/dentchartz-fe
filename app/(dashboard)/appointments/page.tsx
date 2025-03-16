"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Search, Plus, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { format, isToday, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentClinic } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") || 1));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date") as string) : undefined
  );
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [limit] = useState(10);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalAppointments / limit);
  
  // Fetch appointments when page, search, date, or status changes
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentClinic?.id) {
        toast.error("No clinic selected. Please select a clinic first.");
        return;
      }
      
      setIsLoading(true);
      
      try {
        const filters: any = {};
        
        if (searchQuery) {
          filters.search = searchQuery;
        }
        
        if (selectedDate) {
          filters.date = format(selectedDate, "yyyy-MM-dd");
        }
        
        if (statusFilter && statusFilter !== "all") {
          filters.status = statusFilter;
        }
        
        const response = await appointmentService.getAppointments(
          currentClinic.id.toString(),
          currentPage,
          filters,
          limit
        );
        
        setAppointments(response.results);
        setTotalAppointments(response.count);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
    
    // Update URL with current filters
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedDate) params.set("date", format(selectedDate, "yyyy-MM-dd"));
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [currentClinic?.id, currentPage, searchQuery, selectedDate, statusFilter]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDate(undefined);
    setStatusFilter("all");
    setCurrentPage(1);
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
  
  // If no clinic is selected, show a message
  if (!currentClinic?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Clinic Selected</h2>
        <p className="text-gray-500 mb-6">Please select a clinic to view appointments.</p>
        <Button asChild>
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-900">Appointments</h1>
        <Button asChild>
          <Link href="/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Appointment List</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search appointments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            {/* Date Filter */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
                    {selectedDate && (
                      <X
                        className="ml-auto h-4 w-4 text-gray-500 hover:text-gray-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Appointments List */}
          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : appointments.length > 0 ? (
            <>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {appointment.patient_name}
                        </h3>
                        <Badge className={getStatusBadgeColor(appointment.status)}>
                          {appointment.status_display || appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>
                            {format(parseISO(appointment.date), "MMM d, yyyy")}
                            {isToday(parseISO(appointment.date)) && (
                              <span className="ml-1 text-blue-600 font-medium">Today</span>
                            )}
                          </span>
                        </div>
                        <div>
                          {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                        </div>
                        <div>
                          Dr. {appointment.dentist_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex mt-3 md:mt-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/appointments/${appointment.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No appointments found</p>
              {(searchQuery || selectedDate || statusFilter !== "all") && (
                <Button 
                  variant="link" 
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 