import React from "react";
import { Users, Building2, Target, Briefcase, TrendingUp, TrendingDown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModernEmployeeTable } from "./ModernEmployeeTable";
import { ModernAnalyticsSection } from "./ModernAnalyticsSection";

export const OwnerOverview = () => {
  const navigate = useNavigate();

  // Mock data to match the UI visual structure
  const orgAnalytics = {
    employeeCount: 45,
    departmentCount: 6,
    mostPerformingDept: "Engineering",
    leastPerformingDept: "Sales"
  };

  const filteredEmployeesData = [
    {
      id: "1",
      firstName: "Alinah",
      lastName: "Molepo",
      email: "alinah.m@company.com",
      departmentId: { name: "Design" },
      roles: [{ type: "Employee" }]
    },
    {
      id: "2",
      firstName: "Bonolo",
      lastName: "Ponase",
      email: "bonolo.p@company.com",
      departmentId: { name: "Marketing" },
      roles: [{ type: "Employee" }]
    },
    {
      id: "3",
      firstName: "Samantha",
      lastName: "Kgare",
      email: "samantha.k@company.com",
      departmentId: { name: "Design" },
      roles: [{ type: "Intern" }]
    }
  ];

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      padding: "32px",
      backgroundColor: "#f9f7f5",
      maxWidth: "1400px",
      margin: "0 auto",
      borderRadius: "8px",
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontSize: "32px",
          margin: "0 0 8px 0",
          fontWeight: "700",
          color: "#2D3748",
          letterSpacing: "-0.5px"
        }}>
          Owner Overview
        </h1>
        <p style={{
          fontSize: "16px",
          color: "#718096",
          margin: 0,
        }}>
          Comprehensive view of your organization's structure and performance
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "32px",
      }}>
        {/* Total Employees */}
        <div style={{
          backgroundColor: "#3182CE",
          borderRadius: "16px",
          padding: "24px",
          color: "white",
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.12)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}>
            <div>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "500",
                margin: "0 0 8px 0",
                opacity: 0.9,
              }}>
                Total Employees
              </h3>
              <p style={{
                fontSize: "36px",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1",
              }}>
                {orgAnalytics?.employeeCount || 0}
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
            }}>
              <Users size={24} />
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.2)",
            padding: "6px 12px",
            borderRadius: "16px",
            alignSelf: "flex-start",
            fontSize: "14px",
            fontWeight: "500",
            display: "inline-block"
          }}>
            Across all departments
          </div>
        </div>

        {/* Total Departments */}
        <div style={{
          backgroundColor: "#805AD5",
          borderRadius: "16px",
          padding: "24px",
          color: "white",
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.12)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}>
            <div>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "500",
                margin: "0 0 8px 0",
                opacity: 0.9,
              }}>
                Departments
              </h3>
              <p style={{
                fontSize: "36px",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1",
              }}>
                {orgAnalytics?.departmentCount || 0}
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
            }}>
              <Building2 size={24} />
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.2)",
            padding: "6px 12px",
            borderRadius: "16px",
            alignSelf: "flex-start",
            fontSize: "14px",
            fontWeight: "500",
            display: "inline-block"
          }}>
            Organization structure
          </div>
        </div>

        {/* Top Department */}
        <div style={{
          backgroundColor: "#48BB78",
          borderRadius: "16px",
          padding: "24px",
          color: "white",
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.12)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}>
            <div>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "500",
                margin: "0 0 8px 0",
                opacity: 0.9,
              }}>
                Top Department
              </h3>
              <p style={{
                fontSize: "24px",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1.2",
              }}>
                {orgAnalytics?.mostPerformingDept || "N/A"}
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
            }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.2)",
            padding: "6px 12px",
            borderRadius: "16px",
            alignSelf: "flex-start",
            fontSize: "14px",
            fontWeight: "500",
            display: "inline-block"
          }}>
            Best performing
          </div>
        </div>

        {/* Needs Attention */}
        <div style={{
          backgroundColor: "#F687B3",
          borderRadius: "16px",
          padding: "24px",
          color: "white",
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.12)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}>
            <div>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "500",
                margin: "0 0 8px 0",
                opacity: 0.9,
              }}>
                Needs Attention
              </h3>
              <p style={{
                fontSize: "24px",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1.2",
              }}>
                {orgAnalytics?.leastPerformingDept || "N/A"}
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
            }}>
              <TrendingDown size={24} />
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.2)",
            padding: "6px 12px",
            borderRadius: "16px",
            alignSelf: "flex-start",
            fontSize: "14px",
            fontWeight: "500",
            display: "inline-block"
          }}>
            Requires support
          </div>
        </div>
      </div>

      {/* Employee Table Section */}
      <ModernEmployeeTable
        Navigate={navigate}
        filteredEmployeesData={filteredEmployeesData}
      />

      {/* Analytics Section */}
      <ModernAnalyticsSection orgAnalytics={orgAnalytics} />
    </div>
  );
};
