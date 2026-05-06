import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const AnalyticsChart = ({ data, options: customOptions }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "var(--text-secondary)",
          font: { size: 12, family: "var(--font-display)" },
          boxWidth: 10,
          padding: 12,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "var(--bg-elevated)",
        titleColor: "var(--text-primary)",
        bodyColor: "var(--text-secondary)",
        borderColor: "var(--border-default)",
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: "var(--border-default)", drawBorder: false },
        ticks: { color: "var(--text-muted)", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "var(--border-default)", drawBorder: false },
        ticks: { color: "var(--text-muted)", font: { size: 11 }, precision: 0 },
      },
    },
  };

  // Merge custom options with defaults
  const options = customOptions
    ? { ...defaultOptions, ...customOptions }
    : defaultOptions;

  return <Line data={data} options={options} />;
};

export default AnalyticsChart;
