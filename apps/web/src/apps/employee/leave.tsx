import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Calendar, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import SharedLayout from "./SharedLayout";

const API_URL = import.meta.env.VITE_API_URL || 'https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1';

interface LeaveRequest {
  _id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitted_at: string;
}

interface LeavePolicy {
  type: string;
  name: string;
  label?: string;
  entitlementDays: number;
  total?: number;
  icon?: string;
  color?: string;
}

interface LeaveBalance {
  [key: string]: { used: number; total: number; remaining: number };
}

const EmployeeLeave: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeavePolicy[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<Record<string, { used: number; total: number; remaining: number }>>({});
  
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    days: 1,
    reason: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-calculate days when dates change
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

  // Helper function to calculate leave balance
  const calculateLeaveBalance = (requests: LeaveRequest[]) => {
    const balance = {
      annual: { used: 0, total: 20, remaining: 20 },
      sick: { used: 0, total: 10, remaining: 10 },
      family: { used: 0, total: 5, remaining: 5 },
      other: { used: 0, total: 3, remaining: 3 }
    };
    
    requests.forEach((request: LeaveRequest) => {
      if (request.status === 'approved' || request.status === 'pending') {
        const type = request.leave_type;
        if (balance[type as keyof typeof balance]) {
          balance[type as keyof typeof balance].used += request.total_days;
          balance[type as keyof typeof balance].remaining -= request.total_days;
        }
      }
    });
    
    return balance;
  };

  // ✅ Fetch available leave types from backend (employee endpoint)
  const fetchAvailableLeaveTypes = async (token: string) => {
    try {
      // Canonical leave types come straight from the backend (single source of truth)
      const response = await fetch(`${API_URL}/leave/types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('Leave types response:', data);
      
      if (data.success && data.data) {
        const policies = data.data;
        
        const leaveTypes = policies.map((policy: any) => {
          let label = '';
          let total = 0;
          let icon = '📅';
          let color = '#E6A79E';
          
          switch(policy.type) {
            case 'annual':
              label = 'Annual Leave';
              total = policy.entitlementDays || 15;
              icon = '🏖️';
              color = '#E6A79E';
              break;
            case 'sick':
              label = 'Sick Leave';
              total = policy.entitlementDays || 30;
              icon = '🏥';
              color = '#7DC695';
              break;
            case 'family':
              label = 'Family Responsibility Leave';
              total = policy.entitlementDays || 3;
              icon = '👨‍👩‍👧';
              color = '#6B96E1';
              break;
            case 'maternity':
              label = 'Maternity Leave';
              total = policy.entitlementDays || 88;
              icon = '👶';
              color = '#8B5CF6';
              break;
            case 'parental':
              label = 'Parental Leave';
              total = policy.entitlementDays || 10;
              icon = '👨‍👦';
              color = '#10B981';
              break;
            default:
              label = policy.name || policy.type;
              total = policy.entitlementDays || 5;
              icon = policy.icon || '📋';
              color = policy.color || '#0EA5E9';
          }
          
          return {
            type: policy.type,
            label: label,
            total: total,
            icon: icon,
            color: color
          };
        });
        
        setAvailableLeaveTypes(leaveTypes);
        
        // Initialize balance with dynamic types
        const newBalance: any = {};
        leaveTypes.forEach((type: any) => {
          newBalance[type.type] = { used: 0, total: type.total, remaining: type.total };
        });
        
        setLeaveBalance(newBalance);
        return leaveTypes;
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
    return [];
  };

  // ✅ Fetch leave policy from backend
  const fetchLeavePolicy = async (token: string): Promise<LeaveBalance | null> => {
    try {
      const response = await fetch(`${API_URL}/owner/leave-policies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        const policies = data.data;
        
        // Map policies to balance format
        let newBalance: LeaveBalance = {
          annual: { used: 0, total: 15, remaining: 15 },
          sick: { used: 0, total: 30, remaining: 30 },
          family: { used: 0, total: 3, remaining: 3 },
          other: { used: 0, total: 0, remaining: 0 }
        };
        
        policies.forEach((policy: any) => {
          switch(policy.type) {
            case 'annual':
              newBalance.annual.total = policy.daysPerYear || 15;
              newBalance.annual.remaining = policy.daysPerYear || 15;
              break;
            case 'sick':
              newBalance.sick.total = policy.daysTotal || 30;
              newBalance.sick.remaining = policy.daysTotal || 30;
              break;
            case 'family':
              newBalance.family.total = policy.daysPerYear || 3;
              newBalance.family.remaining = policy.daysPerYear || 3;
              break;
          }
        });
        
        return newBalance;
      }
    } catch (error) {
      console.error('Error fetching leave policy:', error);
    }
    
    // Default fallback
    return null;
  };

  // Helper function to fetch leave requests (returns data without setting state)
  const fetchLeaveRequestsInternal = async (employeeId: string, token: string): Promise<LeaveRequest[]> => {
    try {
      const response = await fetch(`${API_URL}/leave/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('Leave requests response:', data);
      
      // Backend already filters by the authenticated user. Response shape is
      // { success, data: { data: [...], pagination } } so unwrap accordingly.
      let requests: any[] = [];
      const payload = data?.data;
      if (Array.isArray(payload?.data)) {
        requests = payload.data;
      } else if (Array.isArray(payload)) {
        requests = payload;
      } else if (Array.isArray(data)) {
        requests = data;
      }
      
      // Map API response to expected format
      const mappedRequests = requests.map((req: any) => ({
        _id: req._id,
        leave_type: req.leave_type || req.leaveType || 'annual',
        start_date: req.start_date || req.startDate,
        end_date: req.end_date || req.endDate,
        total_days: req.total_days || req.totalDays || 1,
        reason: req.reason || '',
        status: req.status || 'pending',
        submitted_at: req.submitted_at || req.createdAt || new Date().toISOString()
      }));
      
      console.log('Mapped requests:', mappedRequests);
      return mappedRequests;
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      return [];
    }
  };

  // ✅ Fetch leave balance from employee endpoint
  const fetchLeaveBalance = async (token: string) => {
    try {
      // ✅ Use the correct employee endpoint
      const response = await fetch(`${API_URL}/leave/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setLeaveBalance(data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
    return null;
  };

  // Helper function to fetch leave requests and update state
  const fetchLeaveRequests = async (employeeId: string, token: string) => {
    const mappedRequests = await fetchLeaveRequestsInternal(employeeId, token);
    setLeaveRequests(mappedRequests);
    
    // Also fetch leave balance from policy
    await fetchLeaveBalance(token);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userStr || !token) {
          window.location.href = '/login';
          return;
        }
        
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // ✅ Fetch available leave types from employee endpoint
        const leaveTypesData = await fetchAvailableLeaveTypes(token);
        
        let foundEmployee: any = null;
        
        // Try to find employee by userId
        if (userData._id) {
          try {
            const empResponse = await fetch(`${API_URL}/employees?userId=${userData._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const empData = await empResponse.json();
            
            if (empData.success && empData.data && empData.data.length > 0) {
              foundEmployee = empData.data[0];
            }
          } catch (err) {
            console.warn('Failed to fetch employee by userId:', err);
          }
        }
        
        // If not found, try to find by email
        if (!foundEmployee && userData.email) {
          try {
            const allEmps = await fetch(`${API_URL}/employees`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const allData = await allEmps.json();
            
            if (allData.success && allData.data) {
              foundEmployee = allData.data.find((emp: any) => 
                emp.email === userData.email
              );
            }
          } catch (err) {
            console.warn('Failed to fetch employees for matching:', err);
          }
        }
        
        if (foundEmployee) {
          setEmployee(foundEmployee);
          
          // Fetch leave requests
          const requests = await fetchLeaveRequestsInternal(foundEmployee._id, token);
          setLeaveRequests(requests);

          // Pull the authoritative balance from the backend (counts approved + pending)
          const serverBalance = await fetchLeaveBalance(token);

          // Fallback: if the server balance is unavailable, compute it client-side
          if (!serverBalance && leaveTypesData.length > 0) {
            const updatedBalance: any = {};
            leaveTypesData.forEach((type: any) => {
              updatedBalance[type.type] = { used: 0, total: type.total, remaining: type.total };
            });

            requests.forEach((request: LeaveRequest) => {
              if (request.status === 'approved' || request.status === 'pending') {
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
          console.error('No employee record not found for user:', userData);
          setMessage({ 
            text: 'Employee record not found. Please contact administrator.', 
            type: 'error' 
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ 
          text: 'Failed to load employee data. Please try again.', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token) {
        setMessage({ text: 'Session expired. Please log in again.', type: 'error' });
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }
      
      if (!employee) {
        setMessage({ text: 'Employee record not found. Please contact administrator.', type: 'error' });
        return;
      }
      
      // Validate dates
      if (!formData.startDate || !formData.endDate) {
        setMessage({ text: 'Please select start and end dates', type: 'error' });
        return;
      }
      
      // Submit leave request
      const response = await fetch(`${API_URL}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leave_type: formData.leaveType,
          start_date: formData.startDate,
          end_date: formData.endDate,
          daysRequested: formData.days,
          reason: formData.reason,
          employee_id: employee._id,
          full_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          employee_code: employee.employeeId,
          department: employee.department?.name || 'Department',
          position: employee.position || 'Employee'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Leave request submitted successfully!', type: 'success' });
        
        // Reset form
        setFormData({
          leaveType: 'annual',
          startDate: '',
          endDate: '',
          days: 1,
          reason: ''
        });
        
        // Refresh leave requests
        await fetchLeaveRequests(employee._id, token);
      } else {
        setMessage({ text: data.error?.message || 'Failed to submit request', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
      
      // Clear success message after 3 seconds
      if (message?.type === 'success') {
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'approved':
        return { color: '#12b76a', background: '#ecfdf3' };
      case 'pending':
        return { color: '#f59e0b', background: '#fffaeb' };
      case 'rejected':
        return { color: '#f04438', background: '#fef2f2' };
      default:
        return { color: '#667085', background: '#f2f4f7' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      annual: '🏖️',
      sick: '🏥',
      family: '👨‍👩‍👧',
      maternity: '👶',
      parental: '👨‍👦'
    };
    return iconMap[type] || '📅';
  };

  const getLeaveTypeLabel = (type: string) => {
    const labelMap: { [key: string]: string } = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      family: 'Family Leave',
      maternity: 'Maternity Leave',
      parental: 'Parental Leave'
    };
    return labelMap[type] || type.charAt(0).toUpperCase() + type.slice(1) + ' Leave';
  };

  const getLeaveTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      annual: '#E6A79E',
      sick: '#7DC695',
      family: '#6B96E1',
      maternity: '#8B5CF6',
      parental: '#10B981'
    };
    return colorMap[type] || '#0EA5E9';
  };

  const renderBalanceCards = () => {
    if (availableLeaveTypes.length === 0) {
      return <div style={{ fontSize: 13, color: "#667085" }}>Loading leave policies...</div>;
    }
    
    return availableLeaveTypes.map((type) => {
      const balance = leaveBalance[type.type as keyof typeof leaveBalance];
      const remaining = balance?.remaining ?? type.total;
      const total = balance?.total ?? type.total;
      const used = balance?.used ?? 0;
      const pct = total > 0 ? (used / total) * 100 : 0;
      const displayName = type.name || type.label;
      
      return (
        <div
          key={type.type}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e4e7ec",
            background: "#f9fafb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{type.icon}</span>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#344054",
                margin: 0,
              }}
            >
              {displayName}
            </p>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "#667085",
              margin: "0 0 8px",
            }}
          >
            {remaining} of {total} days remaining
          </p>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: type.color,
              }}
            />
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <SharedLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          Loading...
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <Helmet>
        <title>Leave Management | Kago HC</title>
        <meta name="description" content="Employee leave management" />
      </Helmet>

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1d2939", marginBottom: 8 }}>
            Leave Management
          </h1>
          <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>
            View your leave balance, recent requests, and submit new leave.
          </p>
        </header>

        {/* Message display */}
        {message && (
          <div style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: message.type === 'success' ? '#ecfdf3' : '#fee2e2',
            color: message.type === 'success' ? '#027a48' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message.text}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* Left: Summary */}
          <section
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e4e7ec",
              padding: 20,
              boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(230,167,158,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#E6A79E",
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1d2939",
                    margin: 0,
                  }}
                >
                  Leave Balance
                </h2>
                <p style={{ fontSize: 13, color: "#667085", margin: 0 }}>
                  Snapshot of your available days.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {renderBalanceCards()}
            </div>
          </section>

          {/* Right: Quick request + history */}
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e4e7ec",
                padding: 20,
                boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#1d2939",
                  margin: "0 0 12px",
                }}
              >
                Quick Leave Request
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#344054",
                      }}
                    >
                      Leave Type
                    </label>
                    <select
                      name="leaveType"
                      value={formData.leaveType}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                      }}
                      required
                    >
                      {availableLeaveTypes.map((type) => (
                        <option key={type.type} value={type.type}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#344054",
                      }}
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "8px 10px",
                        fontSize: 13,
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#344054",
                      }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "8px 10px",
                        fontSize: 13,
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500, color: "#344054" }}>
                      Days (auto-calculated)
                    </label>
                    <input
                      type="number"
                      name="days"
                      value={formData.days}
                      onChange={handleInputChange}
                      min={1}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "8px 10px",
                        fontSize: 13,
                        backgroundColor: "#f5f5f5",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#344054",
                    }}
                  >
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                      padding: 10,
                      fontSize: 13,
                      resize: "vertical",
                    }}
                    placeholder="Short explanation for your leave request..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    border: "none",
                    padding: "10px 20px",
                    background: "#E6A79E",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <Plus size={16} />
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e4e7ec",
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1d2939",
                    margin: 0,
                  }}
                >
                  Recent Requests
                </h2>
              </div>

              {leaveRequests.length === 0 ? (
                <p style={{ fontSize: 13, color: "#667085", textAlign: 'center', padding: '20px' }}>
                  No leave requests found.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {leaveRequests.slice(0, 5).map((request) => {
                    const statusStyle = getStatusStyle(request.status);
                    return (
                      <li
                        key={request._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid #f2f4f7",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 500,
                              color: "#1d2939",
                            }}
                          >
                            {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)} Leave
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: "#667085",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock size={12} />
                            {formatDate(request.start_date)} – {formatDate(request.end_date)} ({request.total_days} days)
                          </p>
                        </div>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "4px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: statusStyle.color,
                            background: statusStyle.background,
                          }}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </SharedLayout>
  );
};

export default EmployeeLeave;
