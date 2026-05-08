import React, { useEffect, useState, useRef, useCallback } from "react";
import { getFaces, deleteFace } from "../../services/api";
import ViolatorCard, {
  injectStyles,
  SkeletonCard,
  SortButton,
  EmptyState,
  ErrorState,
  exportCSV,
  getStatus,
  getFaceId,
  getName,
  getViolationType,
  getZone,
  getStatusLabel,
  getConfidence,
  getGPS,
  getFirstSeen,
  getLastSeen,
  getViolationCount,
  formatDateTime,
} from "./ViolatorCard";
import ViolatorModal, { Toast } from "./ViolatorModal";

// ─────────────────────────────────────────────────────────────
// ⚠️ DEMO SECTION — DELETE BEFORE PRODUCTION
//    Set DEMO_MODE = true to preview UI with dummy data
// ─────────────────────────────────────────────────────────────
const DEMO_MODE = false;

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Main Component ───────────────────────────────────────────
const Violators = () => {
  useEffect(() => {
    injectStyles();
  }, []);

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

  // ── Fetch faces ─────────────────────────────────────────────
  const fetchFaces = useCallback(
    async (params = {}) => {
      if (DEMO_MODE) {
        setLoading(false);
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

  useEffect(() => {
    fetchFaces();
    intervalRef.current = setInterval(() => fetchFaces(), 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchFaces]);

  const debouncedSearch = useRef(
    debounce((val) => fetchFaces({ search: val }), 300),
  ).current;

  const handleSearch = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  // ── Export CSV ──────────────────────────────────────────────
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

  // ── Delete ──────────────────────────────────────────────────
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

  // ── Client-side filter + sort ────────────────────────────────
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

  const allTypes = [...new Set(faces.map(getViolationType))].filter(Boolean);
  const allZones = [...new Set(faces.map(getZone))].filter((z) => z !== "—");
  const activeCount = faces.filter((f) => getStatus(f) === "active").length;
  const pendingCount = faces.filter((f) => getStatus(f) === "pending").length;
  const resolvedCount = faces.filter((f) => getStatus(f) === "resolved").length;
  const hasFilters =
    search || statusFilter || typeFilter || zoneFilter || dateFrom || dateTo;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "#0F172A",
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        overflowX: "hidden",
        width: "100%",
      }}
    >
      {/* Demo banner */}
      {DEMO_MODE && (
        <div className="demo-banner">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>
            DEMO MODE ACTIVE — Set DEMO_MODE = false to connect to real backend.
          </span>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(20px,3vw,26px)",
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
                background: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
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
            {total} Total
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

      {/* ── Stats Strip ─────────────────────────────────────── */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
            gap: 12,
            marginBottom: 20,
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
                padding: "12px 14px",
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
                style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div
        style={{
          background: "#1E293B",
          border: "1px solid #263348",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
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

      {/* ── Sort + Count ─────────────────────────────────────── */}
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
          <strong style={{ color: "#94A3B8" }}>{total}</strong> violators
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

      {/* ── Card Grid ────────────────────────────────────────── */}
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

      {/* ── Modal + Toast ─────────────────────────────────────── */}
      {modalFace && (
        <ViolatorModal face={modalFace} onClose={() => setModalFace(null)} />
      )}
      <Toast toast={showToast} onClose={() => setShowToast(null)} />
    </div>
  );
};

// ─── Error Screen ─────────────────────────────────────────────
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
