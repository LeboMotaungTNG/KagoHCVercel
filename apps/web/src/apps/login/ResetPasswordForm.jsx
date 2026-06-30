import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Row, Col, Form, Input, FormFeedback, Label } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import logoKago from "../../assets/images/kago-logo.png";
import ButtonSubmit from "./ButtonSubmit";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const resetSchema = Yup.object({
  newPassword: Yup.string()
    .required("New password is required.")
    .min(6, "Password must be at least 6 characters."),
  confirmPassword: Yup.string()
    .required("Please confirm your password.")
    .oneOf([Yup.ref("newPassword")], "Passwords do not match."),
});

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: resetSchema,
    onSubmit: async (values) => {
      if (!token) {
        setFormError("Reset link is invalid. Please request a new one.");
        return;
      }

      setPending(true);
      setFormError("");

      try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword: values.newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setFormError(data.message || "Could not reset your password. The link may have expired.");
          return;
        }

        navigate("/", { replace: true, state: { passwordReset: true } });
      } catch (error) {
        console.error("Reset password error:", error);
        setFormError("We couldn't reach the server. Please check your connection and try again.");
      } finally {
        setPending(false);
      }
    },
  });

  const passwordToggleStyle = {
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

  if (!token) {
    return (
      <>
        <div style={{ width: "100px", height: "60px", display: "flex", marginTop: "2%" }}>
          <img src={logoKago} alt="hc-logo" style={{ objectFit: "contain" }} />
        </div>
        <div className="w-100 mt-3">
          <div className="alert alert-danger mb-3" role="alert">
            This reset link is invalid. Please request a new password reset.
          </div>
          <Link to="/forgot-password" className="text-muted">
            Request a new reset link
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          width: "100px",
          height: "60px",
          display: "flex",
          marginTop: "2%",
        }}
      >
        <img
          src={logoKago}
          alt="hc-logo"
          style={{ objectFit: "contain" }}
        />
      </div>

      <div className="w-100 mt-3">
        <h4 className="mb-2" style={{ fontWeight: 700, color: "#1d2939" }}>
          Set a new password
        </h4>
        <p className="text-muted mb-4" style={{ fontSize: 14, lineHeight: 1.5 }}>
          Choose a strong password with at least 6 characters.
        </p>

        {formError && (
          <div className="alert alert-danger mb-3" role="alert">
            {formError}
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
              <div className="mb-3">
                <Label className="form-label">New Password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.newPassword}
                    disabled={pending}
                    style={{ paddingRight: 44 }}
                    invalid={
                      validation.touched.newPassword && validation.errors.newPassword
                        ? true
                        : false
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    style={passwordToggleStyle}
                  >
                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
                {validation.touched.newPassword && validation.errors.newPassword ? (
                  <FormFeedback type="invalid">
                    <div>{validation.errors.newPassword}</div>
                  </FormFeedback>
                ) : null}
              </div>

              <div className="mb-4">
                <Label className="form-label">Confirm Password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.confirmPassword}
                    disabled={pending}
                    style={{ paddingRight: 44 }}
                    invalid={
                      validation.touched.confirmPassword && validation.errors.confirmPassword
                        ? true
                        : false
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    style={passwordToggleStyle}
                  >
                    {showConfirm ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
                {validation.touched.confirmPassword && validation.errors.confirmPassword ? (
                  <FormFeedback type="invalid">
                    <div>{validation.errors.confirmPassword}</div>
                  </FormFeedback>
                ) : null}
              </div>

              <div className="w-100 d-grid mb-3">
                <ButtonSubmit
                  Title={pending ? "Updating..." : "Reset password"}
                  BackgroundColor="#33a6cd"
                  ColorText="#fff"
                  BorderColor=""
                  borderRadius="20px"
                  handleOnclick={() => validation.handleSubmit()}
                  pending={pending}
                />
              </div>

              <div className="w-100 d-flex justify-content-center">
                <Link to="/" className="text-muted" style={{ fontSize: 14 }}>
                  <i className="mdi mdi-arrow-left"></i> Back to login
                </Link>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
};

export default ResetPasswordForm;
