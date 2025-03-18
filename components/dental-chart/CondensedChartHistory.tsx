"use client";

import { useState, useEffect } from "react";
import { dentalChartService, ChartHistoryEntry } from "@/services/dental-chart.service";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, subDays, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Plus, Minus, Edit, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CondensedChartHistoryProps {
  patientId: string;
  toothNumber?: string;
  limit?: number;
}

interface HistoryDetails {
  procedure_name?: string;
  surface?: string;
  status?: string;
  price?: number | string;
  condition_name?: string;
  severity?: string;
  description?: string;
}

interface EnhancedChartHistoryEntry extends ChartHistoryEntry {
  details?: HistoryDetails;
}

interface GroupedHistory {
  [key: string]: EnhancedChartHistoryEntry[];
}

export function CondensedChartHistory({ patientId, toothNumber, limit = 5 }: CondensedChartHistoryProps) {
  const { currentClinic } = useAuth();
  const [history, setHistory] = useState<ChartHistoryEntry[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({});
  const [expandedDays, setExpandedDays] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentClinic?.id) return;
      
      setIsLoading(true);
      try {
        const filters = {
          tooth_number: toothNumber || '',
          start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd')
        };
        
        const historyData = await dentalChartService.getChartHistory(
          currentClinic.id.toString(),
          patientId,
          filters
        );
        
        const limitedHistory = historyData.results.slice(0, limit);
        setHistory(limitedHistory);
        
        // Group history by date
        const grouped: GroupedHistory = {};
        limitedHistory.forEach(entry => {
          const dateKey = format(parseISO(entry.date), 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(entry);
        });
        
        setGroupedHistory(grouped);
        
        // Initialize all days as expanded
        const initialExpandedState: {[key: string]: boolean} = {};
        Object.keys(grouped).forEach(key => {
          initialExpandedState[key] = true;
        });
        setExpandedDays(initialExpandedState);
        
      } catch (error) {
        console.error("Error fetching chart history:", error);
        toast.error("Failed to load chart history");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [currentClinic?.id, patientId, toothNumber, limit]);
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case "add_condition":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "add_procedure":
        return <Plus className="h-4 w-4 text-blue-500" />;
      case "update_condition":
        return <Edit className="h-4 w-4 text-amber-500" />;
      case "update_procedure":
        return <Edit className="h-4 w-4 text-amber-500" />;
      case "remove_condition":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "remove_procedure":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "add_procedure_note":
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getActionBadge = (action: string) => {
    switch (action) {
      case "add_condition":
        return <Badge className="bg-green-100 text-green-800">Added Condition</Badge>;
      case "add_procedure":
        return <Badge className="bg-blue-100 text-blue-800">Added Procedure</Badge>;
      case "update_condition":
        return <Badge className="bg-amber-100 text-amber-800">Updated Condition</Badge>;
      case "update_procedure":
        return <Badge className="bg-amber-100 text-amber-800">Updated Procedure</Badge>;
      case "remove_condition":
        return <Badge className="bg-red-100 text-red-800">Removed Condition</Badge>;
      case "remove_procedure":
        return <Badge className="bg-red-100 text-red-800">Removed Procedure</Badge>;
      case "add_procedure_note":
        return <Badge className="bg-purple-100 text-purple-800">Added Note</Badge>;
      default:
        return <Badge variant="outline">{action.replace(/_/g, " ")}</Badge>;
    }
  };
  
  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };
  
  const formatDetails = (entry: EnhancedChartHistoryEntry) => {
    if (!entry.details) return null;
    
    const details = entry.details;
    
    switch (entry.action) {
      case "add_procedure":
      case "update_procedure":
        return (
          <>
            <p className="text-sm text-gray-600">
              {details.procedure_name}
              {details.surface && ` (Surface: ${details.surface})`}
            </p>
            {details.status && (
              <p className="text-sm text-gray-500">
                Status: {details.status}
                {details.price && ` - $${Number(details.price).toFixed(2)}`}
              </p>
            )}
          </>
        );
        
      case "add_condition":
      case "update_condition":
        return (
          <>
            <p className="text-sm text-gray-600">
              {details.condition_name}
              {details.surface && ` (Surface: ${details.surface})`}
            </p>
            {details.severity && (
              <p className="text-sm text-gray-500">
                Severity: {details.severity}
              </p>
            )}
            {details.description && (
              <p className="text-sm text-gray-500">
                {details.description}
              </p>
            )}
          </>
        );
        
      case "add_procedure_note":
        return (
          <p className="text-sm text-gray-600">
            {details.description || "Note added"}
          </p>
        );
        
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-500">Loading recent activity...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (Object.keys(groupedHistory).length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-500">No recent activity</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Patient History</h3>
      {Object.entries(groupedHistory)
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .map(([dateKey, entries]) => (
          <Card key={dateKey} className="overflow-hidden">
            <Collapsible
              open={expandedDays[dateKey]}
              onOpenChange={() => toggleDay(dateKey)}
            >
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium">
                      {format(parseISO(dateKey), "MMMM d, yyyy")}
                    </h4>
                    <Badge variant="outline" className="ml-2">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </Badge>
                  </div>
                  {expandedDays[dateKey] ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <div key={entry.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActionIcon(entry.action)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 mb-1">
                            {getActionBadge(entry.action)}
                            <span className="text-xs text-gray-500">
                              {format(parseISO(entry.date), "h:mm a")}
                            </span>
                          </div>
                          {entry.tooth_number && (
                            <p className="text-sm text-gray-700 mb-1">
                              Tooth #{entry.tooth_number}
                            </p>
                          )}
                          {formatDetails(entry)}
                          {entry.performed_by && (
                            <p className="text-xs text-gray-500 mt-1">
                              By: {entry.performed_by}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
    </div>
  );
} 