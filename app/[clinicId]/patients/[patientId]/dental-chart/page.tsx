"use client";

import { useState, useEffect } from "react";
import { dentalChartService } from "@/services/dental-chart.service";
import { DentalChartViewer } from "@/components/dental-chart/DentalChartViewer";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function PatientDentalChartPage() {
  const params = useParams();
  const { currentClinic } = useAuth();
  const [dentalChart, setDentalChart] = useState(null);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDentalChart = async () => {
      if (!currentClinic?.id || !params.patientId) return;
      
      setIsLoading(true);
      try {
        const data = await dentalChartService.getPatientDentalChart(
          currentClinic.id.toString(),
          params.patientId.toString()
        );
        console.log("Fetched dental chart:", data);
        setDentalChart(data);
      } catch (error) {
        console.error("Error fetching dental chart:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDentalChart();
  }, [currentClinic?.id, params.patientId]);
  
  const handleToothSelect = (tooth) => {
    console.log("Selected tooth:", tooth);
    setSelectedTooth(tooth);
  };
  
  if (isLoading) {
    return <div>Loading dental chart...</div>;
  }
  
  return (
    <div>
      <DentalChartViewer 
        dentalChart={dentalChart} 
        onToothSelect={handleToothSelect} 
        selectedTooth={selectedTooth} 
      />
      
      {selectedTooth && (
        <div className="mt-4 p-4 border rounded-md">
          <h2>Selected Tooth: {selectedTooth.name} (#{selectedTooth.number})</h2>
          {/* Add more details or actions for the selected tooth */}
        </div>
      )}
    </div>
  );
} 