import type { ShallowTreeMapProps, TreeMapProps } from "@/types/chart";
import { EChart, GenericChartError, GenericEmptyChart } from "../chart";
import { useEffect, useMemo } from "react";
import type { EChartsOption } from "echarts";

export function ShallowTreeMap({ name, names, values }: ShallowTreeMapProps) {
  const data = useMemo(() => {
    if (names.length != values.length)
      throw new TypeError(
        `Array length mismatch: ${names.length} != ${values.length}`,
      );

    const output: Record<any, any> = {};

    names.map((name: string, index: number) => {
      if (!(name in output)) {
        output[name] = values[index];
      } else {
        output[name] += values[index];
      }
    });

    return Object.keys(output).map((name: any) => ({
      name: name,
      value: output[name],
    }));
  }, [names, values]);

  const options: EChartsOption = useMemo(
    () => ({
      title: {
        text: name,
      },
      series: [
        {
          type: "treemap",
          data: data,
        },
      ],
    }),
    [names, values],
  );

  if (!names || !values) return GenericEmptyChart();

  return <EChart options={options} />;
}

export function TreeMap({ name, names, values, ancestries }: TreeMapProps) {
  useEffect(() => {
    // @TODO
  }, [name, names, values, ancestries]);

  // no data state
  if (!names || !values || !ancestries) return GenericEmptyChart();

  // @TODO
  return null;
}
