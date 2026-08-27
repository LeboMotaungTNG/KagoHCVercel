import React from "react";
import SharedLayout from "./SharedLayout";
import { useEmployeeData } from "../../shared/utils/employee";
import EmployeeDashboardBody from "../employee/EmployeeDashboardBody";

const ManagerEmployeeDashboard: React.FC = () => {
  const {
    user, today, stats, balances, activeLeave, recentLeaves, teamOnLeave, birthdays, colleagues,
    loading, error, clockIn, clockOut,
  } = useEmployeeData();

  return (
    <SharedLayout>
      <EmployeeDashboardBody
        mode="manager"
        user={user}
        today={today}
        stats={stats}
        balances={balances}
        activeLeave={activeLeave}
        recentLeaves={recentLeaves}
        teamOnLeave={teamOnLeave}
        birthdays={birthdays}
        colleagues={colleagues}
        loading={loading}
        error={error}
        clockIn={clockIn}
        clockOut={clockOut}
      />
    </SharedLayout>
  );
};

export default ManagerEmployeeDashboard;
