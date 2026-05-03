import { useState, useEffect, useCallback, useMemo } from "react";

// =============================================================================
// API Configuration
// =============================================================================
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1';

// =============================================================================
// TYPES (same as before)
// =============================================================================

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "leave"
  | "holiday"
  | "half_day";

export type AlertType = "success" | "error" | "info";
export type DateRangeKey = "all" | "today" | "week" | "month" | "last_month" | "year";

export interface AttendanceRecord {
  id:         number;
  date:       string;
  status:     AttendanceStatus;
  clock_in:   string | null;
  clock_out:  string | null;
  work_hours: number | null;
  note?:      string;
}

export interface ClockState {
  clockedIn:    boolean;
  clockInTime:  string | null;
  clockOutTime: string | null;
  sessionHours: number | null;
}

export interface MonthStats {
  total:    number;
  present:  number;
  late:     number;
  absent:   number;
  leave:    number;
  avgHours: number;
  rate:     number;
}

export interface ManagerAttendanceRecord {
  attendance_id: number;
  employee_id:   string;
  employee_code: string;
  full_name:     string;
  department:    string;
  position:      string;
  status:        AttendanceStatus;
  clock_in:      string | null;
  clock_out:     string | null;
  work_hours:    number | null;
  date:          string;
}

export interface Employee {
  employee_id:   string;
  employee_code: string;
  full_name:     string;
  department:    string;
  position:      string;
  email:         string;
  status:        "active" | "inactive";
}

export interface AttendanceStats {
  totalEmployees:  number;
  todayPresent:    number;
  todayAbsent:     number;
  todayLate:       number;
  todayPercentage: number;
  monthlyAverage:  number;
}

export interface ManagerFilters {
  search:    string;
  status:    AttendanceStatus | "";
  dateRange: DateRangeKey;
  dept:      string;
}

export interface Toast {
  message: string;
  type:    AlertType;
}

// =============================================================================
// UTILITIES (same as before)
// =============================================================================

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

export function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(base.getDate() + delta);
  return d;
}

export function fmtTime(raw: string | null | undefined): string {
  if (!raw) return "Not clocked in";

  // If already includes AM/PM (e.g., from legacy input), preserve with normalization.
  const ampmMatch = raw.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    const [_, hm, suffix] = ampmMatch;
    return `${hm} ${suffix.toUpperCase()}`;
  }

  const [hStr, mStr] = raw.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h) || !mStr) return raw;
  return `${h % 12 === 0 ? 12 : h % 12}:${mStr} ${h >= 12 ? "PM" : "AM"}`;
}

export function time24(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function fmtDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
  locale = "en-ZA"
): string {
  return new Date(dateStr).toLocaleDateString(locale, options);
}

export function fmtElapsed(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}

export function calcWorkHours(clockIn: string, clockOut: string): number {
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  return parseFloat(((oh * 60 + om - ih * 60 - im) / 60).toFixed(2));
}

export function deriveStatus(clockInTime: string): AttendanceStatus {
  const [h] = clockInTime.split(":").map(Number);
  return h >= 9 ? "late" : "present";
}

export function isCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr), now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function matchesDateRange(dateStr: string, range: DateRangeKey): boolean {
  const d = new Date(dateStr), now = new Date();
  if (range === "today")      return dateStr === todayISO();
  if (range === "week")       return d >= addDays(now, -7);
  if (range === "month")      return isCurrentMonth(dateStr);
  if (range === "last_month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }
  if (range === "year")       return d.getFullYear() === now.getFullYear();
  return true;
}

// =============================================================================
// STYLE TOKENS
// =============================================================================

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:  "#10b981",
  absent:   "#ef4444",
  late:     "#f59e0b",
  leave:    "#3b82f6",
  holiday:  "#8b5cf6",
  half_day: "#f97316",
};

const STATUS_BADGE_MAP: Record<AttendanceStatus, React.CSSProperties> = {
  present:  { background: "#ecfdf3", color: "#027a48" },
  late:     { background: "#fffaeb", color: "#b54708" },
  absent:   { background: "#fef3f2", color: "#b42318" },
  leave:    { background: "#eff6ff", color: "#1d4ed8" },
  holiday:  { background: "#f5f3ff", color: "#6d28d9" },
  half_day: { background: "#fff7ed", color: "#c2410c" },
};

