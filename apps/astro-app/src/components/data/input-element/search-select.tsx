"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type SearchSelectItem = Record<"value" | "label", string>;
export type SearchSelectData = Record<"value" | "label", string>[];

export function SearchSelect({
  data,
  value,
  defaultValue,
  onChange,
}: {
  data: SearchSelectData;
  value: string;
  defaultValue?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState<string>(() => {
    if (!value) return "Select...";

    const currentItem: SearchSelectItem | undefined = data.find(
      (item) => item.value == value,
    );
    if (currentItem) return currentItem.label;
    else
      throw TypeError("SearchSelectData does not contain the initial value.");
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {label}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command
          filter={(value: string, search: string) => {
            const target = search.toLowerCase();

            if (value.toLowerCase().includes(target)) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No values found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={(newValue: string) => {
                    onChange(item.value);
                    setLabel(item.label);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
