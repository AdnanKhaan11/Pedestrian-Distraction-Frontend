import React, { useEffect, useState, useRef, useCallback } from "react";
import { getFaces, deleteFace } from "../../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  DEMO SECTION — DELETE THIS ENTIRE BLOCK BEFORE GOING TO PRODUCTION
//     To preview UI with dummy data: set DEMO_MODE = true
//     To use real backend data:      set DEMO_MODE = false  ← default
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_MODE = false; // 👈 flip to true to test UI without backend

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getStatus(face) {
  if (typeof face.resolved === "boolean")
    return face.resolved ? "resolved" : "active";
  return face.status || "active";
}

function getFaceId(face) {
  return face.face_id || face.faceId || face._id || face.id || "unknown";
}

function getName(face) {
  return face.name || face.full_name || face.display_name || "Unidentified";
}

function getImageSrc(face) {
  if (face.image_base64) return `data:image/jpeg;base64,${face.image_base64}`;
  if (face.snapshot_base64)
    return `data:image/jpeg;base64,${face.snapshot_base64}`;
  if (face.image_url) return face.image_url;
  return null;
}

function getViolationCount(face) {
  return (
    face.violation_count || face.violationCount || face.total_violations || 0
  );
}

function getConfidence(face) {
  return face.confidence || face.confidence_score || null;
}

function getZone(face) {
  return face.zone || face.zone_id || face.location || "—";
}

function getCamera(face) {
  return face.camera_id || face.session_id || face.camera || "—";
}

function getViolationType(face) {
  return face.violation_type || face.type || face.title || "Unknown";
}

function getGPS(face) {
  return face.gps || face.location_gps || null;
}

function getLastSeen(face) {
  return face.last_seen || face.lastSeen || face.updated_at || face.timestamp;
}

function getFirstSeen(face) {
  return face.first_seen || face.firstSeen || face.created_at || face.timestamp;
}

function getStatusColor(status) {
  if (status === "resolved") return "#22C55E";
  if (status === "pending") return "#F59E0B";
  return "#EF4444";
}

function getStatusBg(status) {
  if (status === "resolved") return "rgba(34,197,94,0.12)";
  if (status === "pending") return "rgba(245,158,11,0.12)";
  return "rgba(239,68,68,0.12)";
}

function getStatusLabel(status) {
  if (status === "resolved") return "Resolved";
  if (status === "pending") return "Pending";
  return "Active";
}

