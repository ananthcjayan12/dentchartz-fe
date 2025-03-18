"use client";

import { useState, useEffect } from "react";
import { dentalChartService, ChartHistoryEntry } from "@/services/dental-chart.service";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Plus, Minus, Edit, AlertCircle } from "lucide-react";

interface CondensedChartHistoryProps {
  patientId: string;
  toothNumber?: string;
  limit?: number;
}

export function CondensedChartHistory({ patientId, toothNumber, limit = 5 }: CondensedChartHistoryProps) {
  const { currentClinic } = useAuth();
  const [history, setHistory] = useState<ChartHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentClinic?.id) {
        return;
      }
      
      setIsLoading(true);
      try {
        // Set default filters to show recent activity (last 30 days)
        const filters = {
          tooth_number: toothNumber || '',
          start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd')
        };
        
        const historyData = await dentalChartService.getChartHistory(
          currentClinic.id.toString(),
          patientId,
          filters
        );
        
        // Limit the number of entries shown
        setHistory(historyData.results.slice(0, limit));
      } catch (error) {
        console.error("Error fetching chart history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [currentClinic?.id, patientId, toothNumber, limit]);
  
  // Helper function to get icon for action
  const getActionIcon = (action: string) => {
    switch (action) {
      case "add_condition": return <Plus className="h-3 w-3" />;
      case "add_procedure": return <Plus className="h-3 w-3" />;
      case "update_condition": return <Edit className="h-3 w-3" />;
      case "update_procedure": return <Edit className="h-3 w-3" />;
      case "remove_condition": return <Minus className="h-3 w-3" />;
      case "remove_procedure": return <Minus className="h-3 w-3" />;
      case "add_procedure_note": return <Calendar className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };
  
  if (isLoading) {
    return <div className="text-sm text-gray-500 py-2">Loading recent activity...</div>;
  }
  
  if (history.length === 0) {
    return <div className="text-sm text-gray-500 py-2">No recent activity</div>;
  }
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
      {history.map((entry) => (
        <div key={entry.id} className="flex items-center text-sm py-1 border-b border-gray-100">
          <div className="flex-shrink-0 mr-2">
            {getActionIcon(entry.action)}
          </div>
          <div className="flex-grow">
            <span className="font-medium">
              {entry.action.replace(/_/g, " ")}
            </span>
            {entry.tooth_number && (
              <span className="ml-1">
                on Tooth #{entry.tooth_number}
              </span>
            )}
          </div>
          <div className="flex-shrink-0 text-xs text-gray-500">
            {format(parseISO(entry.date), "MMM d")}
          </div>
        </div>
      ))}
    </div>
  );
} 