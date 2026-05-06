import React from "react";
import AnalyticsChart from "../../analytics/AnalyticsChart/AnalyticsChart";

const UsageMetrics = ({ timelineData }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: "#94A3B8",
          font: { size: 12, family: "var(--font-display)" },
          boxWidth: 10,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "#2D3B52",
        titleColor: "#F1F5F9",
        bodyColor: "#94A3B8",
        borderColor: "#1E2D42",
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 12, weight: "500" },
        bodyFont: { size: 12, family: "var(--font-mono)" },
      },
    },
    scales: {
      x: {
        grid: { color: "#1E2D42", drawBorder: false },
        ticks: { color: "#475569", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#1E2D42", drawBorder: false },
        ticks: {
          color: "#475569",
          font: { size: 11 },
          precision: 0,
        },
      },
    },
  };

  const chartData = {
    labels: timelineData?.labels || [],
    datasets: [
      {
        label: "Violations",
        data: timelineData?.violations || [],
        borderColor: "#FF3B3B",
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "transparent";
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, "rgba(255, 59, 59, 0.18)");
          gradient.addColorStop(1, "rgba(255, 59, 59, 0)");
          return gradient;
        },
      },
    ],
  };

  const totalViolations =
    timelineData?.violations?.reduce((sum, value) => sum + value, 0) || 0;
  const peakViolations = timelineData?.violations?.length
    ? Math.max(...timelineData.violations)
    : 0;
  const peakHourIndex = timelineData?.violations?.indexOf(peakViolations) ?? -1;

  const stats = [
    {
      label: "Violations Today",
      value: totalViolations,
    },
    {
      label: "Peak Hour",
      value:
        peakHourIndex >= 0 && timelineData?.labels?.[peakHourIndex]
          ? timelineData.labels[peakHourIndex]
          : "--",
    },
    {
      label: "Peak Violations",
      value: peakViolations,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
      }}
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 24px 0",
        }}
      >
        Violation Timeline
      </h2>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                margin: "0 0 8px 0",
                fontWeight: 400,
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 4px 0",
                fontFamily: "var(--font-mono)",
              }}
            >
              {stat.value}
            </p>
            {stat.time && (
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                {stat.time}
              </p>
            )}
            {stat.change && (
              <p
                style={{
                  fontSize: "11px",
                  color: stat.change.startsWith("+")
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                  margin: 0,
                }}
              >
                {stat.change} from yesterday
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      {timelineData ? (
        <div style={{ height: "256px", marginBottom: "16px" }}>
          <AnalyticsChart data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div
          style={{
            height: "256px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            border: "1px dashed var(--border-default)",
            borderRadius: "var(--radius-md)",
          }}
        >
          Waiting for real violation data from the backend.
        </div>
      )}

      {/* Time Range Buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["Today", "Week", "Month"].map((period) => (
          <button
            key={period}
            style={{
              padding: "6px 12px",
              backgroundColor:
                period === "Today" ? "var(--accent-cyan)" : "var(--bg-surface)",
              color:
                period === "Today"
                  ? "var(--bg-primary)"
                  : "var(--text-secondary)",
              border: `1px solid ${period === "Today" ? "var(--accent-cyan)" : "var(--border-default)"}`,
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (period !== "Today") {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
                e.currentTarget.style.color = "var(--accent-cyan)";
              }
            }}
            onMouseLeave={(e) => {
              if (period !== "Today") {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UsageMetrics;
