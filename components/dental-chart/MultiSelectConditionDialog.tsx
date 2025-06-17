"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Tooth } from "@/services/dental-chart.service";

interface MultiSelectConditionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCondition: (data: {
    condition_id: number;
    surface: string;
    notes?: string;
    severity?: string;
    date_detected?: string;
  }) => void;
  selectedTeeth: Tooth[];
  conditions: {
    id: number;
    name: string;
    code: string;
    description: string;
    color_code: string;
  }[];
}

export function MultiSelectConditionDialog({
  isOpen,
  onClose,
  onAddCondition,
  selectedTeeth,
  conditions
}: MultiSelectConditionDialogProps) {
  const [selectedCondition, setSelectedCondition] = useState("");
  const [surface, setSurface] = useState("all");
  const [severity, setSeverity] = useState("moderate");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = () => {
    if (!selectedCondition) return;

    onAddCondition({
      condition_id: parseInt(selectedCondition),
      surface,
      notes: notes || undefined,
      severity,
      date_detected: format(date, "yyyy-MM-dd")
    });

    // Reset form
    setSelectedCondition("");
    setSurface("all");
    setSeverity("moderate");
    setNotes("");
    setDate(new Date());
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setSelectedCondition("");
    setSurface("all");
    setSeverity("moderate");
    setNotes("");
    setDate(new Date());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Condition to Multiple Teeth</DialogTitle>
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

          {/* Condition Selection */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Select a condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map(condition => (
                  <SelectItem key={condition.id} value={condition.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: condition.color_code }}
                      />
                      {condition.name} ({condition.code})
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

          {/* Severity Selection */}
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date Detected</Label>
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
            disabled={!selectedCondition}
            className="bg-red-600 hover:bg-red-700"
          >
            Add Condition to {selectedTeeth.length} Teeth
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 