import React, { useState } from "react";

const Header = ({ isMobile, onMenuClick }) => {
  const [isDark, setIsDark] = useState(true);

  const handleThemeToggle = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.setAttribute(
      "data-theme",
      nextIsDark ? "" : "light",
    );
  };

  return (
    <header
      style={{
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-default)",
        minHeight: "56px",
        display: "flex",
        alignItems: "center",
        padding: isMobile ? "10px 12px" : "0 24px",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <button
        onClick={onMenuClick}
        style={{
          display: isMobile ? "inline-flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          padding: 0,
          borderRadius: "var(--radius-md)",
          color: "var(--text-secondary)",
          backgroundColor: "transparent",
          border: "1px solid var(--border-default)",
          cursor: "pointer",
          fontSize: "20px",
          flexShrink: 0,
        }}
        aria-label="Open navigation menu"
      >
        ☰
      </button>

      <h1
        style={{
          fontSize: isMobile ? "14px" : "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: 0,
          flex: 1,
          minWidth: 0,
          lineHeight: 1.3,
          wordBreak: "break-word",
        }}
      >
        Pedestrian Distraction Detection System
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "8px" : "12px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleThemeToggle}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: isMobile ? "6px 8px" : "6px 10px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: isMobile ? "12px" : "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: isMobile ? "44px" : "52px",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.borderColor = "var(--border-hover)";
            event.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.borderColor = "var(--border-default)";
            event.currentTarget.style.color = "var(--text-secondary)";
          }}
          aria-label="Toggle theme"
        >
          {isDark ? "Light" : "Dark"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <div
            className="pulse"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--color-success)",
              flexShrink: 0,
            }}
          />
          {!isMobile && (
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                fontWeight: 400,
                whiteSpace: "nowrap",
              }}
            >
              System Online
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
