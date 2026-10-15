import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchProfileCompletion } from "../utils/profileVerification";
import { normalizeAppRole } from "./RequireAuth";

const RequireVerifiedProfile: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "allowed" | "blocked" | "error">("checking");
  const [error, setError] = useState("");
  let role = "";
  try { role = normalizeAppRole(JSON.parse(localStorage.getItem("user") || "{}").role); } catch { /* logged out route guard handles this */ }

  useEffect(() => {
    if (role !== "user" && role !== "employee") {
      setState("allowed");
      return;
    }
    let active = true;
    const token = localStorage.getItem("token") || "";
    fetchProfileCompletion(token).then(profile => {
      if (active) setState(profile.modulesUnlocked ? "allowed" : "blocked");
    }).catch(loadError => {
      if (!active) return;
      setError(loadError instanceof Error ? loadError.message : "Could not verify profile access.");
      setState("error");
    });
    return () => { active = false; };
  }, [role, location.pathname]);

  if (state === "checking") return <div style={{ padding: 32, textAlign: "center", color: "#667085" }}>Checking profile access…</div>;
  if (state === "blocked") return <Navigate to="/employee/profile" replace state={{ from: location.pathname }} />;
  if (state === "error") return <div role="alert" style={{ maxWidth: 560, margin: "48px auto", padding: 18, border: "1px solid #fecdca", borderRadius: 10, background: "#fef3f2", color: "#b42318" }}>{error}<button type="button" onClick={() => window.location.reload()} style={{ display: "block", marginTop: 12, padding: "8px 12px", border: 0, borderRadius: 7, background: "#b42318", color: "#fff", cursor: "pointer" }}>Retry</button></div>;
  return <>{children}</>;
};

export default RequireVerifiedProfile;
