"use client";

import { useState, useEffect } from "react";
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
} from "@/utils";

export function Calendar24({
  value,
  onChange,
  defaultValue,
}: {
  value: string;
  onChange: (val: string) => void;
  defaultValue?: string;
}) {
  const [open, setOpen] = useState<boolean>(false);

  const date: Date = new Date(value);
  // these fragments are in the user's locale.
  const dateFragments = fragmentTimestamp(toLocaleISOString(date));

  return (
    <div className="flex flex-row w-full items-center gap-4">
      <div className="flex items-center flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(newDate: Date | undefined) => {
                if (newDate)
                  onChange(
                    recombineLocaleTimestamp([
                      fragmentTimestamp(newDate.toISOString())[0],
                      dateFragments[1],
                    ]).toISOString(),
                  );
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
          defaultValue={defaultValue}
          value={dateFragments[1]}
          onChange={(val: React.ChangeEvent<HTMLInputElement>) => {
            onChange(
              recombineLocaleTimestamp([
                dateFragments[0],
                val.target.value,
              ]).toISOString(),
            );
          }}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
