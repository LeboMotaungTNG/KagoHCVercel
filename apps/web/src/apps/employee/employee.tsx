import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Users, Calendar, Folder, ChevronRight,
  Award, Target, Clock,
  FileText, TrendingUp, MapPin, Mail, Phone,
} from "lucide-react";
import SharedLayout from "./SharedLayout";

// --- Utils ---
const getGreeting = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "Good Morning";
  if (currentHour >= 12 && currentHour < 18) return "Good Day";
  return "Good Evening";
};

const getMonthYear = (date = new Date()) => {
  const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

// --- Dashboard Header ---
const DashboardHeader = ({ firstName, todayDate }: { firstName: string; todayDate: string }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
      <div>
        <h1 style={{ fontSize: "32px", margin: "0 0 10px 0", fontWeight: "bold" }}>
          {getGreeting()}, {firstName}
        </h1>
        <p style={{ fontSize: "18px", color: "#666", margin: 0 }}>
          Welcome back! Here's an overview of your work summary and key information.
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ padding: "10px 15px", border: "none", borderRadius: "25px", backgroundColor: "#6b97e2", color: "white", fontSize: "14px", fontWeight: "bold" }}>
          {todayDate}
        </div>
      </div>
    </div>
  );
};

// --- Metrics Cards ---
const MetricsCards = () => {
  const cards = [
    { title: "Attendance Rate", count: "98%", color: "#E6A79E", icon: <Clock size={24} color="white" /> },
    { title: "Leave Balance", count: "15 days", color: "#7DC695", icon: <Calendar size={24} color="white" /> },
    { title: "Tasks Completed", count: "24/30", color: "#6B96E1", icon: <Target size={24} color="white" /> },
    { title: "Performance", count: "92%", color: "#F096C3", icon: <TrendingUp size={24} color="white" /> }
  ];

  return (
    <div style={{ display: "flex", gap: "20px", marginBottom: "40px", flexWrap: "wrap" }}>
      {cards.map((card, index) => (
        <div
          key={`item-${index}`}
          style={{ 
            flex: "1", 
            backgroundColor: card.color, 
            borderRadius: "12px", 
            padding: "20px", 
            minWidth: "200px", 
            color: "white", 
            cursor: "pointer", 
            transition: "transform 0.2s" 
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "18px" }}>{card.title}</span>
            {card.icon}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontSize: "42px", fontWeight: "bold" }}>{card.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Profile Summary Card ---
const ProfileSummaryCard = ({
  avatarInitials,
  fullName,
  position,
  locationText,
  email,
}: {
  avatarInitials: string;
  fullName: string;
  position: string;
  locationText: string;
  email: string;
}) => {
  return (
    <div style={{ 
      flex: "1", 
      backgroundColor: "white", 
      borderRadius: "12px", 
      padding: "24px", 
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(230,167,158,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#E6A79E",
          }}><Users size={20} /></div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1d2939", margin: 0 }}>Profile Summary</h3>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#ecfdf3", color: "#027a48",
          borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#12b76a" }} />Active
        </span>
      </div>
      
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#e4e7ec,#f2f4f7)",
          border: "3px solid #E6A79E",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 28, color: "#1d2939",
          boxShadow: "0 0 0 4px rgba(230,167,158,0.15)",
        }}>
          {avatarInitials}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 20, fontWeight: 700, color: "#1d2939", margin: "0 0 4px" }}>{fullName}</h4>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#666", margin: "0 0 16px" }}>{position}</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: 14, color: "#666" }}>
              <MapPin size={16} color="#E6A79E" />
              <span>{locationText}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: 14, color: "#666" }}>
              <Mail size={16} color="#E6A79E" />
              <span>{email}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: 14, color: "#666" }}>
              <Phone size={16} color="#E6A79E" />
              <span>+27 72 123 4567</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: 14, color: "#666" }}>
              <Calendar size={16} color="#E6A79E" />
              <span>Joined Jan 2024</span>
            </div>
          </div>
          
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20,
            padding: "8px 24px", borderRadius: 25,
            background: "#E6A79E", color: "#fff",
            fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer"
          }}>
            View Full Profile <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Attendance Card ---
