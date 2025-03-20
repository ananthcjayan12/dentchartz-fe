"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { dentalChartService } from "@/services/dental-chart.service";

interface GeneralProceduresPanelProps {
  patientId: string;
  onAddGeneralProcedure: () => void;
  onRefresh: () => Promise<void>;
}

interface GeneralProcedure {
  id: number;
  procedure_name: string;
  procedure_code: string;
  notes: string;
  procedure_notes: ProcedureNote[];
  date_performed: string;
  price: string | number;
  status: string;
  performed_by: string;
}

interface ProcedureNote {
  id: number;
  note: string;
  appointment_date: string;
  created_by: string;
  created_at: string;
}

export function GeneralProceduresPanel({ 
  patientId, 
  onAddGeneralProcedure,
  onRefresh
}: GeneralProceduresPanelProps) {
  const { currentClinic } = useAuth();
  const [generalProcedures, setGeneralProcedures] = useState<GeneralProcedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<GeneralProcedure | null>(null);
  
  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Edit form states
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDate, setEditDate] = useState("");
  
  // Note form states
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  
  // Fetch general procedures
  const fetchGeneralProcedures = async () => {
    if (!currentClinic?.id) {
      toast.error("No clinic selected");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await dentalChartService.getGeneralProcedures(
        currentClinic.id.toString(),
        patientId
      );
      setGeneralProcedures(response.results || []);
    } catch (error) {
      console.error("Error fetching general procedures:", error);
      toast.error("Failed to load general procedures");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGeneralProcedures();
  }, [currentClinic?.id, patientId]);
  
  // Handle edit procedure
  const handleEditProcedure = (procedure: GeneralProcedure) => {
    setSelectedProcedure(procedure);
    setEditPrice(procedure.price.toString());
    setEditStatus(procedure.status);
    setEditNotes(procedure.notes || "");
    setEditDate(procedure.date_performed);
    setShowEditDialog(true);
  };
  
  // Handle add note
  const handleAddNote = (procedure: GeneralProcedure) => {
    setSelectedProcedure(procedure);
    setNoteText("");
    setNoteDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setShowNoteDialog(true);
  };
  
  // Handle delete procedure
  const handleDeleteProcedure = (procedure: GeneralProcedure) => {
    setSelectedProcedure(procedure);
    setShowDeleteDialog(true);
  };
  
  // Submit edit procedure
  const submitEditProcedure = async () => {
    if (!currentClinic?.id || !selectedProcedure) return;
    
    try {
      await dentalChartService.updateGeneralProcedure(
        currentClinic.id.toString(),
        patientId,
        selectedProcedure.id,
        {
          notes: editNotes,
          date_performed: editDate,
          price: parseFloat(editPrice),
          status: editStatus
        }
      );
      
      await fetchGeneralProcedures();
      await onRefresh();
      setShowEditDialog(false);
      toast.success("Procedure updated successfully");
    } catch (error) {
      console.error("Error updating general procedure:", error);
      toast.error("Failed to update procedure");
    }
  };
  
  // Submit add note
  const submitAddNote = async () => {
    if (!currentClinic?.id || !selectedProcedure) return;
    
    try {
      await dentalChartService.addGeneralProcedureNote(
        currentClinic.id.toString(),
        patientId,
        selectedProcedure.id,
        {
          note: noteText,
          appointment_date: noteDate
        }
      );
      
      await fetchGeneralProcedures();
      await onRefresh();
      setShowNoteDialog(false);
      toast.success("Note added successfully");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };
  
  // Submit delete procedure
  const submitDeleteProcedure = async () => {
    if (!currentClinic?.id || !selectedProcedure) return;
    
    try {
      await dentalChartService.deleteGeneralProcedure(
        currentClinic.id.toString(),
        patientId,
        selectedProcedure.id
      );
      
      await fetchGeneralProcedures();
      await onRefresh();
      setShowDeleteDialog(false);
      toast.success("Procedure deleted successfully");
    } catch (error) {
      console.error("Error deleting procedure:", error);
      toast.error("Failed to delete procedure");
    }
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "planned":
        return <Badge className="bg-amber-100 text-amber-800">Planned</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">General Procedures</h3>
        <Button size="sm" onClick={onAddGeneralProcedure}>
          <Plus className="h-4 w-4 mr-1" /> Add Procedure
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading procedures...</p>
        </div>
      ) : generalProcedures.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No general procedures found</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={onAddGeneralProcedure}
          >
            Add General Procedure
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {generalProcedures.map((procedure) => (
            <Card key={procedure.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{procedure.procedure_name}</CardTitle>
                    <p className="text-sm text-gray-500">{procedure.procedure_code}</p>
                  </div>
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
                      onClick={() => handleDeleteProcedure(procedure)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleAddNote(procedure)}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm">
                      {format(parseISO(procedure.date_performed), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm">${parseFloat(procedure.price.toString()).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(procedure.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Performed By</p>
                    <p className="text-sm">{procedure.performed_by || "N/A"}</p>
                  </div>
                </div>
                
                {procedure.notes && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm">{procedure.notes}</p>
                  </div>
                )}
                
                {procedure.procedure_notes && procedure.procedure_notes.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="text-xs text-gray-500 mb-2">Progress Notes</p>
                    <div className="space-y-2">
                      {procedure.procedure_notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-2 rounded-md">
                          <div className="flex justify-between items-start">
                            <p className="text-sm">{note.note}</p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(note.appointment_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            By {note.created_by} on {format(parseISO(note.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Procedure Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Procedure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Procedure</label>
              <p>{selectedProcedure?.procedure_name}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <Input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Performed</label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitEditProcedure}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Progress Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Procedure</label>
              <p>{selectedProcedure?.procedure_name}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter progress note"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Appointment Date</label>
              <Input
                type="datetime-local"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitAddNote} disabled={!noteText}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Procedure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this procedure?</p>
            <p className="font-medium">{selectedProcedure?.procedure_name}</p>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitDeleteProcedure}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 