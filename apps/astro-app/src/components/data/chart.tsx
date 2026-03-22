import type { GenericChartProps } from "@/types/chart";
import { GaugeChart } from "./chart/gauge-chart";
import { WaterfallChart } from "./chart/waterfall-chart";
import { TreeMap } from "./chart/tree-map";
import { coerceToNumber } from "@utils/math/datatype";
import { toSnakeCase } from "@utils/parse";

export function GenericEmptyChart() {
  return null;
}

export function GenericChartError() {
  return null;
}

export function GenericChart({ data, options }: GenericChartProps) {
  const chartType = toSnakeCase(options.type);
  switch (chartType) {
    case "gauge_chart":
      return (
        <GaugeChart
          name={options.name}
          value={coerceToNumber(data, "Invalid input chart data: ")}
          min={options.min}
          max={options.max}
        />
      );
    case "waterfall_chart":
      return (
        <WaterfallChart
          name={options.name}
          startValues={data[0]}
          values={data[1]}
          labels={data[2]}
          {...options}
        />
      );
    case "treemap":
      return (
        <TreeMap
          name={options.name}
          names={data[0]}
          values={data[1]}
          ancestries={data[2]}
        />
      );
    default:
      console.warn(`Could not find chart type "${chartType}"`);
  }
}
