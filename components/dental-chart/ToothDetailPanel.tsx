"use client";

import { useState, useEffect } from "react";
import { Tooth, ToothCondition, ToothProcedure, DentalCondition, DentalProcedure } from "@/services/dental-chart.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { AlertCircle, Edit, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToothDetailPanelProps {
  tooth: Tooth;
  conditions: DentalCondition[];
  procedures: DentalProcedure[];
  onAddCondition: (data: {
    condition_id: number;
    surface: string;
    notes?: string;
    severity?: string;
  }) => void;
  onAddProcedure: (data: {
    procedure_id: number;
    surface: string;
    notes?: string;
    date_performed: string;
    price?: number;
    status: string;
  }) => void;
  onUpdateCondition: (
    conditionId: number,
    data: {
      surface?: string;
      notes?: string;
      severity?: string;
    }
  ) => void;
  onDeleteCondition: (conditionId: number) => void;
}

// Add these standard dental conditions and procedures
const STANDARD_CONDITIONS = [
  { id: 1, name: "Cavity", code: "C01" },
  { id: 2, name: "Filling", code: "F01" },
  { id: 3, name: "Crown", code: "CR01" },
  { id: 4, name: "Root Canal", code: "RC01" },
  { id: 5, name: "Extraction", code: "EX01" },
  { id: 6, name: "Gingivitis", code: "G01" },
  { id: 7, name: "Fracture", code: "FR01" },
  { id: 8, name: "Abscess", code: "AB01" },
  { id: 9, name: "Missing", code: "M01" },
  { id: 10, name: "Impacted", code: "IM01" }
];

const STANDARD_PROCEDURES = [
  { id: 1, name: "Amalgam Filling", code: "D2140", price: 120 },
  { id: 2, name: "Composite Filling", code: "D2330", price: 150 },
  { id: 3, name: "Root Canal Therapy", code: "D3310", price: 700 },
  { id: 4, name: "Crown - Porcelain/Ceramic", code: "D2740", price: 1200 },
  { id: 5, name: "Extraction - Simple", code: "D7140", price: 150 },
  { id: 6, name: "Extraction - Surgical", code: "D7210", price: 250 },
  { id: 7, name: "Scaling and Root Planing", code: "D4341", price: 200 },
  { id: 8, name: "Dental Cleaning", code: "D1110", price: 100 },
  { id: 9, name: "Dental Exam", code: "D0120", price: 50 },
  { id: 10, name: "X-Ray - Periapical", code: "D0220", price: 30 }
];

const conditionFormSchema = z.object({
  condition_id: z.number({
    required_error: "Please select a condition",
  }).or(z.literal("custom")),
  custom_condition: z.string().optional().refine(val => {
    // If condition_id is "custom", then custom_condition is required
    return val !== undefined && val.trim() !== "" || typeof val === "undefined";
  }, {
    message: "Custom condition name is required",
  }),
  surface: z.string().min(1, "Please select at least one surface"),
  notes: z.string().optional(),
  severity: z.string().optional(),
});

const procedureFormSchema = z.object({
  procedure_id: z.number({
    required_error: "Please select a procedure",
  }).or(z.literal("custom")),
  custom_procedure: z.string().optional().refine(val => {
    // If procedure_id is "custom", then custom_procedure is required
    return val !== undefined && val.trim() !== "" || typeof val === "undefined";
  }, {
    message: "Custom procedure name is required",
  }),
  custom_code: z.string().optional(),
  surface: z.string().min(1, "Please select at least one surface"),
  notes: z.string().optional(),
  date_performed: z.date({
    required_error: "Please select a date",
  }),
  price: z.number().optional(),
  status: z.string({
    required_error: "Please select a status",
  }),
});

