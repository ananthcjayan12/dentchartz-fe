"use client";

import { useState, useEffect, useRef } from "react";
import { Tooth, ToothCondition, ToothProcedure } from "@/services/dental-chart.service";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Square } from "lucide-react";
import { ContextMenu } from "./context-menu";
import { MultiSelectConditionDialog } from "./MultiSelectConditionDialog";
import { MultiSelectProcedureDialog } from "./MultiSelectProcedureDialog";

interface EnhancedDentalChartViewerProps {
  teeth: Tooth[];
  onToothSelect: (tooth: Tooth) => void;
  selectedTooth: Tooth | null;
  showPrimary?: boolean;
  onGeneralProcedureClick?: () => void;
  onSelectedTeethChange?: (teeth: Tooth[]) => void;
  conditions?: {
    id: number;
    name: string;
    code: string;
    description: string;
    color_code: string;
  }[];
  procedures?: {
    id: number;
    name: string;
    code: string;
    description: string;
    category: string;
    default_price: number;
  }[];
  onAddConditionToMultiple?: (teeth: Tooth[], conditionData: any) => void;
  onAddProcedureToMultiple?: (teeth: Tooth[], procedureData: any) => void;
  onEditCondition?: (tooth: Tooth, condition: ToothCondition) => void;
  onDeleteCondition?: (tooth: Tooth, condition: ToothCondition) => void;
  onEditProcedure?: (tooth: Tooth, procedure: ToothProcedure) => void;
  onDeleteProcedure?: (tooth: Tooth, procedure: ToothProcedure) => void;
}

