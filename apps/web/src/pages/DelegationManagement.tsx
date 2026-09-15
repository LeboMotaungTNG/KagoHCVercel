import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { normalizeAppRole } from "../shared/components/RequireAuth";
import ManagerLayout from "../apps/Manager/SharedLayout";
import OwnerLayout from "../apps/Owner/SharedLayout";
import DelegationForm from "../components/delegation/DelegationForm";
import DelegationList from "../components/delegation/DelegationList";
import DelegationAuditTrail from "../components/delegation/DelegationAuditTrail";
import { CARD, PageHeader, PrimaryButton } from "../shared/components/overtimeUi";
import { C } from "../shared/utils/employee";

const DelegationManagement: React.FC = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"delegations" | "audit">("delegations");
  const normalizedRole = normalizeAppRole(user?.role || "");
  const canCreateDelegation = ["owner", "admin", "hr", "manager", "line_manager"].includes(normalizedRole);

  const content = (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Delegations"
        subtitle="Hand off approval authority when you are away"
        right={canCreateDelegation ? (
          <PrimaryButton onClick={() => setShowForm((current) => !current)}>
            <Plus size={16} style={{ marginRight: 6 }} />
            {showForm ? "Cancel" : "New delegation"}
          </PrimaryButton>
        ) : undefined}
      />

      <div style={{ ...CARD, marginBottom: 20, padding: 20 }}>
        <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
          When you are on leave or out of office, delegate approval authority to another manager.
          They can approve or reject leave requests on your behalf for the dates you choose.
        </p>
      </div>

      {showForm && canCreateDelegation && (
        <div style={{ ...CARD, marginBottom: 20 }}>
          <DelegationForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {([
          { id: "delegations", label: "Delegations" },
          { id: "audit", label: "Audit trail" },
        ] as const).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                border: "none",
                background: active ? C.primaryBg : "#f2f4f7",
                color: active ? C.primaryDark : C.muted,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "delegations" ? <DelegationList /> : <DelegationAuditTrail />}
    </div>
  );

  if (normalizedRole === "owner") {
    return <OwnerLayout>{content}</OwnerLayout>;
  }
  return <ManagerLayout title="Delegations">{content}</ManagerLayout>;
};

export default DelegationManagement;
