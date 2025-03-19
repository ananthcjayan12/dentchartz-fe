"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { dentalChartService, DentalChart, Tooth, DentalCondition, DentalProcedure } from "@/services/dental-chart.service";
import { patientService } from "@/services/patient.service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, FileText, History } from "lucide-react";
import { toast } from "sonner";
import { DentalChartViewer } from "@/components/dental-chart/DentalChartViewer";
import { ToothDetailPanel } from "@/components/dental-chart/ToothDetailPanel";
import { ChartHistoryViewer } from "@/components/dental-chart/ChartHistoryViewer";
import { CondensedChartHistory } from "@/components/dental-chart/CondensedChartHistory";
import { ProceduresSummary } from "@/components/dental-chart/ProceduresSummary";
import { GeneralProcedureDialog } from "@/components/dental-chart/GeneralProcedureDialog";

export default function PatientDentalChartPage() {
  const router = useRouter();
  const { currentClinic } = useAuth();
  const { id: patientId } = useParams();
  
  const [dentalChart, setDentalChart] = useState<DentalChart | null>(null);
  const [conditions, setConditions] = useState<DentalCondition[]>([]);
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [activeTab, setActiveTab] = useState("chart");
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [showGeneralProcedureDialog, setShowGeneralProcedureDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic?.id) {
        toast.error("No clinic selected");
        return;
      }
      
    setIsLoading(true);
    try {
        // Fetch patient details
        const patientData = await patientService.getPatient(
          currentClinic.id.toString(),
          patientId
        );
        setPatientName(patientData.name);
        
        // Fetch dental chart
        const chartData = await dentalChartService.getPatientDentalChart(
          currentClinic.id.toString(),
          patientId
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
      setIsLoading(false);
    }
  };

    fetchData();
  }, [currentClinic?.id, patientId]);
  
  const handleToothSelect = (tooth: Tooth) => {
    setSelectedTooth(tooth);
  };
  
  const handleAddCondition = async (
    toothNumber: string,
    conditionData: {
      condition_id?: number;
      custom_name?: string;
      custom_code?: string;
      custom_description?: string;
      surface: string;
      notes?: string;
      severity?: string;
    }
  ) => {
    console.log("handleAddCondition called with:", toothNumber, conditionData);
    
    if (!currentClinic?.id) {
      console.error("No clinic selected");
      toast.error("No clinic selected");
      return;
    }
    
    try {
      console.log("Making API call to add condition");
      
      // Add dentition_type based on tooth number format
      const dataWithDentition = {
        ...conditionData,
        dentition_type: /^[A-Z]$/.test(toothNumber) ? 'primary' : 'permanent'
      };
      
      // Make API call to add condition
      const newCondition = await dentalChartService.addToothCondition(
        currentClinic.id.toString(),
        patientId as string,
        toothNumber,
        dataWithDentition
      );
      
      console.log("API call successful, new condition:", newCondition);
      
      // Instead of manually updating the state, fetch the updated dental chart
      await fetchDentalChart();
      
      toast.success("Condition added successfully");
    } catch (error) {
      console.error("Error adding condition:", error);
      toast.error("Failed to add condition");
    }
  };
  
  const handleAddProcedure = async (
    toothNumber: string,
    procedureData: {
      procedure_id: number;
      surface: string;
      notes?: string;
      date_performed: string;
      price?: number;
      status: string;
    }
  ) => {
    if (!currentClinic?.id) {
      console.error("No clinic selected");
      toast.error("No clinic selected");
      return;
    }
    
    try {
      // Make API call to add procedure
      const newProcedure = await dentalChartService.addToothProcedure(
        currentClinic.id.toString(),
        patientId as string,
        toothNumber,
        procedureData
      );
      
      console.log("API call successful, new procedure:", newProcedure);
      
      // Fetch the updated dental chart instead of manually updating state
      await fetchDentalChart();
      
      toast.success("Procedure added successfully");
    } catch (error) {
      console.error("Error adding procedure:", error);
      toast.error("Failed to add procedure");
    }
  };
  
  const handleUpdateCondition = async (
    toothNumber: string | number,
    conditionId: number,
    updateData: {
      surface?: string;
      notes?: string;
      severity?: string;
    }
  ) => {
    if (!currentClinic?.id) return;
    
    try {
      await dentalChartService.updateToothCondition(
        currentClinic.id.toString(),
        patientId as string,
        toothNumber.toString(),
        conditionId,
        updateData
      );
      
      // Fetch updated dental chart instead of manually updating state
      await fetchDentalChart();
      
      toast.success("Condition updated successfully");
    } catch (error) {
      console.error("Error updating condition:", error);
      toast.error("Failed to update condition");
    }
  };
  
  const handleDeleteCondition = async (toothNumber: string | number, conditionId: number) => {
    if (!currentClinic?.id) return;
    
    try {
      await dentalChartService.deleteToothCondition(
        currentClinic.id.toString(),
        patientId as string,
        toothNumber.toString(),
        conditionId
      );
      
      // Fetch updated dental chart instead of manually updating state
      await fetchDentalChart();
      
      toast.success("Condition removed successfully");
    } catch (error) {
      console.error("Error deleting condition:", error);
      toast.error("Failed to remove condition");
    }
  };

  const fetchDentalChart = async () => {
    if (!currentClinic?.id || !patientId) return;
    
    setIsLoading(true);
    try {
      const data = await dentalChartService.getPatientDentalChart(
        currentClinic.id.toString(),
        patientId
      );
      console.log("Fetched dental chart:", data);
      setDentalChart(data);
    } catch (error) {
      console.error("Error fetching dental chart:", error);
      toast.error("Failed to load dental chart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProcedure = async (
    procedureId: number,
    updateData: {
      surface?: string;
      notes?: string;
      date_performed?: string;
      price?: number;
      status?: string;
    }
  ) => {
    if (!currentClinic?.id || !selectedTooth) return;
    
    try {
      await dentalChartService.updateToothProcedure(
        currentClinic.id.toString(),
        patientId as string,
        selectedTooth.number,
        procedureId,
        updateData
      );
      
      // Fetch updated dental chart
      await fetchDentalChart();
      
      toast.success("Procedure updated successfully");
    } catch (error) {
      console.error("Error updating procedure:", error);
      toast.error("Failed to update procedure");
    }
  };

  const handleDeleteProcedure = async (procedureId: number) => {
    if (!currentClinic?.id || !selectedTooth) return;
    
    try {
      await dentalChartService.deleteToothProcedure(
        currentClinic.id.toString(),
        patientId as string,
        selectedTooth.number,
        procedureId
      );
      
      // Fetch updated dental chart
      await fetchDentalChart();
      
      toast.success("Procedure deleted successfully");
    } catch (error) {
      console.error("Error deleting procedure:", error);
      toast.error("Failed to delete procedure");
    }
  };

  const handleAddProcedureNote = async (procedureId: number, noteData: {
    note: string;
    appointment_date: string;
  }) => {
    if (!currentClinic?.id || !selectedTooth) return;
    
    try {
      await dentalChartService.addProcedureNote(
        currentClinic.id.toString(),
        patientId as string,
        selectedTooth.number,
        procedureId,
        noteData
      );
      
      // Fetch updated dental chart
      await fetchDentalChart();
      
      toast.success("Note added successfully");
    } catch (error) {
      console.error("Error adding procedure note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleGeneralProcedureClick = () => {
    setShowGeneralProcedureDialog(true);
  };

  const handleAddGeneralProcedure = async (procedureData: {
    procedure_id: number;
    notes?: string;
    date_performed: string;
    price?: number;
    status: string;
  }) => {
    if (!currentClinic?.id) {
      toast.error("No clinic selected");
      return;
    }

    try {
      await dentalChartService.addGeneralProcedure(
        currentClinic.id.toString(),
        patientId as string,
        procedureData
      );
      
      // Refresh the dental chart
      await fetchDentalChart();
      toast.success("General procedure added successfully");
    } catch (error) {
      console.error("Error adding general procedure:", error);
      toast.error("Failed to add general procedure");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Dental Chart: {patientName}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/patients/${patientId}`}>
              Patient Profile
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/patients/${patientId}/treatments`}>
              Treatment History
          </Link>
        </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="chart">Dental Chart</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="history">Chart History</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading dental chart...</p>
            </div>
          ) : dentalChart ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
              <CardTitle>Dental Chart</CardTitle>
            </CardHeader>
                  <CardContent>
                    <DentalChartViewer 
                      teeth={[...(dentalChart.permanent_teeth || []), ...(dentalChart.primary_teeth || [])]} 
                      onToothSelect={handleToothSelect} 
                selectedTooth={selectedTooth}
                      onGeneralProcedureClick={handleGeneralProcedureClick}
                    />
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Separator className="my-4" />
                    <CondensedChartHistory patientId={patientId as string} />
                  </div>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                      <CardTitle>
                        {selectedTooth ? `Tooth ${selectedTooth.number}: ${selectedTooth.name}` : "Select a Tooth"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      {selectedTooth && (
                        <ToothDetailPanel
                          tooth={selectedTooth}
                          conditions={conditions}
                          procedures={procedures}
                          onAddCondition={(conditionData) => {
                            console.log("onAddCondition callback triggered with:", conditionData);
                            handleAddCondition(selectedTooth.number.toString(), conditionData);
                          }}
                          onUpdateCondition={(conditionId, updateData) => {
                            handleUpdateCondition(selectedTooth.number, conditionId, updateData);
                          }}
                          onDeleteCondition={(conditionId) => {
                            handleDeleteCondition(selectedTooth.number, conditionId);
                          }}
                          onAddProcedure={(procedureData) => {
                            handleAddProcedure(selectedTooth.number, procedureData);
                          }}
                          onUpdateProcedure={(procedureId, updateData) => {
                            handleUpdateProcedure(procedureId, updateData);
                          }}
                          onDeleteProcedure={(procedureId) => {
                            handleDeleteProcedure(procedureId);
                          }}
                          onAddProcedureNote={(procedureId, noteData) => {
                            handleAddProcedureNote(procedureId, noteData);
                          }}
                          clinicId={currentClinic?.id.toString()}
                          patientId={patientId as string}
                          onClose={() => setSelectedTooth(null)}
                        />
                      )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No dental chart found for this patient</p>
              <Button className="mt-4" onClick={() => router.refresh()}>
                Refresh
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="procedures">
          <Card>
            <CardHeader>
              <CardTitle>All Procedures</CardTitle>
            </CardHeader>
            <CardContent>
              {dentalChart ? (
                <ProceduresSummary patientId={patientId as string} dentalChart={dentalChart} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No procedures found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Chart History</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartHistoryViewer patientId={patientId as string} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GeneralProcedureDialog
        open={showGeneralProcedureDialog}
        onOpenChange={setShowGeneralProcedureDialog}
        procedures={procedures}
        onSubmit={handleAddGeneralProcedure}
      />
    </div>
  );
} 