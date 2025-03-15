"use client";

import { useState, useEffect } from "react";
import { format, addMinutes, parse, isBefore, isAfter, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
  patientName?: string;
}

interface TimeSlotPickerProps {
  date: Date;
  startTime?: string; // Format: "HH:mm"
  endTime?: string; // Format: "HH:mm"
  interval?: number; // in minutes
  bookedSlots?: {
    startTime: string;
    endTime: string;
    appointmentId: string;
    patientName: string;
  }[];
  value?: string;
  onChange: (time: string) => void;
}

export function TimeSlotPicker({
  date,
  startTime = "09:00",
  endTime = "17:00",
  interval = 30,
  bookedSlots = [],
  value,
  onChange
}: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Generate time slots
    const slots: TimeSlot[] = [];
    const start = parse(startTime, "HH:mm", new Date());
    const end = parse(endTime, "HH:mm", new Date());
    
    let current = start;
    while (isBefore(current, end)) {
      const timeString = format(current, "HH:mm");
      
      // Check if this slot is booked
      const isBooked = bookedSlots.some(slot => {
        const slotStart = parse(slot.startTime, "HH:mm", new Date());
        const slotEnd = parse(slot.endTime, "HH:mm", new Date());
        
        return (
          isBefore(current, slotEnd) && 
          (isAfter(addMinutes(current, interval), slotStart) || 
           format(current, "HH:mm") === format(slotStart, "HH:mm"))
        );
      });
      
      // Find booking details if booked
      const booking = bookedSlots.find(slot => {
        const slotStart = parse(slot.startTime, "HH:mm", new Date());
        return format(current, "HH:mm") === format(slotStart, "HH:mm");
      });
      
      slots.push({
        time: timeString,
        available: !isBooked,
        appointmentId: booking?.appointmentId,
        patientName: booking?.patientName
      });
      
      current = addMinutes(current, interval);
    }
    
    setTimeSlots(slots);
  }, [date, startTime, endTime, interval, bookedSlots]);

  return (
    <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
      {timeSlots.map((slot) => (
        <TooltipProvider key={slot.time}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors",
                  slot.available
                    ? value === slot.time
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : "bg-red-100 text-red-800 cursor-not-allowed opacity-70"
                )}
                disabled={!slot.available}
                onClick={() => onChange(slot.time)}
              >
                {slot.time}
              </button>
            </TooltipTrigger>
            {!slot.available && slot.patientName && (
              <TooltipContent>
                <p>Booked by: {slot.patientName}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
} 