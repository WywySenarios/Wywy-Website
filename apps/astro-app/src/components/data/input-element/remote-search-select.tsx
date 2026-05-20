"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { useEffect, useState } from "react";
import { useSearch, safeSearchFetch } from "@utils/data/search";
import { DATABASE_URL } from "astro:env/client";
import { toSnakeCase } from "@utils/parse";
import { Spinner } from "@/components/ui/spinner";

export function RemoteSearchSelect({
  databaseName,
  tableName,
  placeholder = "Search...",
  value,
  onChange,
}: {
  databaseName: string;
  tableName: string;
  placeholder?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [initialLabel, setInitialLabel] = useState<string | undefined>(
    undefined,
  );

  const [results, loading] = useSearch({
    databaseName,
    tableName,
    q: query,
  });

  // On mount with an existing value, resolve its label
  useEffect(() => {
    if (value === undefined || initialLabel !== undefined) return;

    const endpoint = `${DATABASE_URL}/${toSnakeCase(databaseName)}/${toSnakeCase(tableName)}/search`;
    safeSearchFetch(endpoint, String(value))
      .then((items) => {
        const match = items.find((item) => item.id === value);
        if (match) setInitialLabel(match.label);
      })
      .catch(() => {
        // silently fail — just show the raw ID
      });
  }, [value]);

  const displayLabel =
    value !== undefined ? (initialLabel ?? String(value)) : placeholder;

  function handleSelect(selectedId: number) {
    onChange(selectedId);
    setOpen(false);
  }

  function handleClear() {
    onChange(undefined);
    setInitialLabel(undefined);
    setQuery("");
  }

  return (
    <div className="flex flex-row items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-80 justify-between"
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type to search..."
              className="h-9"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="py-2 text-center text-sm text-muted-foreground">
                  Searching... <Spinner />
                </div>
              )}
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {results.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={String(item.id)}
                    onSelect={() => handleSelect(item.id)}
                  >
                    <span className="text-muted-foreground">{item.id}</span> {item.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === item.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value !== undefined && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
