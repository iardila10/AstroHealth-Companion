
import { useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type MetricKey =
  | "heart_rate"
  | "blood_pressure"
  | "temperature"
  | "sleep_hours"
  | "glucose"
  | "fatigue_level";

interface HealthHistoryPoint {
  timestamp: string;
  heart_rate: number | null;
  blood_pressure_sys: number | null;
  blood_pressure_dia: number | null;
  temperature: number | null;
  sleep_hours: number | null;
  glucose: number | null;
  fatigue_level: number | null;
}

interface TrendsChartProps {
  history: HealthHistoryPoint[];
}

const metricConfig: Record<MetricKey, {
  label: string;
  unit: string;
}> = {
  heart_rate: {
    label: "Heart Rate",
    unit: "BPM",
  },
  blood_pressure: {
    label: "Blood Pressure",
    unit: "mmHg",
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
  },
  sleep_hours: {
    label: "Sleep Hours",
    unit: "Hours",
  },
  glucose: {
    label: "Glucose",
    unit: "mg/dL",
  },
  fatigue_level: {
    label: "Fatigue Level",
    unit: "/10",
  },
};

function TrendsChart({ history }: TrendsChartProps) {

  const [selectedMetric, setSelectedMetric] =
    useState<MetricKey>("heart_rate");

  const currentMetric = metricConfig[selectedMetric];

  const hasData = history.some((point) => {
    if (selectedMetric === "blood_pressure") {
      return (
        point.blood_pressure_sys !== null ||
        point.blood_pressure_dia !== null
      );
    }

    return point[selectedMetric] !== null;
  });

  return (
    <section className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <p className="text-xs font-semibold tracking-widest text-cyan-400">
            HEALTH ANALYTICS
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-100">
            Health Trends
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Historical health measurements
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex flex-col gap-2">

          <label
            htmlFor="metric-selector"
            className="text-xs font-medium text-slate-400"
          >
            SELECT INDICATOR
          </label>

          <select
            id="metric-selector"
            value={selectedMetric}
            onChange={(event) =>
              setSelectedMetric(event.target.value as MetricKey)
            }
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
          >
            {Object.entries(metricConfig).map(([key, metric]) => (
              <option key={key} value={key}>
                {metric.label}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* Chart Information */}
      <div className="mt-6">

        <p className="text-sm font-medium text-slate-400">
          {currentMetric.label}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Measurement unit: {currentMetric.unit}
        </p>

      </div>

      {/* Chart */}
      <div className="mt-6 h-72 w-full">

        {!hasData ? (

          <div className="flex h-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50">

            <div className="text-center">
              <p className="font-semibold text-slate-300">
                No Historical Data
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Historical measurements will appear here.
              </p>
            </div>

          </div>

        ) : (

          <ResponsiveContainer width="100%" height="100%">

            <LineChart
              data={history}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >

              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="timestamp"
                stroke="#94A3B8"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
              />

              <YAxis
                stroke="#94A3B8"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                width={55}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#F8FAFC",
                }}
                labelStyle={{
                  color: "#22D3EE",
                }}
              />

              {selectedMetric === "blood_pressure" ? (
                <>
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="blood_pressure_sys"
                    name="Systolic"
                    stroke="#22D3EE"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="blood_pressure_dia"
                    name="Diastolic"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  name={currentMetric.label}
                  stroke="#22D3EE"
                  strokeWidth={2}
                  dot={{ fill: "#22D3EE", r: 3 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              )}

            </LineChart>

          </ResponsiveContainer>

        )}

      </div>

    </section>
  );
}

export default TrendsChart;
