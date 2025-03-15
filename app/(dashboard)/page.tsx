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

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPatients: 1248,
    totalPatientsChange: 12,
    appointmentsToday: 8,
    appointmentsTodayChange: 2,
    monthlyRevenue: 24685,
    monthlyRevenueChange: 8,
    treatmentCompletion: 92,
    treatmentCompletionChange: 3
  });
  const [todayAppointments, setTodayAppointments] = useState([
    {
      id: "1",
      time: "09:00 AM",
      patient: { id: "1", name: "John Doe", code: "PAT-1234", initials: "JD" },
      type: "Cleaning",
      status: "confirmed"
    },
    {
      id: "2",
      time: "10:30 AM",
      patient: { id: "2", name: "Jane Smith", code: "PAT-5678", initials: "JS" },
      type: "Root Canal",
      status: "pending"
    },
    {
      id: "3",
      time: "02:00 PM",
      patient: { id: "3", name: "Robert Johnson", code: "PAT-9012", initials: "RJ" },
      type: "Consultation",
      status: "confirmed"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

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
                <p className="text-3xl font-bold mt-1">{stats.totalPatients.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {stats.totalPatientsChange}% from last month
                </p>
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
                <p className="text-3xl font-bold mt-1">{stats.appointmentsToday}</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {stats.appointmentsTodayChange} from yesterday
                </p>
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
                <p className="text-3xl font-bold mt-1">${stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {stats.monthlyRevenueChange}% from last month
                </p>
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
                <p className="text-3xl font-bold mt-1">{stats.treatmentCompletion}%</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {stats.treatmentCompletionChange}% from last month
                </p>
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
                  {todayAppointments.map(appointment => (
                    <tr key={appointment.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                            {appointment.patient.initials}
                          </div>
                          <div>
                            <p className="font-medium">{appointment.patient.name}</p>
                            <p className="text-xs text-gray-500">#{appointment.patient.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
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
                  ))}
                </tbody>
              </table>
            </div>
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