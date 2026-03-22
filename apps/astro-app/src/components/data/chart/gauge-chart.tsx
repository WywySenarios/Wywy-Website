import type { GaugeChartProps } from "@/types/chart";
import { EChart, GenericChartError, GenericEmptyChart } from "../chart";
import { useMemo } from "react";
import type { EChartsOption } from "echarts";

export function GaugeChart({ name, value, min, max }: GaugeChartProps) {
  const numberFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1, // @TODO configurable number of decimal places
  });

  const options: EChartsOption = useMemo(
    () => ({
      title: {
        text: name,
      },
      series: [
        {
          type: "gauge",
          progress: {
            show: true,
            width: 18,
          },
          axisLine: {
            lineStyle: {
              width: 18,
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            length: 15,
            lineStyle: {
              width: 2,
              color: "#999",
            },
          },
          axisLabel: {
            distance: 25,
            color: "#999",
            fontSize: 20,
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 25,
            itemStyle: {
              borderWidth: 10,
            },
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            fontSize: "2rem",
            offsetCenter: [0, "70%"],
          },
          data: [
            {
              value: Number(numberFormatter.format(value)),
            },
          ],
        },
      ],
    }),
    [name, value],
  );

  if (min > max) {
    return GenericChartError();
  }

  // no data state
  if (!value) {
    return GenericEmptyChart();
  }

  // @TODO
  return <EChart options={options} />;
}
