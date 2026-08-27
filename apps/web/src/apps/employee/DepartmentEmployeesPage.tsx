import React, { useEffect, useState } from "react";
import { Alert } from "reactstrap";
import SharedLayout from "./SharedLayout";
import { EmployeesContent } from "../Manager/EmployeesPage";
import { resolveCurrentEmployee } from "./src/utils/resolveEmployee";
import { API_URL } from "../../shared/utils/employee";

interface StoredUser {
  _id?: string;
  id?: string;
  email?: string;
  department?: string | { name?: string };
  departmentName?: string;
}

interface EmployeeRecord {
  email?: string;
  userId?: string | { _id?: string; id?: string };
  department?: string | { name?: string };
  departmentName?: string;
  employment_details?: { department?: string | { name?: string } };
}

const getDepartmentName = (user: StoredUser): string => {
  if (typeof user.department === "string") return user.department.trim();
  return user.department?.name?.trim() || user.departmentName?.trim() || "";
};

const getEmployeeDepartment = (employee: EmployeeRecord): string => {
  if (typeof employee.department === "string") return employee.department.trim();
  return employee.department?.name?.trim()
    || employee.departmentName?.trim()
    || (typeof employee.employment_details?.department === "string"
      ? employee.employment_details.department.trim()
      : employee.employment_details?.department?.name?.trim())
    || "";
};

const getEmployeeList = (body: any): EmployeeRecord[] => {
  const payload = body?.data && !Array.isArray(body.data) ? body.data : body;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.employees)) return payload.employees;
  if (Array.isArray(payload)) return payload;
  return [];
};

const DepartmentEmployeesPage: React.FC = () => {
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDepartment = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}") as StoredUser;
        const storedDepartment = getDepartmentName(user);
        if (storedDepartment) {
          if (!cancelled) setDepartment(storedDepartment);
          return;
        }

        const employee = await resolveCurrentEmployee();
        if (employee?.department) {
          if (!cancelled) setDepartment(employee.department);
          return;
        }

        // Some line-manager accounts are User records without an Employee
        // document. Use the authenticated directory as a department fallback.
        const response = await fetch(`${API_URL}/employees`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        });
        if (!response.ok) throw new Error("Could not load department employees");
        const records = getEmployeeList(await response.json());
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}") as StoredUser;
        const userId = String(storedUser._id || storedUser.id || "");
        const linked = records.find((record) => {
          const linkedId = typeof record.userId === "object" ? record.userId?._id || record.userId?.id : record.userId;
          return (record.email || "").toLowerCase() === (storedUser.email || "").toLowerCase()
            || String(linkedId || "") === userId;
        });
        const linkedDepartment = linked ? getEmployeeDepartment(linked) : "";
        const departments = [...new Set(records.map(getEmployeeDepartment).filter(Boolean))];
        if (!cancelled) setDepartment(linkedDepartment || (departments.length === 1 ? departments[0] : ""));
      } catch {
        if (!cancelled) setDepartment("");
      }
    };

    loadDepartment();
    return () => { cancelled = true; };
  }, []);

  return (
    <SharedLayout title="My Department">
      {department === null ? null : department ? (
        <EmployeesContent departmentOnly={department} readOnly />
      ) : (
        <Alert color="warning">
          Your account is not linked to a department. Ask an administrator to update your profile.
        </Alert>
      )}
    </SharedLayout>
  );
};

export default DepartmentEmployeesPage;
