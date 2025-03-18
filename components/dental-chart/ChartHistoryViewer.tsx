"use client";

import { useState, useEffect } from "react";
import { dentalChartService, ChartHistoryEntry } from "@/services/dental-chart.service";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calendar, Plus, Minus, Edit, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface ChartHistoryViewerProps {
  patientId: string;
}

export function ChartHistoryViewer({ patientId }: ChartHistoryViewerProps) {
  const { currentClinic } = useAuth();
  const [history, setHistory] = useState<ChartHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    tooth_number: '',
    category: '',
    start_date: '',
    end_date: ''
  });
  
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentClinic?.id) {
        toast.error("No clinic selected");
        return;
      }
      
      setIsLoading(true);
      try {
        const historyData = await dentalChartService.getChartHistory(
          currentClinic.id.toString(),
          patientId,
          filters
        );
        setHistory(historyData.results);
      } catch (error) {
        console.error("Error fetching chart history:", error);
        toast.error("Failed to load chart history");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [currentClinic?.id, patientId, filters]);
  
  // Helper function to get icon for action
  const getActionIcon = (action: string) => {
    switch (action) {
      case "add_condition":
        return <Plus className="h-4 w-4" />;
      case "add_procedure":
        return <Plus className="h-4 w-4" />;
      case "update_condition":
        return <Edit className="h-4 w-4" />;
      case "update_procedure":
        return <Edit className="h-4 w-4" />;
      case "remove_condition":
        return <Minus className="h-4 w-4" />;
      case "remove_procedure":
        return <Minus className="h-4 w-4" />;
      case "add_procedure_note":
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  // Helper function to get color for action
  const getActionColor = (action: string) => {
    switch (action) {
      case "add_condition":
        return "bg-yellow-100 text-yellow-800";
      case "add_procedure":
        return "bg-green-100 text-green-800";
      case "update_condition":
      case "update_procedure":
        return "bg-blue-100 text-blue-800";
      case "remove_condition":
      case "remove_procedure":
        return "bg-red-100 text-red-800";
      case "add_procedure_note":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Helper function to format action text
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Helper function to format details
  const formatDetails = (entry: ChartHistoryEntry) => {
    const { action, details } = entry;
    
    if (action === "add_condition" || action === "update_condition") {
      return (
        <div>
          <span className="font-medium">{details.condition_name}</span>
          {details.surface && <span> on {details.surface} surface</span>}
          {details.severity && <span> ({details.severity})</span>}
          {details.description && (
            <p className="mt-1 text-gray-600">{details.description}</p>
          )}
        </div>
      );
    }
    
    if (action === "add_procedure" || action === "update_procedure") {
      return (
        <div>
          <span className="font-medium">{details.procedure_name}</span>
          {details.surface && <span> on {details.surface} surface</span>}
          {details.status && <span> ({details.status})</span>}
          {details.price && <span className="ml-2 font-medium">${parseFloat(details.price).toFixed(2)}</span>}
          {details.description && (
            <p className="mt-1 text-gray-600">{details.description}</p>
          )}
        </div>
      );
    }
    
    if (action === "remove_condition" || action === "remove_procedure") {
      return (
        <div>
          <span className="font-medium">
            {details.condition_name || details.procedure_name}
          </span>
          {details.surface && <span> from {details.surface} surface</span>}
        </div>
      );
    }
    
    if (action === "add_procedure_note") {
      return (
        <div>
          <div className="flex justify-between">
            <span className="font-medium">Added note to {details.procedure_name}</span>
            <span className="text-xs text-gray-500">{details.appointment_date}</span>
          </div>
          <p className="mt-1 text-gray-600 bg-gray-50 p-2 rounded">{details.note}</p>
        </div>
      );
    }
    
    return <div>{JSON.stringify(details)}</div>;
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-4 space-y-4">
        <div className="flex gap-4">
          <div className="w-1/2">
            <Input
              placeholder="Tooth Number"
              value={filters.tooth_number}
              onChange={(e) => setFilters(prev => ({ ...prev, tooth_number: e.target.value }))}
            />
          </div>
          <div className="w-1/2">
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="conditions">Conditions</SelectItem>
                <SelectItem value="procedures">Procedures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-1/2">
            <DatePicker
              placeholder="Start Date"
              value={filters.start_date}
              onChange={(date) => setFilters(prev => ({ ...prev, start_date: date }))}
            />
          </div>
          <div className="w-1/2">
            <DatePicker
              placeholder="End Date"
              value={filters.end_date}
              onChange={(date) => setFilters(prev => ({ ...prev, end_date: date }))}
            />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading chart history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No chart history found for this patient</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Timeline entries */}
          <div className="space-y-6">
            {history.map((entry) => (
              <div key={entry.id} className="relative flex items-start">
                {/* Timeline dot */}
                <div className={`absolute left-7 w-3 h-3 rounded-full mt-1.5 -ml-1.5 ${getActionColor(entry.action)}`}></div>
                
                {/* Date */}
                <div className="min-w-28 pr-4 text-right text-sm text-gray-500">
                  {format(parseISO(entry.date), "MMM d, yyyy")}
                  <div className="text-xs">{format(parseISO(entry.date), "h:mm a")}</div>
                </div>
                
                {/* Content */}
                <div className="ml-8 bg-white p-3 rounded-lg border shadow-sm flex-1">
                  <div className="flex items-center mb-1">
                    <Badge className={`mr-2 ${getActionColor(entry.action)}`}>
                      <span className="flex items-center">
                        {getActionIcon(entry.action)}
                        <span className="ml-1">{formatAction(entry.action)}</span>
                      </span>
                    </Badge>
                    <Badge variant="outline">Tooth #{entry.tooth_number}</Badge>
                  </div>
                  
                  <div className="text-sm">
                    {formatDetails(entry)}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    By {entry.user}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 