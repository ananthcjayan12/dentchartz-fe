"use client";

import { useState, useEffect } from "react";
import { dentalChartService, ToothProcedure } from "@/services/dental-chart.service";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProceduresSummaryProps {
  patientId: string;
  dentalChart: any;
}

interface GroupedProcedures {
  [key: string]: any[];
}

export function ProceduresSummary({ patientId, dentalChart }: ProceduresSummaryProps) {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [groupedProcedures, setGroupedProcedures] = useState<GroupedProcedures>({});
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    if (!dentalChart) return;
    
    // Extract all procedures from all teeth
    const allProcedures: any[] = [];
    
    // Add procedures from permanent teeth
    if (dentalChart.permanent_teeth) {
      dentalChart.permanent_teeth.forEach((tooth: any) => {
        if (tooth.procedures && tooth.procedures.length > 0) {
          tooth.procedures.forEach((proc: any) => {
            allProcedures.push({
              ...proc,
              tooth_number: tooth.number,
              tooth_name: tooth.name
            });
          });
        }
      });
    }
    
    // Add procedures from primary teeth
    if (dentalChart.primary_teeth) {
      dentalChart.primary_teeth.forEach((tooth: any) => {
        if (tooth.procedures && tooth.procedures.length > 0) {
          tooth.procedures.forEach((proc: any) => {
            allProcedures.push({
              ...proc,
              tooth_number: tooth.number,
              tooth_name: tooth.name
            });
          });
        }
      });
    }
    
    // Sort by date (newest first)
    allProcedures.sort((a, b) => 
      new Date(b.date_performed).getTime() - new Date(a.date_performed).getTime()
    );
    
    setProcedures(allProcedures);
    
    // Group procedures by procedure_name
    const grouped: GroupedProcedures = {};
    allProcedures.forEach(proc => {
      const key = proc.procedure_name;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(proc);
    });
    
    setGroupedProcedures(grouped);
    
    // Initialize all groups as expanded
    const initialExpandedState: {[key: string]: boolean} = {};
    Object.keys(grouped).forEach(key => {
      initialExpandedState[key] = true;
    });
    setExpandedGroups(initialExpandedState);
  }, [dentalChart]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "planned":
        return <Badge className="bg-yellow-100 text-yellow-800">Planned</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };
  
  const toggleGroup = (procedureName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [procedureName]: !prev[procedureName]
    }));
  };
  
  if (!procedures.length) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No procedures recorded</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {Object.entries(groupedProcedures).map(([procedureName, procedureList]) => (
        <Card key={procedureName} className="overflow-hidden">
          <CardContent className="p-0">
            <Collapsible 
              open={expandedGroups[procedureName]} 
              onOpenChange={() => toggleGroup(procedureName)}
            >
              <CollapsibleTrigger className="flex justify-between items-center w-full p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <h3 className="font-medium">{procedureName}</h3>
                  <Badge className="ml-2 bg-gray-100 text-gray-800">
                    {procedureList.length}
                  </Badge>
                </div>
                {expandedGroups[procedureName] ? 
                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y divide-gray-100">
                  {procedureList.map((procedure) => (
                    <div key={procedure.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-700">
                            Tooth #{procedure.tooth_number} ({procedure.tooth_name})
                          </p>
                          <p className="text-sm text-gray-500">
                            Surface: {procedure.surface || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="mb-1">{getStatusBadge(procedure.status)}</div>
                          <p className="text-sm font-medium">
                            ${typeof procedure.price === 'number' 
                              ? procedure.price.toFixed(2) 
                              : typeof procedure.price === 'string' 
                                ? parseFloat(procedure.price).toFixed(2) 
                                : '0.00'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(parseISO(procedure.date_performed), "MMM d, yyyy")}
                        </span>
                        <span className="text-gray-500">
                          {procedure.performed_by}
                        </span>
                      </div>
                      
                      {/* Procedure Notes Section */}
                      {procedure.progress_notes && procedure.progress_notes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-2">Progress Notes:</p>
                          <div className="space-y-2">
                            {procedure.progress_notes.map((note: any) => (
                              <div key={note.id} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm">{note.note}</p>
                                  <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                    {format(parseISO(note.appointment_date), "MMM d, yyyy")}
                                  </div>
                                </div>
                                {note.created_by && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    By: {note.created_by}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 