import React from "react";
import { Eye, User } from "lucide-react";
import { C, R, SHADOW } from "../../shared/utils/employee";

export const ModernEmployeeTable = ({ Navigate, filteredEmployeesData }: any) => {
  const toggleAction = (id: string) => {
    Navigate(`/owner/employee/${id}`);
  };

  const tableHeaderStyle: React.CSSProperties = {
    padding: "16px 24px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: C.muted,
    textAlign: "left",
    borderBottom: `1px solid ${C.line}`,
  };

  const tableCellStyle: React.CSSProperties = {
    padding: "16px 24px",
    fontSize: "14px",
    color: C.ink,
    borderBottom: `1px solid ${C.line}`,
  };

  const actionButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: C.primaryBg,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  return (
    <div style={{
      backgroundColor: C.surface,
      borderRadius: R.xl,
      boxShadow: SHADOW,
      border: `1px solid ${C.line}`,
      marginBottom: "32px",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "24px",
        borderBottom: `1px solid ${C.line}`,
      }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: "600",
          color: C.ink,
          margin: 0,
        }}>
          Employee Performance Overview
        </h2>
        <p style={{
          fontSize: "14px",
          color: C.muted,
          margin: "4px 0 0 0",
        }}>
          Track individual employee performance and metrics
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
        }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Employee</th>
              <th style={tableHeaderStyle}>Department</th>
              <th style={tableHeaderStyle}>Role</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployeesData?.length > 0 ? (
              filteredEmployeesData.map((employee: any, index: number) => (
                <tr key={employee?.id || index} style={{
                  transition: "background-color 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#F7FAFC";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}>
                  <td style={tableCellStyle}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: employee?.photo ? "transparent" : C.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}>
                        {employee?.photo ? (
                          <img
                            src={employee.photo}
                            alt="employee"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <User size={20} color="white" />
                        )}
                      </div>
                      <div>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#2D3748",
                          marginBottom: "2px",
                        }}>
                          {employee?.firstName} {employee?.lastName}
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#718096",
                        }}>
                          {employee?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      backgroundColor: "#EBF4FF",
                      color: "#3182CE",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}>
                      {employee?.departmentId?.name || "Unassigned"}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      backgroundColor: "#F0FFF4",
                      color: "#38A169",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}>
                      {employee?.roles?.[0]?.type || "No Role"}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <button
                      style={actionButtonStyle}
                      onClick={() => toggleAction(employee?.id)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#3182CE";
                        (e.currentTarget.querySelector('svg') as any).style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#EBF8FF";
                        (e.currentTarget.querySelector('svg') as any).style.color = "#3182CE";
                      }}
                    >
                      <Eye size={16} color="#3182CE" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{
                  ...tableCellStyle,
                  textAlign: "center",
                  padding: "48px 24px",
                  color: "#718096",
                }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                    <User size={48} color="#CBD5E0" />
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>
                        No employees found
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
