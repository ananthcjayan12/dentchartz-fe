import { use } from 'react';
import { useParams } from 'next/navigation';

const handleAddCondition = async (conditionData: any) => {
  try {
    const response = await dentalChartService.addToothCondition(
      clinicId,
      patientId,
      selectedTooth.number,
      conditionData
    );
    // Handle success - maybe refresh the dental chart data
    refreshDentalChart();
  } catch (error) {
    console.error("Error adding condition:", error);
    // Handle error - show toast notification
  }
};

export default function PatientDentalChartPage() {
  const params = use(useParams()); // Unwrap params using React.use()
  const { patientId } = params; // Now you can safely destructure
  
  // Rest of your component code...
} 