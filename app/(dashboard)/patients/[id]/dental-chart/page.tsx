"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { patientService, Patient } from "@/services/patient.service";
import dentalChartService, { 
  DentalChart, 
  ToothData, 
  ToothCondition, 
  ToothProcedure,
  ChartHistoryEntry
} from "@/services/dentalChart.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToothGrid } from "@/components/dental-chart/ToothGrid";
import { ArrowLeft, Save, Plus, History, Check, X } from "lucide-react";
import { ToothIcon } from "@/components/icons/ToothIcon";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PatientDentalChartPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [chart, setChart] = useState<DentalChart | null>(null);
  const [conditions, setConditions] = useState<ToothCondition[]>([]);
  const [procedures, setProcedures] = useState<ToothProcedure[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [procedureNotes, setProcedureNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<ChartHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("chart");
  const [isPediatric, setIsPediatric] = useState(false);
  const [procedureStatus, setProcedureStatus] = useState<string>("planned");

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [patientData, chartData, conditionsData, proceduresData] = await Promise.all([
        patientService.getPatient(params.id),
        dentalChartService.getPatientChart(params.id),
        dentalChartService.getConditions(),
        dentalChartService.getProcedures()
      ]);
      
      setPatient(patientData);
      setChart(chartData);
      setConditions(conditionsData);
      setProcedures(proceduresData);
      setNotes(chartData.notes || "");
      
      // Fetch history
      const historyData = await dentalChartService.getChartHistory(chartData.id);
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching dental chart data:", error);
      toast.error("Failed to load dental chart");
      router.push(`/patients/${params.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToothClick = (tooth: ToothData) => {
    setSelectedTooth(tooth);
    setProcedureNotes(""); // Reset procedure notes when selecting a new tooth
    setSelectedProcedure(null); // Reset selected procedure
  };

  const handleConditionClick = async (conditionId: string) => {
    if (!chart || !selectedTooth) return;
    
    try {
      // Toggle condition on the selected tooth
      const hasCondition = selectedTooth.conditions.includes(conditionId);
      const updatedChart = await dentalChartService.updateToothCondition(
        chart.id,
        selectedTooth.number,
        conditionId,
        !hasCondition,
        `${hasCondition ? 'Removed' : 'Added'} condition to tooth ${selectedTooth.number}`
      );
      
      setChart(updatedChart);
      
      // Update selected tooth
      const updatedTooth = updatedChart.teeth.find(t => t.number === selectedTooth.number);
      if (updatedTooth) {
        setSelectedTooth(updatedTooth);
      }
      
      // Refresh history
      const historyData = await dentalChartService.getChartHistory(chart.id);
      setHistory(historyData);
      
      toast.success(`Condition ${hasCondition ? 'removed from' : 'added to'} tooth ${selectedTooth.number}`);
    } catch (error) {
      console.error("Error updating tooth condition:", error);
      toast.error("Failed to update tooth condition");
    }
  };

  const handleAddProcedure = async (procedureId: string) => {
    if (!chart || !selectedTooth) return;
    
    // Set the selected procedure for the form
    setSelectedProcedure(procedureId);
  };

  const handleSaveProcedure = async () => {
    if (!chart || !selectedTooth || !selectedProcedure) return;
    
    try {
      setIsSaving(true);
      
      // Add procedure to the selected tooth
      const updatedChart = await dentalChartService.addToothProcedure(
        chart.id,
        selectedTooth.number,
        selectedProcedure,
        procedureNotes,
        procedureStatus
      );
      
      setChart(updatedChart);
      
      // Update selected tooth
      const updatedTooth = updatedChart.teeth.find(t => t.number === selectedTooth.number);
      if (updatedTooth) {
        setSelectedTooth(updatedTooth);
      }
      
      // Refresh history
      const historyData = await dentalChartService.getChartHistory(chart.id);
      setHistory(historyData);
      
      // Reset form
      setSelectedProcedure(null);
      setProcedureNotes("");
      setProcedureStatus("planned");
      
      toast.success(`Procedure added to tooth ${selectedTooth.number}`);
    } catch (error) {
      console.error("Error adding procedure:", error);
      toast.error("Failed to add procedure");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!chart) return;
    
    try {
      setIsSaving(true);
      const updatedChart = await dentalChartService.updateChartNotes(chart.id, notes);
      setChart(updatedChart);
      toast.success("Chart notes saved successfully");
    } catch (error) {
      console.error("Error saving chart notes:", error);
      toast.error("Failed to save chart notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePediatricChange = (checked: boolean) => {
    setIsPediatric(checked);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!patient || !chart) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Patient or dental chart not found</p>
        <Button variant="link" asChild>
          <Link href={`/patients/${params.id}`}>Back to patient</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/patients/${patient.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Dental Chart</h1>
          <p className="text-sm text-gray-500 mt-1">
            {patient.first_name} {patient.last_name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle>Dental Chart</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ToothGrid 
                teeth={chart.teeth} 
                conditions={conditions}
                procedures={procedures}
                onToothClick={handleToothClick}
                selectedTooth={selectedTooth}
                isPediatric={isPediatric}
                onPediatricChange={handlePediatricChange}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Tooth</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTooth ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">
                          Tooth {selectedTooth.number} ({selectedTooth.type})
                        </h2>
                      </div>

                      {selectedProcedure ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Add Procedure Notes</h3>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="procedure-notes">Notes</Label>
                                <Textarea
                                  id="procedure-notes"
                                  value={procedureNotes}
                                  onChange={(e) => setProcedureNotes(e.target.value)}
                                  placeholder="Enter notes about this procedure..."
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label htmlFor="procedure-status">Status</Label>
                                <Select 
                                  value={procedureStatus} 
                                  onValueChange={setProcedureStatus}
                                >
                                  <SelectTrigger id="procedure-status" className="w-full">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedProcedure(null)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={handleSaveProcedure}
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-b-transparent rounded-full mr-2"></div>
                                  ) : (
                                    <Check className="h-4 w-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Conditions</h3>
                            <div className="flex flex-wrap gap-2">
                              {conditions.map(condition => (
                                <Button
                                  key={condition.id}
                                  size="sm"
                                  variant={selectedTooth.conditions.includes(condition.id) ? "default" : "outline"}
                                  className="text-xs"
                                  style={{ 
                                    borderColor: condition.color,
                                    backgroundColor: selectedTooth.conditions.includes(condition.id) ? condition.color : 'transparent',
                                    color: selectedTooth.conditions.includes(condition.id) ? 'white' : 'inherit'
                                  }}
                                  onClick={() => handleConditionClick(condition.id)}
                                >
                                  <div 
                                    className="w-3 h-3 mr-1 rounded-full" 
                                    style={{ backgroundColor: condition.color }}
                                  ></div>
                                  {condition.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Procedures</h3>
                            <div className="flex flex-wrap gap-2">
                              {procedures.map(procedure => (
                                <Button
                                  key={procedure.id}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  style={{ borderColor: procedure.color }}
                                  onClick={() => handleAddProcedure(procedure.id)}
                                >
                                  <div 
                                    className="w-3 h-3 mr-1 rounded-full" 
                                    style={{ backgroundColor: procedure.color }}
                                  ></div>
                                  {procedure.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-6">
                      Click on a tooth in the chart to select it
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Chart Notes</span>
                    <Button size="sm" onClick={handleSaveNotes} disabled={isSaving}>
                      {isSaving ? (
                        <div className="animate-spin h-4 w-4 border-2 border-b-transparent rounded-full mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes about the patient's dental chart..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Treatment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-6">
                  {history.map(entry => (
                    <div key={entry.id} className="border-b pb-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium flex items-center">
                            <ToothIcon className="h-4 w-4 mr-2" />
                            Tooth {entry.tooth_number}: {entry.procedure_name}
                          </h3>
                          {entry.condition_name && (
                            <p className="text-sm text-gray-500 mt-1">
                              Condition: {entry.condition_name}
                            </p>
                          )}
                          {entry.status && (
                            <p className="text-sm mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                entry.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                entry.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                entry.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {entry.status === 'in_progress' ? 'In Progress' : 
                                 entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {entry.created_by_name}
                          </p>
                        </div>
                      </div>
                      {entry.notes && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-md">
                          <p className="text-sm">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">
                  No treatment history available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 