import React from "react";
import { Link, useLocation } from "react-router-dom";
import eagleEyeLogo from "../../../../public/eagle_eye_logo.png";

const Sidebar = ({ isMobile, isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: "Dash", path: "/" },
    { name: "Violators", icon: "Alert", path: "/violators" },
    { name: "Detection", icon: "View", path: "/detection" },
    { name: "Reports", icon: "Data", path: "/reports" },
    { name: "Settings", icon: "Config", path: "/settings" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(2, 6, 23, 0.68)",
            zIndex: 20,
          }}
        />
      )}

      <aside
        style={{
          width: isMobile ? "280px" : "256px",
          maxWidth: "85vw",
          backgroundColor: "var(--bg-primary)",
          borderRight: "1px solid var(--border-default)",
          position: isMobile ? "fixed" : "relative",
          inset: isMobile ? "0 auto 0 0" : "auto",
          zIndex: 30,
          transform: isMobile
            ? isOpen
              ? "translateX(0)"
              : "translateX(-100%)"
            : "translateX(0)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          minHeight: isMobile ? "100vh" : "auto",
        }}
      >
        <div
          style={{
            padding: isMobile ? "18px 16px 10px" : "20px 16px 8px",
            borderBottom: "1px solid var(--border-default)",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              paddingRight: isMobile ? "40px" : 0,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--accent-cyan)",
                boxShadow: "0 0 8px var(--accent-cyan)",
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  color: "var(--accent-cyan)",
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                PDS
              </div>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  lineHeight: 1.2,
                }}
              >
                AI Monitor
              </div>
            </div>
          </div>

          {isMobile && (
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "34px",
                height: "34px",
                borderRadius: "999px",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        <nav style={{ padding: "16px 8px", overflowY: "auto" }}>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => {
                    if (isMobile) {
                      onClose();
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    color: isActive(item.path)
                      ? "var(--accent-cyan)"
                      : "var(--text-secondary)",
                    backgroundColor: isActive(item.path)
                      ? "var(--bg-surface)"
                      : "transparent",
                    borderLeft: isActive(item.path)
                      ? "3px solid var(--accent-cyan)"
                      : "3px solid transparent",
                    paddingLeft: isActive(item.path) ? "13px" : "16px",
                    fontWeight: isActive(item.path) ? 600 : 400,
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(event) => {
                    if (!isActive(item.path)) {
                      event.currentTarget.style.backgroundColor =
                        "var(--bg-surface)";
                      event.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!isActive(item.path)) {
                      event.currentTarget.style.backgroundColor = "transparent";
                      event.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: isActive(item.path)
                        ? "var(--accent-cyan)"
                        : "var(--text-muted)",
                      minWidth: "52px",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span style={{ minWidth: 0, wordBreak: "break-word" }}>
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
