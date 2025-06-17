"use client";

import { PatientCsvUpload } from "@/components/patients/PatientCsvUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function PatientImportPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-8 w-8" />
              Import Patients
            </h1>
            <p className="text-gray-600">
              Bulk import patient records from CSV files
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>File must be in CSV format (.csv extension)</li>
                <li>First row should contain headers</li>
                <li>Required columns: ID, Date, Name, Age Sex, Phone Number, Address, Complaint</li>
                <li>Age and Sex should be combined (e.g., "72/ F" or "10/M")</li>
                <li>Phone numbers should be 10-15 digits</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">What happens during import:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>The system validates each record for required fields</li>
                <li>Invalid records are highlighted and skipped</li>
                <li>Valid records are imported as new patients</li>
                <li>You'll see a progress indicator and final results</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Download the sample CSV file to see the exact format expected.
                You can modify the sample with your patient data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSV Upload Component */}
      <PatientCsvUpload />
    </div>
  );
} 