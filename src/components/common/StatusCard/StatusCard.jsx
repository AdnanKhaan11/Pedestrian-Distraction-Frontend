import React from "react";

const StatusCard = ({ title, value, status, icon, trend }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: { top: "var(--color-success)", bg: "var(--color-success-dim)" },
      warning: { top: "var(--color-danger)", bg: "var(--color-danger-dim)" },
      danger: { top: "var(--color-danger)", bg: "var(--color-danger-dim)" },
      info: { top: "var(--accent-cyan)", bg: "rgba(0, 212, 255, 0.08)" },
    };
    return colors[status] || colors.info;
  };

  const colors = getStatusColor(status);

  return (
    <div
      className="card-hover"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        borderTop: `2px solid ${colors.top}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "20px",
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 400,
              margin: "0 0 8px 0",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 8px 0",
              fontFamily: "var(--font-mono)",
            }}
          >
            {value}
          </p>
          {trend !== undefined && (
            <p
              style={{
                fontSize: "12px",
                color:
                  trend > 0 ? "var(--color-danger)" : "var(--color-success)",
                margin: 0,
              }}
            >
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from yesterday
            </p>
          )}
        </div>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-md)",
            backgroundColor: colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
