import { apiGet, apiPost, apiPatch, apiDelete } from "./api.utils";

export interface Tooth {
  id: number;
  number: string;
  universal_number: number;
  dentition_type: 'permanent' | 'primary';
  name: string;
  quadrant: string;
  conditions: ToothCondition[];
  procedures: ToothProcedure[];
}

export interface ToothCondition {
  id: number;
  condition_id: number;
  condition_name: string;
  condition_code: string;
  surface: string;
  notes?: string;
  severity?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ProcedureNote {
  id: number;
  note: string;
  appointment_date: string;
  created_by: string;
  created_at: string;
}

export interface ToothProcedure {
  id: number;
  procedure_name: string;
  procedure_code: string;
  surface: string;
  notes: ProcedureNote[];
  description: string;
  date_performed: string;
  price: string | number;
  status: string;
  performed_by: string;
}

export interface DentalChart {
  id: number;
  patient_id: number;
  patient_name: string;
  last_updated: string;
  permanent_teeth: Tooth[];
  primary_teeth: Tooth[];
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
  condition_id: number;
  surface: string;
  notes?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  dentition_type: 'permanent' | 'primary';
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
    toothNumber: string,
    conditionData: AddToothConditionData
  ): Promise<ToothCondition> => {
    const url = `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/condition/`;
    
    // Ensure dentition_type is set
    const payload = {
      ...conditionData,
      dentition_type: /^[A-Z]$/.test(toothNumber) ? 'primary' : 'permanent'
    };

    return apiPost(url, payload);
  },

  // Add procedure to tooth
  addToothProcedure: async (
    clinicId: string,
    patientId: string,
    toothNumber: string,
    procedureData: {
      procedure_id: number;
      surface: string;
      notes?: string;
      date_performed: string;
      price?: number | string;
      status: string;
    }
  ): Promise<ToothProcedure> => {
    // Ensure price is a number before sending to API
    const payload = {
      ...procedureData,
      price: procedureData.price ? Number(procedureData.price) : undefined
    };

    return apiPost(
      `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/procedure/`,
      payload
    );
  },

  // Get chart history
  getChartHistory: async (
    clinicId: string,
    patientId: string,
    filters?: {
      tooth_number?: string;
      category?: 'conditions' | 'procedures';
      start_date?: string;
      end_date?: string;
    }
  ): Promise<ChartHistoryResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.tooth_number) queryParams.append('tooth_number', filters.tooth_number);
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.start_date) queryParams.append('start_date', filters.start_date);
    if (filters?.end_date) queryParams.append('end_date', filters.end_date);

    const url = `/clinics/${clinicId}/patients/${patientId}/dental-chart/history/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    return apiGet(url);
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
  },

  // Update tooth procedure
  updateToothProcedure: async (
    clinicId: string,
    patientId: string,
    toothNumber: string,
    procedureId: number,
    updateData: {
      surface?: string;
      notes?: string;
      date_performed?: string;
      price?: number | string;
      status?: string;
    }
  ): Promise<ToothProcedure> => {
    // Ensure price is a number before sending to API
    const payload = {
      ...updateData,
      price: updateData.price ? Number(updateData.price) : undefined
    };

    return apiPatch(
      `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/procedure/${procedureId}/`,
      payload
    );
  },

  // Delete tooth procedure
  deleteToothProcedure: async (
    clinicId: string,
    patientId: string,
    toothNumber: string,
    procedureId: number
  ): Promise<void> => {
    return apiDelete(
      `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/procedure/${procedureId}/`
    );
  },

  // Add procedure note
  addProcedureNote: async (
    clinicId: string,
    patientId: string,
    toothNumber: string,
    procedureId: number,
    data: {
      note: string;
      appointment_date: string;
    }
  ): Promise<ProcedureNote> => {
    return apiPost(
      `/clinics/${clinicId}/patients/${patientId}/dental-chart/tooth/${toothNumber}/procedure/${procedureId}/notes/`,
      data
    );
  },

  // Add general procedure
  addGeneralProcedure: async (
    clinicId: string,
    patientId: string,
    procedureData: {
      procedure_id: number;
      notes?: string;
      date_performed: string;
      price?: number;
      status: string;
    }
  ): Promise<any> => {
    return apiPost(
      `/clinics/${clinicId}/patients/${patientId}/general-procedures/`,
      procedureData
    );
  }
};

export default dentalChartService; 