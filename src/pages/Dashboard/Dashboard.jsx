import React, { useState, useEffect } from "react";
import StatusCard from "../../components/common/StatusCard/StatusCard";
import RealTimeMonitor from "../../components/dashboard/RealTimeMonitor/RealTimeMonitor";
import UsageMetrics from "../../components/dashboard/UsageMetrics/UsageMetrics";
import AlertsPanel from "../../components/alerts/AlertsPanel/AlertsPanel";
import ActivityFeed from "../../components/dashboard/ActivityFeed/ActivityFeed";
import WebcamDetector from "../../components/detection/WebcamDetector/WebcamDetector";
import { getDashboardStats, getDashboardTimeline } from "../../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Fetch stats and timeline
  const fetchDashboardData = async () => {
    try {
      setStatsError(null);
      const [statsData, timelineData] = await Promise.all([
        getDashboardStats(),
        getDashboardTimeline(),
      ]);
      setStats(statsData);
      setTimeline(timelineData);
      setStatsLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setStatsError(error.message);
      setStatsLoading(false);
    }
  };

  // Fetch on mount and set up polling every 5 seconds
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="space-y-6"
      style={{ maxWidth: "100%", overflowX: "hidden" }}
    >
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="mb-6">
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Dashboard Overview
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          Real-time monitoring of pedestrian distraction and violator activity
        </p>
      </div>

      {/* ── Status Cards Row ─────────────────────────────────── */}
      {/* Always 4 equal columns on large screens, stacks on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Active Violators"
          value={stats?.active_violators || 0}
          status="active"
          icon="📱"
        />
        <StatusCard
          title="Violations Today"
          value={stats?.violations_today || 0}
          status="warning"
          icon="🚨"
        />
        <StatusCard
          title="Detections Today"
          value={stats?.detections_today || 0}
          status="info"
          icon="📷"
        />
        <StatusCard
          title="Unresolved Alerts"
          value={stats?.unresolved_alerts || 0}
          status={stats?.unresolved_alerts > 0 ? "danger" : "active"}
          icon="⚠️"
        />
      </div>

      {/* ── Main Content: 3-Column Layout on Big Screens ─────── */}
      {/*                                                          */}
      {/*  [ Webcam (1/4) ] [ Monitor + Metrics (2/4) ] [ Alerts + Feed (1/4) ] */}
      {/*                                                          */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(1, 1fr)" /* mobile: 1 col */,
          gap: "24px",
          alignItems: "start",
        }}
        className="dashboard-main-grid"
      >
        {/* Column 1 — Webcam Detector */}
        <WebcamDetector />

        {/* Column 2 — Real-time Monitor + Usage Metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <RealTimeMonitor />
          <UsageMetrics timelineData={timeline} />
        </div>

        {/* Column 3 — Alerts + Activity Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <AlertsPanel />
          <ActivityFeed />
        </div>
      </div>

      {/* ── Responsive grid breakpoints via <style> ──────────── */}
      <style>{`
        /* Tablet: 2 columns */
        @media (min-width: 768px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr 1fr;
          }
          /* Alerts column spans full width on tablet */
          .dashboard-main-grid > div:last-child {
            grid-column: 1 / -1;
          }
        }

        /* Desktop / Big screen: 3 columns — 1 : 2 : 1 ratio */
        @media (min-width: 1280px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr 2fr 1fr;
          }
          /* Reset the override from tablet */
          .dashboard-main-grid > div:last-child {
            grid-column: auto;
          }
        }

        /* Extra large screens: give more breathing room */
        @media (min-width: 1536px) {
          .dashboard-main-grid {
            grid-template-columns: 320px 1fr 340px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
