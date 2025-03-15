"use client";

import { ToothData } from "@/services/dentalChart.service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";

interface RealisticToothProps {
  tooth: ToothData;
  conditions: { id: string; color: string; name: string }[];
  procedures: { id: string; color: string; name: string }[];
  isSelected: boolean;
  onClick: () => void;
}

export function RealisticTooth({ 
  tooth, 
  conditions, 
  procedures, 
  isSelected, 
  onClick 
}: RealisticToothProps) {
  // Get tooth type for image selection
  const getToothImage = () => {
    const quadrant = tooth.quadrant;
    const isUpper = quadrant === 1 || quadrant === 2;
    
    switch (tooth.type) {
      case 'molar':
        return `/images/teeth/${isUpper ? 'upper' : 'lower'}_molar.png`;
      case 'premolar':
        return `/images/teeth/${isUpper ? 'upper' : 'lower'}_premolar.png`;
      case 'canine':
        return `/images/teeth/${isUpper ? 'upper' : 'lower'}_canine.png`;
      case 'incisor':
        return `/images/teeth/${isUpper ? 'upper' : 'lower'}_incisor.png`;
      default:
        return `/images/teeth/${isUpper ? 'upper' : 'lower'}_molar.png`;
    }
  };

  // Create tooltip content with all conditions and procedures
  const tooltipContent = () => {
    return (
      <div className="space-y-2 p-1">
        <p className="font-semibold">Tooth {tooth.number}</p>
        {conditions.length > 0 && (
          <div>
            <p className="text-xs font-medium">Conditions:</p>
            <ul className="text-xs list-disc pl-3">
              {conditions.map(c => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
        )}
        {procedures.length > 0 && (
          <div>
            <p className="text-xs font-medium">Procedures:</p>
            <ul className="text-xs list-disc pl-3">
              {procedures.map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        )}
        {conditions.length === 0 && procedures.length === 0 && (
          <p className="text-xs">No conditions or procedures</p>
        )}
      </div>
    );
  };

  // Determine if we need to show condition indicators
  const hasConditions = conditions.length > 0;
  
  // Determine if we need to show procedure indicators
  const hasProcedures = procedures.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`tooth-container relative cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 rounded-md' : ''}`}
            onClick={onClick}
          >
            {/* Fallback SVG if images aren't available */}
            <div className="relative w-full h-full">
              <svg viewBox="0 0 40 60" className="w-full h-auto">
                {/* Base tooth shape */}
                <path 
                  d="M20 5 L30 10 L35 25 L30 45 L20 55 L10 45 L5 25 L10 10 Z" 
                  fill="white" 
                  stroke="#ccc" 
                  strokeWidth="1"
                />
                
                {/* Condition overlay */}
                {hasConditions && (
                  <path 
                    d="M20 5 L30 10 L35 25 L30 45 L20 55 L10 45 L5 25 L10 10 Z" 
                    fill={conditions[0].color} 
                    opacity="0.5"
                    stroke="none"
                  />
                )}
                
                {/* Procedure indicator */}
                {hasProcedures && (
                  <circle 
                    cx="20" 
                    cy="30" 
                    r="8" 
                    fill={procedures[0].color} 
                    opacity="0.7"
                    stroke="#333" 
                    strokeWidth="0.5"
                  />
                )}
                
                {/* Multiple conditions indicators */}
                {conditions.length > 1 && conditions.slice(1).map((condition, index) => (
                  <circle 
                    key={condition.id}
                    cx={10 + (index * 5)} 
                    cy="10" 
                    r="3" 
                    fill={condition.color} 
                    stroke="#333" 
                    strokeWidth="0.5"
                  />
                ))}
                
                {/* Multiple procedures indicators */}
                {procedures.length > 1 && procedures.slice(1).map((procedure, index) => (
                  <circle 
                    key={procedure.id}
                    cx={30 - (index * 5)} 
                    cy="50" 
                    r="3" 
                    fill={procedure.color} 
                    stroke="#333" 
                    strokeWidth="0.5"
                  />
                ))}
              </svg>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 