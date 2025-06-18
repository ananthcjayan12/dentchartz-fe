"use client";

import React, { Suspense } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { patientService, Patient } from "@/services/patient.service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Search, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

// Tell Next.js this is a dynamic page that shouldn't be prerendered
export const dynamic = "force-dynamic";

// Component that uses useSearchParams
function PatientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentClinic } = useAuth();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") || 1));
  const [limit] = useState(10);
  
  // Fetch patients when page or search changes
  useEffect(() => {
    const fetchPatients = async () => {
      if (!currentClinic?.id) {
        toast.error("No clinic selected. Please select a clinic first.");
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await patientService.getPatients(
          currentClinic.id.toString(),
          currentPage, 
          searchQuery, 
          limit
        );
        console.log("Patient data:", response.results);
        setPatients(response.results);
        setTotalPatients(response.count);
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast.error("Failed to load patients");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
    
    // Update URL with current filters
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (currentPage > 1) params.set("page", currentPage.toString());
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [currentPage, searchQuery, currentClinic?.id]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalPatients / limit);
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 rounded-lg text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Patients</h1>
          <p className="mt-1 text-white/80">Manage your patient records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white">
            <Link href="/patients/import">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50">
          <Link href="/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Patient
          </Link>
        </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : patients.length > 0 ? (
            <>
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                      <TableHead>Age</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.name || `Patient #${patient.id}`}
                      </TableCell>
                      <TableCell>
                          {patient.phone && <div>{patient.phone}</div>}
                        {patient.email && (
                          <div className="text-gray-500 text-sm">{patient.email}</div>
                        )}
                      </TableCell>
                        <TableCell>{patient.age ? `${patient.age} years` : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                              <Link href={`/patients/${patient.id}`}>View</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                              <Link href={`/appointments/new?patientId=${patient.id}`}>Schedule</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              {/* Mobile card list view */}
              <div className="md:hidden grid gap-4">
                {patients.map((patient) => (
                  <Card key={patient.id} className="shadow rounded-lg">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium">{patient.name}</h3>
                          {patient.phone && <p className="text-sm text-gray-600">{patient.phone}</p>}
                          {patient.email && <p className="text-sm text-gray-600">{patient.email}</p>}
                          <p className="text-sm text-gray-600">{patient.age ? `${patient.age} years` : 'N/A'}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button asChild size="sm" className="bg-indigo-600 text-white">
                            <Link href={`/patients/${patient.id}`}>View</Link>
                          </Button>
                          <Button asChild size="sm" className="bg-green-600 text-white">
                            <Link href={`/appointments/new?patientId=${patient.id}`}>Schedule</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Pagination */}
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
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No patients found</p>
              {searchQuery && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading patients...</div>}>
      <PatientsContent />
    </Suspense>
  );
} 