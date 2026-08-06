import { METRIC_DECIMALS, type InBodyMetricKey } from "../types";

export function formatValue(v: number | undefined, key: InBodyMetricKey): string {
  if (v === undefined) return "-";
  return v.toFixed(METRIC_DECIMALS[key]);
}

export function formatDelta(v: number, key: InBodyMetricKey): string {
  const sign = v > 0 ? "+" : v < 0 ? "" : "±";
  return `${sign}${v.toFixed(METRIC_DECIMALS[key])}`;
}
