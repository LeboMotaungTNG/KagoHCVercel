import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Form, Input, FormFeedback, Label } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import logoKago from "../../assets/images/kago-logo.png";
import ButtonSubmit from "./ButtonSubmit";

// Drop into: web/src/apps/login/ChangePasswordPage.tsx
//
// Reached right after login when data.data.user.mustChangePassword is true,
// or if any later API call comes back 403 with
// { success: false, code: 'PASSWORD_CHANGE_REQUIRED' }. No back button, no
// nav link out — this is a mandatory gate, not a dismissible prompt.
//
// On success, redirects to /employee — same destination LoginForm sends a
// 'user' role to, since employee.tsx is what renders EmployeeDashboardBody.

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().required("Your temporary password is required."),
  newPassword: Yup.string()
    .required("New password is required.")
    .min(8, "New password must be at least 8 characters.")
    .test(
      "not-same-as-current",
      "New password must be different from your current one.",
      function (value) {
        return value !== this.parent.currentPassword;
      }
    ),
  confirmPassword: Yup.string()
    .required("Please confirm your new password.")
    .oneOf([Yup.ref("newPassword")], "Passwords must match."),
});

// Same role → route mapping as LoginForm. Anything not listed (including
// 'user' and 'manager') falls through to /employee, matching LoginForm's
// existing else-branch behavior exactly.
const roleRedirect: Record<string, string> = {
  platform_admin: "/platform",
  auditor: "/auditor",
  owner: "/owner",
  admin: "/manager",
  hr: "/manager",
  manager: "/employee",
  line_manager: "/employee",
  payroll_officer: "/employee",
};

const eyeButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  padding: 6,
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#667085",
  cursor: "pointer",
  lineHeight: 0,
};

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: changePasswordSchema,
    onSubmit: async (values) => {
      setPending(true);
      setServerError("");

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // The old token still has mustChangePassword: true baked in —
          // it must be replaced or every request after this keeps 403'ing.
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));

          const destination = roleRedirect[data.data.user.role] || "/employee";
          navigate(destination, { replace: true });
        } else {
          setServerError(data.message || "Could not update your password.");
        }
      } catch (error) {
        console.error("Change password error:", error);
        setServerError("Network error. Is the backend running?");
      } finally {
        setPending(false);
      }
    },
  });

  return (
    <>
      <div className="login-form-brand">
        <img src={logoKago} alt="Kago HC" />
      </div>

      <div className="login-form-heading">
        <h1>Set your own password</h1>
        <p>
          You logged in with a temporary password. Choose a new one to
          continue — you won't be able to access anything else until this is
          done.
        </p>
      </div>

      <div className="w-100">
        {serverError && (
          <div className="alert alert-danger mb-3" role="alert">
            {serverError}
          </div>
        )}

        <Form
          className="form-horizontal"
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            return false;
          }}
        >
          <Row>
            <Col md={12}>
              <div className="mb-4">
                <Label className="form-label">Temporary password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter the password from your welcome email"
                    autoComplete="current-password"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.currentPassword}
                    disabled={pending}
                    style={{ paddingRight: 44 }}
                    invalid={
                      validation.touched.currentPassword &&
                      !!validation.errors.currentPassword
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                    title={showCurrent ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    style={eyeButtonStyle}
                  >
                    {showCurrent ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {validation.touched.currentPassword &&
                validation.errors.currentPassword ? (
                  <FormFeedback type="invalid" className="d-block">
                    <div>{validation.errors.currentPassword}</div>
                  </FormFeedback>
                ) : null}
              </div>

              <div className="mb-4">
                <Label className="form-label">New password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.newPassword}
                    disabled={pending}
                    style={{ paddingRight: 44 }}
                    invalid={
                      validation.touched.newPassword &&
                      !!validation.errors.newPassword
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    title={showNew ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    style={eyeButtonStyle}
                  >
                    {showNew ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {validation.touched.newPassword && validation.errors.newPassword ? (
                  <FormFeedback type="invalid" className="d-block">
                    <div>{validation.errors.newPassword}</div>
                  </FormFeedback>
                ) : null}
              </div>

              <div className="mb-3">
                <Label className="form-label">Confirm new password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.confirmPassword}
                    disabled={pending}
                    style={{ paddingRight: 44 }}
                    invalid={
                      validation.touched.confirmPassword &&
                      !!validation.errors.confirmPassword
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    title={showConfirm ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    style={eyeButtonStyle}
                  >
                    {showConfirm ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {validation.touched.confirmPassword &&
                validation.errors.confirmPassword ? (
                  <FormFeedback type="invalid" className="d-block">
                    <div>{validation.errors.confirmPassword}</div>
                  </FormFeedback>
                ) : null}
              </div>

              <div className="w-100 d-grid">
                <ButtonSubmit
                  Title={pending ? "Updating password..." : "Update password & continue"}
                  BackgroundColor="#33a6cd"
                  ColorText="#fff"
                  BorderColor=""
                  borderRadius="20px"
                  handleOnclick={() => {
                    validation.handleSubmit();
                  }}
                  pending={pending}
                />
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
};

export default ChangePasswordPage;