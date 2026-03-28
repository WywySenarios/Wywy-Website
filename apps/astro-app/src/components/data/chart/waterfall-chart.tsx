import type { WaterfallChartProps } from "@/types/chart";
import { EChart, GenericChartError, GenericEmptyChart } from "../chart";
import { useMemo } from "react";
import {
  time,
  type DefaultLabelFormatterCallbackParams,
  type EChartsOption,
  type LabelFormatterCallback,
  type XAXisComponentOption,
  type YAXisComponentOption,
} from "echarts";
import { prettifyDurationShortened as prettifyDuration } from "@utils/parse";

export function WaterfallChart({
  name,
  startValues,
  endValues,
  labels,
  offset,
  datatype,
  invertAxes,
}: WaterfallChartProps) {
  const { sortedLabels, sortedStartValues, sortedEndValues, durations } =
    useMemo(() => {
      if (
        startValues.length != endValues.length ||
        startValues.length != labels.length
      )
        throw new TypeError(`Waterfall chart data vector mismatch.`);

      let indices = [...startValues.keys()];
      // reverse sort so that earlier items appear on the top
      if (invertAxes) {
        indices.sort((a, b) => startValues[b] - startValues[a]);
      } else {
        indices.sort((a, b) => startValues[a] - startValues[b]);
      }

      let sortedLabels = indices.map((i) => labels[i]);
      let sortedStartValues = indices.map((i) => startValues[i]);
      let sortedEndValues = indices.map((i) => endValues[i]);
      let durations = sortedStartValues.map(
        (startValue, index) => sortedEndValues[index] - startValue,
      );

      return { sortedLabels, sortedStartValues, sortedEndValues, durations };
    }, [startValues, endValues, labels]);

  const durationFormatter: LabelFormatterCallback = useMemo(() => {
    switch (datatype) {
      case "time":
      case "timestamp":
      case "date":
        return function (params: DefaultLabelFormatterCallbackParams) {
          const value = params.value;
          switch (typeof value) {
            case "object":
            case "number":
              return prettifyDuration(value as number | Date);
            default:
              return `Error: Expected Number or Date but received ${typeof value} instead.`;
          }
        };
      default:
        return function (params: DefaultLabelFormatterCallbackParams) {
          return String(params.value);
        };
    }
  }, [datatype]);

  const dependentAxis: XAXisComponentOption | YAXisComponentOption =
    useMemo(() => {
      const dependentAxisLabel: Record<string, any> = {};

      switch (datatype) {
        case "time":
        case "timestamp":
        case "date":
          // @TODO customizable formatter
          dependentAxisLabel["formatter"] = (value: number) =>
            time.format(value, "{hh}:{mm}", true);
          break;
        default:
      }

      // select offset
      // dataMin doesn't work when the datatype is a date (i.e. the dates displayed will be in 1970 rather than the current time)
      let min = startValues[0];
      for (const value of startValues) {
        if (value < min) min = value;
      }

      return {
        type: "value",
        min: min,
        axisLabel: { ...dependentAxisLabel },
      };
    }, [datatype]);

  const independentAxis: XAXisComponentOption | YAXisComponentOption = useMemo(
    () => ({
      type: "category",
      splitLine: { show: false },
      data: sortedLabels,
    }),
    [datatype],
  );

  const options: EChartsOption = useMemo(
    () => ({
      title: {
        text: name,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params: any) {
          const startTime = params[0];
          const duration = params[1];
          let durationValue;
          let startTimeValue;
          switch (datatype) {
            case "time":
            case "timestamp":
            case "date":
              startTimeValue = new Date(startTime.value).toLocaleString();
              durationValue = prettifyDuration(duration.value);
              break;
            default:
              startTimeValue = startTime;
              durationValue = duration.value;
          }
          return (
            startTime.name +
            "<br/>Duration : " +
            durationValue +
            "<br/>Start : " +
            startTimeValue
          );
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
          name: "Start Value",
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
          data: sortedStartValues,
        },
        {
          name: "Duration",
          type: "bar",
          stack: "Total",
          label: {
            show: true,
            position: "inside",
            formatter: durationFormatter,
          },

          data: durations,
        },
      ],
    }),
    [name, sortedStartValues, durations, sortedLabels],
  );

  // no data state
  if (!sortedStartValues || !durations || !sortedLabels)
    return GenericEmptyChart();

  return <EChart className="h-[80vh]" options={options} />;
}
