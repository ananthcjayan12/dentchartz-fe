"use client";

import { useState, useEffect } from "react";
import { dentalChartService, ChartHistoryEntry } from "@/services/dental-chart.service";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, subDays, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Plus, Minus, Edit, AlertCircle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CondensedChartHistoryProps {
  patientId: string;
  toothNumber?: string;
  limit?: number;
}

interface ChartHistoryEntry {
  id: number;
  date: string;
  action: string;
  action_display: string;
  tooth_number: string;
  category: string;
  details: HistoryDetails;
  user_name: string;
}

interface HistoryDetails {
  procedure_name?: string;
  surface?: string;
  status?: string;
  price?: number | string;
  condition_name?: string;
  severity?: string;
  description?: string;
  note?: string;
  is_general?: boolean;
}

interface GroupedHistory {
  [key: string]: ChartHistoryEntry[];
}

// Add this interface for tracking changes
interface ProcedureChanges {
  from?: {
    status?: string;
    price?: string | number;
    surface?: string;
  };
  to?: {
    status?: string;
    price?: string | number;
    surface?: string;
  };
}

export function CondensedChartHistory({ patientId, toothNumber, limit }: CondensedChartHistoryProps) {
  const { currentClinic } = useAuth();
  const [history, setHistory] = useState<ChartHistoryEntry[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({});
  const [expandedDays, setExpandedDays] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentClinic?.id) return;
      
      setIsLoading(true);
      try {
        const filters = {
          tooth_number: toothNumber || '',
          start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          page: page,
          page_size: 5 // Set page size to 5
        };
        
        const historyData = await dentalChartService.getChartHistory(
          currentClinic.id.toString(),
          patientId,
          filters
        );
        
        setTotalCount(historyData.count);
        setHasMore(!!historyData.next);
        
        // If it's the first page, replace the history, otherwise append
        const newHistory = page === 1 ? historyData.results : [...history, ...historyData.results];
        setHistory(newHistory);
        
        // Group history by date
        const grouped: GroupedHistory = {};
        newHistory.forEach(entry => {
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
  }, [currentClinic?.id, patientId, toothNumber, page]);
  
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
      case "add_general_procedure":
        return <Plus className="h-4 w-4" />;
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
      case "add_general_procedure":
        return <Badge variant="outline">General Procedure</Badge>;
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
  
  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'planned':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const formatDetails = (entry: ChartHistoryEntry) => {
    const { details } = entry;
    if (!details) return null;

    if (entry.action === "update_procedure") {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">{details.procedure_name}</span>
            {details.surface && (
              <Badge variant="outline" className="text-xs">
                Surface: {details.surface}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Badge className={getStatusColor(details.status)}>
              {details.status?.replace(/_/g, ' ')}
            </Badge>
            {details.price && (
              <Badge variant="outline">
                ${Number(details.price).toFixed(2)}
              </Badge>
            )}
          </div>
          
          {entry.user_name && (
            <p className="text-xs text-gray-500 mt-2 border-t pt-2">
              Updated by Dr. {entry.user_name}
            </p>
          )}
        </div>
      );
    }

    if (entry.action === "add_general_procedure" || (details.is_general && entry.category === "procedures")) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">{details.procedure_name}</span>
            <Badge variant="outline">General</Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Badge className={getStatusColor(details.status)}>
              {details.status?.replace(/_/g, ' ')}
            </Badge>
            {details.price && (
              <Badge variant="outline">
                ${Number(details.price).toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
      );
    }

    if (entry.action === "add_procedure") {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">{details.procedure_name}</span>
            {details.surface && (
              <Badge variant="outline" className="text-xs">
                Surface: {details.surface}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {details.status && (
              <Badge className={getStatusColor(details.status)}>
                {details.status?.replace(/_/g, ' ')}
              </Badge>
            )}
            {details.price && (
              <Badge variant="outline">
                ${Number(details.price).toFixed(2)}
              </Badge>
            )}
          </div>
          
          {details.description && (
            <p className="text-sm text-gray-600 mt-2 border-t pt-2">
              {details.description}
            </p>
          )}
        </div>
      );
    }

    if (entry.action === "add_condition") {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">{details.condition_name}</span>
            {details.surface && (
              <Badge variant="outline" className="text-xs">
                Surface: {details.surface}
              </Badge>
            )}
          </div>
          
          {details.severity && (
            <Badge className="bg-yellow-100 text-yellow-800">
              {details.severity} severity
            </Badge>
          )}
          
          {details.description && (
            <p className="text-sm text-gray-600 mt-2 border-t pt-2">
              {details.description}
            </p>
          )}
        </div>
      );
    }

    if (entry.action === "add_procedure_note") {
      return (
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
          <p className="text-sm text-purple-900 italic">
            "{details.note || details.description || "Note added"}"
          </p>
          {details.appointment_date && (
            <p className="text-xs text-purple-700 mt-1">
              Appointment: {format(parseISO(details.appointment_date), "MMM d, yyyy h:mm a")}
            </p>
          )}
        </div>
      );
    }

    return null;
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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">
          Patient History
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({totalCount} entries)
          </span>
        </h3>
        {toothNumber && (
          <Badge variant="outline" className="text-lg">
            Tooth #{toothNumber}
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedHistory)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
          .map(([dateKey, entries]) => (
            <div key={dateKey} className="relative">
              <div className="sticky top-0 bg-white z-10 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h4 className="font-medium text-gray-900">
                  {format(parseISO(dateKey), "MMMM d, yyyy")}
                </h4>
                <Badge variant="outline">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </Badge>
              </div>

              <div className="ml-6 border-l-2 border-gray-200 space-y-6 pl-6">
                {entries
                  .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
                  .map((entry) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[34px] p-1 bg-white rounded-full border-2 border-gray-200">
                        {getActionIcon(entry.action)}
                      </div>
                      
                      <div className="mb-1 flex items-center gap-2">
                        {getActionBadge(entry.action)}
                        <span className="text-sm text-gray-500">
                          {format(parseISO(entry.date), "h:mm a")}
                        </span>
                      </div>

                      {entry.tooth_number && (
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Tooth #{entry.tooth_number}
                        </p>
                      )}

                      {formatDetails(entry)}
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 shadow-sm"
          >
            {isLoading ? "Loading..." : "Load More Entries"}
          </button>
        </div>
      )}
    </div>
  );
} 