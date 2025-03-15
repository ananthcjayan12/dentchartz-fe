"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { patientService, Patient } from "@/services/patient.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search, ChevronLeft, ChevronRight, Edit, Eye, Trash2, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") || 1));
  const [limit] = useState(10);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    if (Array.isArray(patients)) {
      const filtered = patients.filter(
        (patient) =>
          patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phone.includes(searchQuery)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const result = await patientService.getPatients(currentPage, limit, searchQuery);
      setPatients(result.data);
      setFilteredPatients(result.data);
      setTotalPatients(result.total);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
      // Set empty arrays as fallback
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    
    // Update URL with search params
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    params.set("page", "1");
    router.push(`/patients?${params.toString()}`);
    
    fetchPatients();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Update URL with page param
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/patients?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalPatients / limit);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Button asChild>
          <Link href="/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            New Patient
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search patients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : Array.isArray(filteredPatients) && filteredPatients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <Link href={`/patients/${patient.id}`} className="hover:underline flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-500" />
                        {patient.first_name} {patient.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{new Date(patient.date_of_birth).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${patient.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <User className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No patients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? "No patients match your search criteria."
                  : "Get started by creating a new patient."}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/patients/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Patient
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 