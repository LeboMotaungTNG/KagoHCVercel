import React from "react";
import { TrendingUp, Users, Building2, Award } from "lucide-react";

export const ModernAnalyticsSection = ({ orgAnalytics }: any) => {
  const insights = [
    {
      title: "Performance Insights",
      items: [
        `${orgAnalytics?.employeeCount || 0} employees across ${orgAnalytics?.departmentCount || 0} departments`,
        `${orgAnalytics?.mostPerformingDept || "N/A"} is leading in performance metrics`,
        `${orgAnalytics?.leastPerformingDept || "N/A"} may benefit from additional support`,
        "Regular performance reviews help maintain high standards"
      ]
    },
    {
      title: "Recommendations",
      items: [
        "Schedule quarterly reviews for all departments",
        "Implement peer feedback systems",
        "Provide additional training for underperforming areas",
        "Recognize and reward top performers"
      ]
    }
  ];

  const quickStats = [
    {
      label: "Average Performance",
      value: "78%",
      icon: <TrendingUp size={16} />,
      color: "#48BB78",
      bgColor: "#F0FFF4"
    },
    {
      label: "Active Reviews",
      value: "12",
      icon: <Award size={16} />,
      color: "#3182CE",
      bgColor: "#EBF8FF"
    },
    {
      label: "Completion Rate",
      value: "94%",
      icon: <Users size={16} />,
      color: "#805AD5",
      bgColor: "#FAF5FF"
    }
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
      gap: "24px",
    }}>
      {/* Quick Stats */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "#FFF5F5",
          }}>
            <TrendingUp size={20} color="#E53E3E" />
          </div>
          <div>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#2D3748",
              margin: 0,
            }}>
              Quick Statistics
            </h3>
            <p style={{
              fontSize: "14px",
              color: "#718096",
              margin: 0,
            }}>
              Key performance indicators at a glance
            </p>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {quickStats.map((stat, index) => (
            <div key={index} style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              backgroundColor: stat.bgColor,
              borderRadius: "12px",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "white",
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "14px",
                  color: "#718096",
                  marginBottom: "2px",
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: stat.color,
                }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "#EDF2F7",
          }}>
            <Building2 size={20} color="#4A5568" />
          </div>
          <div>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#2D3748",
              margin: 0,
            }}>
              Organization Insights
            </h3>
            <p style={{
              fontSize: "14px",
              color: "#718096",
              margin: 0,
            }}>
              Key insights and actionable recommendations
            </p>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}>
          {insights.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h4 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#2D3748",
                marginBottom: "12px",
              }}>
                {section.title}
              </h4>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "8px 0",
                  }}>
                    <div style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: sectionIndex === 0 ? "#3182CE" : "#48BB78",
                      marginTop: "6px",
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: "14px",
                      color: "#4A5568",
                      lineHeight: "1.5",
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
