/**
 * A controlled component responsible for picking the origin to read/write from.
 */

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CACHE_URL, DATABASE_URL } from "astro:env/client";
import type { Dispatch, JSX, SetStateAction } from "react";

/**
 * A controlled component responsible for picking the origin to read/write from.
 * @param origin The value of the origin.
 * @param setOrigin The setter for the origin.
 * @returns
 */
export function OriginPicker({
  origin,
  setOrigin,
}: {
  origin: string;
  setOrigin: Dispatch<SetStateAction<string>>;
}): JSX.Element {
  return (
    <Select onValueChange={setOrigin} value={origin}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select an Origin" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Origin</SelectLabel>
          <SelectItem value={CACHE_URL}>Cache</SelectItem>
          <SelectItem value={DATABASE_URL}>Master Database</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
