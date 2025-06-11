"use client";

import { useState, useEffect } from "react";
import { EnhancedDentalChartViewer } from "./EnhancedDentalChartViewer";
import { Tooth } from "@/services/dental-chart.service";
import { dentalChartMultiSelectService } from "@/services/dental-chart-multi-select.service";
import { Badge } from "@/components/ui/badge";

interface ExampleUsageProps {
  clinicId: string;
  patientId: string;
  teeth: Tooth[];
  conditions: {
    id: number;
    name: string;
    code: string;
    description: string;
    color_code: string;
  }[];
  procedures: {
    id: number;
    name: string;
    code: string;
    description: string;
    category: string;
    default_price: number;
  }[];
  onTeethUpdate?: () => void;
}

export function ExampleUsage({
  clinicId,
  patientId,
  teeth,
  conditions,
  procedures,
  onTeethUpdate
}: ExampleUsageProps) {
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToothSelect = (tooth: Tooth) => {
    setSelectedTooth(tooth);
  };

  const handleAddConditionToMultiple = async (selectedTeeth: Tooth[], conditionData: any) => {
    setIsLoading(true);
    
    try {
      const result = await dentalChartMultiSelectService.addConditionToMultipleTeethWithProgress(
        clinicId,
        patientId,
        selectedTeeth,
        conditionData,
        (completed, total, currentTooth) => {
          // You can show progress here
          console.log(`Progress: ${completed}/${total} - Processing tooth ${currentTooth.number}`);
        }
      );

      if (result.success.length > 0) {
        console.log(`Conditions Added Successfully: Added condition to ${result.success.length} teeth`);
      }

      if (result.failed.length > 0) {
        console.error(`Some Operations Failed: Failed to add condition to ${result.failed.length} teeth`);
      }

      // Refresh the teeth data
      if (onTeethUpdate) {
        onTeethUpdate();
      }

    } catch (error) {
      console.error("Failed to add conditions to teeth", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProcedureToMultiple = async (selectedTeeth: Tooth[], procedureData: any) => {
    setIsLoading(true);
    
    try {
      const result = await dentalChartMultiSelectService.addProcedureToMultipleTeethWithProgress(
        clinicId,
        patientId,
        selectedTeeth,
        procedureData,
        (completed, total, currentTooth) => {
          // You can show progress here
          console.log(`Progress: ${completed}/${total} - Processing tooth ${currentTooth.number}`);
        }
      );

      if (result.success.length > 0) {
        console.log(`Procedures Added Successfully: Added procedure to ${result.success.length} teeth`);
      }

      if (result.failed.length > 0) {
        console.error(`Some Operations Failed: Failed to add procedure to ${result.failed.length} teeth`);
      }

      // Refresh the teeth data
      if (onTeethUpdate) {
        onTeethUpdate();
      }

    } catch (error) {
      console.error("Failed to add procedures to teeth", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Processing...
          </Badge>
        </div>
      )}

      {/* Enhanced Dental Chart */}
      <EnhancedDentalChartViewer
        teeth={teeth}
        onToothSelect={handleToothSelect}
        selectedTooth={selectedTooth}
        conditions={conditions}
        procedures={procedures}
        onAddConditionToMultiple={handleAddConditionToMultiple}
        onAddProcedureToMultiple={handleAddProcedureToMultiple}
        onGeneralProcedureClick={() => {
          // Handle general procedure click
          console.log("Add general procedure clicked");
        }}
      />

      {/* Selected Tooth Details (if any) */}
      {selectedTooth && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            Selected Tooth: {selectedTooth.name} (#{selectedTooth.number})
          </h3>
          
          {selectedTooth.conditions && selectedTooth.conditions.length > 0 && (
            <div className="mb-2">
              <p className="font-medium">Conditions:</p>
              <ul className="list-disc list-inside">
                {selectedTooth.conditions.map((condition, index) => (
                  <li key={index} className="text-sm">
                    {condition.condition_name} ({condition.surface})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedTooth.procedures && selectedTooth.procedures.length > 0 && (
            <div>
              <p className="font-medium">Procedures:</p>
              <ul className="list-disc list-inside">
                {selectedTooth.procedures.map((procedure, index) => (
                  <li key={index} className="text-sm">
                    {procedure.procedure_name} ({procedure.surface}) - {procedure.status}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!selectedTooth.conditions || selectedTooth.conditions.length === 0) &&
           (!selectedTooth.procedures || selectedTooth.procedures.length === 0) && (
            <p className="text-gray-500">No conditions or procedures recorded</p>
          )}
        </div>
      )}
    </div>
  );
} 