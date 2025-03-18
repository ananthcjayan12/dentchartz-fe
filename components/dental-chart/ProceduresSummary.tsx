"use client";

import { useState, useEffect } from "react";
import { dentalChartService, ToothProcedure } from "@/services/dental-chart.service";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, AlertCircle } from "lucide-react";

interface ProceduresSummaryProps {
  patientId: string;
  dentalChart: any;
}

export function ProceduresSummary({ patientId, dentalChart }: ProceduresSummaryProps) {
  const [procedures, setProcedures] = useState<any[]>([]);
  
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
      {procedures.map((procedure) => (
        <Card key={procedure.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{procedure.procedure_name}</h4>
                <p className="text-sm text-gray-500">
                  Tooth #{procedure.tooth_number} ({procedure.tooth_name})
                </p>
                <p className="text-sm text-gray-500">
                  Surface: {procedure.surface}
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
              <span className="text-gray-500">
                {format(parseISO(procedure.date_performed), "MMM d, yyyy")}
              </span>
              <span className="text-gray-500">
                {procedure.performed_by}
              </span>
            </div>
            
            {procedure.notes && procedure.notes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Progress Notes:</p>
                {procedure.notes.slice(0, 2).map((note: any) => (
                  <div key={note.id} className="bg-gray-50 p-2 rounded text-sm mb-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs">{note.note}</p>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(note.appointment_date), "MMM d")}
                      </div>
                    </div>
                  </div>
                ))}
                {procedure.notes.length > 2 && (
                  <p className="text-xs text-gray-500 text-right">
                    +{procedure.notes.length - 2} more notes
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 