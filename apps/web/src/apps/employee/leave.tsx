import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Calendar, Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import SharedLayout from "./SharedLayout";

// API URL
const API_URL = 'https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1';

interface LeaveRequest {
  _id: string;
  leave_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitted_at: string;
}

interface LeaveBalance {
  annual: { used: number; total: number; remaining: number };
  sick: { used: number; total: number; remaining: number };
  family: { used: number; total: number; remaining: number };
  other: { used: number; total: number; remaining: number };
}

const EmployeeLeave: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    annual: { used: 0, total: 20, remaining: 20 },
    sick: { used: 0, total: 10, remaining: 10 },
    family: { used: 0, total: 5, remaining: 5 },
    other: { used: 0, total: 3, remaining: 3 }
  });
  
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

  // Helper function to fetch leave requests
  const fetchLeaveRequests = async (employeeId: string, token: string) => {
    const leaveResponse = await fetch(`${API_URL}/leave?employee_id=${employeeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const leaveData = await leaveResponse.json();
    
    if (leaveData.success && leaveData.data) {
      const requests = leaveData.data.data || [];
      setLeaveRequests(requests);
      setLeaveBalance(calculateLeaveBalance(requests));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userStr || !token) {
          window.location.href = '/login';
          return;
        }
        
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        let foundEmployee: any = null;
        
        // Strategy 1: Fetch current user's employee record directly
        try {
          const empResponse = await fetch(`${API_URL}/employees/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const empData = await empResponse.json();
          
          if (empData.success && empData.data) {
            foundEmployee = empData.data;
            console.log('Employee record fetched for user:', userData.email);
          }
        } catch (err) {
          console.warn('Failed to fetch employee record via /me endpoint:', err);
        }
        
        // Strategy 2: Fallback - Search by email
        if (!foundEmployee) {
          console.log('Falling back to email search for:', userData.email);
          try {
            const empResponse = await fetch(`${API_URL}/employees?search=${userData.email}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const empData = await empResponse.json();
            
            if (empData.success && empData.data?.data?.length > 0) {
              foundEmployee = empData.data.data[0];
              console.log('Employee found by email:', userData.email);
            }
          } catch (err) {
            console.warn('Email search failed:', err);
          }
        }
        
        // Strategy 3: Final fallback - Fetch all employees and match by userId
        if (!foundEmployee && userData._id) {
          console.log('Email search failed, trying by userId:', userData._id);
          try {
            const empResponse = await fetch(`${API_URL}/employees`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const empData = await empResponse.json();
            
            if (empData.success && Array.isArray(empData.data?.data)) {
              foundEmployee = empData.data.data.find((emp: any) => emp.userId === userData._id);
              if (foundEmployee) {
                console.log('Employee found by userId:', userData._id);
              }
            }
          } catch (err) {
            console.warn('UserId search failed:', err);
          }
        }
        
        if (foundEmployee) {
          setEmployee(foundEmployee);
          await fetchLeaveRequests(foundEmployee._id, token);
        } else {
          console.error('No employee record found for user:', userData);
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
    
    // Calculate days if dates change
    if (name === 'startDate' || name === 'endDate') {
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, days: diffDays }));
      }
    }
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
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
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
              {[
                { label: "Annual Leave", key: 'annual', used: leaveBalance.annual.used, total: leaveBalance.annual.total, color: "#E6A79E" },
                { label: "Sick Leave", key: 'sick', used: leaveBalance.sick.used, total: leaveBalance.sick.total, color: "#7DC695" },
                { label: "Family Leave", key: 'family', used: leaveBalance.family.used, total: leaveBalance.family.total, color: "#6B96E1" },
                { label: "Other", key: 'other', used: leaveBalance.other.used, total: leaveBalance.other.total, color: "#F4B740" },
              ].map((item) => {
                const remaining = item.total - item.used;
                const pct = (item.used / item.total) * 100;
                return (
                  <div
                    key={item.label}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #e4e7ec",
                      background: "#f9fafb",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#344054",
                        margin: "0 0 4px",
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#667085",
                        margin: "0 0 8px",
                      }}
                    >
                      {remaining} of {item.total} days remaining
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
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
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
                      <option value="annual">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="family">Family Responsibility</option>
                      <option value="other">Other</option>
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
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#344054",
                      }}
                    >
                      Days
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
                      }}
                      placeholder="e.g. 3"
                      readOnly
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