export function badgeStyle(status: string): React.CSSProperties {
  return STATUS_BADGE_MAP[status as AttendanceStatus] ?? { background: "#f3f4f6", color: "#374151" };
}

export function statusLabel(status: AttendanceStatus): string {
  return status.replace("_", " ");
}

// =============================================================================
// CSV HELPERS
// =============================================================================

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportEmployeeCSV(records: AttendanceRecord[]): void {
  const header = "Date,Status,Clock In,Clock Out,Work Hours,Note";
  const rows = records.map(r =>
    [r.date, r.status, r.clock_in ?? "N/A", r.clock_out ?? "N/A",
     r.work_hours ?? "N/A", r.note ?? ""].map(v => `"${v}"`).join(",")
  );
  triggerDownload(`my-attendance-${todayISO()}.csv`, [header, ...rows].join("\n"), "text/csv");
}

export function exportManagerCSV(records: ManagerAttendanceRecord[]): void {
  const header = "Employee Code,Name,Department,Position,Status,Clock In,Clock Out,Work Hours,Date";
  const rows = records.map(r =>
    [r.employee_code, r.full_name, r.department, r.position,
     r.status, r.clock_in ?? "N/A", r.clock_out ?? "N/A",
     r.work_hours ?? "N/A", r.date].map(v => `"${v}"`).join(",")
  );
  triggerDownload(`attendance_export_${todayISO()}.csv`, [header, ...rows].join("\n"), "text/csv");
}

export function exportSingleRecord(row: ManagerAttendanceRecord): void {
  const content = [
    `Employee:   ${row.full_name} (${row.employee_code})`,
    `Department: ${row.department}`,
    `Position:   ${row.position}`,
    `Date:       ${row.date}`,
    `Status:     ${row.status}`,
    `Clock In:   ${row.clock_in  ?? "N/A"}`,
    `Clock Out:  ${row.clock_out ?? "N/A"}`,
    `Work Hours: ${row.work_hours != null ? row.work_hours + "h" : "N/A"}`,
  ].join("\n");
  triggerDownload(`attendance_${row.employee_code}_${row.date}.txt`, content, "text/plain");
}