export function EnhancedDentalChartViewer({ 
  teeth, 
  onToothSelect, 
  selectedTooth,
  showPrimary = false,
  onGeneralProcedureClick,
  onSelectedTeethChange,
  conditions = [],
  procedures = [],
  onAddConditionToMultiple,
  onAddProcedureToMultiple,
  onEditCondition,
  onDeleteCondition,
  onEditProcedure,
  onDeleteProcedure
}: EnhancedDentalChartViewerProps) {
  const [isPediatric, setIsPediatric] = useState(showPrimary);
  const [selectedTeeth, setSelectedTeeth] = useState<Tooth[]>([]);
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    isVisible: false
  });
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [showProcedureDialog, setShowProcedureDialog] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Create default teeth data
  const createDefaultTeeth = (isPrimary = false) => {
    const defaultTeeth: Tooth[] = [];
    
    if (isPrimary) {
      // Primary teeth A-T
      const primaryNumbers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
      const quadrants = ['upper_right', 'upper_left', 'lower_left', 'lower_right'];
      
      primaryNumbers.forEach((number, index) => {
        const quadrantIndex = Math.floor(index / 5);
        defaultTeeth.push({
          id: index + 1,
          number: number,
          universal_number: index + 1,
          dentition_type: 'primary',
          name: `Primary Tooth ${number}`,
          quadrant: quadrants[quadrantIndex],
          conditions: [],
          procedures: []
        });
      });
    } else {
      // Permanent teeth 1-32
      for (let i = 1; i <= 32; i++) {
        let quadrant = '';
        if (i <= 8) quadrant = 'upper_right';
        else if (i <= 16) quadrant = 'upper_left';
        else if (i <= 24) quadrant = 'lower_left';
        else quadrant = 'lower_right';
        
        defaultTeeth.push({
          id: i,
          number: i.toString(),
          universal_number: i,
          dentition_type: 'permanent',
          name: `Permanent Tooth ${i}`,
          quadrant: quadrant,
          conditions: [],
          procedures: []
        });
      }
    }
    
    return defaultTeeth;
  };

  // Get filtered teeth
  const getFilteredTeeth = () => {
    if (!teeth || teeth.length === 0) {
      return createDefaultTeeth(isPediatric);
    }
    
    return teeth.filter(tooth => 
      isPediatric ? tooth.dentition_type === "primary" : tooth.dentition_type === "permanent"
    );
  };

  const filteredTeeth = getFilteredTeeth();

  // Group teeth by quadrant
  const upperRight = filteredTeeth
    .filter(tooth => tooth.quadrant === "upper_right")
    .sort((a, b) => isPediatric ? a.number.localeCompare(b.number) : Number(b.number) - Number(a.number));
  
  const upperLeft = filteredTeeth
    .filter(tooth => tooth.quadrant === "upper_left")
    .sort((a, b) => isPediatric ? a.number.localeCompare(b.number) : Number(a.number) - Number(b.number));
  
  const lowerLeft = filteredTeeth
    .filter(tooth => tooth.quadrant === "lower_left")
    .sort((a, b) => isPediatric ? a.number.localeCompare(b.number) : Number(a.number) - Number(b.number));
  
  const lowerRight = filteredTeeth
    .filter(tooth => tooth.quadrant === "lower_right")
    .sort((a, b) => isPediatric ? a.number.localeCompare(b.number) : Number(b.number) - Number(a.number));

  // Helper functions
  const getToothColor = (tooth: Tooth) => {
    if (!tooth.conditions || tooth.conditions.length === 0) return "bg-white";
    
    const hasCavity = tooth.conditions.some(c => 
      c.condition_name.toLowerCase().includes("cavity")
    );
    const hasFilling = tooth.conditions.some(c => 
      c.condition_name.toLowerCase().includes("filling")
    );
    
    if (hasCavity) return "bg-red-200";
    if (hasFilling) return "bg-blue-200";
    return "bg-yellow-100";
  };

  const getToothTooltip = (tooth: Tooth) => {
    const conditions = tooth.conditions?.map(c => c.condition_name).join(", ") || "";
    const procedures = tooth.procedures?.map(p => p.procedure_name).join(", ") || "";
    
    return (
      <div className="text-sm">
        <p className="font-bold">{tooth.name} (#{tooth.number})</p>
        {conditions && <p><span className="font-semibold">Conditions:</span> {conditions}</p>}
        {procedures && <p><span className="font-semibold">Procedures:</span> {procedures}</p>}
        {!conditions && !procedures && <p>No conditions or procedures</p>}
      </div>
    );
  };

  // Event handlers
  const handleToothClick = (tooth: Tooth, event: React.MouseEvent) => {
    // Multi-select is always enabled
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection with Ctrl/Cmd
      if (selectedTeeth.some(t => t.number === tooth.number)) {
        setSelectedTeeth(prev => prev.filter(t => t.number !== tooth.number));
      } else {
        setSelectedTeeth(prev => [...prev, tooth]);
      }
    } else {
      // Normal click - select multiple teeth or toggle selection
      if (selectedTeeth.some(t => t.number === tooth.number)) {
        // If already selected, remove from selection
        setSelectedTeeth(prev => prev.filter(t => t.number !== tooth.number));
      } else {
        // Add to selection
        setSelectedTeeth(prev => [...prev, tooth]);
      }
    }
    
    // Also update the selected tooth for detail panel
    onToothSelect(tooth);
  };

  const handleToothRightClick = (tooth: Tooth, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Only right-click shows context menu
    if (!selectedTeeth.some(t => t.number === tooth.number)) {
      setSelectedTeeth(prev => [...prev, tooth]);
    }
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      isVisible: true
    });
  };

  const clearSelection = () => {
    setSelectedTeeth([]);
  };

  // Notify parent component when selected teeth change
  useEffect(() => {
    if (onSelectedTeethChange) {
      onSelectedTeethChange(selectedTeeth);
    }
  }, [selectedTeeth, onSelectedTeethChange]);

  const handleToggleDentition = () => {
    setIsPediatric(!isPediatric);
    setSelectedTeeth([]);
    // Clear the selected tooth when switching dentition types
    // This prevents errors when the selected tooth doesn't exist in the new dentition
    onToothSelect(null as any);
  };

  const handleAddConditionToMultiple = (conditionData: any) => {
    if (onAddConditionToMultiple && selectedTeeth.length > 0) {
      onAddConditionToMultiple(selectedTeeth, conditionData);
      setSelectedTeeth([]);
    }
  };

  const handleAddProcedureToMultiple = (procedureData: any) => {
    if (onAddProcedureToMultiple && selectedTeeth.length > 0) {
      onAddProcedureToMultiple(selectedTeeth, procedureData);
      setSelectedTeeth([]);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.isVisible && chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, isVisible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.isVisible]);

  // Render individual tooth
  const renderTooth = (tooth: Tooth) => {
    const isSelected = selectedTooth?.number === tooth.number;
    const isMultiSelected = selectedTeeth.some(t => t.number === tooth.number);
    const color = getToothColor(tooth);

    return (
      <TooltipProvider key={`${tooth.dentition_type}-${tooth.number}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative w-8 h-8 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md",
                color,
                {
                  "border-blue-500 ring-2 ring-blue-200": isSelected,
                  "border-purple-500 ring-2 ring-purple-200": isMultiSelected,
                  "border-gray-300": !isSelected && !isMultiSelected,
                }
              )}
              onClick={(e) => handleToothClick(tooth, e)}
              onContextMenu={(e) => handleToothRightClick(tooth, e)}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                {tooth.number}
              </div>
              {(tooth.conditions?.length > 0 || tooth.procedures?.length > 0) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white"></div>
              )}
              {isMultiSelected && (
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full border border-white flex items-center justify-center">
                  <Square className="w-2 h-2 fill-white" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {getToothTooltip(tooth)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div ref={chartRef} className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Dental Chart</h2>
          <Button
            variant={isPediatric ? "default" : "outline"}
            size="sm"
            onClick={handleToggleDentition}
          >
            {isPediatric ? "Primary Teeth" : "Switch to Primary Teeth"}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedTeeth.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {selectedTeeth.length} selected
              </Badge>
              <Button size="sm" variant="outline" onClick={clearSelection}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          

          
          {onGeneralProcedureClick && (
            <Button size="sm" onClick={onGeneralProcedureClick}>
              <Plus className="w-4 h-4 mr-2" />
              Add General Procedure
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      {selectedTeeth.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-800">
            <strong>Multi-Select Active:</strong> Click teeth to add/remove selection, Right-click for context menu
          </p>
        </div>
      )}

      {/* Dental Chart Grid */}
      <div className="space-y-4">
        {/* Upper Teeth */}
        <div>
          <div className="flex justify-center space-x-2 mb-2">
            {upperRight.map(renderTooth)}
            <div className="w-4"></div>
            {upperLeft.map(renderTooth)}
          </div>
          <div className="text-center text-xs text-gray-500 mb-4">Upper Teeth</div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-gray-300 my-4"></div>

        {/* Lower Teeth */}
        <div>
          <div className="text-center text-xs text-gray-500 mb-2">Lower Teeth</div>
          <div className="flex justify-center space-x-2">
            {lowerRight.map(renderTooth)}
            <div className="w-4"></div>
            {lowerLeft.map(renderTooth)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
          <span>Healthy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-200 border-2 border-gray-300 rounded"></div>
          <span>Cavity</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-200 border-2 border-gray-300 rounded"></div>
          <span>Filling</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-gray-300 rounded"></div>
          <span>Other Condition</span>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isVisible={contextMenu.isVisible}
        onClose={() => {
          setContextMenu(prev => ({ ...prev, isVisible: false }));
        }}
        onAddCondition={() => setShowConditionDialog(true)}
        onAddProcedure={() => setShowProcedureDialog(true)}
        selectedTeeth={selectedTeeth}
        onEditCondition={onEditCondition}
        onDeleteCondition={onDeleteCondition}
        onEditProcedure={onEditProcedure}
        onDeleteProcedure={onDeleteProcedure}
      />

      {/* Multi-Select Dialogs */}
      <MultiSelectConditionDialog
        isOpen={showConditionDialog}
        onClose={() => setShowConditionDialog(false)}
        onAddCondition={handleAddConditionToMultiple}
        selectedTeeth={selectedTeeth}
        conditions={conditions}
      />

      <MultiSelectProcedureDialog
        isOpen={showProcedureDialog}
        onClose={() => setShowProcedureDialog(false)}
        onAddProcedure={handleAddProcedureToMultiple}
        selectedTeeth={selectedTeeth}
        procedures={procedures}
      />
    </div>
  );
} 