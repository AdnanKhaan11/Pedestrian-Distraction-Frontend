import React, { useEffect } from "react";

// ─── Utility Functions ────────────────────────────────────────
export function formatDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getStatus(face) {
  if (typeof face.resolved === "boolean")
    return face.resolved ? "resolved" : "active";
  return face.status || "active";
}

export function getFaceId(face) {
  return face.face_id || face.faceId || face._id || face.id || "unknown";
}

export function getName(face) {
  return face.name || face.full_name || face.display_name || "Unidentified";
}

export function getImageSrc(face) {
  if (face.image_base64) return `data:image/jpeg;base64,${face.image_base64}`;
  if (face.snapshot_base64)
    return `data:image/jpeg;base64,${face.snapshot_base64}`;
  if (face.image_url) return face.image_url;
  return null;
}

export function getViolationCount(face) {
  return (
    face.violation_count || face.violationCount || face.total_violations || 0
  );
}

export function getConfidence(face) {
  return face.confidence || face.confidence_score || null;
}

export function getZone(face) {
  return face.zone || face.zone_id || face.location || "—";
}

export function getCamera(face) {
  return face.camera_id || face.session_id || face.camera || "—";
}

export function getViolationType(face) {
  return face.violation_type || face.type || face.title || "Unknown";
}

export function getGPS(face) {
  return face.gps || face.location_gps || null;
}

export function getLastSeen(face) {
  return face.last_seen || face.lastSeen || face.updated_at || face.timestamp;
}

export function getFirstSeen(face) {
  return face.first_seen || face.firstSeen || face.created_at || face.timestamp;
}

export function getStatusColor(status) {
  if (status === "resolved") return "#22C55E";
  if (status === "pending") return "#F59E0B";
  return "#EF4444";
}

export function getStatusBg(status) {
  if (status === "resolved") return "rgba(34,197,94,0.12)";
  if (status === "pending") return "rgba(245,158,11,0.12)";
  return "rgba(239,68,68,0.12)";
}

export function getStatusLabel(status) {
  if (status === "resolved") return "Resolved";
  if (status === "pending") return "Pending";
  return "Active";
}

export function exportCSV(rows, filename) {
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

// ─── Global Styles ────────────────────────────────────────────
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
  .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
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
  .modal-backdrop { animation: toastIn 0.2s ease; }
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

export function injectStyles() {
  if (document.getElementById("violators-global-styles")) return;
  const style = document.createElement("style");
  style.id = "violators-global-styles";
  style.textContent = GLOBAL_STYLES;
  document.head.appendChild(style);
}

// ─── Sub Components ───────────────────────────────────────────

export function SkeletonCard({ index }) {
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

export function StatusBadge({ status }) {
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

export function ConfidenceBar({ value }) {
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

export function DetailItem({ icon, label, value, highlight }) {
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

export function SortButton({ label, field, sortBy, sortDir, onSort }) {
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

export function EmptyState({ filtered }) {
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

export function ErrorState({ message, onRetry }) {
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

// ─── Main ViolatorCard Component ──────────────────────────────
const ViolatorCard = ({ face, index, onView, onDelete, deletingId }) => {
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
          height: 200,
          background: "#0A1628",
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => onView(face)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onView(face)}
        aria-label="View full image"
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={`Captured snapshot of ${name}`}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              // ✅ FIXED: contain shows full image — no cropping
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
              background: "#0A1628",
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.parentNode.querySelector(".img-fallback").style.display =
                "flex";
            }}
          />
        ) : null}

        {/* Fallback */}
        <div
          className="img-fallback"
          style={{
            display: imgSrc ? "none" : "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
            position: "absolute",
            gap: 8,
            color: "#334155",
            background: "#0A1628",
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

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            background:
              "linear-gradient(to top, rgba(10,22,40,0.9), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* View hint */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 10,
            fontSize: 10,
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
          }}
        >
          🔍 Click to expand
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
};

export default ViolatorCard;
