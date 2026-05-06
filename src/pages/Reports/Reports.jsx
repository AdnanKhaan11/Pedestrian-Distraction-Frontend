import React, { useState, useEffect } from "react";
import AnalyticsChart from "../../components/analytics/AnalyticsChart/AnalyticsChart";

import {
  getDashboardTimeline,
  getDashboardStats,
  getAlerts,
  getDevices,
} from "../../services/api";

const Reports = () => {
  // State
  const [timelineData, setTimelineData] = useState(null);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [zone, setZone] = useState("");
  const [camera, setCamera] = useState("");
  const [status, setStatus] = useState(""); // "active" | "resolved" | ""
  const [violationType, setViolationType] = useState("");

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [timeline, dashStats, deviceRes, alertRes] = await Promise.all([
          getDashboardTimeline(),
          getDashboardStats(),
          getDevices(),
          getAlerts({
            from_date: dateRange.from,
            to_date: dateRange.to,
            resolved:
              status === "active"
                ? false
                : status === "resolved"
                  ? true
                  : undefined,
            // zone/camera/violationType can be added if backend supports
          }),
        ]);
        setTimelineData(timeline);
        setStats(dashStats);
        setDevices(deviceRes.devices || []);
        setAlerts(alertRes.alerts || []);
      } catch (err) {
        setError("Failed to fetch reports data. " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to, zone, camera, status, violationType]);

  // Chart data
  const weeklyData = {
    labels: timelineData?.labels || [],
    datasets: [
      {
        label: "Detections",
        data: timelineData?.detections || [],
        borderColor: "#00D4FF",
        backgroundColor: "rgba(0, 212, 255, 0.10)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Violations",
        data: timelineData?.violations || [],
        borderColor: "#FF3B3B",
        backgroundColor: "rgba(255, 59, 59, 0.08)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: "#94A3B8", font: { size: 12 } } },
      tooltip: {
        backgroundColor: "#2D3B52",
        titleColor: "#F1F5F9",
        bodyColor: "#94A3B8",
        borderColor: "#1E2D42",
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { color: "#1E2D42" }, ticks: { color: "#475569" } },
      y: { grid: { color: "#1E2D42" }, ticks: { color: "#475569" } },
    },
  };

  // Summary KPIs (all real data)
  const summaryItems = [
    {
      label: "Total Violations",
      value: alerts.length,
      color: "var(--color-danger)",
    },
    {
      label: "Active Violators",
      value: stats?.active_violators ?? "—",
      color: "var(--color-success)",
    },
    {
      label: "Resolved Cases",
      value: alerts.filter((a) => a.resolved).length,
      color: "var(--accent-cyan)",
    },
    {
      label: "Violation Trends",
      value: timelineData?.violations?.reduce((a, b) => a + b, 0) ?? "—",
      color: "var(--color-warning)",
    },
  ];

  // Report metrics (all calculated from real alerts)
  const violationsPerZone = {};
  const violationsPerCamera = {};
  const violationFrequency = {};
  const violatorRecurrence = {};
  const hourCounts = Array(24).fill(0);
  let resolutionRate = 0;

  alerts.forEach((alert) => {
    if (alert.zone)
      violationsPerZone[alert.zone] = (violationsPerZone[alert.zone] || 0) + 1;
    if (alert.camera_id)
      violationsPerCamera[alert.camera_id] =
        (violationsPerCamera[alert.camera_id] || 0) + 1;
    const date = alert.timestamp?.slice(0, 10);
    if (date) violationFrequency[date] = (violationFrequency[date] || 0) + 1;
    if (alert.face_id)
      violatorRecurrence[alert.face_id] =
        (violatorRecurrence[alert.face_id] || 0) + 1;
    const hour = alert.timestamp ? new Date(alert.timestamp).getHours() : null;
    if (hour !== null) hourCounts[hour]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  resolutionRate = alerts.length
    ? (alerts.filter((a) => a.resolved).length / alerts.length) * 100
    : 0;

  // ── Native CSV Download (no file-saver needed) ──────────────────────────────
  const handleDownloadCSV = () => {
    const rows = [
      [
        "Alert ID",
        "Timestamp",
        "Zone",
        "Camera",
        "Face ID",
        "Severity",
        "Resolved",
        "Type",
      ],
      ...alerts.map((a) => [
        a.alert_id,
        a.timestamp,
        a.zone || "",
        a.camera_id || "",
        a.face_id || "",
        a.severity || "",
        a.resolved ? "Yes" : "No",
        a.type || "",
      ]),
    ];

    const csv = rows
      .map((r) =>
        r.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `violation_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Native PDF Download via browser print (no jsPDF needed) ────────────────
  const handleDownloadPDF = () => {
    const date = new Date().toLocaleDateString();
    const reportDate = new Date().toISOString().slice(0, 10);

    const summaryRows = summaryItems
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 12px;border:1px solid #ddd;">${item.label}</td>
            <td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">${item.value}</td>
          </tr>`,
      )
      .join("");

    const alertRows = alerts
      .slice(0, 30)
      .map(
        (a, i) =>
          `<tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#fff"}">
            <td style="padding:5px 8px;border:1px solid #ddd;">${a.timestamp || "—"}</td>
            <td style="padding:5px 8px;border:1px solid #ddd;">${a.zone || "—"}</td>
            <td style="padding:5px 8px;border:1px solid #ddd;">${a.camera_id || "—"}</td>
            <td style="padding:5px 8px;border:1px solid #ddd;">${a.face_id || "—"}</td>
            <td style="padding:5px 8px;border:1px solid #ddd;">${a.severity || "—"}</td>
            <td style="padding:5px 8px;border:1px solid #ddd;">${a.resolved ? "Yes" : "No"}</td>
          </tr>`,
      )
      .join("");

    const metricsHTML = `
      <h3 style="margin-top:24px;">Report Metrics</h3>
      <p><strong>Peak Violation Hour:</strong> ${peakHour >= 0 ? `${peakHour}:00` : "No data"}</p>
      <p><strong>Resolution Rate:</strong> ${resolutionRate.toFixed(1)}%</p>

      <h4>Violations Per Zone</h4>
      <ul>${
        Object.entries(violationsPerZone)
          .map(([z, c]) => `<li>${z}: ${c}</li>`)
          .join("") || "<li>No data</li>"
      }</ul>

      <h4>Violations Per Camera</h4>
      <ul>${
        Object.entries(violationsPerCamera)
          .map(([cam, c]) => `<li>${cam}: ${c}</li>`)
          .join("") || "<li>No data</li>"
      }</ul>

      <h4>Violation Frequency (by Day)</h4>
      <ul>${
        Object.entries(violationFrequency)
          .map(([d, c]) => `<li>${d}: ${c}</li>`)
          .join("") || "<li>No data</li>"
      }</ul>

      <h4>Violator Recurrence</h4>
      <ul>${
        Object.entries(violatorRecurrence)
          .map(([face, c]) => `<li>${face}: ${c} times</li>`)
          .join("") || "<li>No data</li>"
      }</ul>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Violation Report - ${reportDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #222; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
            h3 { font-size: 15px; margin-top: 20px; }
            h4 { font-size: 13px; margin-top: 14px; margin-bottom: 4px; }
            p { margin: 4px 0; font-size: 13px; }
            table { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 12px; }
            th { background: #1a1a2e; color: #fff; padding: 7px 10px; border: 1px solid #ddd; text-align: left; }
            ul { margin: 4px 0 8px 18px; font-size: 13px; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>
          <h1>Violation Report</h1>
          <p style="color:#666;">Generated: ${date}</p>

          <h2>Summary</h2>
          <table>
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>${summaryRows}</tbody>
          </table>

          <h2>Violations (up to 30 records)</h2>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th><th>Zone</th><th>Camera</th>
                <th>Face ID</th><th>Severity</th><th>Resolved</th>
              </tr>
            </thead>
            <tbody>${alertRows || `<tr><td colspan="6" style="text-align:center;padding:10px;">No violations found</td></tr>`}</tbody>
          </table>

          ${metricsHTML}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups for this site to export PDF.");
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    // Slight delay ensures content is fully rendered before print dialog opens
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  // Filter UI
  const filterSection = (
    <div className="flex flex-wrap gap-4 mb-4">
      <div>
        <label className="block text-xs text-gray-500">Date From</label>
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) =>
            setDateRange((r) => ({ ...r, from: e.target.value }))
          }
          className="border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500">Date To</label>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          className="border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500">Zone</label>
        <input
          type="text"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Zone"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500">Camera</label>
        <input
          type="text"
          value={camera}
          onChange={(e) => setCamera(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Camera ID"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500">Violation Type</label>
        <input
          type="text"
          value={violationType}
          onChange={(e) => setViolationType(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Type"
        />
      </div>
      <button
        onClick={handleDownloadCSV}
        className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
      >
        Download CSV
      </button>
      <button
        onClick={handleDownloadPDF}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Download PDF
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-primary m-0">
          Reports & Analytics
        </h1>
        <p className="text-secondary mt-2 text-sm">
          Detailed usage reports and analytics
        </p>
      </div>
      {filterSection}
      {loading && <p className="text-muted text-sm">Loading reports...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!loading && alerts.length === 0 && (
        <p className="text-muted text-sm">
          No violations found for the selected filters.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary border border-default rounded-lg p-5">
          <h2 className="text-lg font-semibold text-primary mb-4">
            Weekly Detection Report
          </h2>
          <div style={{ height: "256px" }}>
            <AnalyticsChart data={weeklyData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-secondary border border-default rounded-lg p-5">
          <h2 className="text-lg font-semibold text-primary mb-4">Summary</h2>
          <div className="flex flex-col gap-2">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center px-3 py-2 bg-surface rounded-md border border-default"
              >
                <span className="text-secondary text-sm">{item.label}</span>
                <span
                  className="font-mono font-semibold text-sm"
                  style={{ color: item.color }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Report Metrics Section */}
      <div className="bg-secondary border border-default rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          Report Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Violations Per Zone</h3>
            <ul className="text-sm">
              {Object.entries(violationsPerZone).map(([zone, count]) => (
                <li key={zone}>
                  {zone}: {count}
                </li>
              ))}
              {Object.keys(violationsPerZone).length === 0 && <li>No data</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Violations Per Camera</h3>
            <ul className="text-sm">
              {Object.entries(violationsPerCamera).map(([cam, count]) => (
                <li key={cam}>
                  {cam}: {count}
                </li>
              ))}
              {Object.keys(violationsPerCamera).length === 0 && (
                <li>No data</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Violation Frequency (by Day)</h3>
            <ul className="text-sm">
              {Object.entries(violationFrequency).map(([date, count]) => (
                <li key={date}>
                  {date}: {count}
                </li>
              ))}
              {Object.keys(violationFrequency).length === 0 && <li>No data</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Violator Recurrence</h3>
            <ul className="text-sm">
              {Object.entries(violatorRecurrence).map(([face, count]) => (
                <li key={face}>
                  {face}: {count} times
                </li>
              ))}
              {Object.keys(violatorRecurrence).length === 0 && <li>No data</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Peak Violation Hour</h3>
            <p className="text-sm">
              {peakHour >= 0 ? `${peakHour}:00` : "No data"}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Resolution Rate</h3>
            <p className="text-sm">{resolutionRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
