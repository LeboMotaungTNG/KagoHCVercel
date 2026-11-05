import React from "react";
import SharedLayout from "./SharedLayout";
import EmployeeLeave from "../employee/leave";

const ManagerMyLeave: React.FC = () => (
  <SharedLayout title="My Leave">
    <EmployeeLeave embedded />
  </SharedLayout>
);

export default ManagerMyLeave;
