"use client";

import { useState, useEffect } from "react";
import { dentalChartService, Tooth, DentalCondition, DentalProcedure, DentalChart } from "@/services/dental-chart.service";
import { EnhancedDentalChartViewer } from "./EnhancedDentalChartViewer";
import { ToothDetailPanel } from "./ToothDetailPanel";
import { dentalChartMultiSelectService } from "@/services/dental-chart-multi-select.service";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DentalChartPageTemplateProps {
  clinicId: string;
  patientId: string;
  backUrl?: string;
  title?: string;
}

export function DentalChartPageTemplate({
  clinicId,
  patientId,
  backUrl,
  title = "Dental Chart"
}: DentalChartPageTemplateProps) {
  const { currentClinic } = useAuth();
  const [dentalChart, setDentalChart] = useState<DentalChart | null>(null);
  const [conditions, setConditions] = useState<DentalCondition[]>([]);
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const fetchDentalChart = async () => {
    if (!clinicId || !patientId) return;
    
    setIsLoading(true);
    try {
      // Fetch dental chart
      const data = await dentalChartService.getPatientDentalChart(clinicId, patientId);
      setDentalChart(data);

      // Fetch conditions and procedures
      const conditionsData = await dentalChartService.getDentalConditions(clinicId);
      setConditions(conditionsData.results);
      
      const proceduresData = await dentalChartService.getDentalProcedures(clinicId);
      setProcedures(proceduresData.results);
    } catch (error) {
      console.error("Error fetching dental chart:", error);
      setErrorMessage("Failed to load dental chart");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDentalChart();
  }, [clinicId, patientId]);
  
  const handleToothSelect = (tooth: Tooth) => {
    setSelectedTooth(tooth);
  };
  
  // Handle single tooth condition addition
  const handleAddCondition = async (conditionData: any) => {
    if (!selectedTooth || !clinicId || !patientId) return;

    try {
      await dentalChartService.addToothCondition(
        clinicId,
        patientId,
        selectedTooth.number,
        {
          ...conditionData,
          dentition_type: selectedTooth.dentition_type
        }
      );
      
      setSuccessMessage("Condition added successfully!");
      await fetchDentalChart();
    } catch (error) {
      console.error("Error adding condition:", error);
      setErrorMessage("Failed to add condition");
    }
  };

  // Handle single tooth procedure addition
  const handleAddProcedure = async (procedureData: any) => {
    if (!selectedTooth || !clinicId || !patientId) return;

    try {
      await dentalChartService.addToothProcedure(
        clinicId,
        patientId,
        selectedTooth.number,
        procedureData
      );
      
      setSuccessMessage("Procedure added successfully!");
      await fetchDentalChart();
    } catch (error) {
      console.error("Error adding procedure:", error);
      setErrorMessage("Failed to add procedure");
    }
  };
  
  // Handle multi-select condition addition
  const handleAddConditionToMultiple = async (selectedTeeth: Tooth[], conditionData: any) => {
    if (!clinicId || !patientId) return;

    try {
      const result = await dentalChartMultiSelectService.addConditionToMultipleTeethWithProgress(
        clinicId,
        patientId,
        selectedTeeth,
        conditionData,
        (completed, total, currentTooth) => {
          console.log(`Progress: ${completed}/${total} - Processing tooth ${currentTooth.number}`);
        }
      );

      if (result.success.length > 0) {
        setSuccessMessage(`Successfully added condition to ${result.success.length} teeth`);
      }

      if (result.failed.length > 0) {
        setErrorMessage(`Failed to add condition to ${result.failed.length} teeth`);
      }

      await fetchDentalChart();
    } catch (error) {
      console.error("Error adding conditions to multiple teeth:", error);
      setErrorMessage("Failed to add conditions to teeth");
    }
  };

  // Handle multi-select procedure addition
  const handleAddProcedureToMultiple = async (selectedTeeth: Tooth[], procedureData: any) => {
    if (!clinicId || !patientId) return;

    try {
      const result = await dentalChartMultiSelectService.addProcedureToMultipleTeethWithProgress(
        clinicId,
        patientId,
        selectedTeeth,
        procedureData,
        (completed, total, currentTooth) => {
          console.log(`Progress: ${completed}/${total} - Processing tooth ${currentTooth.number}`);
        }
      );

      if (result.success.length > 0) {
        setSuccessMessage(`Successfully added procedure to ${result.success.length} teeth`);
      }

      if (result.failed.length > 0) {
        setErrorMessage(`Failed to add procedure to ${result.failed.length} teeth`);
      }

      await fetchDentalChart();
    } catch (error) {
      console.error("Error adding procedures to multiple teeth:", error);
      setErrorMessage("Failed to add procedures to teeth");
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dental chart...</div>
      </div>
    );
  }
  
  const allTeeth = [
    ...(dentalChart?.permanent_teeth || []),
    ...(dentalChart?.primary_teeth || [])
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {backUrl && (
          <Link href={backUrl}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-800">{successMessage}</p>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chart">Dental Chart</TabsTrigger>
          <TabsTrigger value="details">Tooth Details</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-6">
          {/* Enhanced Dental Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Dental Chart</CardTitle>
              <p className="text-sm text-gray-600">
                Select individual teeth or use multi-select mode to work with multiple teeth at once
              </p>
            </CardHeader>
            <CardContent>
              <EnhancedDentalChartViewer
                teeth={allTeeth}
                onToothSelect={handleToothSelect}
                selectedTooth={selectedTooth}
                conditions={conditions}
                procedures={procedures}
                onAddConditionToMultiple={handleAddConditionToMultiple}
                onAddProcedureToMultiple={handleAddProcedureToMultiple}
                onGeneralProcedureClick={() => {
                  console.log("Add general procedure clicked");
                  // You can implement general procedure functionality here
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Tooth Summary */}
          {selectedTooth && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Selected: {selectedTooth.name} (#{selectedTooth.number})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Conditions</h4>
                    {selectedTooth.conditions && selectedTooth.conditions.length > 0 ? (
                      <div className="space-y-1">
                        {selectedTooth.conditions.map((condition, index) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {condition.condition_name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No conditions recorded</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Procedures</h4>
                    {selectedTooth.procedures && selectedTooth.procedures.length > 0 ? (
                      <div className="space-y-1">
                        {selectedTooth.procedures.map((procedure, index) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {procedure.procedure_name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No procedures recorded</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details">
          {selectedTooth ? (
            <ToothDetailPanel
              tooth={selectedTooth}
              conditions={conditions as any}
              procedures={procedures as any}
              onAddCondition={handleAddCondition}
              onAddProcedure={handleAddProcedure}
              onUpdateCondition={async (conditionId, updateData) => {
                console.log("Update condition:", conditionId, updateData);
                // Implement update condition logic here
              }}
              onDeleteCondition={async (conditionId) => {
                console.log("Delete condition:", conditionId);
                // Implement delete condition logic here
              }}
              onUpdateProcedure={async (procedureId, updateData) => {
                console.log("Update procedure:", procedureId, updateData);
                // Implement update procedure logic here
              }}
              onDeleteProcedure={async (procedureId) => {
                console.log("Delete procedure:", procedureId);
                // Implement delete procedure logic here
              }}
              clinicId={clinicId}
              patientId={patientId}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Select a tooth from the chart to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 