"use client";

import { ToothData, ToothCondition, ToothProcedure } from "@/services/dentalChart.service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ToothProps {
  tooth: ToothData;
  conditions: { id: string; color: string; name: string }[];
  procedures: { id: string; color: string; name: string }[];
  isSelected: boolean;
  onClick: () => void;
}

export function Tooth({ tooth, conditions, procedures, isSelected, onClick }: ToothProps) {
  // Get the primary color for the tooth (first condition or white)
  const primaryColor = conditions.length > 0 ? conditions[0].color : "white";
  
  // Create a tooltip content with all conditions and procedures
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

  // Determine the tooth shape based on type
  const getToothPath = () => {
    switch (tooth.type) {
      case 'molar':
        return (
          <>
            {/* Base tooth shape */}
            <path 
              d="M2 2 L18 2 L18 18 L2 18 Z" 
              fill={primaryColor} 
              stroke="black" 
              strokeWidth="1"
            />
            {/* Tooth details - occlusal surface */}
            <path 
              d="M6 6 L14 6 L14 14 L6 14 Z" 
              fill="none" 
              stroke="black" 
              strokeWidth="0.5"
            />
            <path 
              d="M6 6 L14 14 M14 6 L6 14" 
              fill="none" 
              stroke="black" 
              strokeWidth="0.5"
            />
            
            {/* Show procedure markers if any */}
            {procedures.length > 0 && (
              <circle 
                cx="10" 
                cy="10" 
                r="3" 
                fill={procedures[0].color} 
                stroke="black" 
                strokeWidth="0.5"
              />
            )}
          </>
        );
      case 'premolar':
        return (
          <>
            <path 
              d="M5 2 L15 2 L18 18 L2 18 Z" 
              fill={primaryColor} 
              stroke="black" 
              strokeWidth="1"
            />
            {/* Tooth details - occlusal surface */}
            <path 
              d="M7 7 L13 7 L13 13 L7 13 Z" 
              fill="none" 
              stroke="black" 
              strokeWidth="0.5"
            />
            
            {/* Show procedure markers if any */}
            {procedures.length > 0 && (
              <circle 
                cx="10" 
                cy="10" 
                r="2.5" 
                fill={procedures[0].color} 
                stroke="black" 
                strokeWidth="0.5"
              />
            )}
          </>
        );
      case 'canine':
        return (
          <>
            <path 
              d="M10 2 L15 8 L10 18 L5 8 Z" 
              fill={primaryColor} 
              stroke="black" 
              strokeWidth="1"
            />
            
            {/* Show procedure markers if any */}
            {procedures.length > 0 && (
              <circle 
                cx="10" 
                cy="10" 
                r="2.5" 
                fill={procedures[0].color} 
                stroke="black" 
                strokeWidth="0.5"
              />
            )}
          </>
        );
      case 'incisor':
        return (
          <>
            <path 
              d="M5 2 L15 2 L13 18 L7 18 Z" 
              fill={primaryColor} 
              stroke="black" 
              strokeWidth="1"
            />
            
            {/* Show procedure markers if any */}
            {procedures.length > 0 && (
              <circle 
                cx="10" 
                cy="10" 
                r="2.5" 
                fill={procedures[0].color} 
                stroke="black" 
                strokeWidth="0.5"
              />
            )}
          </>
        );
      default:
        return (
          <>
            <rect 
              x="2" 
              y="2" 
              width="16" 
              height="16" 
              fill={primaryColor} 
              stroke="black" 
              strokeWidth="1"
            />
            
            {/* Show procedure markers if any */}
            {procedures.length > 0 && (
              <circle 
                cx="10" 
                cy="10" 
                r="3" 
                fill={procedures[0].color} 
                stroke="black" 
                strokeWidth="0.5"
              />
            )}
          </>
        );
    }
  };

  // Add visual indicators for multiple conditions
  const getConditionIndicators = () => {
    if (conditions.length <= 1) return null;
    
    return (
      <g>
        {conditions.slice(1).map((condition, index) => (
          <circle 
            key={condition.id}
            cx={4 + (index * 4)} 
            cy="4" 
            r="1.5" 
            fill={condition.color} 
            stroke="black" 
            strokeWidth="0.5"
          />
        ))}
      </g>
    );
  };

  // Add visual indicators for multiple procedures
  const getProcedureIndicators = () => {
    if (procedures.length <= 1) return null;
    
    return (
      <g>
        {procedures.slice(1).map((procedure, index) => (
          <circle 
            key={procedure.id}
            cx={16 - (index * 4)} 
            cy="16" 
            r="1.5" 
            fill={procedure.color} 
            stroke="black" 
            strokeWidth="0.5"
          />
        ))}
      </g>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`tooth-container cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            onClick={onClick}
          >
            <svg viewBox="0 0 20 20" className="w-full h-auto">
              {getToothPath()}
              {getConditionIndicators()}
              {getProcedureIndicators()}
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 