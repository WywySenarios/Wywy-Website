import React, { useEffect, useRef } from "react";
import { init, getInstanceByDom, type EChartsOption, type SetOptionOpts, type ECharts } from "echarts";
import type { JSX } from "astro/jsx-runtime";
import { cn } from "../lib/utils";

export default function EChart({
    id,
    className,
    option,
    optionSettings,
    showLoading,
    theme
}: React.ComponentProps<"div"> & {
    option: EChartsOption,
    optionSettings: SetOptionOpts,
    showLoading: boolean,
    theme?: "light" | "dark"
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
            if (chart != undefined) chart.setOption(option, optionSettings);
        }
    }, [option, optionSettings, theme]); // Whenever theme changes we need to add option and setting due to it being deleted in cleanup function

    useEffect(() => {
        if (chartRef.current !== null) {
            const chart = getInstanceByDom(chartRef.current);
            if (chart != undefined) showLoading === true ? chart.showLoading() : chart.hideLoading();
        }
    }, [showLoading, theme]);

    return <div ref={chartRef} className={cn("w-full h-full", className)} />;
}