export function printAttendance(records: ManagerAttendanceRecord[]): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;

  const tableRows = records.map(r => `
    <tr>
      <td>${r.full_name}</td><td>${r.employee_code}</td><td>${r.department}</td>
       <td><span class="badge badge-${r.status}">${r.status.replace("_"," ").toUpperCase()}</span></td>
       <td>${r.clock_in || '—'}</td>
<td>${r.clock_out || '—'}</td>
       <td>${r.work_hours != null ? r.work_hours + "h" : "_"}</td>
     </tr>`).join("");

  win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
    <title>Attendance Report</title>
    <style>
      body{font-family:Arial,sans-serif;margin:20px}h1{color:#2563eb}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}
      th{background:#2563eb;color:#fff}tr:nth-child(even){background:#f9fafb}
      .badge{padding:3px 8px;border-radius:4px;font-size:12px;font-weight:bold;color:#fff}
      .badge-present{background:#10b981}.badge-absent{background:#ef4444}
      .badge-late{background:#f59e0b}.badge-leave{background:#3b82f6}
      .badge-holiday{background:#8b5cf6}.badge-half_day{background:#f97316}
      @media print{.no-print{display:none}}
    </style></head><body>
    <h1>Attendance Report</h1>
    <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Records: ${records.length}</p>
    <button class="no-print" onclick="window.print()">Print</button>
    <table><thead>??<th>Employee</th><th>Code</th><th>Department</th>
      <th>Status</th><th>Clock In</th><th>Clock Out</th><th>Hours</th>
     </tr></thead><tbody>${tableRows}</tbody></table>
    </body></html>`);
  win.document.close();
  return true;
}

// =============================================================================
// REAL API HOOKS
// =============================================================================

// Employee Attendance Hook
export function useEmployeeAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [clock, setClock] = useState<ClockState>({
    clockedIn: false, clockInTime: null, clockOutTime: null, sessionHours: null
  });
  const [clockLoading, setClockLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<AttendanceStatus | "">("");
  const [historyRange, setHistoryRange] = useState<"all" | "week" | "month" | "last_month" | "year">("month");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // Fetch attendance history
  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Handle multiple possible response structures
      let attendanceData: any[] = [];
      if (data.success === false) {
        // Explicit failure
        console.warn('Attendance fetch failed:', data);
        return;
      }
      
      // Try parsing different response shapes
      if (data.data?.data && Array.isArray(data.data.data)) {
        attendanceData = data.data.data;
      } else if (Array.isArray(data.data)) {
        attendanceData = data.data;
      } else if (Array.isArray(data)) {
        attendanceData = data;
      } else {
        attendanceData = [];
      }
      
      // Transform backend data to frontend format
      const transformed = attendanceData.map((item: any) => {
        let dateStr = '';
        if (item.date) {
          let dateObj: Date;
          if (item.date instanceof Date) {
            dateObj = item.date;
          } else if (typeof item.date === 'string') {
            dateObj = new Date(item.date);
          } else {
            dateObj = new Date();
          }
          dateStr = dateObj.getFullYear().toString() +
            '-' + pad2(dateObj.getMonth() + 1) +
            '-' + pad2(dateObj.getDate());
        }
        return {
          id: item.attendance_id,
          date: dateStr,
          status: item.status,
          clock_in: (item.clock_in || item.clockInTime) ? time24(new Date(item.clock_in || item.clockInTime)) : null,
          clock_out: (item.clock_out || item.clockOutTime) ? time24(new Date(item.clock_out || item.clockOutTime)) : null,
          work_hours: item.totalHours || item.hours_worked,
        };
      });
      setRecords(transformed);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, []);

  // Get today's status
  const fetchTodayStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/attendance/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Handle multiple response shapes - the endpoint may not return a success wrapper
      let status: any = null;
      if (data.success && data.data) {
        status = data.data;
      } else if (data.data) {
        status = data.data;
      } else if (data.success === false && data.message) {
        // Explicit failure
        return;
      } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        // Response is a direct status object
        status = data;
      }
      
      if (status && typeof status === 'object') {
        // Get time values - check both camelCase and snake_case
        const clockInTime = status.clockInTime || status.clock_in;
        const clockOutTime = status.clockOutTime || status.clock_out;
        const hasClockOut = !!clockOutTime;
        
        // Format times for display
        const formattedClockIn = clockInTime ? time24(new Date(clockInTime)) : null;
        const formattedClockOut = clockOutTime ? time24(new Date(clockOutTime)) : null;
        
        // Determine if clocked in (has clockIn but no clockOut)
        const isClockedIn = !!clockInTime && !hasClockOut;
        
        setClock({
          clockedIn: isClockedIn,
          clockInTime: formattedClockIn,
          clockOutTime: formattedClockOut,
          sessionHours: status.totalHours || status.hours_worked || null
        });
      }
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchTodayStatus();
  }, []);

  const handleClockIn = async () => {
    if (clock.clockedIn) return;
    setClockLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/attendance/clock-in`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const time = time24(new Date());
        setClock({
          clockedIn: true,
          clockInTime: time,
          clockOutTime: null,
          sessionHours: null
        });
        showAlert(`Clocked in at ${fmtTime(time)}`, "success");
        fetchHistory();
        fetchTodayStatus();
      } else {
        const errorMsg = data.message || data.error?.message || "Failed to clock in";
        showAlert(errorMsg, "error");
        console.error('Clock in error:', data);
      }
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Network error", "error");
      console.error('Clock in exception:', error);
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!clock.clockedIn) return;
    setClockLoading(true);
    try {
      const token = localStorage.getItem('token');
      const todayRecord = records.find(r => r.date === todayISO());
      const response = await fetch(`${API_URL}/attendance/clock-out`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attendance_id: todayRecord?.id })
      });
      const data = await response.json();
      if (data.success) {
        const time = time24(new Date());
        const hours = data.data.hours_worked;
        setClock({
          clockedIn: false,
          clockInTime: clock.clockInTime,
          clockOutTime: time,
          sessionHours: hours
        });
        showAlert(`Clocked out at ${fmtTime(time)} â€” ${hours.toFixed(2)}h logged`, "success");
        fetchHistory();
        fetchTodayStatus();
      } else {
        showAlert(data.error?.message || "Failed to clock out", "error");
      }
    } catch (error) {
      showAlert("Network error", "error");
    } finally {
      setClockLoading(false);
    }
  };

  // Calculate month stats from records
  const monthStats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthRecords = records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const total = monthRecords.length;
    const present = monthRecords.filter(r => r.status === "present" || r.status === "half_day").length;
    const late = monthRecords.filter(r => r.status === "late").length;
    const absent = monthRecords.filter(r => r.status === "absent").length;
    const leave = monthRecords.filter(r => r.status === "leave").length;
    const hours = monthRecords.map(r => r.work_hours ?? 0).filter(Boolean);
    const avgHours = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
    return { total, present, late, absent, leave, avgHours, rate: total ? Math.round(((present + late) / total) * 100) : 0 };
  }, [records]);

  const filteredHistory = useMemo(() => {
    return records.filter(r => {
      if (historyStatus && r.status !== historyStatus) return false;
      if (historySearch && !r.date.includes(historySearch)) return false;
      return matchesDateRange(r.date, historyRange as DateRangeKey);
    });
  }, [records, historyStatus, historySearch, historyRange]);

  return {
    records, todayRecord: records.find(r => r.date === todayISO()),
    clock, clockLoading, handleClockIn, handleClockOut,
    monthStats,
    historySearch, setHistorySearch,
    historyStatus, setHistoryStatus,
    historyRange, setHistoryRange,
    filteredHistory, exportHistoryCSV: () => exportEmployeeCSV(filteredHistory),
    selectedRecord, setSelectedRecord,
    toast, clearToast: () => setToast(null),
  };
}

