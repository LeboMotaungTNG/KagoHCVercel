import React from "react";
import SharedLayout from "./SharedLayout";
import EmployeeAttendance from "../employee/attendance";

const ManagerMyAttendance: React.FC = () => (
  <SharedLayout title="My Attendance">
    <EmployeeAttendance embedded />
  </SharedLayout>
);

export default ManagerMyAttendance;
