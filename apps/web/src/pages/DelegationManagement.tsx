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
import { FilterTabs } from "../apps/Manager/managerUi";
import { ShieldCheck } from "lucide-react";

const DelegationManagement: React.FC = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"delegations" | "audit">("delegations");
  const normalizedRole = normalizeAppRole(user?.role || "");
  const canCreateDelegation = ["owner", "admin", "hr", "manager", "line_manager"].includes(normalizedRole);

  const content = (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        icon={<ShieldCheck size={24} color="#fff" />}
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

      <div className="mb-4">
        <FilterTabs
          tabs={[
            { key: "delegations", label: "Delegations" },
            { key: "audit", label: "Audit trail" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
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
