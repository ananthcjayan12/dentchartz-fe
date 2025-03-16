"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function PatientDentalChartPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentClinic } = useAuth();
  const patientId = params.id;
  
  const [dentalChart, setDentalChart] = useState<DentalChart | null>(null);
  const [conditions, setConditions] = useState<DentalCondition[]>([]);
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [activeTab, setActiveTab] = useState("chart");
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");

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
    toothNumber: number,
    conditionData: {
      condition_id: number;
      surface: string;
      notes?: string;
      severity?: string;
    }
  ) => {
    if (!currentClinic?.id) return;
    
    try {
      const newCondition = await dentalChartService.addToothCondition(
        currentClinic.id.toString(),
        patientId,
        toothNumber,
        conditionData
      );
      
      // Update the dental chart with the new condition
      if (dentalChart) {
        const updatedTeeth = dentalChart.teeth.map(tooth => {
          if (tooth.number === toothNumber) {
            return {
              ...tooth,
              conditions: [...tooth.conditions, newCondition]
            };
          }
          return tooth;
        });
        
        setDentalChart({
          ...dentalChart,
          teeth: updatedTeeth
        });
      }
      
      toast.success("Condition added successfully");
    } catch (error) {
      console.error("Error adding condition:", error);
      toast.error("Failed to add condition");
    }
  };
  
  const handleAddProcedure = async (
    toothNumber: number,
    procedureData: {
      procedure_id: number;
      surface: string;
      notes?: string;
      date_performed: string;
      price?: number;
      status: string;
    }
  ) => {
    if (!currentClinic?.id) return;
    
    try {
      const newProcedure = await dentalChartService.addToothProcedure(
        currentClinic.id.toString(),
        patientId,
        toothNumber,
        procedureData
      );
      
      // Update the dental chart with the new procedure
      if (dentalChart) {
        const updatedTeeth = dentalChart.teeth.map(tooth => {
          if (tooth.number === toothNumber) {
            return {
              ...tooth,
              procedures: [...tooth.procedures, newProcedure]
            };
          }
          return tooth;
        });
        
        setDentalChart({
          ...dentalChart,
          teeth: updatedTeeth
        });
      }
      
      toast.success("Procedure added successfully");
    } catch (error) {
      console.error("Error adding procedure:", error);
      toast.error("Failed to add procedure");
    }
  };
  
  const handleUpdateCondition = async (
    toothNumber: number,
    conditionId: number,
    updateData: {
      surface?: string;
      notes?: string;
      severity?: string;
    }
  ) => {
    if (!currentClinic?.id) return;
    
    try {
      const updatedCondition = await dentalChartService.updateToothCondition(
        currentClinic.id.toString(),
        patientId,
        toothNumber,
        conditionId,
        updateData
      );
      
      // Update the dental chart with the updated condition
      if (dentalChart) {
        const updatedTeeth = dentalChart.teeth.map(tooth => {
          if (tooth.number === toothNumber) {
            const updatedConditions = tooth.conditions.map(condition => {
              if (condition.id === conditionId) {
                return updatedCondition;
              }
              return condition;
            });
            
            return {
              ...tooth,
              conditions: updatedConditions
            };
          }
          return tooth;
        });
        
        setDentalChart({
          ...dentalChart,
          teeth: updatedTeeth
        });
      }
      
      toast.success("Condition updated successfully");
    } catch (error) {
      console.error("Error updating condition:", error);
      toast.error("Failed to update condition");
    }
  };
  
  const handleDeleteCondition = async (toothNumber: number, conditionId: number) => {
    if (!currentClinic?.id) return;
    
    try {
      await dentalChartService.deleteToothCondition(
        currentClinic.id.toString(),
        patientId,
        toothNumber,
        conditionId
      );
      
      // Update the dental chart by removing the deleted condition
      if (dentalChart) {
        const updatedTeeth = dentalChart.teeth.map(tooth => {
          if (tooth.number === toothNumber) {
            return {
              ...tooth,
              conditions: tooth.conditions.filter(condition => condition.id !== conditionId)
            };
          }
          return tooth;
        });
        
        setDentalChart({
          ...dentalChart,
          teeth: updatedTeeth
        });
      }
      
      toast.success("Condition removed successfully");
    } catch (error) {
      console.error("Error deleting condition:", error);
      toast.error("Failed to remove condition");
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
                      teeth={dentalChart.teeth} 
                      onToothSelect={handleToothSelect} 
                selectedTooth={selectedTooth}
                    />
                </CardContent>
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
                    {selectedTooth ? (
                      <ToothDetailPanel 
                        tooth={selectedTooth}
                        conditions={conditions}
                        procedures={procedures}
                        onAddCondition={(data) => handleAddCondition(selectedTooth.number, data)}
                        onAddProcedure={(data) => handleAddProcedure(selectedTooth.number, data)}
                        onUpdateCondition={(conditionId, data) => 
                          handleUpdateCondition(selectedTooth.number, conditionId, data)
                        }
                        onDeleteCondition={(conditionId) => 
                          handleDeleteCondition(selectedTooth.number, conditionId)
                        }
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Select a tooth to view details</p>
                      </div>
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

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Chart History</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartHistoryViewer patientId={patientId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 