export function ToothDetailPanel({
  tooth,
  conditions,
  procedures,
  onAddCondition,
  onAddProcedure,
  onUpdateCondition,
  onDeleteCondition,
}: ToothDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("conditions");
  const [showAddConditionDialog, setShowAddConditionDialog] = useState(false);
  const [showAddProcedureDialog, setShowAddProcedureDialog] = useState(false);
  const [editingCondition, setEditingCondition] = useState<ToothCondition | null>(null);
  const [isCustomCondition, setIsCustomCondition] = useState(false);
  const [isCustomProcedure, setIsCustomProcedure] = useState(false);
  
  // Combine API-provided conditions with standard ones
  const allConditions = [...STANDARD_CONDITIONS, ...(conditions || [])];
  const allProcedures = [...STANDARD_PROCEDURES, ...(procedures || [])];
  
  const conditionForm = useForm<z.infer<typeof conditionFormSchema>>({
    resolver: zodResolver(conditionFormSchema),
    defaultValues: {
      surface: "",
      notes: "",
      severity: "moderate",
    },
  });
  
  const procedureForm = useForm<z.infer<typeof procedureFormSchema>>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: {
      surface: "",
      notes: "",
      date_performed: new Date(),
      price: 0,
      status: "completed",
    },
  });

  // Watch for condition_id changes to show/hide custom condition field
  const selectedConditionId = conditionForm.watch("condition_id");
  useEffect(() => {
    setIsCustomCondition(selectedConditionId === "custom");
  }, [selectedConditionId]);

  // Watch for procedure_id changes to show/hide custom procedure field
  const selectedProcedureId = procedureForm.watch("procedure_id");
  useEffect(() => {
    setIsCustomProcedure(selectedProcedureId === "custom");
    
    // Set default price if a standard procedure is selected
    if (typeof selectedProcedureId === "number") {
      const selectedProcedure = allProcedures.find(p => p.id === selectedProcedureId);
      if (selectedProcedure?.price) {
        procedureForm.setValue("price", selectedProcedure.price);
      }
    }
  }, [selectedProcedureId, allProcedures, procedureForm]);
  
  const handleAddConditionSubmit = (data: z.infer<typeof conditionFormSchema>) => {
    let conditionData: any = {
      surface: data.surface,
      notes: data.notes,
      severity: data.severity,
    };
    
    if (data.condition_id === "custom") {
      // Handle custom condition
      conditionData.custom_name = data.custom_condition;
    } else {
      // Handle standard condition
      // Convert string to number if needed
      conditionData.condition_id = typeof data.condition_id === 'string' 
        ? parseInt(data.condition_id) 
        : data.condition_id;
    }
    
    if (editingCondition) {
      onUpdateCondition(editingCondition.id, conditionData);
    } else {
      onAddCondition(conditionData);
    }
    setShowAddConditionDialog(false);
    setEditingCondition(null);
    conditionForm.reset();
  };
  
  const handleAddProcedureSubmit = (data: z.infer<typeof procedureFormSchema>) => {
    let procedureData: any = {
      surface: data.surface,
      notes: data.notes,
      date_performed: format(data.date_performed, "yyyy-MM-dd"),
      price: data.price || 0,
      status: data.status,
    };
    
    if (data.procedure_id === "custom") {
      // Handle custom procedure
      procedureData.custom_name = data.custom_procedure;
      procedureData.custom_code = data.custom_code;
    } else {
      // Handle standard procedure
      // Convert string to number if needed
      procedureData.procedure_id = typeof data.procedure_id === 'string' 
        ? parseInt(data.procedure_id) 
        : data.procedure_id;
    }
    
    onAddProcedure(procedureData);
    setShowAddProcedureDialog(false);
    procedureForm.reset();
  };
  
  const handleEditCondition = (condition: ToothCondition) => {
    setEditingCondition(condition);
    conditionForm.reset({
      condition_id: condition.condition_id,
      surface: condition.surface,
      notes: condition.notes,
      severity: condition.severity || "moderate",
    });
    setShowAddConditionDialog(true);
  };
  
  const handleDeleteCondition = (conditionId: number) => {
    if (confirm("Are you sure you want to remove this condition?")) {
      onDeleteCondition(conditionId);
    }
  };
  
  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="conditions" className="flex-1">Conditions</TabsTrigger>
          <TabsTrigger value="procedures" className="flex-1">Procedures</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conditions">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Current Conditions</h3>
              <Dialog open={showAddConditionDialog} onOpenChange={setShowAddConditionDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingCondition(null);
                    conditionForm.reset({
                      surface: "",
                      notes: "",
                      severity: "moderate",
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCondition ? "Edit Condition" : "Add New Condition"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCondition 
                        ? "Update the details of this condition" 
                        : "Add a new condition to this tooth"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...conditionForm}>
                    <form onSubmit={conditionForm.handleSubmit(handleAddConditionSubmit)} className="space-y-4">
                      <FormField
                        control={conditionForm.control}
                        name="condition_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value !== "custom") {
                                  const selectedCondition = allConditions.find(c => c.id.toString() === value);
                                  if (selectedCondition) {
                                    conditionForm.setValue("custom_condition", "");
                                  }
                                }
                              }}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a condition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {allConditions.map((condition) => (
                                  <SelectItem key={condition.id} value={condition.id.toString()}>
                                    {condition.name} ({condition.code})
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">+ Add Custom Condition</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isCustomCondition && (
                        <FormField
                          control={conditionForm.control}
                          name="custom_condition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Condition Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter condition name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={conditionForm.control}
                        name="surface"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surface</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a surface" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="occlusal">Occlusal (O)</SelectItem>
                                <SelectItem value="mesial">Mesial (M)</SelectItem>
                                <SelectItem value="distal">Distal (D)</SelectItem>
                                <SelectItem value="buccal">Buccal (B)</SelectItem>
                                <SelectItem value="lingual">Lingual (L)</SelectItem>
                                <SelectItem value="occlusal,mesial">Occlusal-Mesial (OM)</SelectItem>
                                <SelectItem value="occlusal,distal">Occlusal-Distal (OD)</SelectItem>
                                <SelectItem value="mesial,occlusal,distal">Mesial-Occlusal-Distal (MOD)</SelectItem>
                                <SelectItem value="all">All Surfaces</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={conditionForm.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mild">Mild</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={conditionForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add any additional notes here" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit">
                          {editingCondition ? "Update Condition" : "Add Condition"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {tooth.conditions.length === 0 ? (
              <div className="text-center py-6 border rounded-md bg-gray-50">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No conditions recorded for this tooth</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tooth.conditions.map((condition) => (
                  <Card key={condition.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{condition.condition_name}</h4>
                          <p className="text-sm text-gray-500">
                            Surface: <Badge variant="outline">{condition.surface}</Badge>
                          </p>
                          {condition.severity && (
                            <p className="text-sm text-gray-500 mt-1">
                              Severity: <Badge variant="outline">{condition.severity}</Badge>
                            </p>
                          )}
                          {condition.notes && (
                            <p className="text-sm mt-2">{condition.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Added by {condition.created_by} on {format(parseISO(condition.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditCondition(condition)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteCondition(condition.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="procedures">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Procedures</h3>
              <Dialog open={showAddProcedureDialog} onOpenChange={setShowAddProcedureDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Procedure
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Procedure</DialogTitle>
                    <DialogDescription>
                      Record a procedure performed on this tooth
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...procedureForm}>
                    <form onSubmit={procedureForm.handleSubmit(handleAddProcedureSubmit)} className="space-y-4">
                      <FormField
                        control={procedureForm.control}
                        name="procedure_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Procedure</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value !== "custom") {
                                  const selectedProcedure = allProcedures.find(p => p.id.toString() === value);
                                  if (selectedProcedure) {
                                    procedureForm.setValue("price", selectedProcedure.price);
                                    procedureForm.setValue("custom_procedure", "");
                                    procedureForm.setValue("custom_code", "");
                                  }
                                }
                              }}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a procedure" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {allProcedures.map((procedure) => (
                                  <SelectItem key={procedure.id} value={procedure.id.toString()}>
                                    {procedure.name} ({procedure.code}) - ${procedure.price}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">+ Add Custom Procedure</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isCustomProcedure && (
                        <>
                          <FormField
                            control={procedureForm.control}
                            name="custom_procedure"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Procedure Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter procedure name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={procedureForm.control}
                            name="custom_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Procedure Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter procedure code (optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      <FormField
                        control={procedureForm.control}
                        name="surface"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surface</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a surface" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="occlusal">Occlusal (O)</SelectItem>
                                <SelectItem value="mesial">Mesial (M)</SelectItem>
                                <SelectItem value="distal">Distal (D)</SelectItem>
                                <SelectItem value="buccal">Buccal (B)</SelectItem>
                                <SelectItem value="lingual">Lingual (L)</SelectItem>
                                <SelectItem value="occlusal,mesial">Occlusal-Mesial (OM)</SelectItem>
                                <SelectItem value="occlusal,distal">Occlusal-Distal (OD)</SelectItem>
                                <SelectItem value="mesial,occlusal,distal">Mesial-Occlusal-Distal (MOD)</SelectItem>
                                <SelectItem value="all">All Surfaces</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={procedureForm.control}
                        name="date_performed"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date Performed</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={procedureForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter price"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={procedureForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={procedureForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add any additional notes here" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit">Add Procedure</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {tooth.procedures.length === 0 ? (
              <div className="text-center py-6 border rounded-md bg-gray-50">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No procedures recorded for this tooth</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tooth.procedures.map((procedure) => (
                  <Card key={procedure.id}>
                    <CardContent className="p-4">
                      <div>
                        <div className="flex justify-between">
                          <h4 className="font-medium">{procedure.procedure_name}</h4>
                          <Badge>{procedure.procedure_code}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Surface: <Badge variant="outline">{procedure.surface}</Badge>
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500">
                            Date: {format(parseISO(procedure.date_performed), "MMM d, yyyy")}
                          </p>
                          <Badge 
                            variant={
                              procedure.status === "completed" ? "default" :
                              procedure.status === "in_progress" ? "secondary" :
                              procedure.status === "planned" ? "outline" : "destructive"
                            }
                          >
                            {procedure.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {procedure.notes && (
                          <p className="text-sm mt-2">{procedure.notes}</p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-400">
                            Performed by {procedure.performed_by}
                          </p>
                          <p className="font-medium">${procedure.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 