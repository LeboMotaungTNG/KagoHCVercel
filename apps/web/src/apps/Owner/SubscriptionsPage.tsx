import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { CreditCard } from "lucide-react";
import { C } from "../../shared/utils/employee";
import { PageHero, PerformancePage, SectionCard, perfBtnPrimary, perfBtnSecondary } from "./ownerUi";
import {
  formatMonthlyPrice,
  isActiveCompanyStatus,
  loadOwnerOrgNumbers,
  type OwnerOrgNumbers,
} from "../../shared/utils/ownerOrgNumbers";

export const SubscriptionsPage = () => {
  const [org, setOrg] = useState<OwnerOrgNumbers | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadOwnerOrgNumbers()
      .then(setOrg)
      .catch(() => setLoadError("Could not load plan details."));
  }, []);

  const active = isActiveCompanyStatus(org?.companyStatus);
  const planName = org?.planName || "Starter";
  const price = formatMonthlyPrice(org?.monthlyRand ?? 0);
  const employees = org?.employeeCount ?? 0;
  const status = org?.companyStatus || "Active";

  return (
    <PerformancePage maxWidth={900}>
      <PageHero
        icon={<CreditCard size={24} color="#fff" />}
        title="Plan"
        subtitle="The same package shown on the owner dashboard."
      />
      {loadError && (
        <p style={{ fontSize: 14, color: C.bad, marginBottom: 12 }}>{loadError}</p>
      )}
      <div className="d-flex flex-wrap gap-3 mb-3">
        <SectionCard fill title="Current Plan">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span style={{ fontWeight: 600, color: C.ink }}>{planName}</span>
            <span style={{
              width: 24, height: 24, borderRadius: "50%",
              background: active ? C.primary : "#f04438",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <FaCheck size={12} color="white" />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 6 }}>
            {price} <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>/month</span>
          </div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 8 }}>
            {employees} employees in the directory · company status {status}
          </p>
          <button type="button" style={{ ...perfBtnSecondary, color: C.bad, borderColor: C.bad }}>Cancel Subscription</button>
        </SectionCard>
        <SectionCard fill>
          <div
            style={{
              margin: -18,
              padding: 18,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 70%)`,
              color: "#fff",
              minHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Contact Us</div>
              <p className="mb-0" style={{ color: "rgba(255,255,255,0.88)", fontSize: 14 }}>
                Want to update your subscription? Please click below.
              </p>
            </div>
            <button type="button" style={perfBtnPrimary}>Upgrade</button>
          </div>
        </SectionCard>
      </div>
      <p style={{ fontSize: 14, color: C.muted }}>
        Plan name and price follow directory headcount (Starter up to 50 people, Business to 200, then Enterprise) until billing is connected.
      </p>
    </PerformancePage>
  );
};