const AttendanceCard = () => {
  return (
    <div style={{ 
      flex: "1", 
      backgroundColor: "white", 
      borderRadius: "12px", 
      padding: "24px", 
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(125,198,149,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#7DC695",
          }}><Clock size={20} /></div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1d2939", margin: 0 }}>Attendance Today</h3>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#f2f4f7", color: "#344054",
          borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#666" }} />Not Clocked In
        </span>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        background: "#f9fafb", borderRadius: 10,
        border: "1px solid #f0f2f5",
        padding: 20, marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", color: "#666", marginBottom: 8 }}>
            Clock In
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#1d2939" }}>--:--</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", color: "#666", marginBottom: 8 }}>
            Hours Worked
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#1d2939" }}>0h 00m</div>
        </div>
      </div>

      <button style={{
        width: "100%", padding: "14px 0", borderRadius: 25,
        border: "none", background: "#7DC695", color: "#fff",
        fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <Clock size={18} />
        Clock In
      </button>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#f9fafb", borderRadius: 10, padding: "12px 16px"
      }}>
        <span style={{ color: "#666", fontSize: 14 }}>Weekly hours</span>
        <span style={{ fontWeight: 600, color: "#1d2939" }}>32h 30m / 40h</span>
      </div>
    </div>
  );
};

// --- Leave Overview Card ---
const LeaveOverviewCard = () => {
  const leaveTypes = [
    { type: "Annual Leave", used: 12, total: 20, color: "#E6A79E" },
    { type: "Sick Leave", used: 3, total: 10, color: "#7DC695" },
    { type: "Family Leave", used: 2, total: 5, color: "#6B96E1" },
  ];

  return (
    <div style={{ 
      backgroundColor: "white", 
      borderRadius: "12px", 
      padding: "20px", 
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(230,167,158,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#E6A79E",
          }}><Calendar size={18} /></div>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", margin: 0 }}>Leave Overview</h4>
        </div>
        <button style={{
          fontSize: 12, fontWeight: 600, color: "#E6A79E", 
          border: "1px solid rgba(230,167,158,0.4)", 
          borderRadius: 20, padding: "4px 12px", 
          background: "none", cursor: "pointer"
        }}>
          Request <ChevronRight size={12} style={{ marginLeft: 4 }} />
        </button>
      </div>

      {leaveTypes.map((leave, index) => (
        <div key={`item-${index}`} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1d2939" }}>{leave.type}</span>
            <span style={{ fontSize: 14, color: leave.color, fontWeight: 600 }}>
              {leave.total - leave.used} days left
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 4 }}>
            <span>{leave.used} used</span>
            <span>{leave.total} total</span>
          </div>
          <div style={{ height: 6, background: "#f0f2f5", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ 
              width: `${(leave.used / leave.total) * 100}%`, 
              height: "100%", 
              background: leave.color,
              borderRadius: 3 
            }} />
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: 12, padding: "12px", background: "#f9fafb", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#666" }}>Next available:</span>
          <span style={{ fontWeight: 600, color: "#1d2939" }}>15 June 2026</span>
        </div>
      </div>
    </div>
  );
};

// --- Payroll Summary Card ---
const PayrollSummaryCard = () => {
  return (
    <div style={{ 
      backgroundColor: "white", 
      borderRadius: "12px", 
      padding: "20px", 
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(125,198,149,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#7DC695",
          }}><Folder size={18} /></div>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", margin: 0 }}>Payroll Summary</h4>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "#ecfdf3", color: "#027a48",
          borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600,
        }}>
          <Award size={12} />
          Up to date
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: "#666" }}>Last payslip</span>
          <span style={{ fontWeight: 600, color: "#1d2939" }}>March 2026</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#666" }}>Net salary</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#1d2939" }}>R 30,000</span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: "#666" }}>YTD Earnings</span>
          <span style={{ fontWeight: 600, color: "#1d2939" }}>R 90,000</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#666" }}>Next pay date</span>
          <span style={{ fontWeight: 600, color: "#1d2939" }}>25 April 2026</span>
        </div>
      </div>

      <button style={{
        width: "100%", padding: "12px 0", borderRadius: 25,
        border: "1px solid #7DC695", background: "transparent", 
        color: "#7DC695", fontSize: 14, fontWeight: 600, cursor: "pointer"
      }}>
        View Payslips
      </button>
    </div>
  );
};

