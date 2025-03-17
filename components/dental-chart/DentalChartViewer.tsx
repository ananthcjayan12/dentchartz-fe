"use client";

import { useState, useEffect } from "react";
import { Tooth } from "@/services/dental-chart.service";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DentalChartViewerProps {
  dentalChart: {
    permanent_teeth?: Tooth[];
    primary_teeth?: Tooth[];
  };
  onToothSelect: (tooth: Tooth) => void;
  selectedTooth: Tooth | null;
  showPrimary?: boolean;
}

export function DentalChartViewer({ 
  dentalChart, 
  onToothSelect, 
  selectedTooth,
  showPrimary = false
}: DentalChartViewerProps) {
  const [isPediatric, setIsPediatric] = useState(showPrimary);
  
  // Function to create default teeth
  const createDefaultTeeth = (isPrimary = false) => {
    if (isPrimary) {
      // Create default primary teeth (A-T)
      return [
        // Upper right (A-E)
        { number: "A", name: "Primary Upper Right Central Incisor", quadrant: "upper_right", type: "primary", conditions: [], procedures: [] },
        { number: "B", name: "Primary Upper Right Lateral Incisor", quadrant: "upper_right", type: "primary", conditions: [], procedures: [] },
        { number: "C", name: "Primary Upper Right Canine", quadrant: "upper_right", type: "primary", conditions: [], procedures: [] },
        { number: "D", name: "Primary Upper Right First Molar", quadrant: "upper_right", type: "primary", conditions: [], procedures: [] },
        { number: "E", name: "Primary Upper Right Second Molar", quadrant: "upper_right", type: "primary", conditions: [], procedures: [] },
        
        // Upper left (F-J)
        { number: "F", name: "Primary Upper Left Central Incisor", quadrant: "upper_left", type: "primary", conditions: [], procedures: [] },
        { number: "G", name: "Primary Upper Left Lateral Incisor", quadrant: "upper_left", type: "primary", conditions: [], procedures: [] },
        { number: "H", name: "Primary Upper Left Canine", quadrant: "upper_left", type: "primary", conditions: [], procedures: [] },
        { number: "I", name: "Primary Upper Left First Molar", quadrant: "upper_left", type: "primary", conditions: [], procedures: [] },
        { number: "J", name: "Primary Upper Left Second Molar", quadrant: "upper_left", type: "primary", conditions: [], procedures: [] },
        
        // Lower left (K-O)
        { number: "K", name: "Primary Lower Left Central Incisor", quadrant: "lower_left", type: "primary", conditions: [], procedures: [] },
        { number: "L", name: "Primary Lower Left Lateral Incisor", quadrant: "lower_left", type: "primary", conditions: [], procedures: [] },
        { number: "M", name: "Primary Lower Left Canine", quadrant: "lower_left", type: "primary", conditions: [], procedures: [] },
        { number: "N", name: "Primary Lower Left First Molar", quadrant: "lower_left", type: "primary", conditions: [], procedures: [] },
        { number: "O", name: "Primary Lower Left Second Molar", quadrant: "lower_left", type: "primary", conditions: [], procedures: [] },
        
        // Lower right (P-T)
        { number: "P", name: "Primary Lower Right Central Incisor", quadrant: "lower_right", type: "primary", conditions: [], procedures: [] },
        { number: "Q", name: "Primary Lower Right Lateral Incisor", quadrant: "lower_right", type: "primary", conditions: [], procedures: [] },
        { number: "R", name: "Primary Lower Right Canine", quadrant: "lower_right", type: "primary", conditions: [], procedures: [] },
        { number: "S", name: "Primary Lower Right First Molar", quadrant: "lower_right", type: "primary", conditions: [], procedures: [] },
        { number: "T", name: "Primary Lower Right Second Molar", quadrant: "lower_right", type: "primary", conditions: [], procedures: [] },
      ];
    } else {
      // Create default permanent teeth (1-32)
      return [
        // Upper right (1-8)
        { number: "1", name: "Upper Right Third Molar", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        { number: "2", name: "Upper Right Second Molar", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        { number: "3", name: "Upper Right First Molar", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        { number: "4", name: "Upper Right Second Premolar", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        { number: "5", name: "Upper Right First Premolar", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        { number: "6", name: "Upper Right Canine", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        { number: "7", name: "Upper Right Lateral Incisor", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        { number: "8", name: "Upper Right Central Incisor", quadrant: "upper_right", type: "permanent", conditions: [], procedures: [] },
        
        // Upper left (9-16)
        { number: "9", name: "Upper Left Central Incisor", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        { number: "10", name: "Upper Left Lateral Incisor", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        { number: "11", name: "Upper Left Canine", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        { number: "12", name: "Upper Left First Premolar", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        { number: "13", name: "Upper Left Second Premolar", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        { number: "14", name: "Upper Left First Molar", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        { number: "15", name: "Upper Left Second Molar", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        { number: "16", name: "Upper Left Third Molar", quadrant: "upper_left", type: "permanent", conditions: [], procedures: [] },
        
        // Lower left (17-24)
        { number: "17", name: "Lower Left Third Molar", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        { number: "18", name: "Lower Left Second Molar", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        { number: "19", name: "Lower Left First Molar", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        { number: "20", name: "Lower Left Second Premolar", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        { number: "21", name: "Lower Left First Premolar", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        { number: "22", name: "Lower Left Canine", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        { number: "23", name: "Lower Left Lateral Incisor", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        { number: "24", name: "Lower Left Central Incisor", quadrant: "lower_left", type: "permanent", conditions: [], procedures: [] },
        
        // Lower right (25-32)
        { number: "25", name: "Lower Right Central Incisor", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
        { number: "26", name: "Lower Right Lateral Incisor", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
        { number: "27", name: "Lower Right Canine", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
        { number: "28", name: "Lower Right First Premolar", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
        { number: "29", name: "Lower Right Second Premolar", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
        { number: "30", name: "Lower Right First Molar", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
        { number: "31", name: "Lower Right Second Molar", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
        { number: "32", name: "Lower Right Third Molar", quadrant: "lower_right", type: "permanent", conditions: [], procedures: [] },
      ];
    }
  };
  
  // Extract teeth from the dental chart based on the selected dentition type
  const teeth = isPediatric 
    ? (dentalChart?.primary_teeth?.length > 0 ? dentalChart.primary_teeth : createDefaultTeeth(true))
    : (dentalChart?.permanent_teeth?.length > 0 ? dentalChart.permanent_teeth : createDefaultTeeth(false));
  
  // Ensure teeth is always an array, even if undefined is passed
  const safeTeeth = Array.isArray(teeth) ? teeth : [];
  
  // Log the data to debug
  useEffect(() => {
    console.log("Dental Chart Data:", dentalChart);
    console.log("Current teeth array:", safeTeeth);
    console.log("Is Pediatric:", isPediatric);
  }, [dentalChart, safeTeeth, isPediatric]);
  
  // Group teeth by quadrant
  const upperRight = safeTeeth
    .filter(tooth => tooth?.quadrant === "upper_right")
    .sort((a, b) => {
      if (isPediatric) {
        // For primary teeth (letters), sort A-E
        return a.number.localeCompare(b.number);
      } else {
        // For permanent teeth (numbers), sort 8-1 (reversed for display)
        return Number(b.number) - Number(a.number);
      }
    });
  
  const upperLeft = safeTeeth
    .filter(tooth => tooth?.quadrant === "upper_left")
    .sort((a, b) => {
      if (isPediatric) {
        // For primary teeth (letters), sort F-J
        return a.number.localeCompare(b.number);
      } else {
        // For permanent teeth (numbers), sort 9-16
        return Number(a.number) - Number(b.number);
      }
    });
  
  const lowerLeft = safeTeeth
    .filter(tooth => tooth?.quadrant === "lower_left")
    .sort((a, b) => {
      if (isPediatric) {
        // For primary teeth (letters), sort K-O
        return a.number.localeCompare(b.number);
      } else {
        // For permanent teeth (numbers), sort 17-24
        return Number(a.number) - Number(b.number);
      }
    });
  
  const lowerRight = safeTeeth
    .filter(tooth => tooth?.quadrant === "lower_right")
    .sort((a, b) => {
      if (isPediatric) {
        // For primary teeth (letters), sort P-T
        return a.number.localeCompare(b.number);
      } else {
        // For permanent teeth (numbers), sort 32-25 (reversed for display)
        return Number(b.number) - Number(a.number);
      }
    });
  
  // Helper function to determine tooth color based on conditions
  const getToothColor = (tooth: Tooth) => {
    if (!tooth.conditions || tooth.conditions.length === 0) return "bg-white";
    
    // Priority: cavity > filling > other
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
  
  // Helper function to get tooltip content
  const getToothTooltip = (tooth: Tooth) => {
    const conditions = tooth.conditions && tooth.conditions.length > 0 
      ? tooth.conditions.map(c => c.condition_name).join(", ")
      : "";
      
    const procedures = tooth.procedures && tooth.procedures.length > 0
      ? tooth.procedures.map(p => p.procedure_name).join(", ")
      : "";
    
    return (
      <div className="text-sm">
        <p className="font-bold">{tooth.name} (#{tooth.number})</p>
        {conditions && <p><span className="font-semibold">Conditions:</span> {conditions}</p>}
        {procedures && <p><span className="font-semibold">Procedures:</span> {procedures}</p>}
        {!conditions && !procedures && <p>No conditions or procedures</p>}
      </div>
    );
  };
  
  const handleToggleDentition = () => {
    setIsPediatric(!isPediatric);
    // If there was a selected tooth, deselect it when switching dentition
    if (selectedTooth) {
      onToothSelect(null);
    }
  };
  
  return (
    <div className="dental-chart">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {isPediatric ? "Primary Dentition" : "Permanent Dentition"}
        </h3>
        <button 
          onClick={handleToggleDentition}
          className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
        >
          Switch to {isPediatric ? "Permanent" : "Primary"} Teeth
        </button>
      </div>
      
      {safeTeeth.length === 0 && (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No teeth data available for {isPediatric ? "primary" : "permanent"} dentition.</p>
        </div>
      )}
      
      {safeTeeth.length > 0 && (
        <div className="mx-auto max-w-3xl">
          {/* Quadrant labels */}
          <div className="grid grid-cols-2 text-center mb-2">
            <div className="text-sm font-medium">Upper Right Quadrant</div>
            <div className="text-sm font-medium">Upper Left Quadrant</div>
          </div>
          
          {/* Upper jaw */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Upper Right Quadrant */}
            <div className="flex justify-end">
              <div className="grid grid-cols-8 gap-1">
                {upperRight.map(tooth => (
                  <Tooltip key={tooth.number}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "w-10 h-14 border rounded-t-lg flex items-center justify-center font-bold text-sm",
                          getToothColor(tooth),
                          selectedTooth?.number === tooth.number && "ring-2 ring-blue-500"
                        )}
                        onClick={() => onToothSelect(tooth)}
                      >
                        {tooth.number}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {getToothTooltip(tooth)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
            
            {/* Upper Left Quadrant */}
            <div className="flex justify-start">
              <div className="grid grid-cols-8 gap-1">
                {upperLeft.map(tooth => (
                  <Tooltip key={tooth.number}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "w-10 h-14 border rounded-t-lg flex items-center justify-center font-bold text-sm",
                          getToothColor(tooth),
                          selectedTooth?.number === tooth.number && "ring-2 ring-blue-500"
                        )}
                        onClick={() => onToothSelect(tooth)}
                      >
                        {tooth.number}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {getToothTooltip(tooth)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
          
          {/* Lower jaw */}
          <div className="grid grid-cols-2 gap-2">
            {/* Lower Right Quadrant */}
            <div className="flex justify-end">
              <div className="grid grid-cols-8 gap-1">
                {lowerRight.map(tooth => (
                  <Tooltip key={tooth.number}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "w-10 h-14 border rounded-b-lg flex items-center justify-center font-bold text-sm",
                          getToothColor(tooth),
                          selectedTooth?.number === tooth.number && "ring-2 ring-blue-500"
                        )}
                        onClick={() => onToothSelect(tooth)}
                      >
                        {tooth.number}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {getToothTooltip(tooth)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
            
            {/* Lower Left Quadrant */}
            <div className="flex justify-start">
              <div className="grid grid-cols-8 gap-1">
                {lowerLeft.map(tooth => (
                  <Tooltip key={tooth.number}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "w-10 h-14 border rounded-b-lg flex items-center justify-center font-bold text-sm",
                          getToothColor(tooth),
                          selectedTooth?.number === tooth.number && "ring-2 ring-blue-500"
                        )}
                        onClick={() => onToothSelect(tooth)}
                      >
                        {tooth.number}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {getToothTooltip(tooth)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quadrant labels */}
          <div className="grid grid-cols-2 text-center mt-2">
            <div className="text-sm font-medium">Lower Right Quadrant</div>
            <div className="text-sm font-medium">Lower Left Quadrant</div>
          </div>
          
          {/* Legend */}
          <div className="mt-8 flex justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border rounded mr-2"></div>
              <span className="text-sm">Healthy</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-200 border rounded mr-2"></div>
              <span className="text-sm">Cavity</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-200 border rounded mr-2"></div>
              <span className="text-sm">Filling</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border rounded mr-2"></div>
              <span className="text-sm">Other Condition</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 