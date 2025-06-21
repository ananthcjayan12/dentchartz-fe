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
import { Input } from "@/components/ui/input";

interface MultiSelectConditionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCondition: (data: {
    condition_id?: number;
    surface: string;
    notes?: string;
    severity?: string;
    date_detected?: string;
    custom_condition?: string;
    custom_code?: string;
    custom_description?: string;
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
  const [customConditionName, setCustomConditionName] = useState("");
  const [customConditionCode, setCustomConditionCode] = useState("");
  const [customConditionDescription, setCustomConditionDescription] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [surface, setSurface] = useState("all");
  const [severity, setSeverity] = useState("moderate");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = () => {
    if (!selectedCondition) return;

    if (selectedCondition === 'custom') {
      onAddCondition({
        surface,
        notes: notes || undefined,
        severity,
        date_detected: format(date, "yyyy-MM-dd"),
        custom_condition: customConditionName,
        custom_code: customConditionCode,
        custom_description: customConditionDescription
      });
    } else {
      onAddCondition({
        condition_id: parseInt(selectedCondition),
        surface,
        notes: notes || undefined,
        severity,
        date_detected: format(date, "yyyy-MM-dd")
      });
    }

    // Reset form
    setSelectedCondition("");
    setSurface("all");
    setSeverity("moderate");
    setNotes("");
    setDate(new Date());
    setCustomConditionName("");
    setCustomConditionCode("");
    setCustomConditionDescription("");
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setSelectedCondition("");
    setSurface("all");
    setSeverity("moderate");
    setNotes("");
    setDate(new Date());
    setCustomConditionName("");
    setCustomConditionCode("");
    setCustomConditionDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Add Condition to Multiple Teeth</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
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
            <Label htmlFor="condition" className="text-sm">Condition</Label>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a condition" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {conditions.map(condition => (
                  <SelectItem key={condition.id} value={condition.id.toString()}>
                    <div className="flex items-center gap-2 w-full">
                      <div 
                        className="w-3 h-3 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: condition.color_code }}
                      />
                      <span className="text-sm">{condition.name} ({condition.code})</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem key="custom-condition" value="custom">
                  <span className="text-sm">+ Add Custom Condition</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Condition Fields */}
          {selectedCondition === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customConditionName" className="text-sm">Custom Condition Name</Label>
              <Input
                id="customConditionName"
                placeholder="Enter condition name"
                value={customConditionName}
                onChange={e => setCustomConditionName(e.target.value)}
                className="w-full"
              />
              <Label htmlFor="customConditionCode" className="text-sm">Custom Condition Code</Label>
              <Input
                id="customConditionCode"
                placeholder="Enter condition code"
                value={customConditionCode}
                onChange={e => setCustomConditionCode(e.target.value)}
                className="w-full"
              />
              <Label htmlFor="customConditionDescription" className="text-sm">Custom Description</Label>
              <Textarea
                id="customConditionDescription"
                placeholder="Enter description"
                value={customConditionDescription}
                onChange={e => setCustomConditionDescription(e.target.value)}
                rows={2}
                className="w-full resize-none"
              />
            </div>
          )}

          {/* Surface Selection */}
          <div className="space-y-2">
            <Label htmlFor="surface" className="text-sm">Surface</Label>
            <Select value={surface} onValueChange={setSurface}>
              <SelectTrigger className="w-full">
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
            <Label htmlFor="severity" className="text-sm">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full">
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
            <Label className="text-sm">Date Detected</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
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
            <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedCondition}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
          >
            Add to {selectedTeeth.length} Teeth
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 