// --- Performance Highlights Card ---
const PerformanceHighlightsCard = () => {
  const highlights = [
    { text: "Completed 95% of assigned tasks last month.", icon: "check", color: "#7DC695" },
    { text: "Zero late arrivals in the last 30 days.", icon: "check", color: "#7DC695" },
    { text: "Upcoming performance review scheduled for next quarter.", icon: "info", color: "#6B96E1" },
    { text: "Recognition: 'Employee of the Month' - February 2026", icon: "award", color: "#E6A79E" },
  ];

  return (
    <div style={{ 
      backgroundColor: "white", 
      borderRadius: "12px", 
      padding: "20px", 
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "rgba(107,150,225,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#6B96E1",
        }}><TrendingUp size={18} /></div>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", margin: 0 }}>Performance Highlights</h4>
      </div>

      {highlights.map((item, index) => (
        <div key={`item-${index}`} style={{ 
          display: "flex", gap: 12, marginBottom: 16, 
          padding: "8px 0", borderBottom: index < highlights.length - 1 ? "1px solid #f0f2f5" : "none"
        }}>
          {item.icon === "check" && <Award size={18} color={item.color} style={{ flexShrink: 0, marginTop: 2 }} />}
          {item.icon === "info" && <FileText size={18} color={item.color} style={{ flexShrink: 0, marginTop: 2 }} />}
          {item.icon === "award" && <Award size={18} color={item.color} style={{ flexShrink: 0, marginTop: 2 }} />}
          <span style={{ fontSize: 14, color: "#344054", lineHeight: 1.5 }}>{item.text}</span>
        </div>
      ))}

      <div style={{ marginTop: 16, padding: "12px", background: "#f9fafb", borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#666" }}>Current KPI Score</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#6B96E1" }}>92%</span>
        </div>
        <div style={{ height: 6, background: "#f0f2f5", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: "92%", height: "100%", background: "#6B96E1", borderRadius: 3 }} />
        </div>
      </div>

      <button style={{
        width: "100%", padding: "12px 0", borderRadius: 25,
        border: "none", background: "#f0f2f5", color: "#666",
        fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16
      }}>
        View Full Report
      </button>
    </div>
  );
};

const EmployeeDashboard = () => {
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; email?: string; department?: string; position?: string; } | null>(null);
  const todayDate = getMonthYear(new Date());

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, []);

  const firstName = user?.firstName || "Sarah";
  const fullName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Sarah Johnson";
  const email = user?.email || "sarah.j@kago.com";
  const position = user?.position || "Senior Software Engineer";
  const location = user?.department || "Johannesburg, SA";
  const avatarInitials = user?.firstName || user?.lastName ? `${(user?.firstName?.[0] || "").toUpperCase()}${(user?.lastName?.[0] || "").toUpperCase()}` : "E";

  return (
    <SharedLayout>
      <Helmet>
        <title>Employee Dashboard | Kago HC</title>
        <meta name="description" content="Kago HC Employee Portal" />
      </Helmet>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <DashboardHeader firstName={firstName} todayDate={todayDate} />

        <MetricsCards />

        {/* Profile and Attendance Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <ProfileSummaryCard
          avatarInitials={avatarInitials}
          fullName={fullName}
          position={position}
          locationText={location}
          email={email}
        />
          <AttendanceCard />
        </div>

        {/* Leave, Payroll, Performance Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <LeaveOverviewCard />
          <PayrollSummaryCard />
          <PerformanceHighlightsCard />
        </div>
      </div>
    </SharedLayout>
  );
};

export default EmployeeDashboard;

