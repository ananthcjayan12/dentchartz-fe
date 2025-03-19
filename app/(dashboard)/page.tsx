"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { patientService } from "@/services/patient.service";
import { appointmentService } from "@/services/appointment.service";
import { format } from "date-fns";
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  LineChart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalPatientsChange: 0,
    appointmentsToday: 0,
    appointmentsTodayChange: 0,
    monthlyRevenue: 0,
    monthlyRevenueChange: 0,
    treatmentCompletion: 0,
    treatmentCompletionChange: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentClinic } = useAuth();

  useEffect(() => {
    if (!currentClinic?.id) {
      toast.error("No clinic selected");
      return;
    }
    fetchDashboardData();
  }, [currentClinic?.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats data using your API utils
      const [patientStats, appointmentStats] = await Promise.all([
        patientService.getPatientStats(currentClinic.id.toString()),
        appointmentService.getAppointmentStats(currentClinic.id.toString())
      ]);
      
      setStats({
        totalPatients: patientStats.totalPatients || 0,
        totalPatientsChange: patientStats.monthlyGrowth || 0,
        appointmentsToday: appointmentStats.todayCount || 0,
        appointmentsTodayChange: appointmentStats.dailyChange || 0,
        monthlyRevenue: appointmentStats.monthlyRevenue || 0,
        monthlyRevenueChange: appointmentStats.revenueChange || 0,
        treatmentCompletion: appointmentStats.completionRate || 0,
        treatmentCompletionChange: appointmentStats.completionRateChange || 0
      });
      
      // Fetch today's appointments
      const today = format(new Date(), 'yyyy-MM-dd');
      const appointments = await appointmentService.getAppointments(
        currentClinic.id.toString(),
        1,
        "",
        10,
        today
      );
      
      setTodayAppointments(appointments.results || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get patient initials
  const getPatientInitials = (name) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Overview of your dental practice</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <>
                    <p className="text-3xl font-bold mt-1">{stats.totalPatients}</p>
                    <p className={`text-sm ${stats.totalPatientsChange >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                      {stats.totalPatientsChange >= 0 ? '↑' : '↓'} {Math.abs(stats.totalPatientsChange)}% from last month
                    </p>
                  </>
                )}
              </div>
              <div className="p-2 bg-gray-50 rounded-full">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <>
                    <p className="text-3xl font-bold mt-1">{stats.appointmentsToday}</p>
                    <p className={`text-sm ${stats.appointmentsTodayChange >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                      {stats.appointmentsTodayChange >= 0 ? '↑' : '↓'} {Math.abs(stats.appointmentsTodayChange)} from yesterday
                    </p>
                  </>
                )}
              </div>
              <div className="p-2 bg-gray-50 rounded-full">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <>
                    <p className="text-3xl font-bold mt-1">${stats.monthlyRevenue.toLocaleString()}</p>
                    <p className={`text-sm ${stats.monthlyRevenueChange >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                      {stats.monthlyRevenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.monthlyRevenueChange)}% from last month
                    </p>
                  </>
                )}
              </div>
              <div className="p-2 bg-gray-50 rounded-full">
                <CreditCard className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Treatment Completion</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <>
                    <p className="text-3xl font-bold mt-1">{stats.treatmentCompletion}%</p>
                    <p className={`text-sm ${stats.treatmentCompletionChange >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                      {stats.treatmentCompletionChange >= 0 ? '↑' : '↓'} {Math.abs(stats.treatmentCompletionChange)}% from last month
                    </p>
                  </>
                )}
              </div>
              <div className="p-2 bg-gray-50 rounded-full">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Appointments */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Today's Appointments</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/appointments" className="text-indigo-600">
              View all
            </Link>
          </Button>
        </div>
        
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-gray-500 uppercase">
                      <th className="px-6 py-3 text-left">Time</th>
                      <th className="px-6 py-3 text-left">Patient</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.map(appointment => {
                      const patientName = appointment.patient_name || 'Unknown Patient';
                      
                      const patientCode = `PAT-${appointment.patient}`;
                      
                      const patientInitials = getPatientInitials(appointment.patient_name) || 'UP';
                      
                      const appointmentTime = appointment.start_time 
                        ? format(new Date(`2000-01-01T${appointment.start_time}`), 'hh:mm a')
                        : 'N/A';
                      
                      return (
                        <tr key={appointment.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {appointmentTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                {patientInitials}
                              </div>
                              <div>
                                <p className="font-medium">{patientName}</p>
                                <p className="text-xs text-gray-500">{patientCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {appointment.type || 'General'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === 'scheduled'
                                ? 'bg-green-100 text-green-800' 
                                : appointment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status_display || 
                               (appointment.status && appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)) || 
                               'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/appointments/${appointment.id}`} className="text-indigo-600">
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No appointments scheduled for today</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/appointments/new">Schedule an appointment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-medium">New Appointment</h3>
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link href="/appointments/new">
                  Schedule
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-medium">New Patient</h3>
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link href="/patients/new">
                  Register
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="font-medium">Record Payment</h3>
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link href="/payments">
                  Record
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="font-medium">View Reports</h3>
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link href="/reports">
                  View
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 