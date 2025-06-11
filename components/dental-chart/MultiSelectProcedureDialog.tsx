"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Tooth } from "@/services/dental-chart.service";

interface MultiSelectProcedureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProcedure: (data: {
    procedure_id: number;
    surface: string;
    notes?: string;
    date_performed: string;
    price?: number;
    status: string;
  }) => void;
  selectedTeeth: Tooth[];
  procedures: {
    id: number;
    name: string;
    code: string;
    description: string;
    category: string;
    default_price: number;
  }[];
}

export function MultiSelectProcedureDialog({
  isOpen,
  onClose,
  onAddProcedure,
  selectedTeeth,
  procedures
}: MultiSelectProcedureDialogProps) {
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [surface, setSurface] = useState("all");
  const [status, setStatus] = useState("planned");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = () => {
    if (!selectedProcedure) return;

    const selectedProc = procedures.find(p => p.id.toString() === selectedProcedure);
    const finalPrice = price ? parseFloat(price) : selectedProc?.default_price || 0;

    onAddProcedure({
      procedure_id: parseInt(selectedProcedure),
      surface,
      notes: notes || undefined,
      date_performed: format(date, "yyyy-MM-dd"),
      price: finalPrice,
      status
    });

    // Reset form
    setSelectedProcedure("");
    setSurface("all");
    setStatus("planned");
    setNotes("");
    setPrice("");
    setDate(new Date());
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setSelectedProcedure("");
    setSurface("all");
    setStatus("planned");
    setNotes("");
    setPrice("");
    setDate(new Date());
    onClose();
  };

  const selectedProc = procedures.find(p => p.id.toString() === selectedProcedure);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Procedure to Multiple Teeth</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Selected Teeth Display */}
          <div>
            <Label className="text-sm font-medium">Selected Teeth ({selectedTeeth.length})</Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTeeth.map(tooth => (
                <Badge key={tooth.number} variant="outline" className="text-xs">
                  #{tooth.number}
                </Badge>
              ))}
            </div>
          </div>

          {/* Procedure Selection */}
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedure</Label>
            <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
              <SelectTrigger>
                <SelectValue placeholder="Select a procedure" />
              </SelectTrigger>
              <SelectContent>
                {procedures.map(procedure => (
                  <SelectItem key={procedure.id} value={procedure.id.toString()}>
                    <div className="flex flex-col">
                      <span>{procedure.name} ({procedure.code})</span>
                      <span className="text-xs text-gray-500">
                        {procedure.category} - ${procedure.default_price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Surface Selection */}
          <div className="space-y-2">
            <Label htmlFor="surface">Surface</Label>
            <Select value={surface} onValueChange={setSurface}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Surfaces</SelectItem>
                <SelectItem value="occlusal">Occlusal (O)</SelectItem>
                <SelectItem value="mesial">Mesial (M)</SelectItem>
                <SelectItem value="distal">Distal (D)</SelectItem>
                <SelectItem value="buccal">Buccal (B)</SelectItem>
                <SelectItem value="lingual">Lingual (L)</SelectItem>
                <SelectItem value="facial">Facial (F)</SelectItem>
                <SelectItem value="incisal">Incisal (I)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Selection */}
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
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Price (Default: ${selectedProc?.default_price || 0})
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder={`${selectedProc?.default_price || 0}`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedProcedure}
            className="bg-green-600 hover:bg-green-700"
          >
            Add Procedure to {selectedTeeth.length} Teeth
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 