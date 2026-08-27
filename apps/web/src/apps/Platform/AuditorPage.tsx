import React, { useEffect, useState } from "react";
import { Alert, Spinner, Table } from "reactstrap";
import { API_BASE } from "../../shared/utils/apiBase";

const PAGE_SIZE = 100;

const LOG_CATEGORIES = ["Leave", "Attendance", "Payroll", "Employee", "Authentication", "Compliance", "Other"] as const;

interface AuditLog {
  _id?: string;
  id?: string;
  action?: string;
  event?: string;
  message?: string;
  user?: string;
  userEmail?: string;
  createdAt?: string;
  timestamp?: string;
  category?: string;
  type?: string;
  resource?: string;
  module?: string;
  details?: unknown;
  [key: string]: unknown;
}

interface AuditPagination {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  [key: string]: unknown;
}

const AuditorPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<AuditPagination>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAuditLogs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be signed in to view audit logs.");
        setLoading(false);
        return;
      }

      try {
        const allLogs: AuditLog[] = [];
        let page = 1;
        let lastPagination: AuditPagination = {};

        do {
          const response = await fetch(`${API_BASE}/logs/audit?page=${page}&limit=${PAGE_SIZE}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error(`Audit log request failed with status ${response.status}`);
          }

          const result = await response.json();
          const payload = result.data && !Array.isArray(result.data) ? result.data : result;
          const pageLogs = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.logs) ? payload.logs : [];
          lastPagination = payload.pagination || result.pagination || {};
          allLogs.push(...pageLogs);

          const totalPages = Number(lastPagination.pages || lastPagination.totalPages || 0);
          const totalRecords = Number(lastPagination.total || 0);
          const hasMore = lastPagination.hasNextPage === true
            || (totalPages > 0 && page < totalPages)
            || (totalRecords > 0 && allLogs.length < totalRecords);
          if (pageLogs.length === 0 || !hasMore) break;
          page += 1;
        } while (page < 1000);

        setLogs(allLogs);
        setPagination({ ...lastPagination, total: lastPagination.total ?? allLogs.length });
      } catch (requestError) {
        console.error("Failed to load audit logs:", requestError);
        setError("Unable to load audit logs.");
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  const getCategory = (log: AuditLog): string => {
    const value = [log.category, log.type, log.resource, log.module, log.action, log.event]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return LOG_CATEGORIES.find((category) => value.includes(category.toLowerCase())) || "Other";
  };

  const getDetails = (log: AuditLog): string => {
    if (log.details !== undefined) {
      return typeof log.details === "string" ? log.details : JSON.stringify(log.details);
    }

    const excluded = new Set(["_id", "id", "action", "event", "message", "user", "userEmail", "createdAt", "timestamp"]);
    const details = Object.fromEntries(Object.entries(log).filter(([key]) => !excluded.has(key) && log[key] !== undefined));
    return Object.keys(details).length > 0 ? JSON.stringify(details) : log.message || "-";
  };

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: 0, color: "#1A202C", fontWeight: 700 }}>Audit Logs</h3>
        <p style={{ margin: "4px 0 0", color: "#718096", fontSize: "14px" }}>
          Review activity recorded for your organization.
        </p>
      </div>

      {error && <Alert color="danger">{error}</Alert>}
      {loading && <div style={{ textAlign: "center", padding: "40px" }}><Spinner color="primary" /></div>}

      {!loading && !error && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", overflowX: "auto" }}>
          <Table hover responsive style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Action</th>
                <th>User</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#718096", padding: "32px" }}>No audit logs found.</td></tr>
              ) : logs.map((log, index) => (
                <tr key={log._id || log.id || index}>
                  <td>{getCategory(log)}</td>
                  <td>{log.action || log.event || log.message || "-"}</td>
                  <td>{log.userEmail || log.user || "-"}</td>
                  <td>{log.createdAt || log.timestamp ? new Date(log.createdAt || log.timestamp || "").toLocaleString() : "-"}</td>
                  <td style={{ maxWidth: "420px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{getDetails(log)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {pagination.total !== undefined && (
            <div style={{ padding: "12px 16px", color: "#718096", fontSize: "13px" }}>
              {pagination.total} total records
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditorPage;