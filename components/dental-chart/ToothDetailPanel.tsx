"use client";

import { useState } from "react";
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

const conditionFormSchema = z.object({
  condition_id: z.number({
    required_error: "Please select a condition",
  }),
  surface: z.string().min(1, "Please select at least one surface"),
  notes: z.string().optional(),
  severity: z.string().optional(),
});

const procedureFormSchema = z.object({
  procedure_id: z.number({
    required_error: "Please select a procedure",
  }),
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
      status: "completed",
    },
  });
  
  const handleAddConditionSubmit = (data: z.infer<typeof conditionFormSchema>) => {
    if (editingCondition) {
      onUpdateCondition(editingCondition.id, {
        surface: data.surface,
        notes: data.notes,
        severity: data.severity,
      });
    } else {
      onAddCondition(data);
    }
    setShowAddConditionDialog(false);
    setEditingCondition(null);
    conditionForm.reset();
  };
  
  const handleAddProcedureSubmit = (data: z.infer<typeof procedureFormSchema>) => {
    onAddProcedure({
      ...data,
      date_performed: format(data.date_performed, "yyyy-MM-dd"),
    });
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
                              disabled={!!editingCondition}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a condition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {conditions.map((condition) => (
                                  <SelectItem 
                                    key={condition.id} 
                                    value={condition.id.toString()}
                                  >
                                    {condition.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a procedure" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {procedures.map((procedure) => (
                                  <SelectItem 
                                    key={procedure.id} 
                                    value={procedure.id.toString()}
                                  >
                                    {procedure.name} ({procedure.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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