// Manager Attendance Hook
export function useManagerAttendance() {
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<ManagerAttendanceRecord[]>([]);
  const [allHistory, setAllHistory] = useState<ManagerAttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0, todayPresent: 0, todayAbsent: 0,
    todayLate: 0, todayPercentage: 0, monthlyAverage: 0,
  });
  const [showNoClockIn, setShowNoClockIn] = useState(true);
  const [selectedRow, setSelectedRow] = useState<ManagerAttendanceRecord | null>(null);
  const [alert, setAlert] = useState<Toast | null>(null);
  const [filters, setFilters] = useState<ManagerFilters>({
    search: "", status: "", dateRange: "today", dept: "all",
  });

  const showAlert = useCallback((message: string, type: AlertType = "info") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  // Fetch all attendance records
  const fetchAllAttendance = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Attendance API ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        let attendanceData: any[] = [];
        
        // Handle multiple possible response structures
        if (data.data?.data && Array.isArray(data.data.data)) {
          attendanceData = data.data.data;
        } else if (Array.isArray(data.data)) {
          attendanceData = data.data;
        } else {
          attendanceData = [];
        }
        
        const transformed = attendanceData.map((item: any) => {
          // Parse date safely - handle Date objects, ISO strings, and various formats
          let dateStr = '';
          if (item.date) {
            let dateObj: Date;
            // If it's already a Date object, use it directly
            if (item.date instanceof Date) {
              dateObj = item.date;
            } else if (typeof item.date === 'string') {
              dateObj = new Date(item.date);
            } else {
              dateObj = new Date();
            }
            
            // Extract local date in YYYY-MM-DD format (not UTC)
            dateStr = dateObj.getFullYear().toString() +
              '-' + pad2(dateObj.getMonth() + 1) +
              '-' + pad2(dateObj.getDate());
          }
          
          // Extract employee_id correctly - handle both direct ID and object references
          let empId = item.employee_id;
          if (empId && typeof empId === 'object') {
            // If it's an object with _id property, extract the _id
            empId = empId._id || empId.id || String(empId);
          }
          // Ensure it's always a string for consistent comparison
          if (empId) {
            empId = String(empId).trim();
          }
          
          // Extract employee_code - may be nested in employee object
          let empCode = item.employee_code || item.employeeId || '';
          if (item.employee && typeof item.employee === 'object') {
            empCode = item.employee.employee_code || item.employee.employeeId || empCode;
          }
          
          // Extract department - may be nested
          let dept = item.department || '';
          if (item.employee && typeof item.employee === 'object') {
            dept = item.employee.department?.name || item.employee.department || dept;
          }
          
          // Extract full_name - try employee_name, then fallback to employee object
          let fullName = item.employee_name || item.full_name || '';
          if (!fullName && item.employee && typeof item.employee === 'object') {
            fullName = item.employee.full_name || `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim();
          }
          
          return {
            attendance_id: item.attendance_id,
            employee_id: empId,
            employee_code: empCode,
            full_name: fullName,
            department: dept,
            position: item.position || item.employee?.position || 'Employee',
            status: item.status,
            clock_in: (item.clock_in || item.clockInTime) ? time24(new Date(item.clock_in || item.clockInTime)) : null,
            clock_out: (item.clock_out || item.clockOutTime) ? time24(new Date(item.clock_out || item.clockOutTime)) : null,
            work_hours: item.hours_worked,
            date: dateStr,
          };
        });
        
        const today = todayISO();
        const todayRecs = transformed.filter(r => r.date === today);
        
        // Debug: Log actual dates from records
        if (transformed.length > 0) {
          console.log('Date Debug Info:', {
            todayISO: today,
            recordDates: transformed.slice(0, 3).map(r => r.date),
            firstRecordFullDate: transformed[0].date,
            typeOfDate: typeof transformed[0].date,
            rawDateFromAPI: attendanceData[0]?.date
          });
        }
        
        setTodayAttendance(todayRecs);
        setAllHistory(transformed);
        
        // Calculate stats
        const present = todayRecs.filter(r => r.status === "present" || r.status === "half_day").length;
        const late = todayRecs.filter(r => r.status === "late").length;
        const total = todayRecs.length;
        setStats({
          totalEmployees: total,
          todayPresent: present,
          todayAbsent: todayRecs.filter(r => r.status === "absent").length,
          todayLate: late,
          todayPercentage: total ? Math.round(((present + late) / total) * 100) : 0,
          monthlyAverage: 0,
        });
        
        console.log('Attendance Summary:', {
          totalRecords: transformed.length,
          todayCount: todayRecs.length,
          todayDate: today,
          sampleRecord: transformed[0],
          allRecordDates: transformed.map(r => r.date)
        });
      } else {
        showAlert('Failed to load attendance data.', 'error');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        showAlert('Request timed out. Please try again.', 'error');
      } else {
        console.error('Error fetching attendance:', error);
        showAlert(`Failed to load attendance data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Employees API ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        let employeesData = [];
        
        // Handle multiple possible response structures
        if (data.data && Array.isArray(data.data)) {
          employeesData = data.data;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          employeesData = data.data.data;
        } else {
          employeesData = [];
        }
        
        const transformed = employeesData.map((emp: any) => ({
          employee_id: String(emp._id).trim(),
          employee_code: emp.employeeId,
          full_name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department?.name || 'Department',
          position: emp.position,
          email: emp.email,
          status: emp.status,
        }));
        setEmployees(transformed);
        const depts = Array.from(new Set(transformed.map(e => e.department))) as string[];
        setDepartments(depts);
      } else {
        showAlert('Failed to load employees data.', 'error');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        showAlert('Request timed out. Please try again.', 'error');
      } else {
        console.error('Error fetching employees:', error);
        showAlert(`Failed to load employees data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    }
  }, [showAlert]);

  useEffect(() => {
    fetchAllAttendance();
    fetchEmployees();
  }, [fetchAllAttendance, fetchEmployees]);

  useEffect(() => {
    if (!loading) return;
    const fallback = window.setTimeout(() => {
      setLoading(false);
      showAlert('Attendance loading is taking unusually long. Check backend/API connectivity and refresh.', 'error');
    }, 15000);

    return () => window.clearTimeout(fallback);
  }, [loading, showAlert]);

  const filtered = useMemo(() => {
    const pool = filters.dateRange === "today" ? todayAttendance : allHistory;
    return pool.filter(r => {
      const matchSearch = !filters.search ||
        r.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.employee_code.toLowerCase().includes(filters.search.toLowerCase());
      const matchStatus = !filters.status || r.status === filters.status;
      const matchDept = filters.dept === "all" || r.department === filters.dept;
      const matchDate = matchesDateRange(r.date, filters.dateRange);
      return matchSearch && matchStatus && matchDept && matchDate;
    });
  }, [todayAttendance, allHistory, filters]);

  const noClockInList = useMemo(() => {
    const todayIds = new Set(todayAttendance.map(r => r.employee_id));
    const notClocked = employees.filter(e => !todayIds.has(e.employee_id)).map(emp => ({
      employee_id: emp.employee_id || "",
      employee_code: emp.employee_code || "-",
      full_name: emp.full_name || "Unknown",
      department: emp.department || "-",
      position: emp.position || "-",
      email: emp.email || "",
      status: emp.status || "active",
    }));
    
    if (notClocked.length > 0) {
      console.log('Did Not Clock In Debug:', {
        totalEmployees: employees.length,
        clockedInToday: todayAttendance.length,
        todayIds: Array.from(todayIds),
        notClockedIds: notClocked.map(e => ({ name: e.full_name, id: e.employee_id }))
      });
    }
    
    return notClocked;
  }, [todayAttendance, employees]);

  const setSearch = useCallback((v: string) => setFilters(f => ({ ...f, search: v })), []);
  const setStatus = useCallback((v: AttendanceStatus | "") => setFilters(f => ({ ...f, status: v })), []);
  const setDateRange = useCallback((v: DateRangeKey) => setFilters(f => ({ ...f, dateRange: v })), []);
  const setDept = useCallback((v: string) => setFilters(f => ({ ...f, dept: v })), []);
  const clearFilters = useCallback(() => setFilters({ search: "", status: "", dateRange: "today", dept: "all" }), []);

  const quickFilterPresent = useCallback(() => {
    setFilters({ search: "", status: "present", dateRange: "today", dept: "all" });
    setShowNoClockIn(false);
    showAlert("Showing present employees today", "info");
  }, [showAlert]);

  const quickFilterAbsent = useCallback(() => {
    setFilters({ search: "", status: "absent", dateRange: "today", dept: "all" });
    setShowNoClockIn(true);
    showAlert("Showing absent employees today", "info");
  }, [showAlert]);

  const quickFilterWeek = useCallback(() => {
    setFilters(f => ({ ...f, status: "", dateRange: "week" }));
    setShowNoClockIn(false);
    showAlert("Showing this week's attendance", "info");
  }, [showAlert]);

  const handleRefresh = useCallback(() => {
    fetchAllAttendance();
    fetchEmployees();
    showAlert("Attendance data refreshed!", "success");
  }, [fetchAllAttendance, fetchEmployees, showAlert]);

  const handleExportCSV = useCallback(() => {
    if (!filtered.length) { showAlert("No data to export", "error"); return; }
    exportManagerCSV(filtered);
    showAlert("Attendance data exported!", "success");
  }, [filtered, showAlert]);

  const handlePrint = useCallback(() => {
    if (!filtered.length) { showAlert("No data to print", "error"); return; }
    if (!printAttendance(filtered)) { showAlert("Pop-ups blocked", "error"); return; }
    showAlert("Print preview opened", "success");
  }, [filtered, showAlert]);

  const handleExportRecord = useCallback((row: ManagerAttendanceRecord) => {
    exportSingleRecord(row);
    showAlert(`Record for ${row.full_name} exported`, "success");
  }, [showAlert]);

  return {
    loading, todayAttendance, allHistory, employees, departments, stats,
    noClockInList, showNoClockIn, setShowNoClockIn,
    filters, setSearch, setStatus, setDateRange, setDept, clearFilters,
    filtered,
    quickFilterPresent, quickFilterAbsent, quickFilterWeek,
    handleRefresh, handleExportCSV, handlePrint, handleExportRecord,
    selectedRow, setSelectedRow,
    alert, clearAlert: () => setAlert(null),
  };
}




