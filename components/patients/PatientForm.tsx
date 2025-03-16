"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { patientService, Patient } from "@/services/patient.service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Define the form schema with Zod
const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.string().transform(val => val ? parseInt(val, 10) : undefined).optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  chief_complaint: z.string().optional(),
  medical_history: z.string().optional(),
  drug_allergies: z.string().optional(),
  previous_dental_work: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient;
  isEditing?: boolean;
}

export function PatientForm({ patient, isEditing = false }: PatientFormProps) {
  const router = useRouter();
  const { currentClinic } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize form with existing patient data or empty values
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient?.name || "",
      age: patient?.age ? patient.age.toString() : "",
      gender: patient?.gender || undefined,
      phone: patient?.phone || "",
      email: patient?.email || "",
      address: patient?.address || "",
      chief_complaint: patient?.chief_complaint || "",
      medical_history: patient?.medical_history || "",
      drug_allergies: patient?.drug_allergies || "",
      previous_dental_work: patient?.previous_dental_work || "",
    },
  });

  const onSubmit = async (data: PatientFormValues) => {
    if (!currentClinic?.id) {
      toast.error("No clinic selected. Please select a clinic first.");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    setFieldErrors({});

    try {
      if (isEditing && patient) {
        await patientService.updatePatient(
          currentClinic.id.toString(),
          patient.id,
          data
        );
        toast.success("Patient updated successfully");
      } else {
        await patientService.createPatient(
          currentClinic.id.toString(),
          data
        );
        toast.success("Patient created successfully");
      }
      router.push("/patients");
    } catch (error: any) {
      console.error("Error saving patient:", error);
      
      // Handle API validation errors
      if (error.response && error.response.data) {
        const apiErrors = error.response.data;
        
        // Set field-specific errors
        const newFieldErrors: Record<string, string> = {};
        
        // Process field errors
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (field !== 'non_field_errors' && field !== 'detail') {
            // Set error in the form
            setError(field as any, { 
              type: 'manual', 
              message: Array.isArray(messages) ? messages[0] : messages as string 
            });
            
            // Also track in our state for display
            newFieldErrors[field] = Array.isArray(messages) ? messages[0] : messages as string;
          }
        });
        
        setFieldErrors(newFieldErrors);
        
        // Handle non-field errors
        if (apiErrors.non_field_errors) {
          setApiError(Array.isArray(apiErrors.non_field_errors) 
            ? apiErrors.non_field_errors[0] 
            : apiErrors.non_field_errors);
        } else if (apiErrors.detail) {
          setApiError(apiErrors.detail);
        }
        
        toast.error(
          apiErrors.non_field_errors || apiErrors.detail || "Failed to save patient. Please check the form for errors."
        );
      } else {
        // Generic error handling
        setApiError(error.message || "An unexpected error occurred. Please try again.");
        toast.error("Failed to save patient");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Patient" : "New Patient"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {apiError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter patient's full name"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            {fieldErrors.name && !errors.name && (
              <p className="text-sm text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          {/* Age and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                {...register("age")}
                placeholder="Enter age"
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age.message}</p>
              )}
              {fieldErrors.age && !errors.age && (
                <p className="text-sm text-red-500">{fieldErrors.age}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value as any)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-500">{errors.gender.message}</p>
              )}
              {fieldErrors.gender && !errors.gender && (
                <p className="text-sm text-red-500">{fieldErrors.gender}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
              {fieldErrors.phone && !errors.phone && (
                <p className="text-sm text-red-500">{fieldErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              {fieldErrors.email && !errors.email && (
                <p className="text-sm text-red-500">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register("address")}
              placeholder="Enter address"
              rows={2}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
            {fieldErrors.address && !errors.address && (
              <p className="text-sm text-red-500">{fieldErrors.address}</p>
            )}
          </div>

          {/* Chief Complaint */}
          <div className="space-y-2">
            <Label htmlFor="chief_complaint">Chief Complaint</Label>
            <Textarea
              id="chief_complaint"
              {...register("chief_complaint")}
              placeholder="Enter chief complaint"
              rows={2}
            />
            {errors.chief_complaint && (
              <p className="text-sm text-red-500">{errors.chief_complaint.message}</p>
            )}
            {fieldErrors.chief_complaint && !errors.chief_complaint && (
              <p className="text-sm text-red-500">{fieldErrors.chief_complaint}</p>
            )}
          </div>

          {/* Medical History */}
          <div className="space-y-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              {...register("medical_history")}
              placeholder="Enter medical history"
              rows={3}
            />
            {errors.medical_history && (
              <p className="text-sm text-red-500">{errors.medical_history.message}</p>
            )}
            {fieldErrors.medical_history && !errors.medical_history && (
              <p className="text-sm text-red-500">{fieldErrors.medical_history}</p>
            )}
          </div>

          {/* Drug Allergies */}
          <div className="space-y-2">
            <Label htmlFor="drug_allergies">Drug Allergies</Label>
            <Textarea
              id="drug_allergies"
              {...register("drug_allergies")}
              placeholder="Enter drug allergies"
              rows={2}
            />
            {errors.drug_allergies && (
              <p className="text-sm text-red-500">{errors.drug_allergies.message}</p>
            )}
            {fieldErrors.drug_allergies && !errors.drug_allergies && (
              <p className="text-sm text-red-500">{fieldErrors.drug_allergies}</p>
            )}
          </div>

          {/* Previous Dental Work */}
          <div className="space-y-2">
            <Label htmlFor="previous_dental_work">Previous Dental Work</Label>
            <Textarea
              id="previous_dental_work"
              {...register("previous_dental_work")}
              placeholder="Enter previous dental work"
              rows={3}
            />
            {errors.previous_dental_work && (
              <p className="text-sm text-red-500">{errors.previous_dental_work.message}</p>
            )}
            {fieldErrors.previous_dental_work && !errors.previous_dental_work && (
              <p className="text-sm text-red-500">{fieldErrors.previous_dental_work}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Patient" : "Create Patient"}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 