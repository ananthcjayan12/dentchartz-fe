import { dentalChartService, Tooth, AddToothConditionData } from "./dental-chart.service";

export interface MultiSelectConditionData {
  condition_id: number;
  surface: string;
  notes?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface MultiSelectProcedureData {
  procedure_id: number;
  surface: string;
  notes?: string;
  date_performed: string;
  price?: number;
  status: string;
}

export const dentalChartMultiSelectService = {
  // Add condition to multiple teeth
  addConditionToMultipleTeeth: async (
    clinicId: string,
    patientId: string,
    teeth: Tooth[],
    conditionData: MultiSelectConditionData
  ): Promise<{ success: Tooth[]; failed: { tooth: Tooth; error: string }[] }> => {
    const results = {
      success: [] as Tooth[],
      failed: [] as { tooth: Tooth; error: string }[]
    };

    for (const tooth of teeth) {
      try {
        const addConditionData: AddToothConditionData = {
          condition_id: conditionData.condition_id,
          surface: conditionData.surface,
          notes: conditionData.notes,
          severity: conditionData.severity,
          dentition_type: tooth.dentition_type
        };

        await dentalChartService.addToothCondition(
          clinicId,
          patientId,
          tooth.number,
          addConditionData
        );

        results.success.push(tooth);
      } catch (error) {
        results.failed.push({
          tooth,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  },

  // Add procedure to multiple teeth
  addProcedureToMultipleTeeth: async (
    clinicId: string,
    patientId: string,
    teeth: Tooth[],
    procedureData: MultiSelectProcedureData
  ): Promise<{ success: Tooth[]; failed: { tooth: Tooth; error: string }[] }> => {
    const results = {
      success: [] as Tooth[],
      failed: [] as { tooth: Tooth; error: string }[]
    };

    for (const tooth of teeth) {
      try {
        await dentalChartService.addToothProcedure(
          clinicId,
          patientId,
          tooth.number,
          {
            procedure_id: procedureData.procedure_id,
            surface: procedureData.surface,
            notes: procedureData.notes,
            date_performed: procedureData.date_performed,
            price: procedureData.price,
            status: procedureData.status
          }
        );

        results.success.push(tooth);
      } catch (error) {
        results.failed.push({
          tooth,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  },

  // Batch operations with progress tracking
  addConditionToMultipleTeethWithProgress: async (
    clinicId: string,
    patientId: string,
    teeth: Tooth[],
    conditionData: MultiSelectConditionData,
    onProgress?: (completed: number, total: number, currentTooth: Tooth) => void
  ): Promise<{ success: Tooth[]; failed: { tooth: Tooth; error: string }[] }> => {
    const results = {
      success: [] as Tooth[],
      failed: [] as { tooth: Tooth; error: string }[]
    };

    for (let i = 0; i < teeth.length; i++) {
      const tooth = teeth[i];
      
      try {
        const addConditionData: AddToothConditionData = {
          condition_id: conditionData.condition_id,
          surface: conditionData.surface,
          notes: conditionData.notes,
          severity: conditionData.severity,
          dentition_type: tooth.dentition_type
        };

        await dentalChartService.addToothCondition(
          clinicId,
          patientId,
          tooth.number,
          addConditionData
        );

        results.success.push(tooth);
      } catch (error) {
        results.failed.push({
          tooth,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, teeth.length, tooth);
      }
    }

    return results;
  },

  addProcedureToMultipleTeethWithProgress: async (
    clinicId: string,
    patientId: string,
    teeth: Tooth[],
    procedureData: MultiSelectProcedureData,
    onProgress?: (completed: number, total: number, currentTooth: Tooth) => void
  ): Promise<{ success: Tooth[]; failed: { tooth: Tooth; error: string }[] }> => {
    const results = {
      success: [] as Tooth[],
      failed: [] as { tooth: Tooth; error: string }[]
    };

    for (let i = 0; i < teeth.length; i++) {
      const tooth = teeth[i];
      
      try {
        await dentalChartService.addToothProcedure(
          clinicId,
          patientId,
          tooth.number,
          {
            procedure_id: procedureData.procedure_id,
            surface: procedureData.surface,
            notes: procedureData.notes,
            date_performed: procedureData.date_performed,
            price: procedureData.price,
            status: procedureData.status
          }
        );

        results.success.push(tooth);
      } catch (error) {
        results.failed.push({
          tooth,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, teeth.length, tooth);
      }
    }

    return results;
  }
}; 