import { apiGet, apiPost, apiPatch, apiDelete } from "./api.utils";

export interface Tooth {
  number: number;
  name: string;
  quadrant: string;
  type: string;
  conditions: ToothCondition[];
  procedures: ToothProcedure[];
}

export interface ToothCondition {
  id: number;
  condition_id: number;
  condition_name: string;
  surface: string;
  notes: string;
  severity?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

export interface ToothProcedure {
  id: number;
  procedure_id: number;
  procedure_name: string;
  procedure_code: string;
  surface: string;
  notes: string;
  date_performed: string;
  performed_by: string;
  price: number;
  status: string;
  created_at: string;
}

export interface DentalChart {
  id: number;
  patient_id: number;
  patient_name: string;
  last_updated: string;
  teeth: Tooth[];
}

export interface DentalCondition {
  id: number;
  name: string;
  code: string;
  description: string;
  color_code: string;
  icon: string;
}

export interface DentalProcedure {
  id: number;
  name: string;
  code: string;
  description: string;
  category: string;
  default_price: number;
  duration_minutes: number;
}

export interface ChartHistoryEntry {
  id: number;
  date: string;
  user: string;
  action: string;
  tooth_number: number;
  details: any;
}

export interface ChartHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChartHistoryEntry[];
}

export interface ConditionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DentalCondition[];
}

export interface ProceduresResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DentalProcedure[];
}

export interface AddToothConditionData {
  condition_id?: number;
  custom_name?: string;
  custom_code?: string;
  custom_description?: string;
  surface: string;
  notes?: string;
  severity?: string;
}

export const dentalChartService = {
  // Get patient's dental chart
  getPatientDentalChart: async (clinicId: string, patientId: string): Promise<DentalChart> => {
    return apiGet(`/clinics/${clinicId}/patients/${patientId}/dental-chart/`);
  },

  // Get all dental conditions
  getDentalConditions: async (clinicId: string): Promise<ConditionsResponse> => {
    return apiGet(`/clinics/${clinicId}/dental-conditions/`);
  },

  // Get all dental procedures
  getDentalProcedures: async (clinicId: string): Promise<ProceduresResponse> => {
    return apiGet(`/clinics/${clinicId}/dental-procedures/`);
  },

  // Add condition to tooth
  addToothCondition: async (
    clinicId: string,
    patientId: string,
    toothNumber: number,
    conditionData: AddToothConditionData
  ): Promise<ToothCondition> => {
    console.log("Adding tooth condition:", {
      clinicId,
      patientId,
      toothNumber,
      conditionData
    });

    const url = `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/condition/`;
    
    try {
      const response = await apiPost(url, conditionData);
      console.log("API response:", response);
      return response;
    } catch (error) {
      console.error("Error in addToothCondition:", error);
      throw error;
    }
  },

  // Add procedure to tooth
  addToothProcedure: async (
    clinicId: string,
    patientId: string,
    toothNumber: number,
    procedureData: {
      procedure_id: number;
      surface: string;
      notes?: string;
      date_performed: string;
      price?: number;
      status: string;
    }
  ): Promise<ToothProcedure> => {
    return apiPost(
      `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/procedure/`,
      procedureData
    );
  },

  // Get chart history
  getChartHistory: async (clinicId: string, patientId: string): Promise<ChartHistoryResponse> => {
    return apiGet(`/clinics/${clinicId}/patients/${patientId}/dental-chart/history/`);
  },

  // Update tooth condition
  updateToothCondition: async (
    clinicId: string,
    patientId: string,
    toothNumber: number,
    conditionId: number,
    updateData: {
      surface?: string;
      notes?: string;
      severity?: string;
    }
  ): Promise<ToothCondition> => {
    return apiPatch(
      `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/condition/${conditionId}/`,
      updateData
    );
  },

  // Delete tooth condition
  deleteToothCondition: async (
    clinicId: string,
    patientId: string,
    toothNumber: number,
    conditionId: number
  ): Promise<void> => {
    return apiDelete(
      `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/condition/${conditionId}/`
    );
  }
};

export default dentalChartService; 