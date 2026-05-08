import React, { useState, useEffect } from "react";
import StatusCard from "../../components/common/StatusCard/StatusCard";
import RealTimeMonitor from "../../components/dashboard/RealTimeMonitor/RealTimeMonitor";
import UsageMetrics from "../../components/dashboard/UsageMetrics/UsageMetrics";
import AlertsPanel from "../../components/alerts/AlertsPanel/AlertsPanel";
import ActivityFeed from "../../components/dashboard/ActivityFeed/ActivityFeed";
import WebcamDetector from "../../components/detection/WebcamDetector/WebcamDetector";
import { getDashboardStats, getDashboardTimeline } from "../../services/api";

const SkeletonCard = () => (
  <div
    style={{
      height: "130px",
      borderRadius: "14px",
      background:
        "linear-gradient(90deg, #1a2744 0%, #243044 50%, #1a2744 100%)",
      backgroundSize: "600px 100%",
      animation: "dashShimmer 1.4s infinite linear",
      border: "1px solid #1e3a5f",
    }}
  />
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      setLastUpdated(new Date());
    } catch (error) {
      setStatsError(error.message);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <style>{`
        @keyframes dashShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        @keyframes livePing {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }

        /* Status cards — 2 col mobile, 4 col desktop */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 1024px) {
          .dash-stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }

        /* Main grid */
        .dash-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (min-width: 768px) {
          .dash-main-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .dash-main-grid .dash-col-full {
            grid-column: 1 / -1;
          }
        }
        @media (min-width: 1280px) {
  .dash-main-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .dash-main-grid .dash-col-full {
    grid-column: auto;
  }
}
@media (min-width: 1536px) {
  .dash-main-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ── Header ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            paddingBottom: "16px",
            borderBottom: "1px solid #1E2D42",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontSize: "clamp(20px, 3vw, 28px)",
                  fontWeight: 800,
                  color: "#F1F5F9",
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                Dashboard Overview
              </h1>

              {/* Live badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#22C55E",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#22C55E",
                    display: "inline-block",
                    animation: "livePing 1.5s infinite",
                  }}
                />
                LIVE
              </span>
            </div>

            <p
              style={{
                color: "#64748B",
                margin: 0,
                fontSize: "clamp(12px, 2vw, 14px)",
              }}
            >
              Real-time monitoring of pedestrian distraction and violator
              activity
            </p>
          </div>

          {lastUpdated && (
            <div
              style={{
                fontSize: "11px",
                color: "#475569",
                background: "#0f1724",
                border: "1px solid #1e2d42",
                borderRadius: "8px",
                padding: "6px 12px",
                whiteSpace: "nowrap",
              }}
            >
              🕐 {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* ── Error Banner ─────────────────────────────── */}
        {statsError && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "12px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              color: "#f87171",
              flexWrap: "wrap",
            }}
          >
            <span>⚠️ {statsError}</span>
            <button
              onClick={fetchDashboardData}
              style={{
                marginLeft: "auto",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ↻ Retry
            </button>
          </div>
        )}

        {/* ── Status Cards ─────────────────────────────── */}
        <div className="dash-stats-grid">
          {statsLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
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
                status={stats?.unresolved_alerts > 0 ? "danger" : "success"}
                icon="⚠️"
              />
            </>
          )}
        </div>

        {/* ── Main Grid ────────────────────────────────── */}
        <div className="dash-main-grid ">
          {/* Col 1 — Webcam */}
          <div>
            <WebcamDetector />
          </div>

          {/* Col 2 — Monitor + Metrics */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <RealTimeMonitor />
            <UsageMetrics timelineData={timeline} />
          </div>

          {/* Col 3 — Alerts + Feed */}
          <div
            className="dash-col-full"
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <AlertsPanel />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
