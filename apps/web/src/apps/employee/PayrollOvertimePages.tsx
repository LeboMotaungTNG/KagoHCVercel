import React from "react";
import SharedLayout from "./SharedLayout";
import { OvertimeApprovalsContent } from "../Manager/OvertimeApprovalsPage";
import { TeamOvertimeContent } from "../Manager/TeamOvertimePage";

export const PayrollOvertimeApprovalsPage: React.FC = () => (
  <SharedLayout title="Overtime Approvals">
    <OvertimeApprovalsContent />
  </SharedLayout>
);

export const PayrollTeamOvertimePage: React.FC = () => (
  <SharedLayout title="Team Overtime">
    <TeamOvertimeContent />
  </SharedLayout>
);
