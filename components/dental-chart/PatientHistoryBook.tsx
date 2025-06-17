"use client";

import { useState, useEffect } from "react";
import { dentalChartService, ChartHistoryEntry } from "@/services/dental-chart.service";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, startOfDay, endOfDay, subMonths, subWeeks, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Calendar, 
  Plus, 
  Minus, 
  Edit, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  Clock,
  User,
  MapPin,
  Activity,
  TrendingUp,
  FileText,
  Search,
  Filter,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface PatientHistoryBookProps {
  patientId: string;
  patientName?: string;
  toothNumber?: string;
  selectedTeethNumbers?: string[];
}

interface TimelineEntry {
  date: string;
  entries: ChartHistoryEntry[];
  dayStats: {
    conditions: number;
    procedures: number;
    notes: number;
    updates: number;
  };
}

interface HistoryStats {
  totalConditions: number;
  totalProcedures: number;
  totalNotes: number;
  totalUpdates: number;
  teethAffected: string[];
  lastVisit: string | null;
  currentStatus: {
    activeConditions: number;
    completedProcedures: number;
    plannedProcedures: number;
  };
}

export function PatientHistoryBook({ patientId, patientName, toothNumber, selectedTeethNumbers }: PatientHistoryBookProps) {
  const { currentClinic } = useAuth();
  const [history, setHistory] = useState<ChartHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ChartHistoryEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");
  const [expandedDays, setExpandedDays] = useState<{[key: string]: boolean}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 20;
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    timeRange: 'all',
    toothNumber: toothNumber || '',
    status: 'all'
  });

  useEffect(() => {
    fetchHistory(1);
    setCurrentPage(1);
  }, [currentClinic?.id, patientId, filters]);

  useEffect(() => {
    applyFilters();
  }, [history, selectedTeethNumbers, sortOrder]);

  useEffect(() => {
    if (toothNumber !== undefined) {
      setFilters(prev => ({ ...prev, toothNumber: toothNumber || '' }));
    }
  }, [toothNumber]);

  const fetchHistory = async (page: number = 1) => {
    if (!currentClinic?.id) return;
    
    setIsLoading(page === 1); // Only show loading on first page
    try {
      const apiFilters = {
        page: page,
        page_size: itemsPerPage,
        ...(filters.category !== 'all' && { category: filters.category as 'conditions' | 'procedures' }),
        ...(filters.toothNumber && { tooth_number: filters.toothNumber }),
        ...(filters.timeRange !== 'all' && getTimeRangeFilter())
      };

      const historyData = await dentalChartService.getChartHistory(
        currentClinic.id.toString(),
        patientId,
        apiFilters
      );
      
      if (page === 1) {
        setHistory(historyData.results);
        calculateStats(historyData.results);
      } else {
        // Append to existing history for pagination
        setHistory(prev => [...prev, ...historyData.results]);
      }
      
      setTotalRecords(historyData.count);
      setTotalPages(Math.ceil(historyData.count / itemsPerPage));
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching patient history:", error);
      toast.error("Failed to load patient history");
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRangeFilter = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (filters.timeRange) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      default:
        return {};
    }
    
    return {
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(now, 'yyyy-MM-dd')
    };
  };

  const calculateStats = (entries: ChartHistoryEntry[]) => {
    const teethSet = new Set<string>();
    let totalConditions = 0;
    let totalProcedures = 0;
    let totalNotes = 0;
    let totalUpdates = 0;
    let lastVisit: string | null = null;
    let activeConditions = 0;
    let completedProcedures = 0;
    let plannedProcedures = 0;

    entries.forEach(entry => {
      if (entry.tooth_number) {
        teethSet.add(entry.tooth_number.toString());
      }

      switch (entry.action) {
        case 'add_condition':
          totalConditions++;
          activeConditions++;
          break;
        case 'add_procedure':
          totalProcedures++;
          if (entry.details?.status === 'completed') completedProcedures++;
          if (entry.details?.status === 'planned') plannedProcedures++;
          break;
        case 'add_procedure_note':
          totalNotes++;
          break;
        case 'update_condition':
        case 'update_procedure':
          totalUpdates++;
          break;
        case 'remove_condition':
          activeConditions = Math.max(0, activeConditions - 1);
          break;
      }

      if (!lastVisit || new Date(entry.date) > new Date(lastVisit)) {
        lastVisit = entry.date;
      }
    });

    setStats({
      totalConditions,
      totalProcedures,
      totalNotes,
      totalUpdates,
      teethAffected: Array.from(teethSet).sort(),
      lastVisit,
      currentStatus: {
        activeConditions,
        completedProcedures,
        plannedProcedures
      }
    });
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Apply client-side search filter (since API doesn't support search)
    if (filters.search) {
      filtered = filtered.filter(entry => 
        entry.details?.condition_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        entry.details?.procedure_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        entry.details?.note?.toLowerCase().includes(filters.search.toLowerCase()) ||
        entry.details?.notes?.toLowerCase().includes(filters.search.toLowerCase()) ||
        entry.tooth_number?.toString().includes(filters.search)
      );
    }

    // Apply client-side status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => 
        entry.action.includes('procedure') ? entry.details?.status === filters.status : true
      );
    }

    // Don't filter by teeth here - we'll do it after grouping bulk operations
    setFilteredHistory(filtered);
    createTimeline(filtered);
  };

  const filterEntriesBySelectedTeeth = (entries: (ChartHistoryEntry & { isBulkOperation?: boolean; bulkTeeth?: string[]; user_name?: string })[]): (ChartHistoryEntry & { isBulkOperation?: boolean; bulkTeeth?: string[]; user_name?: string })[] => {
    if (!selectedTeethNumbers || selectedTeethNumbers.length === 0) {
      return entries;
    }

    const filtered = entries.filter(entry => {
      // Check if this is a bulk operation
      if (entry.isBulkOperation === true && entry.bulkTeeth && entry.bulkTeeth.length > 0) {
        // For bulk operations, check if any of the selected teeth are in the bulkTeeth array
        return entry.bulkTeeth.some(toothNum => 
          selectedTeethNumbers.includes(toothNum)
        );
      } else {
        // For individual operations, check the tooth_number
        if (!entry.tooth_number) {
          return false; // Skip entries without tooth numbers
        }
        return selectedTeethNumbers.includes(entry.tooth_number.toString());
      }
    });

    return filtered;
  };

  const createTimeline = (entries: ChartHistoryEntry[]) => {
    const grouped: { [key: string]: ChartHistoryEntry[] } = {};
    
    entries.forEach(entry => {
      // Use the actual date from details (date_detected or date_performed) if available
      let relevantDate = entry.date; // fallback to creation date
      
      if (entry.details?.date_detected) {
        relevantDate = entry.details.date_detected;
      } else if (entry.details?.date_performed) {
        relevantDate = entry.details.date_performed;
      }
      
      const dateKey = format(parseISO(relevantDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });

    const timelineData: TimelineEntry[] = Object.entries(grouped)
      .sort(([a], [b]) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      })
      .map(([date, dayEntries]) => {
        // Group bulk operations that happened within the same minute
        let groupedEntries = groupBulkOperations(dayEntries);
        
        // Apply teeth filtering AFTER bulk operations are grouped
        groupedEntries = filterEntriesBySelectedTeeth(groupedEntries);
        
        return {
          date,
          entries: groupedEntries.sort((a, b) => {
            // Use relevant dates for sorting within the day
            let dateA = a.date;
            let dateB = b.date;
            
            if (a.details?.date_detected) dateA = a.details.date_detected;
            else if (a.details?.date_performed) dateA = a.details.date_performed;
            
            if (b.details?.date_detected) dateB = b.details.date_detected;
            else if (b.details?.date_performed) dateB = b.details.date_performed;
            
            const timeA = new Date(dateA).getTime();
            const timeB = new Date(dateB).getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
          }),
          dayStats: {
            conditions: dayEntries.filter(e => e.action.includes('condition')).length,
            procedures: dayEntries.filter(e => e.action.includes('procedure')).length,
            notes: dayEntries.filter(e => e.action === 'add_procedure_note').length,
            updates: dayEntries.filter(e => e.action.includes('update')).length,
          }
        };
      });

    setTimeline(timelineData);
    
    // Auto-expand the most recent days based on sort order
    const expandedState: {[key: string]: boolean} = {};
    const daysToExpand = sortOrder === 'asc' ? timelineData.slice(-3) : timelineData.slice(0, 3);
    daysToExpand.forEach(entry => {
      expandedState[entry.date] = true;
    });
    setExpandedDays(expandedState);
  };

  const groupBulkOperations = (entries: ChartHistoryEntry[]) => {
    const groups: { [key: string]: ChartHistoryEntry[] } = {};
    const ungrouped: ChartHistoryEntry[] = [];

    entries.forEach(entry => {
      // Use the actual date from details (date_detected or date_performed) if available
      let relevantDate = entry.date;
      if (entry.details?.date_detected) {
        relevantDate = entry.details.date_detected;
      } else if (entry.details?.date_performed) {
        relevantDate = entry.details.date_performed;
      }
      
      // Create a grouping key based on action, condition/procedure name, and time (within same minute)
      const timeKey = format(parseISO(relevantDate), 'yyyy-MM-dd HH:mm');
      const actionKey = entry.action;
      const nameKey = entry.details?.condition_name || entry.details?.procedure_name || '';
      const groupKey = `${timeKey}_${actionKey}_${nameKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(entry);
    });

    // Process groups - if a group has multiple entries, create a bulk entry
    Object.values(groups).forEach(group => {
      if (group.length > 1) {
        // Create a bulk operation entry
        const firstEntry = group[0];
        const bulkEntry: ChartHistoryEntry & { isBulkOperation?: boolean; bulkTeeth?: string[]; user_name?: string } = {
          ...firstEntry,
          id: firstEntry.id,
          isBulkOperation: true,
          bulkTeeth: group.map(e => e.tooth_number.toString()).sort(),
          user_name: (firstEntry as any).user_name || firstEntry.user
        };
        ungrouped.push(bulkEntry);
      } else {
        // Individual entry - explicitly mark as not bulk operation
        const individualEntry = group[0];
        const markedEntry: ChartHistoryEntry & { isBulkOperation?: boolean; bulkTeeth?: string[]; user_name?: string } = {
          ...individualEntry,
          isBulkOperation: false,
          user_name: (individualEntry as any).user_name || individualEntry.user
        };
        ungrouped.push(markedEntry);
      }
    });

    return ungrouped;
  };

  const formatEntryAsNarrative = (entry: ChartHistoryEntry & { isBulkOperation?: boolean; bulkTeeth?: string[]; user_name?: string }) => {
    const { action, details, tooth_number, user, isBulkOperation, bulkTeeth, user_name } = entry;
    const doctorName = user_name || user || 'Unknown';
    
    // Determine if this is a bulk operation
    const isMultipleTeeth = isBulkOperation && bulkTeeth && bulkTeeth.length > 1;
    const teethText = isMultipleTeeth 
      ? `teeth ${bulkTeeth.map(t => `#${t}`).join(', ')}`
      : `tooth #${tooth_number}`;
    
    // Use the actual date from details for time display
    let relevantDate = entry.date;
    if (entry.details?.date_detected) {
      relevantDate = entry.details.date_detected;
    } else if (entry.details?.date_performed) {
      relevantDate = entry.details.date_performed;
    }
    const timeText = format(parseISO(relevantDate), 'h:mm a');
    const conditionName = details?.condition_name || '';
    const procedureName = details?.procedure_name || '';
    const surface = details?.surface ? ` on the ${details.surface} surface` : '';
    const severity = details?.severity ? ` with ${details.severity} severity` : '';
    const status = details?.status ? ` (${details.status})` : '';
    const price = details?.price ? ` for $${parseFloat(details.price.toString()).toFixed(2)}` : '';
    
    let narrative = '';
    
    switch (action) {
      case 'add_condition':
        narrative = `Dr. ${doctorName} diagnosed ${conditionName.toLowerCase()}${severity} on ${teethText}${surface} at ${timeText}`;
        break;
        
      case 'add_procedure':
        narrative = `Dr. ${doctorName} scheduled ${procedureName.toLowerCase()}${status} for ${teethText}${surface}${price} at ${timeText}`;
        break;
        
      case 'update_condition':
        narrative = `Dr. ${doctorName} updated the ${conditionName.toLowerCase()} condition on ${teethText}${surface} at ${timeText}`;
        break;
        
      case 'update_procedure':
        narrative = `Dr. ${doctorName} modified the ${procedureName.toLowerCase()} procedure for ${teethText}${surface} at ${timeText}`;
        break;
        
      case 'remove_condition':
        narrative = `Dr. ${doctorName} resolved the ${conditionName.toLowerCase()} condition on ${teethText} at ${timeText}`;
        break;
        
      case 'remove_procedure':
        narrative = `Dr. ${doctorName} cancelled the ${procedureName.toLowerCase()} procedure for ${teethText} at ${timeText}`;
        break;
        
      case 'add_procedure_note':
        narrative = `Dr. ${doctorName} added progress notes for ${procedureName.toLowerCase()} on ${teethText} at ${timeText}`;
        break;
        
      case 'add_general_procedure':
        narrative = `Dr. ${doctorName} performed ${procedureName.toLowerCase()}${status}${price} at ${timeText}`;
        break;
        
      default:
        narrative = `Dr. ${doctorName} performed ${action.replace(/_/g, ' ')} at ${timeText}`;
    }
    
    return narrative;
  };

  const getDetailedInformation = (entry: ChartHistoryEntry & { isBulkOperation?: boolean; bulkTeeth?: string[]; user_name?: string }) => {
    const details = entry.details;
    if (!details) return null;
    
    const sections = [];
    
    // Technical details
    const technicalDetails = [];
    if (details.surface) technicalDetails.push(`Surface: ${details.surface}`);
    if (details.severity) technicalDetails.push(`Severity: ${details.severity}`);
    if (details.status) technicalDetails.push(`Status: ${details.status}`);
    if (details.price) technicalDetails.push(`Cost: $${parseFloat(details.price.toString()).toFixed(2)}`);
    
    if (technicalDetails.length > 0) {
      sections.push({
        title: 'Details',
        content: technicalDetails.join(' • ')
      });
    }

    // Date information
    if (details.date_detected) {
      sections.push({
        title: 'Date Detected',
        content: format(parseISO(details.date_detected), 'MMMM d, yyyy')
      });
    }
    
    if (details.date_performed) {
      sections.push({
        title: 'Date Performed',
        content: format(parseISO(details.date_performed), 'MMMM d, yyyy')
      });
    }
    
    // Notes and descriptions
    if (details.description) {
      sections.push({
        title: 'Clinical Notes',
        content: details.description
      });
    }
    
    // Handle both "notes" (for conditions) and "note" (for procedure notes)
    if (details.notes) {
      sections.push({
        title: 'Clinical Notes',
        content: details.notes
      });
    }
    
    if (details.note) {
      sections.push({
        title: 'Progress Notes',
        content: details.note
      });
    }
    
    // Appointment information for procedure notes
    if (entry.action === 'add_procedure_note' && details.appointment_date) {
      sections.push({
        title: 'Appointment Date',
        content: format(parseISO(details.appointment_date), 'MMMM d, yyyy')
      });
    }
    
    return sections;
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Loading patient history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {selectedTeethNumbers && selectedTeethNumbers.length > 0
                  ? selectedTeethNumbers.length === 1
                    ? `Tooth #${selectedTeethNumbers[0]} History`
                    : `Selected Teeth History (${selectedTeethNumbers.length} teeth)`
                  : toothNumber 
                    ? `Tooth #${toothNumber} History` 
                    : patientName 
                      ? `${patientName}'s Medical History` 
                      : 'Patient Medical History'
                }
              </CardTitle>
              <p className="text-gray-600">
                {selectedTeethNumbers && selectedTeethNumbers.length > 0
                  ? selectedTeethNumbers.length === 1
                    ? `Complete treatment history for tooth #${selectedTeethNumbers[0]}`
                    : `Treatment history for teeth: ${selectedTeethNumbers.map(n => `#${n}`).join(', ')}`
                  : toothNumber 
                    ? `Complete treatment history for tooth #${toothNumber}` 
                    : 'Complete dental treatment timeline and records'
                }
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Selected Teeth Indicator */}
      {selectedTeethNumbers && selectedTeethNumbers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Filtering by:</span>
                {selectedTeethNumbers.map(toothNum => (
                  <Badge key={toothNum} className="bg-blue-100 text-blue-700 border-blue-200">
                    Tooth #{toothNum}
                  </Badge>
                ))}
                <span className="text-xs text-gray-500 ml-2">
                  ({selectedTeethNumbers.length} {selectedTeethNumbers.length === 1 ? 'tooth' : 'teeth'} selected)
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()} // This will clear the selection
                className="text-xs"
              >
                Clear Selection
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Only showing history records that involve the selected {selectedTeethNumbers.length === 1 ? 'tooth' : 'teeth'}. 
              Select different teeth in the dental chart above to change the filter.
            </p>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Conditions</p>
                  <p className="text-2xl font-bold">{stats.currentStatus.activeConditions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Procedures</p>
                  <p className="text-2xl font-bold">{stats.totalProcedures}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teeth Affected</p>
                  <p className="text-2xl font-bold">{stats.teethAffected.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Visit</p>
                  <p className="text-lg font-semibold">
                    {stats.lastVisit ? format(parseISO(stats.lastVisit), 'MMM d, yyyy') : 'No visits'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="flex items-center gap-2"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <ArrowUp className="h-4 w-4" />
                    Oldest First
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4" />
                    Newest First
                  </>
                )}
              </Button>
              <Badge variant="outline" className="text-xs">
                Chronological Order
              </Badge>
            </div>
            <div className="text-xs text-gray-500">
              {totalRecords > 0 && `${totalRecords} total records`}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conditions, procedures..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="conditions">Conditions</SelectItem>
                <SelectItem value="procedures">Procedures</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.timeRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Tooth number"
              value={filters.toothNumber}
              onChange={(e) => setFilters(prev => ({ ...prev, toothNumber: e.target.value }))}
            />

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {timeline.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {selectedTeethNumbers && selectedTeethNumbers.length > 0 ? (
                <div>
                  <p className="text-gray-500 mb-2">No history records found</p>
                  <p className="text-sm text-gray-400">
                    No conditions or procedures have been recorded for {selectedTeethNumbers.length === 1 
                      ? `tooth #${selectedTeethNumbers[0]}` 
                      : `the selected teeth: ${selectedTeethNumbers.map(n => `#${n}`).join(', ')}`
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Try selecting different teeth or clear the selection to view all records
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No history records found</p>
              )}
            </CardContent>
          </Card>
        ) : (
          timeline.map((dayEntry) => (
            <Card key={dayEntry.date} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedDays(prev => ({ ...prev, [dayEntry.date]: !prev[dayEntry.date] }))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {format(parseISO(dayEntry.date), 'd')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(parseISO(dayEntry.date), 'MMM yyyy')}
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div>
                      <h3 className="text-lg font-semibold">
                        {format(parseISO(dayEntry.date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{dayEntry.entries.length} entries</span>
                        {dayEntry.dayStats.conditions > 0 && (
                          <Badge variant="outline" className="text-red-600">
                            {dayEntry.dayStats.conditions} condition{dayEntry.dayStats.conditions !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {dayEntry.dayStats.procedures > 0 && (
                          <Badge variant="outline" className="text-blue-600">
                            {dayEntry.dayStats.procedures} procedure{dayEntry.dayStats.procedures !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {dayEntry.dayStats.notes > 0 && (
                          <Badge variant="outline" className="text-purple-600">
                            {dayEntry.dayStats.notes} note{dayEntry.dayStats.notes !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedDays[dayEntry.date] ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>

              {expandedDays[dayEntry.date] && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                                          {dayEntry.entries.map((entry, index) => {
                        const typedEntry = entry as ChartHistoryEntry & { isBulkOperation?: boolean; bulkTeeth?: string[]; user_name?: string };
                        const narrative = formatEntryAsNarrative(typedEntry);
                        const detailedInfo = getDetailedInformation(typedEntry);
                        
                        return (
                          <div key={entry.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="p-2 bg-white border border-gray-200 rounded-full shadow-sm">
                                {entry.action === 'add_condition' ? (
                                  <Plus className="h-4 w-4 text-red-500" />
                                ) : entry.action === 'add_procedure' ? (
                                  <Plus className="h-4 w-4 text-blue-500" />
                                ) : entry.action.includes('update') ? (
                                  <Edit className="h-4 w-4 text-amber-500" />
                                ) : entry.action.includes('remove') ? (
                                  <Minus className="h-4 w-4 text-red-500" />
                                ) : entry.action === 'add_procedure_note' ? (
                                  <FileText className="h-4 w-4 text-purple-500" />
                                ) : (
                                  <Activity className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              {index < dayEntry.entries.length - 1 && (
                                <div className="w-px h-8 bg-gray-200 mt-2" />
                              )}
                            </div>
                            
                            <div className="flex-1 pb-4">
                              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                {/* Narrative Description */}
                                <div className="mb-3">
                                  <p className="text-gray-800 leading-relaxed">
                                    {narrative}
                                  </p>
                                </div>

                                {/* Bulk Operation Indicator */}
                                {typedEntry.isBulkOperation && typedEntry.bulkTeeth && typedEntry.bulkTeeth.length > 1 && (
                                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-blue-700">Bulk Operation</span>
                                      <div className="flex flex-wrap gap-1">
                                        {typedEntry.bulkTeeth.map(toothNum => (
                                          <Badge key={toothNum} variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                            #{toothNum}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Action Badge */}
                                <div className="mb-3">
                                  <Badge className={
                                    entry.action === 'add_condition' ? 'bg-red-50 text-red-700 border-red-200' :
                                    entry.action === 'add_procedure' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    entry.action.includes('update') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    entry.action.includes('remove') ? 'bg-red-50 text-red-700 border-red-200' :
                                    entry.action === 'add_procedure_note' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                  }>
                                    {entry.action === 'add_condition' ? 'Condition Diagnosed' :
                                     entry.action === 'add_procedure' ? 'Procedure Scheduled' :
                                     entry.action === 'update_condition' ? 'Condition Updated' :
                                     entry.action === 'update_procedure' ? 'Procedure Modified' :
                                     entry.action === 'remove_condition' ? 'Condition Resolved' :
                                     entry.action === 'remove_procedure' ? 'Procedure Cancelled' :
                                     entry.action === 'add_procedure_note' ? 'Progress Note Added' :
                                     'General Procedure Performed'}
                                  </Badge>
                                </div>

                                {/* Detailed Information */}
                                {detailedInfo && detailedInfo.length > 0 && (
                                  <div className="space-y-3">
                                    {detailedInfo.map((section, idx) => (
                                      <div key={idx} className="border-l-2 border-gray-200 pl-3">
                                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                          {section.title}
                                        </h4>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                          {section.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {history.length} of {totalRecords} records
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prevPage = Math.max(1, currentPage - 1);
                    fetchHistory(prevPage);
                  }}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => fetchHistory(pageNum)}
                        disabled={isLoading}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextPage = Math.min(totalPages, currentPage + 1);
                    fetchHistory(nextPage);
                  }}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load More Button for easier navigation */}
      {currentPage < totalPages && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => fetchHistory(currentPage + 1)}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Loading more...
              </div>
            ) : (
              `Load More Records (${totalRecords - history.length} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 