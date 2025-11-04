import { Card } from "@/components/ui/card";
import type { JSX } from "astro/jsx-runtime";

// START - Multi-variable Chart Cards

/**
 * A card component that displays a line chart with variables chosen by the user.
 * The user may choose to make the line step between values or connect data points directly.
 * The user may also choose to make this an area chart.
 * @returns {JSX.Element}
 */
export function LineChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a line chart with variables chosen by the user.
 * The user may choose to make this a stacked line chart.
 * @returns {JSX.Element}
 */
export function StackedAreaChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a scatter plot with variables chosen by the user.
 * @returns {JSX.Element}
 */
export function ScatterPlotChartCard(): JSX.Element {
    // @TODO
}

// END - Multi-variable Chart Cards

// START - Single-variable Chart Cards

/**
 * A card component that displays a histogram with a variable chosen by the user.
 * The number of intervals may be adjusted by the user.
 * @returns {JSX.Element}
 */
export function HistogramChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a box plot with variables chosen by the user.
 * @returns {JSX.Element}
 */
export function BoxPlotChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a pie chart with a variable chosen by the user.
 * @returns {JSX.Element}
 */
export function PieChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a bar chart with a variable chosen by the user.
 * The user may choose to make this a horizontal or vertical bar chart.
 * The user also may choose to make this a stacked bar chart.
 * @returns {JSX.Element}
 */
export function BarChartCard(): JSX.Element {
    // @TODO
}
// END - Single-variable Chart Cards