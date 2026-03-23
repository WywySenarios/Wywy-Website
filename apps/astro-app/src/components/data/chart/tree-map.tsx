import type { TreeMapProps } from "@/types/chart";
import { GenericChartError, GenericEmptyChart } from "../chart";
import { useEffect } from "react";

export function TreeMap({ name, names, values, ancestries }: TreeMapProps) {
  useEffect(() => {
    // @TODO
  }, [name, names, values, ancestries]);

  // no data state
  if (!names || !values || !ancestries) return GenericEmptyChart();

  // @TODO
  return null;
}