function exportCSV(rows, filename) {
  const csv = rows
    .map((r) =>
      r.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE STYLES — Global CSS injected once into <head>
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
    50% { opacity: 0.85; transform: scale(1.15); box-shadow: 0 0 0 6px rgba(239,68,68,0); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .v-card {
    animation: fadeSlideUp 0.35s ease both;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .v-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(59,130,246,0.25);
  }
  .v-card:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }
  .pulse-dot {
    animation: pulse-dot 1.4s ease-in-out infinite;
  }
  .skeleton-shimmer {
    background: linear-gradient(90deg, #1E293B 25%, #263348 50%, #1E293B 75%);
    background-size: 600px 100%;
    animation: shimmer 1.6s infinite linear;
  }
  .v-select, .v-input {
    background: #1E293B;
    border: 1px solid #334155;
    color: #CBD5E1;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
    appearance: none;
  }
  .v-select:focus, .v-input:focus {
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
  }
  .v-select option { background: #1E293B; }
  .v-btn-primary {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    white-space: nowrap;
  }
  .v-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .v-btn-primary:active { transform: translateY(0); }
  .v-btn-ghost {
    background: rgba(255,255,255,0.05);
    color: #94A3B8;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .v-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #F1F5F9; }
  .v-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }
  .modal-backdrop {
    animation: toastIn 0.2s ease;
  }
  .demo-banner {
    background: repeating-linear-gradient(
      45deg, rgba(245,158,11,0.08), rgba(245,158,11,0.08) 10px,
      transparent 10px, transparent 20px
    );
    border: 1px solid rgba(245,158,11,0.4);
    border-radius: 10px;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #F59E0B;
    font-weight: 600;
  }
  .confidence-bar-track {
    height: 4px;
    background: #334155;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 3px;
  }
  .confidence-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.6s ease;
  }
`;

function injectStyles() {
  if (document.getElementById("violators-global-styles")) return;
  const style = document.createElement("style");
  style.id = "violators-global-styles";
  style.textContent = GLOBAL_STYLES;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Skeleton card shown while loading
function SkeletonCard({ index }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        borderRadius: 14,
        height: 370,
        animationDelay: `${index * 0.07}s`,
        border: "1px solid #263348",
      }}
    />
  );
}

// Status badge component
function StatusBadge({ status }) {
  const color = getStatusColor(status);
  const bg = getStatusBg(status);
  const label = getStatusLabel(status);
  return (
    <span className="v-tag" style={{ color, background: bg }}>
      {status === "active" && (
        <span
          className="pulse-dot"
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
          }}
        />
      )}
      {label}
    </span>
  );
}

// Confidence bar component
function ConfidenceBar({ value }) {
  if (value === null || value === undefined)
    return <span style={{ color: "#475569" }}>—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "#22C55E" : pct >= 70 ? "#F59E0B" : "#EF4444";
  return (
    <div>
      <span style={{ color, fontWeight: 700, fontSize: 12 }}>{pct}%</span>
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// Individual violator card
function ViolatorCard({ face, index, onView, onDelete, deletingId }) {
  const faceId = getFaceId(face);
  const status = getStatus(face);
  const isRepeat = getViolationCount(face) > 1;
  const imgSrc = getImageSrc(face);
  const name = getName(face);

  return (
    <div
      className="v-card"
      style={{
        animationDelay: `${Math.min(index * 0.06, 0.5)}s`,
        background: "#1E293B",
        border: `1px solid ${isRepeat ? "#EF4444" : "#334155"}`,
        borderLeft: isRepeat ? "4px solid #EF4444" : "1px solid #334155",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      tabIndex={0}
      aria-label={`Violator card for ${name}`}
    >
      {/* Repeat offender ribbon */}
      {isRepeat && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: -1,
            zIndex: 5,
            background: "#EF4444",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.8,
            padding: "2px 10px 2px 12px",
            borderRadius: "0 20px 20px 0",
            boxShadow: "2px 2px 8px rgba(239,68,68,0.4)",
            textTransform: "uppercase",
          }}
        >
          🔁 Repeat
        </div>
      )}

      {/* Image section */}
      <div
        style={{
          width: "100%",
          height: 185,
          background: "#0F172A",
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
        onClick={() => onView(face)}
        aria-label="View full image"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onView(face)}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={`Captured snapshot of ${name}`}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.parentNode.querySelector(".img-fallback").style.display =
                "flex";
            }}
          />
        ) : null}
        <div
          className="img-fallback"
          style={{
            display: imgSrc ? "none" : "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 8,
            color: "#475569",
          }}
        >
          <svg
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500 }}>No Image</span>
        </div>
        {/* Hover overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
            display: "flex",
            alignItems: "flex-end",
            padding: 10,
            opacity: 0,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
        >
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
            🔍 View Full Image
          </span>
        </div>
      </div>

      {/* Card body */}
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Header row: ID + Status + Delete */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Violator ID
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#F1F5F9",
                fontFamily: "monospace",
                letterSpacing: 0.5,
              }}
            >
              #VL-{faceId.slice(-6).toUpperCase()}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={status} />
            <button
              onClick={() => onDelete(faceId)}
              disabled={deletingId === faceId}
              aria-label="Delete violator"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#475569",
                padding: 4,
                borderRadius: 6,
                fontSize: 14,
                transition: "color 0.15s",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
            >
              {deletingId === faceId ? (
                <span
                  style={{
                    fontSize: 12,
                    animation: "spin 1s linear infinite",
                    display: "inline-block",
                  }}
                >
                  ⟳
                </span>
              ) : (
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: name === "Unidentified" ? "#64748B" : "#E2E8F0",
            fontStyle: name === "Unidentified" ? "italic" : "normal",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width="13"
            height="13"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ flexShrink: 0, color: "#475569" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {name}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#1E3A5F", marginBottom: 10 }} />

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 12px",
            marginBottom: 10,
          }}
        >
          <DetailItem icon="📍" label="Zone" value={getZone(face)} />
          <DetailItem icon="🎥" label="Camera" value={getCamera(face)} />
          <DetailItem
            icon="⚠️"
            label="Violation"
            value={getViolationType(face)}
          />
          <DetailItem
            icon="🔁"
            label="Occurrences"
            value={`${getViolationCount(face)}×`}
            highlight={isRepeat}
          />
          <DetailItem
            icon="🕐"
            label="Last Seen"
            value={timeAgo(getLastSeen(face))}
          />
          <DetailItem
            icon="📅"
            label="First Seen"
            value={timeAgo(getFirstSeen(face))}
          />
        </div>

        {/* Confidence */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 4,
            }}
          >
            🤖 AI Confidence
          </div>
          <ConfidenceBar value={getConfidence(face)} />
        </div>

        {/* GPS */}
        {getGPS(face) && (
          <div
            style={{
              fontSize: 11,
              color: "#3B82F6",
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 8,
            }}
          >
            <span>🌐</span>
            <span style={{ fontFamily: "monospace" }}>{getGPS(face)}</span>
          </div>
        )}

        {/* Action button */}
        <button
          className="v-btn-primary"
          onClick={() => onView(face)}
          aria-label={`View details for ${name}`}
          style={{
            width: "100%",
            marginTop: "auto",
            borderRadius: 8,
            padding: "9px 0",
            fontSize: 13,
          }}
        >
          View Full Details
        </button>
      </div>
    </div>
  );
}

// Small detail item inside card
function DetailItem({ icon, label, value, highlight }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: "#475569",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: highlight ? "#EF4444" : "#94A3B8",
          fontWeight: highlight ? 700 : 400,
          marginTop: 1,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        {icon} {value}
      </div>
    </div>
  );
}

// Detail Modal component
function ViolatorModal({ face, onClose }) {
  if (!face) return null;
  const imgSrc = getImageSrc(face);
  const status = getStatus(face);
  const name = getName(face);
  const faceId = getFaceId(face);
  const confidence = getConfidence(face);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Violator details"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: 18,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Modal image */}
        <div
          style={{
            width: "100%",
            height: 260,
            background: "#0F172A",
            borderRadius: "18px 18px 0 0",
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={`Full capture of ${name}`}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "#475569",
              }}
            >
              <span style={{ fontSize: 52 }}>📷</span>
              <span style={{ fontSize: 13 }}>No captured image available</span>
            </div>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%",
              width: 34,
              height: 34,
              color: "#F1F5F9",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
          {/* Status overlay */}
          <div style={{ position: "absolute", bottom: 12, left: 12 }}>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Modal content */}
        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Violator ID
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#F1F5F9",
                  fontFamily: "monospace",
                }}
              >
                #VL-{faceId.slice(-6).toUpperCase()}
              </div>
            </div>
            {getViolationCount(face) > 1 && (
              <span
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#EF4444",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                🔁 Repeat Offender
              </span>
            )}
          </div>

          {/* Info grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 18,
            }}
          >
            {[
              { label: "Name", value: name, icon: "👤" },
              {
                label: "Violation Type",
                value: getViolationType(face),
                icon: "⚠️",
              },
              { label: "Zone", value: getZone(face), icon: "📍" },
              { label: "Camera", value: getCamera(face), icon: "🎥" },
              {
                label: "Total Occurrences",
                value: `${getViolationCount(face)}×`,
                icon: "🔁",
              },
              { label: "Status", value: getStatusLabel(status), icon: "🔴" },
              {
                label: "First Seen",
                value: formatDateTime(getFirstSeen(face)),
                icon: "📅",
              },
              {
                label: "Last Seen",
                value: formatDateTime(getLastSeen(face)),
                icon: "🕐",
              },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  background: "#0F172A",
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: "1px solid #263348",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    marginBottom: 3,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 500 }}
                >
                  {icon} {value}
                </div>
              </div>
            ))}
          </div>

          {/* Confidence */}
          <div
            style={{
              background: "#0F172A",
              borderRadius: 10,
              padding: "12px 14px",
              border: "1px solid #263348",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 6,
              }}
            >
              🤖 AI Detection Confidence
            </div>
            <ConfidenceBar value={confidence} />
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
              Higher confidence means more accurate detection
            </div>
          </div>

          {/* GPS */}
          {getGPS(face) && (
            <div
              style={{
                background: "rgba(59,130,246,0.08)",
                borderRadius: 10,
                padding: "10px 14px",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                🌐 GPS Location
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#3B82F6",
                  fontFamily: "monospace",
                  marginTop: 3,
                }}
              >
                {getGPS(face)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast notification
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 200,
        background: isSuccess ? "#065F46" : "#7F1D1D",
        border: `1px solid ${isSuccess ? "#22C55E" : "#EF4444"}`,
        borderRadius: 12,
        padding: "12px 18px",
        color: "#F1F5F9",
        fontSize: 14,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        animation: "toastIn 0.25s ease",
        maxWidth: 360,
      }}
      role="alert"
    >
      <span>{isSuccess ? "✅" : "❌"}</span>
      <span style={{ flex: 1 }}>{toast.msg}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "#94A3B8",
          cursor: "pointer",
          fontSize: 16,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// Empty state
function EmptyState({ filtered }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 64, opacity: 0.5 }}>🚦</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#64748B" }}>
        {filtered ? "No Violators Match Filters" : "No Violators Detected"}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#475569",
          textAlign: "center",
          maxWidth: 300,
        }}
      >
        {filtered
          ? "Try adjusting your search or filter criteria."
          : "Violators detected by the system will appear here automatically."}
      </div>
    </div>
  );
}

// Error state
function ErrorState({ message, onRetry }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 52 }}>⚠️</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#EF4444" }}>
        Failed to Load Violators
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#64748B",
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        {message}
      </div>
      <button
        className="v-btn-primary"
        onClick={onRetry}
        style={{ marginTop: 8 }}
      >
        ↺ Retry
      </button>
    </div>
  );
}

// Sort button
function SortButton({ label, field, sortBy, sortDir, onSort }) {
  const active = sortBy === field;
  return (
    <button
      className="v-btn-ghost"
      onClick={() => onSort(field)}
      style={{
        fontSize: 12,
        background: active ? "rgba(59,130,246,0.15)" : undefined,
        borderColor: active ? "#3B82F6" : undefined,
        color: active ? "#3B82F6" : undefined,
        padding: "6px 12px",
      }}
    >
      {label} {active ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const Violators = () => {
  // Inject global styles once
  useEffect(() => {
    injectStyles();
  }, []);

  // ── State ──────────────────────────────────────────────────────────────────
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [showToast, setShowToast] = useState(null);
  const [modalFace, setModalFace] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(12);
  const searchRef = useRef();
  const intervalRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchFaces = useCallback(
    async (params = {}) => {
      // Use demo data if DEMO_MODE is on — remove this block before production
      if (DEMO_MODE) {
        setLoading(false);
        setFaces(DEMO_FACES);
        setTotal(DEMO_FACES.length);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getFaces({
          page,
          limit: pageSize,
          search,
          status: statusFilter,
          type: typeFilter,
          zone: zoneFilter,
          from_date: dateFrom,
          to_date: dateTo,
          ...params,
        });
        setFaces(data.faces || data.data || []);
        setTotal(data.total || data.count || 0);
      } catch (err) {
        setError(
          err.message || "Failed to fetch violators. Check your connection.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      pageSize,
      search,
      statusFilter,
      typeFilter,
      zoneFilter,
      dateFrom,
      dateTo,
    ],
  );

  // Initial fetch + 30s auto-refresh
  useEffect(() => {
    fetchFaces();
    intervalRef.current = setInterval(() => fetchFaces(), 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchFaces]);

  // Debounced search handler
  const debouncedSearch = useRef(
    debounce((val) => fetchFaces({ search: val }), 300),
  ).current;

  const handleSearch = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  // Sort toggle
  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  // ── Export CSV (exports currently filtered & sorted data) ──────────────────
  const handleExport = () => {
    if (filtered.length === 0) {
      setShowToast({ type: "error", msg: "No data to export." });
      return;
    }
    const headers = [
      "Violator ID",
      "Name",
      "Zone",
      "Camera",
      "Violation Type",
      "Occurrences",
      "Status",
      "AI Confidence (%)",
      "GPS",
      "First Seen",
      "Last Seen",
    ];
    const rows = filtered.map((f) => [
      `#VL-${getFaceId(f).slice(-6).toUpperCase()}`,
      getName(f),
      getZone(f),
      getCamera(f),
      getViolationType(f),
      getViolationCount(f),
      getStatusLabel(getStatus(f)),
      getConfidence(f) ? `${(getConfidence(f) * 100).toFixed(1)}` : "",
      getGPS(f) || "",
      formatDateTime(getFirstSeen(f)),
      formatDateTime(getLastSeen(f)),
    ]);
    exportCSV(
      [headers, ...rows],
      `violators_report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    setShowToast({
      type: "success",
      msg: `Exported ${filtered.length} violators to CSV.`,
    });
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async (faceId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this violator? This action cannot be undone.",
      )
    )
      return;
    setDeletingId(faceId);
    try {
      await deleteFace(faceId);
      setShowToast({ type: "success", msg: "Violator removed successfully." });
      fetchFaces();
    } catch (err) {
      setShowToast({
        type: "error",
        msg: err.message || "Delete failed. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Client-side filtering & sorting ───────────────────────────────────────
  let filtered = faces.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getFaceId(f).toLowerCase().includes(q) ||
      getName(f).toLowerCase().includes(q) ||
      getViolationType(f).toLowerCase().includes(q)
    );
  });
  if (statusFilter)
    filtered = filtered.filter((f) => getStatus(f) === statusFilter);
  if (typeFilter)
    filtered = filtered.filter((f) => getViolationType(f) === typeFilter);
  if (zoneFilter) filtered = filtered.filter((f) => getZone(f) === zoneFilter);
  if (dateFrom)
    filtered = filtered.filter(
      (f) => new Date(getFirstSeen(f)) >= new Date(dateFrom),
    );
  if (dateTo)
    filtered = filtered.filter(
      (f) => new Date(getLastSeen(f)) <= new Date(dateTo),
    );

  filtered = [...filtered].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    if (sortBy === "date")
      return dir * (new Date(getLastSeen(b)) - new Date(getLastSeen(a)));
    if (sortBy === "occurrences")
      return dir * (getViolationCount(b) - getViolationCount(a));
    if (sortBy === "status")
      return dir * getStatus(a).localeCompare(getStatus(b));
    return 0;
  });

  // Unique filter options
  const allTypes = [...new Set(faces.map(getViolationType))].filter(Boolean);
  const allZones = [...new Set(faces.map(getZone))].filter((z) => z !== "—");

  // Stats summary
  const activeCount = faces.filter((f) => getStatus(f) === "active").length;
  const pendingCount = faces.filter((f) => getStatus(f) === "pending").length;
  const resolvedCount = faces.filter((f) => getStatus(f) === "resolved").length;
  const hasFilters =
    search || statusFilter || typeFilter || zoneFilter || dateFrom || dateTo;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "#0F172A",
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        overflowX: "hidden", // ← fixes horizontal scroll
        width: "100%",
      }}
    >
      {/* Demo banner — DELETE BEFORE PRODUCTION */}
      {DEMO_MODE && (
        <div className="demo-banner">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>
            DEMO MODE ACTIVE — Displaying dummy data for UI testing. Set
            DEMO_MODE = false to connect to real backend.
          </span>
        </div>
      )}

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 6,
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#F1F5F9",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 18,
              }}
            >
              🚨
            </span>
            Violators
          </h1>
          <span
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#3B82F6",
              borderRadius: 20,
              padding: "3px 12px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {DEMO_MODE ? DEMO_FACES.length : total} Total
          </span>
          {!loading && (
            <span style={{ fontSize: 11, color: "#475569" }}>
              Auto-refreshes every 30s
            </span>
          )}
        </div>
        <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>
          Real-time pedestrian violation detections from all active cameras.
        </p>
      </div>

      {/* ── STATS STRIP ────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 22,
          }}
        >
          {[
            {
              label: "Active Violators",
              value: activeCount,
              color: "#EF4444",
              icon: "🔴",
            },
            {
              label: "Pending Review",
              value: pendingCount,
              color: "#F59E0B",
              icon: "⏳",
            },
            {
              label: "Resolved",
              value: resolvedCount,
              color: "#22C55E",
              icon: "✅",
            },
            {
              label: "Filtered View",
              value: filtered.length,
              color: "#3B82F6",
              icon: "🔍",
            },
          ].map(({ label, value, color, icon }) => (
            <div
              key={label}
              style={{
                background: "#1E293B",
                border: "1px solid #263348",
                borderTop: `3px solid ${color}`,
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                {icon} {label}
              </div>
              <div
                style={{ fontSize: 26, fontWeight: 800, color, marginTop: 4 }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FILTER BAR ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#1E293B",
          border: "1px solid #263348",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by ID, name, or type..."
            value={search}
            onChange={handleSearch}
            ref={searchRef}
            className="v-input"
            aria-label="Search Violators"
            style={{ width: "100%", paddingLeft: 32, boxSizing: "border-box" }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="v-select"
          aria-label="Filter by Status"
          style={{ flex: "0 0 130px" }}
        >
          <option value="">All Status</option>
          <option value="active">🔴 Active</option>
          <option value="pending">⏳ Pending</option>
          <option value="resolved">✅ Resolved</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="v-select"
          aria-label="Filter by Type"
          style={{ flex: "0 0 150px" }}
        >
          <option value="">All Types</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="v-select"
          aria-label="Filter by Zone"
          style={{ flex: "0 0 120px" }}
        >
          <option value="">All Zones</option>
          {allZones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="v-input"
          aria-label="Date From"
          style={{ flex: "0 0 138px" }}
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="v-input"
          aria-label="Date To"
          style={{ flex: "0 0 138px" }}
        />

        {hasFilters && (
          <button
            className="v-btn-ghost"
            style={{ fontSize: 12, padding: "7px 12px" }}
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setTypeFilter("");
              setZoneFilter("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            ✕ Clear
          </button>
        )}

        <button
          className="v-btn-primary"
          onClick={handleExport}
          aria-label="Export CSV"
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── SORT + COUNT BAR ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 13, color: "#475569" }}>
          Showing{" "}
          <strong style={{ color: "#94A3B8" }}>{filtered.length}</strong> of{" "}
          <strong style={{ color: "#94A3B8" }}>
            {DEMO_MODE ? DEMO_FACES.length : total}
          </strong>{" "}
          violators
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#475569" }}>Sort:</span>
          <SortButton
            label="Date"
            field="date"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <SortButton
            label="Occurrences"
            field="occurrences"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <SortButton
            label="Status"
            field="status"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* ── CARD GRID ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {loading ? (
          Array(pageSize)
            .fill(0)
            .map((_, i) => <SkeletonCard key={i} index={i} />)
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchFaces()} />
        ) : filtered.length === 0 ? (
          <EmptyState filtered={!!hasFilters} />
        ) : (
          filtered.map((face, i) => (
            <ViolatorCard
              key={getFaceId(face)}
              face={face}
              index={i}
              onView={setModalFace}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))
        )}
      </div>

      {/* ── MODALS & TOASTS ────────────────────────────────────────────────── */}
      {modalFace && (
        <ViolatorModal face={modalFace} onClose={() => setModalFace(null)} />
      )}
      <Toast toast={showToast} onClose={() => setShowToast(null)} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY — catches runtime/syntax errors in the component
// ─────────────────────────────────────────────────────────────────────────────
const ErrorScreen = ({ error }) => (
  <div
    style={{
      background: "#1E293B",
      color: "#EF4444",
      padding: 40,
      borderRadius: 16,
      margin: 32,
      textAlign: "center",
      border: "1px solid rgba(239,68,68,0.3)",
    }}
  >
    <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
      Component Error
    </h2>
    <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>
      {error?.message || String(error)}
    </p>
    <pre
      style={{
        background: "#0F172A",
        color: "#F1F5F9",
        padding: 16,
        borderRadius: 10,
        fontSize: 12,
        overflowX: "auto",
        textAlign: "left",
        border: "1px solid #334155",
      }}
    >
      {error?.stack || "No stack trace available"}
    </pre>
  </div>
);

let ViolatorsExport = Violators;
if (typeof window !== "undefined" && window.__VITE_REACT_BABEL_ERROR__) {
  ViolatorsExport = () => (
    <ErrorScreen error={window.__VITE_REACT_BABEL_ERROR__} />
  );
}

export default ViolatorsExport;
