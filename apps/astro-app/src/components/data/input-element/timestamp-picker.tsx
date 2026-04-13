"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  fragmentTimestamp,
  recombineLocaleTimestamp,
  toLocaleISOString,
} from "@utils/parse";

export function TimestampPicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (val: Date) => void;
}) {
  const [open, setOpen] = useState<boolean>(false);

  // these fragments are in the user's locale.
  const dateFragments = fragmentTimestamp(
    toLocaleISOString(value ?? new Date()),
  );

  return (
    <div className="flex flex-row w-full items-center gap-4">
      <div className="flex items-center flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {value ? value.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              onSelect={(newDate: Date | undefined) => {
                if (newDate) {
                  // carry over the time part
                  const updatedDate = new Date(newDate);
                  updatedDate.setHours(
                    value.getHours(),
                    value.getMinutes(),
                    value.getSeconds(),
                    value.getMilliseconds(),
                  );
                  onChange(updatedDate);
                }
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center flex-col w-full gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={dateFragments[1]}
          onChange={(val: React.ChangeEvent<HTMLInputElement>) => {
            onChange(
              recombineLocaleTimestamp([dateFragments[0], val.target.value]),
            );
          }}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
