"use client";

import { PatientHistoryBook } from "./PatientHistoryBook";

interface PatientHistoryExampleProps {
  patientId: string;
  patientName?: string;
}

export function PatientHistoryExample({ patientId, patientName }: PatientHistoryExampleProps) {
  return (
    <div className="container mx-auto py-6">
      <PatientHistoryBook 
        patientId={patientId}
        patientName={patientName}
      />
    </div>
  );
} 