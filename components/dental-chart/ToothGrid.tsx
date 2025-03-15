"use client";

import { ToothData, ToothCondition, ToothProcedure } from "@/services/dentalChart.service";
import { RealisticTooth } from "./RealisticTooth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ToothGridProps {
  teeth: ToothData[];
  conditions: ToothCondition[];
  procedures: ToothProcedure[];
  onToothClick: (tooth: ToothData) => void;
  selectedTooth?: ToothData | null;
  isPediatric: boolean;
  onPediatricChange: (checked: boolean) => void;
}

export function ToothGrid({
  teeth,
  conditions,
  procedures,
  onToothClick,
  selectedTooth,
  isPediatric,
  onPediatricChange
}: ToothGridProps) {
  // Group teeth by quadrant
  const upperRight = teeth.filter(tooth => tooth.quadrant === 1).sort((a, b) => b.number - a.number);
  const upperLeft = teeth.filter(tooth => tooth.quadrant === 2).sort((a, b) => a.number - b.number);
  const lowerLeft = teeth.filter(tooth => tooth.quadrant === 3).sort((a, b) => a.number - b.number);
  const lowerRight = teeth.filter(tooth => tooth.quadrant === 4).sort((a, b) => b.number - a.number);

  // Get condition colors for a tooth
  const getToothConditions = (tooth: ToothData) => {
    return tooth.conditions.map(conditionId => {
      const condition = conditions.find(c => c.id === conditionId);
      return condition ? { id: condition.id, color: condition.color, name: condition.name } : null;
    }).filter(Boolean);
  };

  // Get procedure colors for a tooth
  const getToothProcedures = (tooth: ToothData) => {
    return tooth.procedures.map(procedureId => {
      const procedure = procedures.find(p => p.id === procedureId);
      return procedure ? { id: procedure.id, color: procedure.color, name: procedure.name } : null;
    }).filter(Boolean);
  };

  return (
    <div className="dental-chart">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="pediatric" 
            checked={isPediatric} 
            onCheckedChange={onPediatricChange} 
          />
          <Label htmlFor="pediatric">Pediatric</Label>
        </div>
        
        <div className="text-right">
          <button className="text-blue-500 hover:underline">
            Treatment Plan
          </button>
        </div>
      </div>
      
      {/* Upper Teeth */}
      <div className="grid grid-cols-16 gap-1 mb-2">
        {upperRight.map(tooth => (
          <RealisticTooth
            key={tooth.number}
            tooth={tooth}
            conditions={getToothConditions(tooth)}
            procedures={getToothProcedures(tooth)}
            isSelected={selectedTooth?.number === tooth.number}
            onClick={() => onToothClick(tooth)}
          />
        ))}
        {upperLeft.map(tooth => (
          <RealisticTooth
            key={tooth.number}
            tooth={tooth}
            conditions={getToothConditions(tooth)}
            procedures={getToothProcedures(tooth)}
            isSelected={selectedTooth?.number === tooth.number}
            onClick={() => onToothClick(tooth)}
          />
        ))}
      </div>
      
      {/* Tooth Numbers - Upper */}
      <div className="grid grid-cols-16 gap-1 mb-6 text-xs text-center">
        {upperRight.map(tooth => (
          <div key={tooth.number} className="rounded-full bg-gray-200 w-6 h-6 flex items-center justify-center mx-auto">
            {tooth.number}
          </div>
        ))}
        {upperLeft.map(tooth => (
          <div key={tooth.number} className="rounded-full bg-gray-200 w-6 h-6 flex items-center justify-center mx-auto">
            {tooth.number}
          </div>
        ))}
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-300 my-4"></div>
      
      {/* Tooth Numbers - Lower */}
      <div className="grid grid-cols-16 gap-1 mb-2 text-xs text-center">
        {lowerRight.map(tooth => (
          <div key={tooth.number} className="rounded-full bg-gray-200 w-6 h-6 flex items-center justify-center mx-auto">
            {tooth.number}
          </div>
        ))}
        {lowerLeft.map(tooth => (
          <div key={tooth.number} className="rounded-full bg-gray-200 w-6 h-6 flex items-center justify-center mx-auto">
            {tooth.number}
          </div>
        ))}
      </div>
      
      {/* Lower Teeth */}
      <div className="grid grid-cols-16 gap-1">
        {lowerRight.map(tooth => (
          <RealisticTooth
            key={tooth.number}
            tooth={tooth}
            conditions={getToothConditions(tooth)}
            procedures={getToothProcedures(tooth)}
            isSelected={selectedTooth?.number === tooth.number}
            onClick={() => onToothClick(tooth)}
          />
        ))}
        {lowerLeft.map(tooth => (
          <RealisticTooth
            key={tooth.number}
            tooth={tooth}
            conditions={getToothConditions(tooth)}
            procedures={getToothProcedures(tooth)}
            isSelected={selectedTooth?.number === tooth.number}
            onClick={() => onToothClick(tooth)}
          />
        ))}
      </div>
    </div>
  );
} 