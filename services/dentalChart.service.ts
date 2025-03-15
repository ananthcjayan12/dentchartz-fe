import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface ToothCondition {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface ToothProcedure {
  id: string;
  name: string;
  color: string;
  description: string;
  price: number;
}

export interface ToothData {
  id: number;
  number: number;
  quadrant: 1 | 2 | 3 | 4;
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  conditions: string[]; // Array of condition IDs
  procedures: string[]; // Array of procedure IDs
  notes?: string;
}

export interface DentalChart {
  id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  teeth: ToothData[];
  notes?: string;
}

export interface ChartHistoryEntry {
  id: string;
  chart_id: string;
  tooth_number: number;
  procedure_id: string | null;
  procedure_name: string | null;
  condition_id: string | null;
  condition_name: string | null;
  notes: string | null;
  status: string | null;
  created_at: string;
  created_by: string;
  created_by_name: string;
}

// Mock data for testing
const MOCK_CONDITIONS: ToothCondition[] = [
  { id: "1", name: "Decay", color: "#FF5733", description: "Tooth decay or cavity" },
  { id: "2", name: "Missing", color: "#C70039", description: "Missing tooth" },
  { id: "3", name: "Filled", color: "#900C3F", description: "Tooth has been filled" },
  { id: "4", name: "Crown", color: "#581845", description: "Tooth has a crown" },
  { id: "5", name: "Bridge", color: "#2471A3", description: "Dental bridge" },
  { id: "6", name: "Implant", color: "#148F77", description: "Dental implant" },
  { id: "7", name: "Root Canal", color: "#D4AC0D", description: "Root canal treatment" },
  { id: "8", name: "Fractured", color: "#CB4335", description: "Fractured tooth" },
];

const MOCK_PROCEDURES: ToothProcedure[] = [
  { id: "1", name: "Examination", color: "#3498DB", description: "Dental examination", price: 50 },
  { id: "2", name: "Cleaning", color: "#2ECC71", description: "Dental cleaning", price: 80 },
  { id: "3", name: "Filling", color: "#F1C40F", description: "Dental filling", price: 120 },
  { id: "4", name: "Extraction", color: "#E74C3C", description: "Tooth extraction", price: 150 },
  { id: "5", name: "Root Canal", color: "#9B59B6", description: "Root canal treatment", price: 500 },
  { id: "6", name: "Crown", color: "#34495E", description: "Dental crown", price: 800 },
  { id: "7", name: "Bridge", color: "#1ABC9C", description: "Dental bridge", price: 1200 },
  { id: "8", name: "Implant", color: "#D35400", description: "Dental implant", price: 2000 },
];

// Generate a full set of teeth for a dental chart
const generateTeeth = (): ToothData[] => {
  const teeth: ToothData[] = [];
  
  // Adult teeth are numbered 1-32
  for (let i = 1; i <= 32; i++) {
    let quadrant: 1 | 2 | 3 | 4;
    let type: 'molar' | 'premolar' | 'canine' | 'incisor';
    
    // Determine quadrant
    if (i >= 1 && i <= 8) quadrant = 1;
    else if (i >= 9 && i <= 16) quadrant = 2;
    else if (i >= 17 && i <= 24) quadrant = 3;
    else quadrant = 4;
    
    // Determine tooth type
    if ([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(i)) type = 'molar';
    else if ([4, 5, 12, 13, 20, 21, 28, 29].includes(i)) type = 'premolar';
    else if ([6, 11, 22, 27].includes(i)) type = 'canine';
    else type = 'incisor';
    
    teeth.push({
      id: i,
      number: i,
      quadrant,
      type,
      conditions: [],
      procedures: [],
    });
  }
  
  return teeth;
};

const MOCK_CHARTS: Record<string, DentalChart> = {
  "1": {
    id: "1",
    patient_id: "1",
    created_at: "2023-01-15T10:30:00Z",
    updated_at: "2023-06-20T14:45:00Z",
    teeth: generateTeeth(),
    notes: "Patient has good oral hygiene"
  },
  "2": {
    id: "2",
    patient_id: "2",
    created_at: "2023-02-10T09:15:00Z",
    updated_at: "2023-05-18T11:20:00Z",
    teeth: generateTeeth(),
    notes: "Patient needs to improve flossing"
  }
};

// Add some conditions and procedures to the mock charts
MOCK_CHARTS["1"].teeth[0].conditions = ["1"]; // Decay on tooth 1
MOCK_CHARTS["1"].teeth[0].procedures = ["3"]; // Filling on tooth 1
MOCK_CHARTS["1"].teeth[15].conditions = ["2"]; // Missing tooth 16
MOCK_CHARTS["2"].teeth[4].conditions = ["3"]; // Filled tooth 5
MOCK_CHARTS["2"].teeth[12].conditions = ["4"]; // Crown on tooth 13
MOCK_CHARTS["2"].teeth[12].procedures = ["6"]; // Crown procedure on tooth 13

const MOCK_HISTORY: ChartHistoryEntry[] = [
  {
    id: "1",
    chart_id: "1",
    tooth_number: 1,
    procedure_id: "3",
    procedure_name: "Filling",
    condition_id: "1",
    condition_name: "Decay",
    notes: "Filled cavity on upper right molar",
    status: null,
    created_at: "2023-06-20T14:45:00Z",
    created_by: "1",
    created_by_name: "Dr. Sarah Johnson"
  },
  {
    id: "2",
    chart_id: "1",
    tooth_number: 16,
    procedure_id: "4",
    procedure_name: "Extraction",
    condition_id: "2",
    condition_name: "Missing",
    notes: "Extracted due to severe decay",
    status: null,
    created_at: "2023-05-10T11:30:00Z",
    created_by: "1",
    created_by_name: "Dr. Sarah Johnson"
  },
  {
    id: "3",
    chart_id: "2",
    tooth_number: 5,
    procedure_id: "3",
    procedure_name: "Filling",
    condition_id: "3",
    condition_name: "Filled",
    notes: "Composite filling on upper left premolar",
    status: null,
    created_at: "2023-05-18T11:20:00Z",
    created_by: "2",
    created_by_name: "Dr. Michael Chen"
  },
  {
    id: "4",
    chart_id: "2",
    tooth_number: 13,
    procedure_id: "6",
    procedure_name: "Crown",
    condition_id: "4",
    condition_name: "Crown",
    notes: "Porcelain crown placed on upper left molar",
    status: null,
    created_at: "2023-04-05T09:45:00Z",
    created_by: "2",
    created_by_name: "Dr. Michael Chen"
  }
];

const dentalChartService = {
  async getConditions(): Promise<ToothCondition[]> {
    if (USE_MOCK_DATA) {
      return MOCK_CONDITIONS;
    }
    
    const response = await axios.get(`${API_URL}/dental-chart/conditions/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getProcedures(): Promise<ToothProcedure[]> {
    if (USE_MOCK_DATA) {
      return MOCK_PROCEDURES;
    }
    
    const response = await axios.get(`${API_URL}/dental-chart/procedures/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async getPatientChart(patientId: string): Promise<DentalChart> {
    if (USE_MOCK_DATA) {
      // Return a copy of the mock chart or create a new one if it doesn't exist
      const existingChart = MOCK_CHARTS[patientId];
      if (existingChart) {
        return JSON.parse(JSON.stringify(existingChart));
      }
      
      // Create a new chart for this patient
      const newChart: DentalChart = {
        id: patientId,
        patient_id: patientId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        teeth: generateTeeth(),
        notes: ""
      };
      
      MOCK_CHARTS[patientId] = newChart;
      return JSON.parse(JSON.stringify(newChart));
    }
    
    const response = await axios.get(`${API_URL}/dental-chart/patient/${patientId}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async updateToothCondition(
    chartId: string,
    toothNumber: number,
    conditionId: string,
    add: boolean
  ): Promise<DentalChart> {
    if (USE_MOCK_DATA) {
      const chart = MOCK_CHARTS[chartId];
      if (!chart) {
        throw new Error("Chart not found");
      }
      
      const toothIndex = chart.teeth.findIndex(t => t.number === toothNumber);
      if (toothIndex === -1) {
        throw new Error("Tooth not found");
      }
      
      if (add) {
        // Add condition if it doesn't already exist
        if (!chart.teeth[toothIndex].conditions.includes(conditionId)) {
          chart.teeth[toothIndex].conditions.push(conditionId);
        }
      } else {
        // Remove condition
        chart.teeth[toothIndex].conditions = chart.teeth[toothIndex].conditions.filter(
          id => id !== conditionId
        );
      }
      
      chart.updated_at = new Date().toISOString();
      return JSON.parse(JSON.stringify(chart));
    }
    
    const response = await axios.post(
      `${API_URL}/dental-chart/${chartId}/tooth/${toothNumber}/condition/`,
      { condition_id: conditionId, add },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  async addProcedure(
    chartId: string,
    toothNumber: number,
    procedureId: string,
    notes?: string
  ): Promise<DentalChart> {
    if (USE_MOCK_DATA) {
      const chart = MOCK_CHARTS[chartId];
      if (!chart) {
        throw new Error("Chart not found");
      }
      
      const toothIndex = chart.teeth.findIndex(t => t.number === toothNumber);
      if (toothIndex === -1) {
        throw new Error("Tooth not found");
      }
      
      // Add procedure
      chart.teeth[toothIndex].procedures.push(procedureId);
      
      // Add to history
      const procedure = MOCK_PROCEDURES.find(p => p.id === procedureId);
      if (procedure) {
        MOCK_HISTORY.push({
          id: (MOCK_HISTORY.length + 1).toString(),
          chart_id: chartId,
          tooth_number: toothNumber,
          procedure_id: procedureId,
          procedure_name: procedure.name,
          notes: notes || "",
          status: null,
          created_at: new Date().toISOString(),
          created_by: "1", // Mock doctor ID
          created_by_name: "Dr. Sarah Johnson" // Mock doctor name
        });
      }
      
      chart.updated_at = new Date().toISOString();
      return JSON.parse(JSON.stringify(chart));
    }
    
    const response = await axios.post(
      `${API_URL}/dental-chart/${chartId}/tooth/${toothNumber}/procedure/`,
      { procedure_id: procedureId, notes },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  async getChartHistory(chartId: string): Promise<ChartHistoryEntry[]> {
    if (USE_MOCK_DATA) {
      return MOCK_HISTORY.filter(entry => entry.chart_id === chartId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    const response = await axios.get(`${API_URL}/dental-chart/${chartId}/history/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    return response.data;
  },
  
  async updateChartNotes(chartId: string, notes: string): Promise<DentalChart> {
    if (USE_MOCK_DATA) {
      const chart = MOCK_CHARTS[chartId];
      if (!chart) {
        throw new Error("Chart not found");
      }
      
      chart.notes = notes;
      chart.updated_at = new Date().toISOString();
      return JSON.parse(JSON.stringify(chart));
    }
    
    const response = await axios.patch(
      `${API_URL}/dental-chart/${chartId}/`,
      { notes },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  },
  
  addToothProcedure: async (chartId: string, toothNumber: number, procedureId: string, notes: string = "", status: string = "planned") => {
    if (USE_MOCK_DATA) {
      // Mock implementation
      const chart = MOCK_CHARTS[chartId];
      if (!chart) throw new Error("Chart not found");
      
      const tooth = chart.teeth.find(t => t.number === toothNumber);
      if (!tooth) throw new Error("Tooth not found");
      
      // Add procedure to tooth
      if (!tooth.procedures.includes(procedureId)) {
        tooth.procedures.push(procedureId);
      }
      
      // Add to history
      const procedure = MOCK_PROCEDURES.find(p => p.id === procedureId);
      MOCK_HISTORY.push({
        id: `hist_${Date.now()}`,
        chart_id: chartId,
        tooth_number: toothNumber,
        procedure_id: procedureId,
        procedure_name: procedure?.name || "Unknown Procedure",
        condition_id: null,
        condition_name: null,
        notes: notes,
        status: status,
        created_at: new Date().toISOString(),
        created_by: "current-user",
        created_by_name: "Dr. Current User"
      });
      
      return { ...chart };
    }
    
    // Real API implementation
    const response = await axios.post(
      `${API_URL}/dental-chart/${chartId}/tooth/${toothNumber}/procedure/`,
      { 
        procedure_id: procedureId, 
        notes: notes,
        status: status
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );
    
    return response.data;
  }
};

export default dentalChartService; 