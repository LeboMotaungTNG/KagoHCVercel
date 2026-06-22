

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "./SharedLayout";
import EditPayrollModal from './components/EditPayrollModal';

type PayrollStatus = "on_payroll" | "not_on_payroll" | "active" | "inactive";

interface PayrollEmployee {
  id: string;
  fullName: string;
  employeeCode: string;
  department: string;
  position: string;
  onPayroll: boolean;
  employmentStatus: "active" | "inactive" | "probation";
  basicSalary: number;
  netSalary: number;
  paymentFrequency: "Monthly" | "Weekly" | "Bi-weekly";
  employmentType: "Full-time" | "Part-time" | "Contract";
}

interface PayrollRun {
  periodName: string;
  period: "monthly" | "weekly" | "bi-weekly";
  startDate: string;
  endDate: string;
  paymentDate: string;
  department: string;
  employeeIds: string[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const PayrollPageContent: React.FC = () => {
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      console.log('No authentication found, redirecting to login');
      navigate('/');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Authenticated user:', user);
    } catch (error) {
      console.error('Invalid user data in localStorage:', error);
      navigate('/');
      return;
    }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState<"employees" | "payroll" | "benefits" | "reports">("employees");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "">("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const [payrollStep, setPayrollStep] = useState<1 | 2 | 3 | 4>(1);
  const [payrollRun, setPayrollRun] = useState<PayrollRun>({
    periodName: "February 2026 Payroll",
    period: "monthly",
    startDate: "",
    endDate: "",
    paymentDate: "",
    department: "",
    employeeIds: [],
  });

  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      setLoading(false);
      return;
    }

    fetch('https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Employee API returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // employees API: { success, data: { data: [...], pagination } }
        let raw: any[] = [];
        if (Array.isArray(data?.data?.data)) raw = data.data.data;
        else if (Array.isArray(data?.data)) raw = data.data;
        else if (Array.isArray(data)) raw = data;

        const mapped: PayrollEmployee[] = raw.map((emp: any) => ({
          id: emp._id || emp.id,
          fullName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
          employeeCode: emp.employeeId || emp.employee_code || 'N/A',
          department: emp.department?.name || emp.department || 'Unassigned',
          position: emp.position || 'Employee',
          onPayroll: emp.onPayroll === true,
          employmentStatus: emp.status || 'active',
          basicSalary: emp.salary || 0,
          netSalary: emp.salary ? Math.round(emp.salary * 0.81) : 0,
          paymentFrequency: emp.paymentFrequency || 'Monthly',
          employmentType: emp.employmentType || 'Full-time',
        }));
        setEmployees(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching employees:', err);
        setEmployees([]);
        setLoading(false);
      });
  }, []);

  // Add this function in PayrollPageContent component
  const showEmployeeDetails = (employee: PayrollEmployee) => {
    alert(`
      Employee: ${employee.fullName}
      ID: ${employee.employeeCode}
      Department: ${employee.department}
      Position: ${employee.position}
      Basic Salary: ${formatCurrency(employee.basicSalary)}
      Net Salary: ${formatCurrency(employee.netSalary)}
      Status: ${employee.onPayroll ? 'On Payroll' : 'Not on Payroll'}
    `);
  };

  // Add this function in PayrollPageContent component
  const addToPayroll = async (employee: PayrollEmployee) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          onPayroll: true,
        })
      });
      
      if (response.ok) {
        setEmployees(prev => prev.map(e =>
          e.id === employee.id ? { ...e, onPayroll: true } : e
        ));
      } else {
        alert('Failed to add employee to payroll');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding to payroll');
    }
  };

  // Download payroll summary as CSV
  const downloadPayrollSummary = () => {
    const onPayrollEmployees = employees.filter(e => e.onPayroll);
    let csv = "Employee Name,Department,Basic Salary,Net Salary\n";
    onPayrollEmployees.forEach(emp => {
      csv += `${emp.fullName},${emp.department},${emp.basicSalary},${emp.netSalary}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download EMP201 report
  const downloadEMP201 = () => {
    const totalGross = employees.filter(e => e.onPayroll).reduce((sum, e) => sum + e.basicSalary, 0);
    const totalPAYE = totalGross * 0.18;
    const totalUIF = totalGross * 0.01;
    const totalSDL = totalGross * 0.01;
    
    const report = `
EMPLOYER DECLARATION (EMP201)
=============================
Period: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
Total Gross Payable: R${totalGross}
PAYE (18%): R${totalPAYE}
UIF (1%): R${totalUIF}
SDL (1%): R${totalSDL}
Total Payable: R${totalPAYE + totalUIF + totalSDL}
    `;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EMP201-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download payslip for employee
  const downloadPayslip = (employee: PayrollEmployee) => {
    const payslip = `
PAYSLIP
=======
Employee: ${employee.fullName}
Employee ID: ${employee.employeeCode}
Department: ${employee.department}
Position: ${employee.position}
Period: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}

Earnings:
  Basic Salary: ${formatCurrency(employee.basicSalary)}

Deductions:
  PAYE (18%): ${formatCurrency(employee.basicSalary * 0.18)}
  UIF (1%): ${formatCurrency(employee.basicSalary * 0.01)}

Net Pay: ${formatCurrency(employee.netSalary || employee.basicSalary * 0.81)}
    `;
    
    const blob = new Blob([payslip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${employee.employeeCode}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchEmployees = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        let raw: any[] = [];
        if (Array.isArray(data?.data?.data)) raw = data.data.data;
        else if (Array.isArray(data?.data)) raw = data.data;
        else if (Array.isArray(data)) raw = data;

        const mapped: PayrollEmployee[] = raw.map((emp: any) => ({
          id: emp._id || emp.id,
          fullName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
          employeeCode: emp.employeeId || emp.employee_code || 'N/A',
          department: emp.department?.name || emp.department || 'Unassigned',
          position: emp.position || 'Employee',
          onPayroll: emp.onPayroll === true,
          employmentStatus: emp.status || 'active',
          basicSalary: emp.salary || 0,
          netSalary: emp.salary ? Math.round(emp.salary * 0.81) : 0,
          paymentFrequency: emp.paymentFrequency || 'Monthly',
          employmentType: emp.employmentType || 'Full-time',
        }));
        setEmployees(mapped);
      })
      .catch(err => console.error('Error fetching employees:', err));
  };

  const handleSavePayroll = async (updatedEmployee: PayrollEmployee) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees/${updatedEmployee.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        onPayroll: updatedEmployee.onPayroll,
        salary: updatedEmployee.basicSalary,
        paymentFrequency: updatedEmployee.paymentFrequency,
        employmentType: updatedEmployee.employmentType,
        status: updatedEmployee.employmentStatus,
        position: updatedEmployee.position,
      }),
    });
    if (!response.ok) throw new Error('Failed to update payroll information');
    // Update local state immediately � no need to re-fetch
    setEmployees(prev => prev.map(e =>
      e.id === updatedEmployee.id ? updatedEmployee : e
    ));
  };

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !search ||
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment = !departmentFilter || emp.department === departmentFilter;

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "on_payroll" && emp.onPayroll) ||
      (statusFilter === "not_on_payroll" && !emp.onPayroll) ||
      (statusFilter === "active" && emp.employmentStatus === "active") ||
      (statusFilter === "inactive" && emp.employmentStatus !== "active");

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const stats = useMemo(
    () => ({
      totalEmployees: employees.length,
      onPayroll: employees.filter((e) => e.onPayroll).length,
      notOnPayroll: employees.filter((e) => !e.onPayroll).length,
      estimatedGross: employees
        .filter((e) => e.onPayroll)
        .reduce((sum, emp) => sum + emp.basicSalary, 0),
      estimatedNet: employees
        .filter((e) => e.onPayroll)
        .reduce((sum, emp) => sum + emp.netSalary, 0),
    }),
    [employees]
  );

  const selectedEmployees = employees.filter((e) => payrollRun.employeeIds.includes(e.id) && e.onPayroll);

  const totalGrossSelected = selectedEmployees.reduce((sum, emp) => sum + emp.basicSalary, 0);
  const totalNetSelected = selectedEmployees.reduce((sum, emp) => sum + emp.netSalary, 0);

  // Simple compliance-style breakdowns inspired by the legacy payroll page.
  // These are mock calculations that mirror the structure of the HTML view.
  const totalPAYE = totalGrossSelected * 0.18;
  const totalUIFEmployee = totalGrossSelected * 0.01;
  const totalUIFEmployer = totalGrossSelected * 0.01;
  const totalSDL = totalGrossSelected * 0.01;
  const totalEmployerCost = totalGrossSelected + totalUIFEmployer + totalSDL;
  const totalMedicalAid = totalGrossSelected * 0.02;
  const totalPension = totalGrossSelected * 0.05;

  const toggleEmployeeSelection = (id: string) => {
    setPayrollRun((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter((x) => x !== id)
        : [...prev.employeeIds, id],
    }));
  };

  const selectAllOnPayroll = () => {
    setPayrollRun((prev) => ({
      ...prev,
      employeeIds: employees.filter((e) => e.onPayroll).map((e) => e.id),
    }));
  };

  const clearSelection = () => {
    setPayrollRun((prev) => ({ ...prev, employeeIds: [] }));
  };

  const handleCreatePeriod = () => {
    if (!payrollRun.periodName || !payrollRun.startDate || !payrollRun.endDate || !payrollRun.paymentDate) {
      alert("Please fill in all required fields for the payroll period.");
      return;
    }
    setPayrollStep(2);
  };

  const handleProceedReview = () => {
    if (selectedEmployees.length === 0) {
      alert("Select at least one employee for this payroll run.");
      return;
    }
    setPayrollStep(3);
  };

  const handleProcessPayroll = () => {
    if (selectedEmployees.length === 0) return;
    setPayrollStep(4);
  };

  const statCard = (
    label: string,
    value: React.ReactNode,
    sub?: string,
    accent?: string
  ) => (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid #e4e7ec",
        background: "#fff",
        padding: 20,
      }}
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: accent || "#E6A79E" }}>{label}</p>
      <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: "#1d2939" }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#667085" }}>{sub}</p>}
    </div>
  );

  if (loading) {
    return <div>Loading payroll data...</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1d2939", margin: 0 }}>Payroll Management</h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>
          Home &rsaquo; Payroll Management
        </p>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {statCard("On Payroll", `${stats.onPayroll}/${stats.totalEmployees}`, "Employees currently on payroll")}
        {statCard(
          "Estimated Gross",
          formatCurrency(stats.estimatedGross),
          "Current month gross",
          "#7DC695"
        )}
        {statCard(
          "Estimated Net",
          formatCurrency(stats.estimatedNet),
          "After tax & deductions",
          "#6B96E1"
        )}
        {statCard("Not On Payroll", stats.notOnPayroll, "Employees to be added", "#F096C3")}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #e4e7ec", marginBottom: 16 }}>
        {(["employees", "payroll", "benefits", "reports"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #E6A79E" : "2px solid transparent",
              fontSize: 14,
              fontWeight: 500,
              color: activeTab === tab ? "#E6A79E" : "#667085",
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            {tab === "employees" && "Employees"}
            {tab === "payroll" && "Payroll Run"}
            {tab === "benefits" && "Benefits"}
            {tab === "reports" && "Reports & History"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "employees" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e4e7ec",
            background: "#fff",
            padding: 20,
          }}
        >
          {/* Filters row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    height: 40,
                    width: 240,
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "0 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #d0d5dd",
                  padding: "0 12px",
                  fontSize: 14,
                  outline: "none",
                  minWidth: 160,
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PayrollStatus | "")}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #d0d5dd",
                  padding: "0 12px",
                  fontSize: 14,
                  outline: "none",
                  minWidth: 160,
                }}
              >
                <option value="">All Status</option>
                <option value="on_payroll">On payroll</option>
                <option value="not_on_payroll">Not on payroll</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setDepartmentFilter("");
                }}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #d0d5dd",
                  background: "#fff",
                  padding: "0 14px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#344054",
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </button>
              <button
                type="button"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: "none",
                  background: "#E6A79E",
                  padding: "0 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Add to Payroll
              </button>
            </div>
          </div>

          {/* Employees table */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e4e7ec",
              overflowX: "auto",
            }}
          >
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f2f4f7", background: "#f9fafb" }}>
                  {["Employee", "Department", "Salary Details", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#667085",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "36px 16px", textAlign: "center", fontSize: 14, color: "#667085" }}>
                      No employees found. Adjust your filters or add employees to payroll.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      style={{ borderBottom: "1px solid #f9fafb" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: "#f2f4f7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#667085",
                            }}
                          >
                            {getInitials(emp.fullName)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1d2939" }}>{emp.fullName}</div>
                            <div style={{ fontSize: 12, color: "#98a2b3" }}>{emp.position}</div>
                            <div style={{ fontSize: 12, color: "#98a2b3" }}>ID: {emp.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "2px 10px",
                            fontSize: 12,
                            fontWeight: 500,
                            background: "#f9fafb",
                            color: "#344054",
                          }}
                        >
                          {emp.department || "Unassigned"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#344054" }}>
                        <div>
                          <div>
                            Basic: {emp.onPayroll ? formatCurrency(emp.basicSalary) : "�"}
                          </div>
                          <div>
                            Net: {emp.onPayroll ? formatCurrency(emp.netSalary) : "�"}
                          </div>
                          <div style={{ fontSize: 12, color: "#98a2b3" }}>
                            {emp.onPayroll ? (
                              <>
                                {emp.paymentFrequency} � {emp.employmentType}
                              </>
                            ) : (
                              <span style={{ color: "#b45309" }}>Not on payroll</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {emp.onPayroll ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: 999,
                              padding: "2px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              background: "#ecfdf3",
                              color: "#027a48",
                              textTransform: "capitalize",
                            }}
                          >
                            {emp.employmentStatus}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: 999,
                              padding: "2px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              background: "#fffbeb",
                              color: "#b45309",
                            }}
                          >
                            Not on payroll
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => showEmployeeDetails(emp)}
                            style={{
                              borderRadius: 8,
                              border: "1px solid #d0d5dd",
                              background: "#fff",
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              color: "#344054",
                            }}
                          >
                            Details
                          </button>
                          {emp.onPayroll ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setIsEditModalOpen(true);
                              }}
                              style={{
                                borderRadius: 8,
                                border: "1px solid #e4e7ec",
                                background: "#f9fafb",
                                padding: "6px 10px",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                color: "#344054",
                              }}
                            >
                              Edit Payroll
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToPayroll(emp)}
                              style={{
                                borderRadius: 8,
                                border: "none",
                                background: "#E6A79E",
                                padding: "6px 10px",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                color: "#fff",
                              }}
                            >
                              Add to Payroll
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "payroll" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e4e7ec",
            background: "#fff",
            padding: 20,
            marginTop: 4,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#1d2939" }}>
              Process Payroll Run
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>
              Guide through setting up a payroll period, selecting employees and reviewing totals.
            </p>
          </div>

          {/* Stepper */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 8,
            }}
          >
            {["Setup Period", "Select Employees", "Review & Process", "Approve & Pay"].map(
              (label, index) => {
                const stepIndex = (index + 1) as 1 | 2 | 3 | 4;
                const isActive = payrollStep === stepIndex;
                const isCompleted = payrollStep > stepIndex;
                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: 80,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          background: isCompleted
                            ? "#16a34a"
                            : isActive
                            ? "#E6A79E"
                            : "#e5e7eb",
                          color: isActive || isCompleted ? "#fff" : "#6b7280",
                          boxShadow: isActive ? "0 0 0 4px rgba(230,167,158,0.28)" : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {isCompleted ? "?" : stepIndex}
                      </div>
                      <span
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          textAlign: "center",
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? "#E6A79E" : "#667085",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          marginLeft: 8,
                          marginRight: 8,
                          background: payrollStep > stepIndex ? "#16a34a" : "#e5e7eb",
                        }}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* Step 1 */}
          {payrollStep === 1 && (
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#344054",
                    marginBottom: 6,
                  }}
                >
                  Payroll Period Name *
                </label>
                <input
                  type="text"
                  value={payrollRun.periodName}
                  onChange={(e) =>
                    setPayrollRun((prev) => ({ ...prev, periodName: e.target.value }))
                  }
                  placeholder="e.g. February 2026 Payroll"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#344054",
                    marginBottom: 6,
                  }}
                >
                  Period Type *
                </label>
                <select
                  value={payrollRun.period}
                  onChange={(e) =>
                    setPayrollRun((prev) => ({
                      ...prev,
                      period: e.target.value as PayrollRun["period"],
                    }))
                  }
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                    background: "#fff",
                  }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#344054",
                    marginBottom: 6,
                  }}
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  value={payrollRun.startDate}
                  onChange={(e) =>
                    setPayrollRun((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#344054",
                    marginBottom: 6,
                  }}
                >
                  End Date *
                </label>
                <input
                  type="date"
                  value={payrollRun.endDate}
                  onChange={(e) =>
                    setPayrollRun((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#344054",
                    marginBottom: 6,
                  }}
                >
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={payrollRun.paymentDate}
                  onChange={(e) =>
                    setPayrollRun((prev) => ({ ...prev, paymentDate: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#344054",
                    marginBottom: 6,
                  }}
                >
                  Department (optional)
                </label>
                <select
                  value={payrollRun.department}
                  onChange={(e) =>
                    setPayrollRun((prev) => ({ ...prev, department: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                    background: "#fff",
                  }}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", textAlign: "right", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleCreatePeriod}
                  style={{
                    borderRadius: 8,
                    border: "none",
                    background: "#E6A79E",
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Create Period &amp; Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {payrollStep === 2 && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", margin: 0 }}>
                  Select Employees for Payroll Run
                </h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={selectAllOnPayroll}
                    style={{
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                      background: "#fff",
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      color: "#344054",
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    style={{
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                      background: "#fff",
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      color: "#344054",
                    }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 8,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  padding: 12,
                  marginBottom: 12,
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#1d4ed8" }}>
                    {selectedEmployees.length} of {employees.filter((e) => e.onPayroll).length} employees selected
                  </span>
                  <div style={{ color: "#1d4ed8", marginTop: 2 }}>
                    Est. Gross: {formatCurrency(totalGrossSelected)} � Est. Net:{" "}
                    {formatCurrency(totalNetSelected)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  borderRadius: 8,
                  border: "1px solid #e4e7ec",
                  padding: 8,
                }}
              >
                {employees.filter((e) => e.onPayroll).length === 0 ? (
                  <div
                    style={{
                      padding: 32,
                      textAlign: "center",
                      fontSize: 14,
                      color: "#667085",
                    }}
                  >
                    No employees on payroll yet. Add employees from the Employees tab first.
                  </div>
                ) : (
                  employees
                    .filter((e) => e.onPayroll)
                    .map((emp) => {
                      const checked = payrollRun.employeeIds.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: 8,
                            borderRadius: 8,
                            border: checked
                              ? "1px solid #E6A79E"
                              : "1px solid #e4e7ec",
                            background: checked ? "#fdf6f3" : "#fff",
                            marginBottom: 6,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEmployeeSelection(emp.id)}
                              style={{ width: 16, height: 16 }}
                            />
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "#f2f4f7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#667085",
                              }}
                            >
                              {getInitials(emp.fullName)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: "#1d2939",
                                }}
                              >
                                {emp.fullName}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#98a2b3",
                                }}
                              >
                                {emp.department} � {emp.position}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#1d2939",
                              }}
                            >
                              {formatCurrency(emp.basicSalary)}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#98a2b3",
                                textTransform: "lowercase",
                              }}
                            >
                              {emp.paymentFrequency}
                            </div>
                          </div>
                        </label>
                      );
                    })
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 16,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPayrollStep(1)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    background: "#fff",
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    color: "#344054",
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedReview}
                  style={{
                    borderRadius: 8,
                    border: "none",
                    background: "#E6A79E",
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    color: "#fff",
                    opacity: selectedEmployees.length === 0 ? 0.6 : 1,
                  }}
                  disabled={selectedEmployees.length === 0}
                >
                  Review &amp; Process
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {payrollStep === 3 && (
            <div style={{ marginTop: 8 }}>
              {/* High-level summary cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {statCard("Employees", selectedEmployees.length, undefined, "#1d2939")}
                {statCard("Gross Pay", formatCurrency(totalGrossSelected), undefined, "#2563eb")}
                {statCard("Net Pay", formatCurrency(totalNetSelected), undefined, "#16a34a")}
              </div>

              {/* Compliance-style breakdowns (Tax & Employer Cost) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e4e7ec",
                    background: "#fff",
                    padding: 16,
                  }}
                >
                  <h5
                    style={{
                      margin: "0 0 12px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1d2939",
                    }}
                  >
                    Tax &amp; Statutory
                  </h5>
                  <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>PAYE Tax</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(totalPAYE)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>UIF (Employee)</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(totalUIFEmployee)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>UIF (Employer)</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(totalUIFEmployer)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>SDL</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(totalSDL)}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e4e7ec",
                    background: "#fff",
                    padding: 16,
                  }}
                >
                  <h5
                    style={{
                      margin: "0 0 12px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1d2939",
                    }}
                  >
                    Employer Cost
                  </h5>
                  <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>Total Employer Cost</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(totalEmployerCost)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>Medical Aid</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(totalMedicalAid)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>Pension</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(totalPension)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee-level breakdown table */}
              <div
                style={{
                  borderRadius: 8,
                  border: "1px solid #e4e7ec",
                  background: "#fff",
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                    minWidth: 520,
                  }}
                >
                  <thead style={{ position: "sticky", top: 0, background: "#f9fafb" }}>
                    <tr>
                      {["Employee", "Dept", "Gross", "Net"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "8px 12px",
                            textAlign: h === "Employee" ? "left" : "right",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#667085",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployees.map((emp) => (
                      <tr key={emp.id} style={{ borderTop: "1px solid #f2f4f7" }}>
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "left",
                            fontWeight: 500,
                            color: "#1d2939",
                          }}
                        >
                          {emp.fullName}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#667085" }}>
                          {emp.department}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#667085" }}>
                          {formatCurrency(emp.basicSalary)}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#16a34a" }}>
                          {formatCurrency(emp.netSalary)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 16,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPayrollStep(2)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    background: "#fff",
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    color: "#344054",
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayroll}
                  style={{
                    borderRadius: 8,
                    border: "none",
                    background: "#16a34a",
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#fff",
                  }}
                >
                  Process Payroll
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {payrollStep === 4 && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  borderRadius: 8,
                  border: "1px solid #bbf7d0",
                  background: "#ecfdf3",
                  padding: 16,
                  marginBottom: 16,
                  fontSize: 14,
                  color: "#166534",
                }}
              >
                <strong>Payroll processed!</strong> This mock flow simulates a completed
                payroll run for the selected employees and period.
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, color: "#667085" }}>Total net payable</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>
                    {formatCurrency(totalNetSelected)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={{
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                      background: "#fff",
                      padding: "8px 16px",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      color: "#344054",
                    }}
                  >
                    Download Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayrollStep(1)}
                    style={{
                      borderRadius: 8,
                      border: "none",
                      background: "#E6A79E",
                      padding: "8px 16px",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      color: "#fff",
                    }}
                  >
                    Back to Step 1
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e4e7ec",
            background: "#fff",
            padding: 20,
            marginTop: 4,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1d2939", marginBottom: 4 }}>
            Payroll Reports &amp; Downloads
          </h3>
          <p style={{ fontSize: 14, color: "#667085", marginBottom: 20 }}>
            Generate and download payroll reports, compliance documents, and payslips.
          </p>

          {/* Monthly Summary / Compliance cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                borderRadius: 12,
                border: "1px solid #e4e7ec",
                background: "#fff",
                padding: 16,
              }}
            >
              <h5 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#1d2939" }}>
                Monthly Payroll Summary
              </h5>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#667085" }}>
                High-level gross, deductions and net for the selected period.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={downloadPayrollSummary}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    border: "none",
                    background: "#4f46e5",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Download
                </button>
                <button
                  type="button"
                  style={{
                    borderRadius: 8,
                    border: "1px solid #4f46e5",
                    background: "#eef2ff",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#3730a3",
                    cursor: "pointer",
                  }}
                >
                  CSV
                </button>
              </div>
            </div>

            <div
              style={{
                borderRadius: 12,
                border: "1px solid #c7d2fe",
                background: "#eef2ff",
                padding: 16,
              }}
            >
              <h5 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#312e81" }}>
                EMP201 � Monthly SARS
              </h5>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#4f46e5" }}>
                Employer declaration for PAYE, UIF and SDL.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={downloadEMP201}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    border: "none",
                    background: "#4f46e5",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Download Report
                </button>
                <button
                  type="button"
                  style={{
                    borderRadius: 8,
                    border: "1px solid #6366f1",
                    background: "#e0e7ff",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#3730a3",
                    cursor: "pointer",
                  }}
                >
                  CSV
                </button>
              </div>
            </div>

            <div
              style={{
                borderRadius: 12,
                border: "1px solid #fecaca",
                background: "#fee2e2",
                padding: 16,
              }}
            >
              <h5 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#7f1d1d" }}>
                EMP501 � Annual Reconciliation
              </h5>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#b91c1c" }}>
                Annual employer reconciliation declaration for SARS.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    border: "none",
                    background: "#dc2626",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Download Report
                </button>
                <button
                  type="button"
                  style={{
                    borderRadius: 8,
                    border: "1px solid #f87171",
                    background: "#fee2e2",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Payslips list */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 8 }}>
              Employee Payslips
            </h4>
            <p style={{ fontSize: 14, color: "#667085", marginBottom: 8 }}>
              Click on any employee below to generate and download a payslip.
            </p>
            <div
              style={{
                maxHeight: 260,
                borderRadius: 12,
                border: "1px solid #e4e7ec",
                overflowY: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead style={{ position: "sticky", top: 0, background: "#f9fafb" }}>
                  <tr>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#667085",
                      }}
                    >
                      Employee
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#667085",
                      }}
                    >
                      Department
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#667085",
                      }}
                    >
                      Net Pay
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#667085",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.filter((e) => e.onPayroll).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "24px 12px",
                          textAlign: "center",
                          fontSize: 13,
                          color: "#667085",
                        }}
                      >
                        No employees on payroll. Add employees first.
                      </td>
                    </tr>
                  ) : (
                    employees
                      .filter((e) => e.onPayroll)
                      .map((emp) => (
                        <tr
                          key={emp.id}
                          style={{
                            borderTop: "1px solid #f2f4f7",
                          }}
                        >
                          <td style={{ padding: "8px 12px", color: "#1d2939" }}>
                            <span style={{ fontWeight: 500 }}>{emp.fullName}</span>
                            <span style={{ marginLeft: 4, fontSize: 12, color: "#98a2b3" }}>
                              ({emp.employeeCode})
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", color: "#667085" }}>{emp.department}</td>
                          <td
                            style={{
                              padding: "8px 12px",
                              textAlign: "right",
                              fontWeight: 500,
                              color: "#1d2939",
                            }}
                          >
                            {formatCurrency(emp.netSalary)}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => downloadPayslip(emp)}
                              style={{
                                borderRadius: 999,
                                border: "none",
                                background: "#16a34a",
                                padding: "6px 10px",
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              Payslip
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional reports shortcuts */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 8 }}>
              Additional Reports
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #bbf7d0",
                  background: "#ecfdf3",
                  padding: 16,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>?</span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#166534",
                      }}
                    >
                      Tax Summary
                    </div>
                    <div style={{ fontSize: 12, color: "#166534" }}>
                      PAYE, UIF, SDL breakdown
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #ddd6fe",
                  background: "#f5f3ff",
                  padding: 16,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#ede9fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>??</span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#4c1d95",
                      }}
                    >
                      Department Summary
                    </div>
                    <div style={{ fontSize: 12, color: "#4c1d95" }}>
                      Export department payroll data
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #facc15",
                  background: "#fef9c3",
                  padding: 16,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#fef3c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>??</span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#854d0e",
                      }}
                    >
                      Export All Data
                    </div>
                    <div style={{ fontSize: 12, color: "#854d0e" }}>
                      Full payroll data export (JSON / CSV)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "benefits" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e4e7ec",
            background: "#fff",
            padding: 20,
            marginTop: 4,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1d2939", margin: 0 }}>
              Employee Benefits Management
            </h3>
            <p style={{ fontSize: 14, color: "#667085", marginTop: 4 }}>
              Manage statutory and company benefits (UIF, SDL, medical aid, pension, bonuses and more).
            </p>
          </div>

          {/* Statutory Benefits */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 12 }}>
              Statutory Benefits (South Africa)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h5 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1d4ed8" }}>
                    UIF Contributions
                  </h5>
                  <span
                    style={{
                      borderRadius: 999,
                      background: "#dbeafe",
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#1d4ed8",
                    }}
                  >
                    Required
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                  Unemployment Insurance Fund contribution rates.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ color: "#1d4ed8", marginBottom: 4 }}>Employee rate</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        defaultValue={1}
                        style={{
                          width: 72,
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          padding: "4px 6px",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      <span style={{ color: "#1d4ed8" }}>%</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#1d4ed8", marginBottom: 4 }}>Employer rate</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        defaultValue={1}
                        style={{
                          width: 72,
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          padding: "4px 6px",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      <span style={{ color: "#1d4ed8" }}>%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #bbf7d0",
                  background: "#ecfdf3",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h5 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#166534" }}>
                    Skills Development Levy (SDL)
                  </h5>
                  <span
                    style={{
                      borderRadius: 999,
                      background: "#dcfce7",
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#166534",
                    }}
                  >
                    Required
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#166534", marginBottom: 8 }}>
                  Configure SDL rate and minimum threshold.
                </p>
                <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>
                    <div style={{ color: "#166534", marginBottom: 4 }}>Rate</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        defaultValue={1}
                        style={{
                          width: 72,
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          padding: "4px 6px",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      <span style={{ color: "#166534" }}>%</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#166534", marginBottom: 4 }}>Minimum amount</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#166534" }}>R</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        defaultValue={0}
                        style={{
                          width: 120,
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          padding: "4px 6px",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #e9d5ff",
                  background: "#f5f3ff",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h5 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#6d28d9" }}>
                    Overtime Rates
                  </h5>
                  <span
                    style={{
                      borderRadius: 999,
                      background: "#ede9fe",
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#6d28d9",
                    }}
                  >
                    Company Policy
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#6d28d9", marginBottom: 8 }}>
                  Configure overtime multipliers as a % of base rate.
                </p>
                <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Normal</span>
                    <input
                      type="number"
                      defaultValue={150}
                      min={100}
                      max={300}
                      step={1}
                      style={{
                        width: 72,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        padding: "4px 6px",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "spaceBetween", alignItems: "center" }}>
                    <span>Weekend</span>
                    <input
                      type="number"
                      defaultValue={200}
                      min={100}
                      max={300}
                      step={1}
                      style={{
                        width: 72,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        padding: "4px 6px",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Public Holiday</span>
                    <input
                      type="number"
                      defaultValue={250}
                      min={100}
                      max={300}
                      step={1}
                      style={{
                        width: 72,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        padding: "4px 6px",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Benefits */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 12 }}>
              Company Benefits
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #e4e7ec",
                  background: "#fff",
                  padding: 16,
                }}
              >
                <h5 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#1d2939" }}>
                  Medical Aid Contribution
                </h5>
                <p style={{ fontSize: 13, color: "#667085", marginBottom: 8 }}>
                  Percentage of salary contributed to medical aid.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    defaultValue={10}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                      padding: "8px 10px",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#667085" }}>%</span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #e4e7ec",
                  background: "#fff",
                  padding: 16,
                }}
              >
                <h5 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#1d2939" }}>
                  Pension Fund
                </h5>
                <p style={{ fontSize: 13, color: "#667085", marginBottom: 8 }}>
                  Percentage of salary contributed to pension.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    defaultValue={15}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                      padding: "8px 10px",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#667085" }}>%</span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #e4e7ec",
                  background: "#fff",
                  padding: 16,
                }}
              >
                <h5 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#1d2939" }}>
                  Annual Bonus
                </h5>
                <p style={{ fontSize: 13, color: "#667085", marginBottom: 8 }}>
                  Percentage of annual salary paid as bonus (13th cheque).
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    defaultValue={8}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                      padding: "8px 10px",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#667085" }}>%</span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #e4e7ec",
                  background: "#fff",
                  padding: 16,
                }}
              >
                <h5 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#1d2939" }}>
                  Leave Policy
                </h5>
                <p style={{ fontSize: 13, color: "#667085", marginBottom: 8 }}>
                  Number of annual leave days per employee.
                </p>
                <input
                  type="number"
                  min={0}
                  max={365}
                  defaultValue={21}
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d0d5dd",
                    padding: "8px 10px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Optional Benefits summary (static placeholder) */}
          <div
            style={{
              borderRadius: 12,
              border: "1px dashed #e4e7ec",
              padding: 16,
              fontSize: 13,
              color: "#667085",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#1d2939" }}>
              Optional Benefits
            </div>
            <p style={{ marginBottom: 4 }}>
              In the original payroll page this section lists toggleable optional benefits such as
              gym memberships, study allowances and travel stipends. You can mirror that here later
              by wiring these controls to your real payroll configuration API.
            </p>
          </div>

          {/* Footer actions: reset & save benefits */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              style={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff7ed",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: "#b45309",
                cursor: "pointer",
              }}
            >
              Reset Benefits to Defaults
            </button>
            <button
              type="button"
              style={{
                borderRadius: 8,
                border: "none",
                background: "#E6A79E",
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Save Benefits Settings
            </button>
          </div>
        </div>
      )}
      <EditPayrollModal
        isOpen={isEditModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSave={handleSavePayroll}
      />
    </div>
  );
};

const Payroll: React.FC = () => (
  <SharedLayout title="Payroll Management">
    <PayrollPageContent />
  </SharedLayout>
);

export default Payroll;
