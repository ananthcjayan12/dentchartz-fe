"use client";

import { useState } from "react";
import { Tooth } from "@/services/dental-chart.service";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DentalChartViewerProps {
  teeth: Tooth[];
  onToothSelect: (tooth: Tooth) => void;
  selectedTooth: Tooth | null;
}

export function DentalChartViewer({ teeth, onToothSelect, selectedTooth }: DentalChartViewerProps) {
  // Group teeth by quadrant
  const upperRight = teeth.filter(tooth => tooth.quadrant === "upper_right").sort((a, b) => a.number - b.number);
  const upperLeft = teeth.filter(tooth => tooth.quadrant === "upper_left").sort((a, b) => a.number - b.number);
  const lowerRight = teeth.filter(tooth => tooth.quadrant === "lower_right").sort((a, b) => a.number - b.number);
  const lowerLeft = teeth.filter(tooth => tooth.quadrant === "lower_left").sort((a, b) => a.number - b.number);
  
  // Helper function to determine tooth color based on conditions
  const getToothColor = (tooth: Tooth) => {
    if (tooth.conditions.length === 0) return "bg-white";
    
    // Priority: cavity > filling > other
    const hasCavity = tooth.conditions.some(c => c.condition_name.toLowerCase().includes("cavity"));
    const hasFilling = tooth.conditions.some(c => c.condition_name.toLowerCase().includes("filling"));
    
    if (hasCavity) return "bg-red-200";
    if (hasFilling) return "bg-blue-200";
    return "bg-yellow-100";
  };
  
  // Helper function to get tooltip content
  const getToothTooltip = (tooth: Tooth) => {
    const conditions = tooth.conditions.map(c => c.condition_name).join(", ");
    const procedures = tooth.procedures.map(p => p.procedure_name).join(", ");
    
    return (
      <div className="text-sm">
        <p className="font-bold">{tooth.name} (#{tooth.number})</p>
        {conditions && <p><span className="font-semibold">Conditions:</span> {conditions}</p>}
        {procedures && <p><span className="font-semibold">Procedures:</span> {procedures}</p>}
        {!conditions && !procedures && <p>No conditions or procedures</p>}
      </div>
    );
  };
  
  return (
    <div className="dental-chart">
      <TooltipProvider>
        {/* Upper Jaw */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-8 gap-1">
            {upperRight.map(tooth => (
              <Tooltip key={tooth.number}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-12 h-16 border rounded-t-lg flex items-center justify-center font-bold",
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
            {upperLeft.map(tooth => (
              <Tooltip key={tooth.number}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-12 h-16 border rounded-t-lg flex items-center justify-center font-bold",
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
        
        {/* Lower Jaw */}
        <div className="flex justify-center">
          <div className="grid grid-cols-8 gap-1">
            {lowerRight.map(tooth => (
              <Tooltip key={tooth.number}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-12 h-16 border rounded-b-lg flex items-center justify-center font-bold",
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
            {lowerLeft.map(tooth => (
              <Tooltip key={tooth.number}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-12 h-16 border rounded-b-lg flex items-center justify-center font-bold",
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
      </TooltipProvider>
    </div>
  );
} 