"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { dentalChartService, DentalChart, DentalCondition, DentalProcedure, Tooth } from "@/services/dental-chart.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, History, Users, FileText, Activity, BookOpen } from "lucide-react";

import { EnhancedDentalChartViewer } from "./EnhancedDentalChartViewer";
import { ToothDetailPanel } from "./ToothDetailPanel";
import { PatientHistoryBook } from "./PatientHistoryBook";
import { ProceduresSummary } from "./ProceduresSummary";
import { GeneralProceduresPanel } from "./GeneralProceduresPanel";
import { dentalChartMultiSelectService } from "@/services/dental-chart-multi-select.service";

interface EnhancedDentalChartPageTemplateProps {
  patientId: string;
  patientName?: string;
  defaultTab?: string;
}

export function EnhancedDentalChartPageTemplate({ 
  patientId, 
  patientName,
  defaultTab = "chart"
}: EnhancedDentalChartPageTemplateProps) {
  const { currentClinic } = useAuth();
  const [dentalChart, setDentalChart] = useState<DentalChart | null>(null);
  const [conditions, setConditions] = useState<DentalCondition[]>([]);
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<Tooth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showGeneralProcedures, setShowGeneralProcedures] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (currentClinic?.id) {
      loadDentalChart();
      loadConditions();
      loadProcedures();
    }
  }, [currentClinic?.id, patientId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadDentalChart = async () => {
    if (!currentClinic?.id) return;

    try {
      const chart = await dentalChartService.getPatientDentalChart(
        currentClinic.id.toString(),
        patientId
      );
      setDentalChart(chart);
    } catch (error) {
      console.error("Error loading dental chart:", error);
      toast.error("Failed to load dental chart");
    } finally {
      setIsLoading(false);
    }
  };

  const loadConditions = async () => {
    if (!currentClinic?.id) return;

    try {
      const response = await dentalChartService.getDentalConditions(
        currentClinic.id.toString()
      );
      setConditions(response.results);
    } catch (error) {
      console.error("Error loading conditions:", error);
    }
  };

  const loadProcedures = async () => {
    if (!currentClinic?.id) return;

    try {
      const response = await dentalChartService.getDentalProcedures(
        currentClinic.id.toString()
      );
      setProcedures(response.results);
    } catch (error) {
      console.error("Error loading procedures:", error);
    }
  };

  const handleToothSelect = (tooth: Tooth) => {
    const updatedTooth = findToothInChart(tooth.number);
    setSelectedTooth(updatedTooth || tooth);
  };

  const findToothInChart = (toothNumber: string): Tooth | null => {
    if (!dentalChart) return null;
    
    const allTeeth = [...dentalChart.permanent_teeth, ...dentalChart.primary_teeth];
    return allTeeth.find(tooth => tooth.number === toothNumber) || null;
  };

  const handleAddConditionToMultiple = async (selectedTeeth: Tooth[], conditionData: any) => {
    if (!currentClinic?.id) return;

    try {
      setSuccessMessage("Adding condition to selected teeth...");
      
      const results = await dentalChartMultiSelectService.addConditionToMultipleTeeth(
        currentClinic.id.toString(),
        patientId,
        selectedTeeth,
        conditionData
      );

      const successCount = results.success.length;
      const failureCount = results.failed.length;

      if (successCount > 0) {
        setSuccessMessage(`Successfully added condition to ${successCount} ${successCount === 1 ? 'tooth' : 'teeth'}`);
        await loadDentalChart();
      }

      if (failureCount > 0) {
        setErrorMessage(`Failed to add condition to ${failureCount} ${failureCount === 1 ? 'tooth' : 'teeth'}`);
      }
    } catch (error) {
      console.error("Error adding condition to multiple teeth:", error);
      setErrorMessage("Failed to add condition to selected teeth");
    }
  };

  const handleAddProcedureToMultiple = async (selectedTeeth: Tooth[], procedureData: any) => {
    if (!currentClinic?.id) return;

    try {
      setSuccessMessage("Adding procedure to selected teeth...");
      
      const results = await dentalChartMultiSelectService.addProcedureToMultipleTeeth(
        currentClinic.id.toString(),
        patientId,
        selectedTeeth,
        procedureData
      );

      const successCount = results.success.length;
      const failureCount = results.failed.length;

      if (successCount > 0) {
        setSuccessMessage(`Successfully added procedure to ${successCount} ${successCount === 1 ? 'tooth' : 'teeth'}`);
        await loadDentalChart();
      }

      if (failureCount > 0) {
        setErrorMessage(`Failed to add procedure to ${failureCount} ${failureCount === 1 ? 'tooth' : 'teeth'}`);
      }
    } catch (error) {
      console.error("Error adding procedure to multiple teeth:", error);
      setErrorMessage("Failed to add procedure to selected teeth");
    }
  };

  const handleDataUpdate = async () => {
    await loadDentalChart();
    if (selectedTooth) {
      const updatedTooth = findToothInChart(selectedTooth.number);
      setSelectedTooth(updatedTooth);
    }
  };

  const handleSelectedTeethChange = (teeth: Tooth[]) => {
    setSelectedTeeth(teeth);
  };

  const handleAddCondition = async (conditionData: any) => {
    if (!currentClinic?.id || !selectedTooth) return;

    try {
      await dentalChartService.addToothCondition(
        currentClinic.id.toString(),
        patientId,
        selectedTooth.number.toString(),
        conditionData
      );
      toast.success("Condition added successfully");
      await handleDataUpdate();
    } catch (error) {
      console.error("Error adding condition:", error);
      toast.error("Failed to add condition");
    }
  };

  const handleUpdateCondition = async (conditionId: number, updateData: any) => {
    if (!currentClinic?.id || !selectedTooth) return;

    try {
      await dentalChartService.updateToothCondition(
        currentClinic.id.toString(),
        patientId,
        parseInt(selectedTooth.number),
        conditionId,
        updateData
      );
      toast.success("Condition updated successfully");
      await handleDataUpdate();
    } catch (error) {
      console.error("Error updating condition:", error);
      toast.error("Failed to update condition");
    }
  };

  const handleDeleteCondition = async (conditionId: number) => {
    if (!currentClinic?.id || !selectedTooth) return;

    try {
      await dentalChartService.deleteToothCondition(
        currentClinic.id.toString(),
        patientId,
        parseInt(selectedTooth.number),
        conditionId
      );
      toast.success("Condition deleted successfully");
      await handleDataUpdate();
    } catch (error) {
      console.error("Error deleting condition:", error);
      toast.error("Failed to delete condition");
    }
  };

  const handleAddProcedure = async (procedureData: any) => {
    if (!currentClinic?.id || !selectedTooth) return;

    try {
      await dentalChartService.addToothProcedure(
        currentClinic.id.toString(),
        patientId,
        selectedTooth.number.toString(),
        procedureData
      );
      toast.success("Procedure added successfully");
      await handleDataUpdate();
    } catch (error) {
      console.error("Error adding procedure:", error);
      toast.error("Failed to add procedure");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dental chart...</span>
        </div>
      </div>
    );
  }

  const currentTeeth = dentalChart?.permanent_teeth || [];
  const primaryTeeth = dentalChart?.primary_teeth || [];

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-800 font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {patientName ? `${patientName}'s Dental Chart` : 'Dental Chart'}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Enhanced multi-select dental chart with comprehensive patient history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">
                Multi-Select Enabled
              </Badge>
              {dentalChart?.last_updated && (
                <Badge variant="outline">
                  Updated {new Date(dentalChart.last_updated).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chart" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Dental Chart
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Patient History
          </TabsTrigger>
          <TabsTrigger value="procedures" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Procedures
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            General Procedures
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Interactive Dental Chart
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    <p>• <strong>Left-click</strong> teeth to select/deselect</p>
                    <p>• <strong>Right-click</strong> for bulk operations</p>
                    <p>• <strong>Ctrl+Click</strong> for advanced multi-select</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <EnhancedDentalChartViewer
                    teeth={[...currentTeeth, ...primaryTeeth]}
                    onToothSelect={handleToothSelect}
                    selectedTooth={selectedTooth}
                    showPrimary={false}
                    conditions={conditions}
                    procedures={procedures}
                    onAddConditionToMultiple={handleAddConditionToMultiple}
                    onAddProcedureToMultiple={handleAddProcedureToMultiple}
                    onGeneralProcedureClick={() => setShowGeneralProcedures(true)}
                    onSelectedTeethChange={handleSelectedTeethChange}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              {selectedTooth ? (
                <ToothDetailPanel
                  tooth={selectedTooth}
                  conditions={conditions as any}
                  procedures={procedures as any}
                  onAddCondition={handleAddCondition}
                  onAddProcedure={handleAddProcedure}
                  onUpdateCondition={handleUpdateCondition}
                  onDeleteCondition={handleDeleteCondition}
                  clinicId={currentClinic?.id.toString()}
                  patientId={patientId}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">Select a tooth to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PatientHistoryBook
            patientId={patientId}
            patientName={patientName}
            selectedTeethNumbers={selectedTeeth.map(tooth => tooth.number)}
          />
        </TabsContent>

        <TabsContent value="procedures" className="space-y-6">
          <ProceduresSummary
            patientId={patientId}
            dentalChart={dentalChart}
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <GeneralProceduresPanel
            patientId={patientId}
            onAddGeneralProcedure={() => setShowGeneralProcedures(true)}
            onRefresh={handleDataUpdate}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total Teeth</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {currentTeeth.length + primaryTeeth.length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Active Conditions</p>
                  <p className="text-2xl font-bold text-red-700">
                    {[...currentTeeth, ...primaryTeeth].reduce((count, tooth) => 
                      count + (tooth.conditions?.length || 0), 0)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Completed Procedures</p>
                  <p className="text-2xl font-bold text-green-700">
                    {[...currentTeeth, ...primaryTeeth].reduce((count, tooth) => 
                      count + (tooth.procedures?.filter(p => p.status === 'completed').length || 0), 0)}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600">Planned Procedures</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {[...currentTeeth, ...primaryTeeth].reduce((count, tooth) => 
                      count + (tooth.procedures?.filter(p => p.status === 'planned').length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* General Procedures Panel */}
      {showGeneralProcedures && (
        <GeneralProceduresPanel
          patientId={patientId}
          onAddGeneralProcedure={() => setShowGeneralProcedures(true)}
          onRefresh={handleDataUpdate}
        />
      )}
    </div>
  );
} 