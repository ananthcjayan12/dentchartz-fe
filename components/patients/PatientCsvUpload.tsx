"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { patientService } from "@/services/patient.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  User
} from "lucide-react";

interface CsvPatient {
  id: string;
  date: string;
  name: string;
  age: string;
  phone: string;
  address: string;
  complaint: string;
  treatment: string;
  isValid?: boolean;
  errors?: string[];
  processedData?: {
    name: string;
    age?: number;
    gender?: 'M' | 'F' | 'O';
    phone?: string;
    address?: string;
    chief_complaint?: string;
    medical_history?: string;
  };
}

export function PatientCsvUpload() {
  const { currentClinic } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [csvData, setCsvData] = useState<CsvPatient[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Parse age and sex from combined field (e.g., "72/ F" or "10/M")
  const parseAgeAndSex = (ageAndSex: string): { age?: number; gender?: 'M' | 'F' | 'O' } => {
    const cleanStr = ageAndSex.trim().replace(/\s+/g, '');
    const match = cleanStr.match(/(\d+)\/?\s*([MFO])/i);
    
    if (match) {
      const age = parseInt(match[1]);
      const gender = match[2].toUpperCase() as 'M' | 'F' | 'O';
      return { age: isNaN(age) ? undefined : age, gender };
    }
    
    return {};
  };

  // Validate and process CSV data
  const validateCsvData = (data: CsvPatient[]): CsvPatient[] => {
    return data.map(row => {
      const errors: string[] = [];
      
      // Required field validation
      if (!row.name || row.name.trim() === '') {
        errors.push('Name is required');
      }
      
      // Parse age and gender
      const { age, gender } = parseAgeAndSex(row.age);
      if (!age) {
        errors.push('Valid age is required');
      }
      if (!gender) {
        errors.push('Valid gender is required (M/F/O)');
      }
      
      // Phone validation (basic)
      if (row.phone && !/^\d{10,15}$/.test(row.phone.replace(/\s+/g, ''))) {
        errors.push('Phone number should be 10-15 digits');
      }
      
      // Process the data for API
      const processedData = {
        name: row.name.trim(),
        age,
        gender,
        phone: row.phone ? row.phone.replace(/\s+/g, '') : undefined,
        address: row.address || undefined,
        chief_complaint: row.complaint || undefined,
        medical_history: row.treatment ? `Previous treatment: ${row.treatment}` : undefined,
      };
      
      return {
        ...row,
        isValid: errors.length === 0,
        errors,
        processedData
      };
    });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('CSV file must contain at least a header and one data row');
          setIsUploading(false);
          return;
        }
        
        // Parse CSV (assuming tab-separated based on your example)
        const separator = csvText.includes('\t') ? '\t' : ',';
        
        const parsedData: CsvPatient[] = lines.slice(1).map(line => {
          const values = line.split(separator);
          return {
            id: values[0] || '',
            date: values[1] || '',
            name: values[2] || '',
            age: values[3] || '',
            phone: values[4] || '',
            address: values[5] || '',
            complaint: values[6] || '',
            treatment: values[7] || ''
          };
        });
        
        // Validate the data
        const validatedData = validateCsvData(parsedData);
        setCsvData(validatedData);
        
        const validCount = validatedData.filter(row => row.isValid).length;
        const invalidCount = validatedData.filter(row => !row.isValid).length;
        
        toast.success(`CSV loaded! ${validCount} valid, ${invalidCount} invalid records`);
        setShowPreview(true);
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error('Error parsing CSV file. Please check the format.');
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.readAsText(file);
  };

  // Import patients to database
  const handleImport = async () => {
    if (!currentClinic?.id || csvData.length === 0) return;
    
    const validPatients = csvData.filter(row => row.isValid && row.processedData);
    if (validPatients.length === 0) {
      toast.error('No valid patients to import');
      return;
    }
    
    setIsProcessing(true);
    setUploadProgress(0);
    
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];
    
    try {
      for (let i = 0; i < validPatients.length; i++) {
        const patient = validPatients[i];
        
        try {
          console.log('Creating patient:', patient.processedData);
          await patientService.createPatient(
            currentClinic.id.toString(),
            patient.processedData!
          );
          successCount++;
          console.log(`Successfully created patient: ${patient.name}`);
        } catch (error: any) {
          console.error(`Error creating patient ${patient.name}:`, error);
          failureCount++;
          
          // Capture specific error messages
          let errorMessage = 'Unknown error';
          if (error.response?.data) {
            if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else {
              errorMessage = JSON.stringify(error.response.data);
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          errors.push(`${patient.name}: ${errorMessage}`);
        }
        
        // Update progress
        setUploadProgress(((i + 1) / validPatients.length) * 100);
      }
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} patients!`);
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to import ${failureCount} patients. Check console for details.`);
        console.error('Import errors:', errors);
      }
      
    } catch (error) {
      console.error('Import process error:', error);
      toast.error('Import process failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setCsvData([]);
    setShowPreview(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download sample CSV
  const downloadSampleCsv = () => {
    const sampleData = [
      'ID\tDate\tName\tAge Sex\tPhone Number\tAddress\tComplaint\tTreatement\tSource\tTotal Paymant\tPaid\tBalance\tnxt appnt',
      'P000001\t18/5/25\tPhylomina\t72/ F\t8138060154\tezhupunna\tmissing teeth wants rpd\t\tlocal\t\t100\t\t',
      'P000002\t18/5/25\tKarmili\t75/ F\t9142841976\tezhupunna\tpain\tadv xn\tlocal\t\t\t\t20/5/25'
    ].join('\n');
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patient_import_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validCount = csvData.filter(row => row.isValid).length;
  const invalidCount = csvData.filter(row => !row.isValid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Patient CSV Import
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Upload a CSV file to bulk import patient records
              </p>
            </div>
            <Button variant="outline" onClick={downloadSampleCsv}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Upload Section */}
      {!showPreview && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                <p className="text-gray-600 mb-4">
                  Select a CSV file containing patient data to import
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mb-4"
                >
                  {isUploading ? 'Loading...' : 'Choose CSV File'}
                </Button>
                
                <div className="text-sm text-gray-500">
                  <p>Expected format: Tab-separated or comma-separated values</p>
                  <p>Required columns: ID, Date, Name, Age Sex, Phone Number, Address, Complaint</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview and Import */}
      {showPreview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Records</p>
                        <p className="text-2xl font-bold">{csvData.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Valid Records</p>
                        <p className="text-2xl font-bold text-green-600">{validCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Invalid Records</p>
                        <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {invalidCount > 0 && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidCount} records have validation errors and will be skipped during import.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleReset}>
                  Upload Different File
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={isProcessing || validCount === 0}
                  className="flex-1"
                >
                  {isProcessing ? 'Importing...' : `Import ${validCount} Valid Records`}
                </Button>
              </div>

              {isProcessing && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Import Progress</span>
                    <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {csvData.map((row, index) => (
                    <Card key={index} className={row.isValid ? 'border-green-200' : 'border-red-200'}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={row.isValid ? 'default' : 'destructive'}>
                              {row.isValid ? 'Valid' : 'Invalid'}
                            </Badge>
                            <span className="font-medium">{row.name}</span>
                          </div>
                          {row.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Age/Gender</p>
                            <p>{row.age}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p>{row.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Address</p>
                            <p>{row.address || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Complaint</p>
                            <p>{row.complaint || 'N/A'}</p>
                          </div>
                        </div>
                        
                        {!row.isValid && row.errors && row.errors.length > 0 && (
                          <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                            <p className="text-sm font-medium text-red-800 mb-1">Validation Errors:</p>
                            <ul className="text-sm text-red-700 list-disc list-inside">
                              {row.errors.map((error, errorIndex) => (
                                <li key={errorIndex}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 