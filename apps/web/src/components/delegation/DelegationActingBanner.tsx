import React from "react";
import { C } from "../../shared/utils/employee";
import { useDelegation } from "../../hooks/useDelegation";

const formatRole = (role: string) => role.replace(/_/g, " ");

const DelegationActingBanner: React.FC = () => {
  const { activeDelegations, fetchActiveDelegations } = useDelegation();

  React.useEffect(() => {
    fetchActiveDelegations().catch(() => undefined);
  }, [fetchActiveDelegations]);

  if (activeDelegations.length === 0) return null;

  return (
    <div style={{
      marginBottom: 16, padding: "12px 16px", borderRadius: 12,
      background: C.warnBg, border: "1px solid #f7d070", color: "#b54708", fontSize: 13,
    }}>
      <strong>Temporary delegated authority: </strong>
      {activeDelegations.map((delegation, index) => (
        <React.Fragment key={delegation._id}>
          Acting as {delegation.scope.roles.map(formatRole).join(", ")} for {delegation.delegatorName}
          {index < activeDelegations.length - 1 ? "; " : "."}
        </React.Fragment>
      ))}
    </div>
  );
};

export default DelegationActingBanner;
