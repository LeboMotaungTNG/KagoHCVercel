import React, { useEffect, useState } from "react";
import { useDelegation } from "../../hooks/useDelegation";
import { useEmployees } from "../../hooks/useEmployees";
import { C } from "../../shared/utils/employee";
import { INPUT, PrimaryButton, GhostButton } from "../../shared/components/overtimeUi";

interface DelegationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6 };

const DelegationForm: React.FC<DelegationFormProps> = ({ onSuccess, onCancel }) => {
  const { createDelegation, loading } = useDelegation();
  const { employees, fetchEmployees } = useEmployees();
  const [formData, setFormData] = useState({
    delegateId: "",
    delegateName: "",
    delegateEmail: "",
    startDate: "",
    endDate: "",
    reason: "",
    scope: {
      roles: ["hr_manager"] as string[],
      leaveTypes: ["annual", "sick", "compassionate"] as string[],
    },
  });

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleDelegateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const delegateId = event.target.value;
    const delegate = employees.find((emp: any) => emp._id === delegateId || emp.id === delegateId);
    if (!delegate) {
      setFormData((current) => ({ ...current, delegateId: "", delegateName: "", delegateEmail: "" }));
      return;
    }
    setFormData((current) => ({
      ...current,
      delegateId: delegate._id || delegate.id,
      delegateName: `${delegate.firstName || ""} ${delegate.lastName || ""}`.trim(),
      delegateEmail: delegate.email || "",
    }));
  };

  const toggleScope = (type: "roles" | "leaveTypes", value: string) => {
    setFormData((current) => {
      const list = current.scope[type];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, scope: { ...current.scope, [type]: next } };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.delegateId || !formData.startDate || !formData.endDate) return;
    try {
      await createDelegation({
        delegateId: formData.delegateId,
        delegateName: formData.delegateName,
        delegateEmail: formData.delegateEmail,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        scope: formData.scope,
        reason: formData.reason || undefined,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create delegation:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: C.ink }}>Create delegation</h3>
      <div style={{ display: "grid", gap: 16 }}>
        <label>
          <span style={labelStyle}>Delegate (acting manager)</span>
          <select value={formData.delegateId} onChange={handleDelegateChange} required style={INPUT}>
            <option value="">Select a delegate...</option>
            {employees.map((emp: any) => (
              <option key={emp._id || emp.id} value={emp._id || emp.id}>
                {emp.firstName} {emp.lastName} ({emp.email})
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            <span style={labelStyle}>Start</span>
            <input type="datetime-local" value={formData.startDate} required
              onChange={(e) => setFormData((current) => ({ ...current, startDate: e.target.value }))} style={INPUT} />
          </label>
          <label>
            <span style={labelStyle}>End</span>
            <input type="datetime-local" value={formData.endDate} required
              onChange={(e) => setFormData((current) => ({ ...current, endDate: e.target.value }))} style={INPUT} />
          </label>
        </div>
        <label>
          <span style={labelStyle}>Reason</span>
          <textarea
            rows={3}
            value={formData.reason}
            placeholder="Why are you delegating authority?"
            onChange={(e) => setFormData((current) => ({ ...current, reason: e.target.value }))}
            style={{ ...INPUT, height: "auto", padding: 12, resize: "vertical" }}
          />
        </label>
        <div>
          <span style={labelStyle}>Roles</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["hr_manager", "line_manager", "payroll_officer"].map((role) => (
              <label key={role} style={{ display: "inline-flex", gap: 6, fontSize: 13, color: C.text, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.scope.roles.includes(role)} onChange={() => toggleScope("roles", role)} />
                {role.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        </div>
        <div>
          <span style={labelStyle}>Leave types</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["annual", "sick", "compassionate", "family_responsibility"].map((type) => (
              <label key={type} style={{ display: "inline-flex", gap: 6, fontSize: 13, color: C.text, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.scope.leaveTypes.includes(type)} onChange={() => toggleScope("leaveTypes", type)} />
                {type.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <GhostButton type="button" onClick={onCancel} style={{ padding: "8px 16px", fontSize: 14 }}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={loading}>{loading ? "Creating..." : "Create delegation"}</PrimaryButton>
        </div>
      </div>
    </form>
  );
};

export default DelegationForm;
