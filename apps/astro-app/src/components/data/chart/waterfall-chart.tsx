import type { WaterfallChartProps } from "@/types/chart";
import { EChart, GenericChartError, GenericEmptyChart } from "../chart";
import { useMemo } from "react";
import type {
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";

export function WaterfallChart({
  name,
  startValues,
  endValues,
  labels,
  offset,
  datatype,
  invertAxes,
}: WaterfallChartProps) {
  const options: EChartsOption = useMemo(() => {
    if (
      startValues.length != endValues.length ||
      startValues.length != labels.length
    )
      throw new TypeError(`Waterfall chart data vector mismatch.`);
    let transformedValues: typeof startValues;
    switch (offset) {
      case "initial":
        transformedValues = startValues.map(
          (startValue: number) => startValue - startValues[0],
        );
        break;
      default:
        transformedValues = startValues;
    }

    const durations = startValues.map(
      (startValue, index) => endValues[index] - startValue,
    );

    const independentAxis: XAXisComponentOption | YAXisComponentOption = {
      type: "category",
      splitLine: { show: false },
      data: labels,
    };
    const dependentAxis: XAXisComponentOption | YAXisComponentOption = {
      type: datatype ? datatype : "value",
    };

    return {
      title: {
        text: name,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params: any) {
          var tar = params[1];
          return tar.name + "<br/>" + tar.seriesName + " : " + tar.value;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: (invertAxes
        ? dependentAxis
        : independentAxis) as XAXisComponentOption,
      yAxis: (invertAxes
        ? independentAxis
        : dependentAxis) as YAXisComponentOption,
      series: [
        {
          name: "Placeholder",
          type: "bar",
          stack: "Total",
          itemStyle: {
            borderColor: "transparent",
            color: "transparent",
          },
          emphasis: {
            itemStyle: {
              borderColor: "transparent",
              color: "transparent",
            },
          },
          data: transformedValues,
        },
        {
          name: "Duration",
          type: "bar",
          stack: "Total",
          label: {
            show: true,
            position: "inside",
          },
          data: durations,
        },
      ],
    };
  }, [name, startValues, endValues, labels]);

  // no data state
  if (!startValues || !endValues || !labels) return GenericEmptyChart();

  return <EChart options={options}></EChart>;
}
