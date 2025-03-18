"use client";

import { useState, useEffect, useMemo } from "react";
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

interface ExtendedDentalProcedure extends DentalProcedure {
  price?: number;
}

interface ToothDetailPanelProps {
  tooth: Tooth;
  conditions: {
    id: number;
    name: string;
    code: string;
    description: string;
    color_code: string;
    icon: string;
    is_standard: boolean;
    created_at: string;
  }[];
  procedures: ExtendedDentalProcedure[];
  onAddCondition: (data: {
    condition_id?: number;
    condition_name?: string;
    condition_code?: string;
    custom_name?: string;
    custom_code?: string;
    custom_description?: string;
    surface: string;
    notes?: string;
    severity?: string;
    dentition_type?: 'permanent' | 'primary';
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
  onUpdateProcedure?: (
    procedureId: number,
    data: {
      surface?: string;
      notes?: string;
      date_performed?: string;
      price?: number;
      status?: string;
    }
  ) => void;
  onDeleteProcedure?: (procedureId: number) => void;
  onClose?: () => void;
}

const conditionFormSchema = z.object({
  condition_id: z.union([
    z.number(),
    z.string().transform((val) => {
      if (val === "custom") return "custom";
      return parseInt(val);
    })
  ]),
  custom_condition: z.string().optional(),
  custom_code: z.string().optional(),
  custom_description: z.string().optional(),
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
  custom_description: z.string().optional(),
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
  onUpdateProcedure = () => {},
  onDeleteProcedure = () => {},
  onClose,
}: ToothDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("conditions");
  const [showAddConditionDialog, setShowAddConditionDialog] = useState(false);
  const [showAddProcedureDialog, setShowAddProcedureDialog] = useState(false);
  const [editingCondition, setEditingCondition] = useState<ToothCondition | null>(null);
  const [isCustomCondition, setIsCustomCondition] = useState(false);
  const [isCustomProcedure, setIsCustomProcedure] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ToothProcedure | null>(null);
  
  // Update the allConditions useMemo to handle the API response format
  const allConditions = useMemo(() => {
    // If conditions is undefined or empty, return empty array
    if (!conditions?.length) return [];
    
    // Map the conditions from the API response
    return conditions.map(condition => ({
      id: condition.id,
      name: condition.name,
      code: condition.code,
      description: condition.description,
      color_code: condition.color_code,
      icon: condition.icon
    }));
  }, [conditions]);

  // Update the allProcedures useMemo
  const allProcedures = useMemo(() => {
    // If procedures is undefined or empty, return empty array
    if (!procedures?.length) return [];
    
    // Map the procedures from the API response
    return procedures.map(procedure => ({
      id: procedure.id,
      name: procedure.name,
      code: procedure.code,
      description: procedure.description,
      category: procedure.category,
      default_price: procedure.default_price,
      duration_minutes: procedure.duration_minutes,
      price: procedure.default_price // Map default_price to price for ExtendedDentalProcedure
    }));
  }, [procedures]);
  
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
      const selectedProcedure = allProcedures.find(p => p.id === selectedProcedureId) as ExtendedDentalProcedure;
      if (selectedProcedure?.price) {
        procedureForm.setValue("price", selectedProcedure.price);
      }
    }
  }, [selectedProcedureId, allProcedures, procedureForm]);
  
  const handleAddConditionSubmit = (data: z.infer<typeof conditionFormSchema>) => {
    if (data.condition_id === "custom") {
      // Handle custom condition
      onAddCondition({
        custom_name: data.custom_condition,
        custom_code: data.custom_code || `CUST${Math.floor(Math.random() * 1000)}`,
        custom_description: data.custom_description || "",
        surface: data.surface,
        notes: data.notes,
        severity: data.severity as 'mild' | 'moderate' | 'severe',
        dentition_type: /^[A-Z]$/.test(tooth.number) ? 'primary' : 'permanent'
      });
    } else {
      // Handle standard condition
      onAddCondition({
        condition_id: data.condition_id as number,
        surface: data.surface,
        notes: data.notes,
        severity: data.severity as 'mild' | 'moderate' | 'severe',
        dentition_type: /^[A-Z]$/.test(tooth.number) ? 'primary' : 'permanent'
      });
    }
    
    setShowAddConditionDialog(false);
    conditionForm.reset();
  };
  
  const handleAddProcedureSubmit = (data: z.infer<typeof procedureFormSchema>) => {
    if (editingProcedure) {
      console.log("Updating procedure:", editingProcedure.id, data);
      
      if (typeof onUpdateProcedure !== 'function') {
        console.error("onUpdateProcedure is not a function or not provided!");
        return;
      }
      
      // Handle update
      onUpdateProcedure(editingProcedure.id, {
        surface: data.surface,
        notes: data.notes,
        date_performed: format(data.date_performed, "yyyy-MM-dd"),
        price: data.price,
        status: data.status,
      });
    } else {
      // Handle create (existing code)
      let procedureData: any = {
        surface: data.surface,
        notes: data.notes,
        date_performed: format(data.date_performed, "yyyy-MM-dd"),
        price: data.price,
        status: data.status,
      };
      
      if (data.procedure_id === "custom") {
        // Handle custom procedure
        procedureData.custom_name = data.custom_procedure;
        procedureData.custom_code = data.custom_code || `CUST${Math.floor(Math.random() * 1000)}`;
        procedureData.custom_description = data.custom_description || "";
      } else {
        // Handle standard procedure
        procedureData.procedure_id = data.procedure_id as number;
      }
      
      onAddProcedure(procedureData);
    }
    
    setShowAddProcedureDialog(false);
    setEditingProcedure(null);
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
  
  const handleEditProcedure = (procedure: ToothProcedure) => {
    setEditingProcedure(procedure);
    procedureForm.reset({
      procedure_id: procedure.procedure_id,
      surface: procedure.surface,
      notes: procedure.notes,
      date_performed: parseISO(procedure.date_performed),
      price: typeof procedure.price === 'string' ? parseFloat(procedure.price) : procedure.price,
      status: procedure.status,
    });
    setShowAddProcedureDialog(true);
  };
  
  const handleDeleteProcedure = (procedureId: number) => {
    console.log("Delete procedure called with ID:", procedureId);
    
    if (typeof onDeleteProcedure !== 'function') {
      console.error("onDeleteProcedure is not a function or not provided!");
      return;
    }
    
    if (confirm("Are you sure you want to remove this procedure?")) {
      onDeleteProcedure(procedureId);
    }
  };
  
  useEffect(() => {
    console.log("ToothDetailPanel props:", {
      onUpdateProcedure: typeof onUpdateProcedure,
      onDeleteProcedure: typeof onDeleteProcedure
    });
  }, [onUpdateProcedure, onDeleteProcedure]);
  
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
                                if (value === "custom") {
                                  field.onChange("custom");
                                } else {
                                  const numericValue = parseInt(value);
                                  field.onChange(numericValue);
                                  
                                  // Clear custom fields when selecting a standard condition
                                  conditionForm.setValue("custom_condition", "");
                                  conditionForm.setValue("custom_code", "");
                                  conditionForm.setValue("custom_description", "");
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
                                  <SelectItem 
                                    key={`condition-${condition.id}`} 
                                    value={condition.id.toString()}
                                  >
                                    {condition.name} ({condition.code})
                                  </SelectItem>
                                ))}
                                <SelectItem key="custom-condition" value="custom">
                                  + Add Custom Condition
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isCustomCondition && (
                        <>
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
                          
                          <FormField
                            control={conditionForm.control}
                            name="custom_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Condition Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter condition code (optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={conditionForm.control}
                            name="custom_description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter condition description (optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
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
                        <Button type="submit">Save Condition</Button>
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
                  <Button size="sm" onClick={() => {
                    setEditingProcedure(null);
                    procedureForm.reset({
                      surface: "",
                      notes: "",
                      date_performed: new Date(),
                      price: 0,
                      status: "planned",
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Procedure
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingProcedure ? "Edit Procedure" : "Add New Procedure"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProcedure 
                        ? "Update the details of this procedure" 
                        : "Add a new procedure to this tooth"}
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
                                if (value === "custom") {
                                  field.onChange("custom");
                                } else {
                                  const numericValue = parseInt(value);
                                  field.onChange(numericValue);
                                  
                                  // Set default price when selecting a procedure
                                  const selectedProcedure = allProcedures.find(p => p.id === numericValue);
                                  if (selectedProcedure?.default_price) {
                                    procedureForm.setValue("price", selectedProcedure.default_price);
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
                                  <SelectItem 
                                    key={`procedure-${procedure.id}`} 
                                    value={procedure.id.toString()}
                                  >
                                    {procedure.name} ({procedure.code})
                                  </SelectItem>
                                ))}
                                <SelectItem key="custom-procedure" value="custom">
                                  + Add Custom Procedure
                                </SelectItem>
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
                          
                          <FormField
                            control={procedureForm.control}
                            name="custom_description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter procedure description (optional)" {...field} />
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
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditProcedure(procedure)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteProcedure(procedure.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                          <p className="font-medium">
                            ${typeof procedure.price === 'number' 
                              ? procedure.price.toFixed(2) 
                              : typeof procedure.price === 'string' 
                                ? parseFloat(procedure.price).toFixed(2) 
                                : '0.00'}
                          </p>
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