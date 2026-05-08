import React from "react";

const StatusCard = ({ title, value, status, icon, trend }) => {
  const getTheme = (status) => {
    const themes = {
      // 🔴 Active Violators — RED (violation = danger)
      active: {
        top: "#EF4444",
        glow: "rgba(239,68,68,0.12)",
        iconBg: "rgba(239,68,68,0.1)",
        iconBorder: "rgba(239,68,68,0.25)",
        valueColor: "#EF4444",
        pulseColor: "#EF4444",
        label: "● Active",
      },
      // 🟠 Violations Today — ORANGE
      warning: {
        top: "#F59E0B",
        glow: "rgba(245,158,11,0.12)",
        iconBg: "rgba(245,158,11,0.1)",
        iconBorder: "rgba(245,158,11,0.25)",
        valueColor: "#F59E0B",
        pulseColor: "#F59E0B",
        label: "● Warning",
      },
      // 🔴 Danger — DEEP RED
      danger: {
        top: "#DC2626",
        glow: "rgba(220,38,38,0.15)",
        iconBg: "rgba(220,38,38,0.1)",
        iconBorder: "rgba(220,38,38,0.3)",
        valueColor: "#F87171",
        pulseColor: "#DC2626",
        label: "● Critical",
      },
      // 🔵 Detections — BLUE
      info: {
        top: "#3B82F6",
        glow: "rgba(59,130,246,0.12)",
        iconBg: "rgba(59,130,246,0.1)",
        iconBorder: "rgba(59,130,246,0.25)",
        valueColor: "#3B82F6",
        pulseColor: "#3B82F6",
        label: "● Monitoring",
      },
      // 🟢 Safe/Resolved — GREEN
      success: {
        top: "#22C55E",
        glow: "rgba(34,197,94,0.12)",
        iconBg: "rgba(34,197,94,0.1)",
        iconBorder: "rgba(34,197,94,0.25)",
        valueColor: "#22C55E",
        pulseColor: "#22C55E",
        label: "● Safe",
      },
    };
    return themes[status] || themes.info;
  };

  const theme = getTheme(status);

  return (
    <>
      <style>{`
        @keyframes pvdPulse {
          0%   { box-shadow: 0 0 0 0 ${theme.pulseColor}55; }
          70%  { box-shadow: 0 0 0 6px ${theme.pulseColor}00; }
          100% { box-shadow: 0 0 0 0 ${theme.pulseColor}00; }
        }
        @keyframes pvdFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pvd-card {
          position: relative;
          background: linear-gradient(145deg, #1a2744 0%, #0f1724 100%);
          border: 1px solid #1e3a5f;
          border-top: 3px solid ${theme.top};
          border-radius: 14px;
          padding: 18px;
          cursor: default;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: pvdFadeIn 0.35s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .pvd-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.4),
                      0 0 0 1px ${theme.top}44;
        }
        .pvd-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 70px;
          background: linear-gradient(180deg, ${theme.glow}, transparent);
          pointer-events: none;
        }
        .pvd-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${theme.pulseColor};
          display: inline-block;
          animation: pvdPulse 1.8s infinite;
        }
      `}</style>

      <div className="pvd-card">
        {/* Top Row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#64748B",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            {title}
          </p>

          {/* Icon */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: theme.iconBg,
              border: `1px solid ${theme.iconBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <p
          style={{
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 800,
            color: value > 0 ? theme.valueColor : "#94A3B8",
            margin: "0 0 12px 0",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}
        >
          {value}
        </p>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: `linear-gradient(to right, ${theme.top}44, transparent)`,
            marginBottom: "10px",
          }}
        />

        {/* Bottom Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "10px",
              fontWeight: 700,
              color: theme.valueColor,
              background: theme.iconBg,
              border: `1px solid ${theme.iconBorder}`,
              borderRadius: "999px",
              padding: "2px 8px",
            }}
          >
            <span className="pvd-dot" />
            {theme.label.replace("● ", "")}
          </span>

          {trend !== undefined && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: trend > 0 ? "#EF4444" : "#22C55E",
              }}
            >
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default StatusCard;
