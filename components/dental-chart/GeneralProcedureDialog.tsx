"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DentalProcedure } from "@/services/dental-chart.service";
import { format } from "date-fns";
import { toast } from "sonner";

interface GeneralProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedures: DentalProcedure[];
  onSubmit: (data: {
    procedure_id: number;
    notes?: string;
    date_performed: string;
    price?: number;
    status: string;
  }) => Promise<void>;
}

export function GeneralProcedureDialog({
  open,
  onOpenChange,
  procedures,
  onSubmit
}: GeneralProcedureDialogProps) {
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("completed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [procedureDate, setProcedureDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        procedure_id: parseInt(selectedProcedure),
        notes: notes,
        date_performed: procedureDate,
        price: price ? parseFloat(price) : undefined,
        status: status
      });
      
      // Reset form
      setSelectedProcedure("");
      setNotes("");
      setPrice("");
      setStatus("completed");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting procedure:", error);
      toast.error("Failed to add general procedure");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add General Procedure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedure</Label>
            <Select
              value={selectedProcedure}
              onValueChange={setSelectedProcedure}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select procedure" />
              </SelectTrigger>
              <SelectContent>
                {procedures
                  .filter(
                    proc =>
                      proc.category &&
                      proc.category.toLowerCase() === "general"
                  )
                  .map(procedure => (
                    <SelectItem 
                      key={procedure.id} 
                      value={procedure.id.toString()}
                    >
                      {procedure.name} ({procedure.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_performed">Date Performed</Label>
            <Input
              id="date_performed"
              type="date"
              value={procedureDate}
              onChange={(e) => setProcedureDate(e.target.value)}
              placeholder="Enter date performed"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedProcedure || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Procedure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 