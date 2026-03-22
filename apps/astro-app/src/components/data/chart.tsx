import type { GenericChartProps } from "@/types/chart";
import { GaugeChart } from "./chart/gauge-chart";
import { WaterfallChart } from "./chart/waterfall-chart";
import { TreeMap } from "./chart/tree-map";
import { coerceToNumber } from "@utils/math/datatype";
import {
  getInstanceByDom,
  init,
  type ECharts,
  type EChartsOption,
  type SetOptionOpts,
} from "echarts";
import { useEffect, useRef, type JSX } from "react";
import { cn } from "@root/lib/utils";
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
          endValues={data[1]}
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

export function EChart({
  id,
  className,
  options,
  optionSettings,
  showLoading,
  theme,
}: React.ComponentProps<"div"> & {
  options: EChartsOption;
  optionSettings?: SetOptionOpts;
  showLoading?: boolean;
  theme?: "light" | "dark";
}): JSX.Element {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chart
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme);
    }

    function resizeChart() {
      chart?.resize();
    }
    window.addEventListener("resize", resizeChart);

    // Cleanup function
    return () => {
      chart?.dispose();
      window.removeEventListener("resize", resizeChart);
    };
  }, [theme]);

  useEffect(() => {
    // Update chart
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      chart?.setOption(options, optionSettings);
    }
  }, [options, optionSettings, theme]); // Whenever theme changes we need to add options and setting due to it being deleted in cleanup function

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      showLoading === true ? chart?.showLoading() : chart?.hideLoading();
    }
  }, [showLoading, theme]);

  return (
    <div
      ref={chartRef}
      className={cn("min-w-100 min-h-100 w-full h-full", className)}
    />
  );
}
