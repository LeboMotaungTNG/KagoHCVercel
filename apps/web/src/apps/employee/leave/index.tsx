import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Calendar, CheckCircle2, Clock, Hourglass } from "lucide-react";
import SharedLayout from "../SharedLayout";
import { C } from "../../../shared/utils/employee";
import LeaveBalanceGrid from "./LeaveBalanceGrid";
import LeaveRequestForm from "./LeaveRequestForm";
import LeaveRequestHistory from "./LeaveRequestHistory";
import LeaveRequestDetail from "./LeaveRequestDetail";
import { heroStyle, statChip, numStyle, subtle } from "./leaveStyles";
import { Toast } from "./leaveUiHelpers";
import type { LeaveBalanceMap, LeaveFormData, LeavePolicy, LeaveRequest } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const PageSkeleton: React.FC = () => (
  <SharedLayout>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ ...heroStyle, minHeight: 140, opacity: 0.7 }} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 24 }}>
        <div style={{ height: 320, borderRadius: 22, background: C.line }} />
        <div style={{ height: 420, borderRadius: 22, background: C.line }} />
      </div>
    </div>
  </SharedLayout>
);

const EmployeeLeavePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeavePolicy[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceMap>({});

  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    days: 1,
    reason: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, days: diffDays > 0 ? diffDays : 1 }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const fetchAvailableLeaveTypes = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/leave/types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.data) {
        const policies = data.data;
        const leaveTypes: LeavePolicy[] = policies.map((policy: any) => {
          let label = "";
          let total = 0;
          let color: string = C.primary;

          switch (policy.type) {
            case "annual":
              label = "Annual Leave";
              total = policy.entitlementDays || 15;
              color = C.primary;
              break;
            case "sick":
              label = "Sick Leave";
              total = policy.entitlementDays || 30;
              color = C.green;
              break;
            case "family":
              label = "Family Responsibility Leave";
              total = policy.entitlementDays || 3;
              color = C.blue;
              break;
            case "maternity":
              label = "Maternity Leave";
              total = policy.entitlementDays || 88;
              color = C.purple;
              break;
            case "parental":
              label = "Parental Leave";
              total = policy.entitlementDays || 10;
              color = C.ok;
              break;
            default:
              label = policy.name || policy.type;
              total = policy.entitlementDays || 5;
              color = policy.color || C.primary;
          }

          return { type: policy.type, label, total, color };
        });

        setAvailableLeaveTypes(leaveTypes);

        const newBalance: LeaveBalanceMap = {};
        leaveTypes.forEach(type => {
          newBalance[type.type] = { used: 0, total: type.total || 0, remaining: type.total || 0 };
        });
        setLeaveBalance(newBalance);
        return leaveTypes;
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
    return [];
  };

  const fetchLeaveRequestsInternal = async (_employeeId: string, token: string): Promise<LeaveRequest[]> => {
    try {
      const response = await fetch(`${API_URL}/leave/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      let requests: any[] = [];
      const payload = data?.data;
      if (Array.isArray(payload?.data)) requests = payload.data;
      else if (Array.isArray(payload)) requests = payload;
      else if (Array.isArray(data)) requests = data;

      return requests.map((req: any) => ({
        _id: req._id,
        leave_type: req.leave_type || req.leaveType || "annual",
        start_date: req.start_date || req.startDate,
        end_date: req.end_date || req.endDate,
        total_days: req.total_days || req.totalDays || 1,
        reason: req.reason || "",
        status: req.status || "pending",
        submitted_at: req.submitted_at || req.createdAt || new Date().toISOString(),
        reviewer_name: req.reviewer_name,
        reviewed_at: req.reviewed_at,
        rejection_reason: req.rejection_reason,
      }));
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      return [];
    }
  };

  const fetchLeaveBalance = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/leave/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setLeaveBalance(data.data);
        return data.data;
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    }
    return null;
  };

  const fetchLeaveRequests = async (employeeId: string, token: string) => {
    const mappedRequests = await fetchLeaveRequestsInternal(employeeId, token);
    setLeaveRequests(mappedRequests);
    await fetchLeaveBalance(token);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!userStr || !token) {
          window.location.href = "/login";
          return;
        }

        const userData = JSON.parse(userStr);
        setUser(userData);

        const leaveTypesData = await fetchAvailableLeaveTypes(token);
        let foundEmployee: any = null;

        if (userData._id) {
          try {
            const empResponse = await fetch(`${API_URL}/employees?userId=${userData._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const empData = await empResponse.json();
            if (empData.success && empData.data?.length > 0) {
              foundEmployee = empData.data[0];
            }
          } catch (err) {
            console.warn("Failed to fetch employee by userId:", err);
          }
        }

        if (!foundEmployee && userData.email) {
          try {
            const allEmps = await fetch(`${API_URL}/employees`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const allData = await allEmps.json();
            if (allData.success && allData.data) {
              foundEmployee = allData.data.find((emp: any) => emp.email === userData.email);
            }
          } catch (err) {
            console.warn("Failed to fetch employees for matching:", err);
          }
        }

        if (foundEmployee) {
          setEmployee(foundEmployee);
          const requests = await fetchLeaveRequestsInternal(foundEmployee._id, token);
          setLeaveRequests(requests);

          const serverBalance = await fetchLeaveBalance(token);

          if (!serverBalance && leaveTypesData.length > 0) {
            const updatedBalance: LeaveBalanceMap = {};
            leaveTypesData.forEach((type: LeavePolicy) => {
              updatedBalance[type.type] = { used: 0, total: type.total || 0, remaining: type.total || 0 };
            });
            requests.forEach((request: LeaveRequest) => {
              if (request.status === "approved" || request.status === "pending") {
                const type = request.leave_type;
                if (updatedBalance[type]) {
                  updatedBalance[type].used += request.total_days;
                  updatedBalance[type].remaining -= request.total_days;
                }
              }
            });
            setLeaveBalance(updatedBalance);
          }
        } else {
          setMessage({
            text: "Employee record not found. Please contact administrator.",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({ text: "Failed to load employee data. Please try again.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 3500);
    return () => window.clearTimeout(t);
  }, [message]);

  const stats = useMemo(() => {
    const pending = leaveRequests.filter(r => r.status === "pending").length;
    const approved = leaveRequests.filter(r => r.status === "approved").length;
    const daysRemaining = Object.values(leaveBalance).reduce((sum, b) => sum + (b?.remaining ?? 0), 0);
    return { pending, approved, daysRemaining };
  }, [leaveRequests, leaveBalance]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage({ text: "Session expired. Please log in again.", type: "error" });
        setTimeout(() => { window.location.href = "/login"; }, 2000);
        return;
      }

      if (!employee) {
        setMessage({ text: "Employee record not found. Please contact administrator.", type: "error" });
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        setMessage({ text: "Please select start and end dates", type: "error" });
        return;
      }

      const response = await fetch(`${API_URL}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leave_type: formData.leaveType,
          start_date: formData.startDate,
          end_date: formData.endDate,
          daysRequested: formData.days,
          reason: formData.reason,
          employee_id: employee._id,
          full_name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          employee_code: employee.employeeId,
          department: employee.department?.name || "Department",
          position: employee.position || "Employee",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: "Leave request submitted successfully!", type: "success" });
        setFormData({ leaveType: "annual", startDate: "", endDate: "", days: 1, reason: "" });
        await fetchLeaveRequests(employee._id, token);
      } else {
        setMessage({ text: data.error?.message || "Failed to submit request", type: "error" });
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setMessage({ text: "Couldn't connect. Please check your internet and try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <SharedLayout>
      <Helmet>
        <title>Leave Management | Kago HC</title>
        <meta name="description" content="Employee leave management" />
      </Helmet>

      {message && <Toast message={message.text} type={message.type} />}
      {selectedRequest && (
        <LeaveRequestDetail request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={heroStyle}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <span style={{
              width: 48, height: 48, borderRadius: 14,
              background: C.primaryBg, color: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={24} />
            </span>
            <div>
              <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>
                Leave Management
              </h1>
              <p style={{ ...subtle, margin: 0, maxWidth: 520 }}>
                View your leave balance, submit new requests, and track approval status.
              </p>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}>
            <div style={statChip}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Hourglass size={15} color={C.amber} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Pending</span>
              </div>
              <div style={numStyle}>{stats.pending}</div>
            </div>
            <div style={statChip}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <CheckCircle2 size={15} color={C.ok} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Approved</span>
              </div>
              <div style={numStyle}>{stats.approved}</div>
            </div>
            <div style={statChip}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Clock size={15} color={C.primary} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Days remaining</span>
              </div>
              <div style={numStyle}>{stats.daysRemaining}</div>
            </div>
          </div>
        </header>

        <div
          className="leave-page-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            gap: 24,
            alignItems: "start",
            marginBottom: 24,
          }}
        >
          <LeaveBalanceGrid
            types={availableLeaveTypes}
            balance={leaveBalance}
          />
          <LeaveRequestForm
            formData={formData}
            availableLeaveTypes={availableLeaveTypes}
            submitting={submitting}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        </div>

        <LeaveRequestHistory
          requests={leaveRequests}
          onSelect={setSelectedRequest}
        />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .leave-page-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </SharedLayout>
  );
};

export default EmployeeLeavePage;
