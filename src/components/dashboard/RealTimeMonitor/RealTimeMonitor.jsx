import React, { useEffect, useState } from "react";
import { getAlerts } from "../../../services/api";

const RealTimeMonitor = () => {
  const [violators, setViolators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViolators = async () => {
      try {
        const data = await getAlerts({ limit: 5, resolved: false });
        setViolators(data.alerts || []);
      } catch (err) {
        console.error("Failed to fetch violators:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchViolators();
    const interval = setInterval(fetchViolators, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColors = (severity) => {
    const colors = {
      high: { bg: "var(--color-danger-dim)", text: "var(--color-danger)" },
      medium: { bg: "var(--color-warning-dim)", text: "var(--color-warning)" },
      low: { bg: "rgba(0, 212, 255, 0.08)", text: "var(--accent-cyan)" },
    };
    return colors[severity?.toLowerCase?.()] || colors.low;
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Real-time Violator Activity
        </h2>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
            color: "var(--color-success)",
          }}
        >
          <span
            className="pulse"
            style={{
              width: "6px",
              height: "6px",
              backgroundColor: "var(--color-success)",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          />
          Live
        </span>
      </div>

      {loading && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Loading violators...
        </p>
      )}

      {!loading && violators.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          No active violators found
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {violators.map((violator) => {
          const statusColors = getStatusColors(violator.severity);
          return (
            <div
              key={violator.alert_id || violator._id}
              style={{
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                transition: "all 0.15s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                e.currentTarget.style.boxShadow = "var(--shadow-card)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      backgroundColor: "var(--bg-elevated)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                    }}
                  >
                    V
                  </div>
                  <div>
                    <h3
                      style={{
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        margin: 0,
                        fontSize: "14px",
                      }}
                    >
                      {violator.face_id || "Unknown violator"}
                    </h3>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        margin: "3px 0 0 0",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Last alert: {formatLastSeen(violator.timestamp)}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "11px",
                    fontWeight: 500,
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                  }}
                >
                  {violator.severity || "LOW"}
                </span>
              </div>

              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  margin: "8px 0 0 50px",
                }}
              >
                {violator.description || "Violation detected"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RealTimeMonitor;
