/**
 * AcceptInvitePage.tsx
 * Location: apps/web/src/apps/Platform/AcceptInvitePage.tsx
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logoKago from "../../assets/images/kago-logo.png";

import { API_BASE } from "../../shared/utils/apiBase";
const API = API_BASE;
const BRAND = "#E6A79E";

// ─── Password strength ────────────────────────────────────────────────────────
function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || /\d/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Strong"];
  return { score, label: labels[score] };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

// ─── Inline style helpers (typed explicitly to satisfy React.CSSProperties) ──
const css = {
  page: (): React.CSSProperties => ({
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f9f7f5 0%, #f0ebe8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "inherit",
  }),
  card: (): React.CSSProperties => ({
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(16,24,40,0.10)",
    border: "1px solid #e4e7ec",
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
  }),
  logo: (): React.CSSProperties => ({
    width: 90,
    objectFit: "contain",
    marginBottom: 28,
  }),
  heading: (): React.CSSProperties => ({
    fontSize: 22,
    fontWeight: 700,
    color: "#1d2939",
    margin: "0 0 6px",
  }),
  sub: (): React.CSSProperties => ({
    fontSize: 13,
    color: "#667085",
    margin: "0 0 28px",
    lineHeight: 1.6,
  }),
  label: (): React.CSSProperties => ({
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#344054",
    marginBottom: 5,
  }),
  input: (hasError = false): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${hasError ? "#f04438" : "#d0d5dd"}`,
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    color: "#1d2939",
  }),
  inputWithPad: (hasError = false): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    paddingRight: 40,
    border: `1px solid ${hasError ? "#f04438" : "#d0d5dd"}`,
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    color: "#1d2939",
  }),
  fieldGroup: (): React.CSSProperties => ({ marginBottom: 16 }),
  fieldError: (): React.CSSProperties => ({ fontSize: 11, color: "#f04438", marginTop: 4 }),
  btn: (disabled = false): React.CSSProperties => ({
    width: "100%",
    padding: "11px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    background: disabled ? "#e4e7ec" : BRAND,
    color: disabled ? "#98a2b3" : "#fff",
    marginTop: 8,
  }),
  notice: (type: "error" | "success" | "warn"): React.CSSProperties => ({
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
    background: type === "error" ? "#fee2e2" : type === "success" ? "#ecfdf3" : "#fffaeb",
    border: `1px solid ${type === "error" ? "#fca5a5" : type === "success" ? "#abefc6" : "#fedf89"}`,
    color: type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#92400e",
  }),
  divider: (): React.CSSProperties => ({
    height: 1,
    background: "#f2f4f7",
    margin: "24px 0",
  }),
  footer: (): React.CSSProperties => ({
    textAlign: "center",
    fontSize: 12,
    color: "#98a2b3",
    marginTop: 24,
  }),
  strengthBar: (score: number, i: number): React.CSSProperties => ({
    height: 4,
    borderRadius: 2,
    flex: 1,
    background:
      score === 0 || score < i ? "#e4e7ec"
      : score === 1 ? "#f04438"
      : score === 2 ? "#f79009"
      : "#12b76a",
    transition: "background 0.2s",
  }),
  eyeBtn: (): React.CSSProperties => ({
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#667085",
    display: "flex",
    alignItems: "center",
  }),
  successCenter: (): React.CSSProperties => ({
    textAlign: "center",
    padding: "20px 0",
  }),
  successSubText: (): React.CSSProperties => ({
    fontSize: 13,
    color: "#667085",
    margin: "0",
    textAlign: "center",
    lineHeight: 1.6,
  }),
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AcceptInvitePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ firstName: "", lastName: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = passwordStrength(form.password);

  useEffect(() => {
    if (!token) setServerError("No invite token found. Make sure you opened the full invite link.");
  }, [token]);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
    setServerError("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch(`${API}/auth/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setSuccess(true);
        setTimeout(() => navigate("/owner"), 2000);
      } else {
        setServerError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={css.page()}>
      <div style={css.card()}>
        <img src={logoKago} alt="Kago Human Capital" style={css.logo()} />

        {success ? (
          <div style={css.successCenter()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={css.heading()}>Account created!</h2>
            <p style={css.successSubText()}>
              Welcome aboard. Redirecting you to your dashboard...
            </p>
          </div>
        ) : (
          <>
            <h1 style={css.heading()}>Set up your account</h1>
            <p style={css.sub()}>
              You've been invited to manage a company on Kago Human Capital.
              Set your name and password to get started.
            </p>

            {serverError && <div style={css.notice("error")}>{serverError}</div>}

            {/* First name */}
            <div style={css.fieldGroup()}>
              <label style={css.label()}>
                First name <span style={{ color: "#f04438" }}>*</span>
              </label>
              <input
                style={css.input(!!errors.firstName)}
                placeholder="John"
                value={form.firstName}
                onChange={upd("firstName")}
                disabled={submitting || !token}
              />
              {errors.firstName && <p style={css.fieldError()}>{errors.firstName}</p>}
            </div>

            {/* Last name */}
            <div style={css.fieldGroup()}>
              <label style={css.label()}>
                Last name <span style={{ color: "#f04438" }}>*</span>
              </label>
              <input
                style={css.input(!!errors.lastName)}
                placeholder="Smith"
                value={form.lastName}
                onChange={upd("lastName")}
                disabled={submitting || !token}
              />
              {errors.lastName && <p style={css.fieldError()}>{errors.lastName}</p>}
            </div>

            <div style={css.divider()} />

            {/* Password */}
            <div style={css.fieldGroup()}>
              <label style={css.label()}>
                Password <span style={{ color: "#f04438" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  style={css.inputWithPad(!!errors.password)}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={upd("password")}
                  disabled={submitting || !token}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} style={css.eyeBtn()}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && <p style={css.fieldError()}>{errors.password}</p>}
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={css.strengthBar(strength.score, i)} />
                    ))}
                  </div>
                  {strength.label && (
                    <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>
                      Password strength: {strength.label}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={css.fieldGroup()}>
              <label style={css.label()}>
                Confirm password <span style={{ color: "#f04438" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  style={css.inputWithPad(!!errors.confirmPassword)}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={upd("confirmPassword")}
                  disabled={submitting || !token}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} style={css.eyeBtn()}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {errors.confirmPassword && <p style={css.fieldError()}>{errors.confirmPassword}</p>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !token}
              style={css.btn(submitting || !token)}
            >
              {submitting ? "Creating your account..." : "Create account & continue"}
            </button>
          </>
        )}

        <div style={css.footer()}>
          Kago Human Capital &nbsp;·&nbsp; By TNG Solutions
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;