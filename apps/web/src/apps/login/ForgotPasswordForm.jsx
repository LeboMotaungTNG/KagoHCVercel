import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Form, Input, FormFeedback, Label } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";

import logoKago from "../../assets/images/kago-logo.png";
import ButtonSubmit from "./ButtonSubmit";
import { C } from "../../shared/utils/employee";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const forgotSchema = Yup.object({
  email: Yup.string()
    .required("Email address is required.")
    .email("Invalid email address."),
});

const ForgotPasswordForm = () => {
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState("");

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: { email: "" },
    validationSchema: forgotSchema,
    onSubmit: async (values) => {
      setPending(true);
      setFormError("");
      setDevResetUrl("");

      try {
        const email = values.email ? values.email.toLowerCase() : "";
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setFormError(data.message || "Could not process your request. Please try again.");
          return;
        }

        if (data.resetUrl) {
          setDevResetUrl(data.resetUrl);
        }
        setSubmitted(true);
      } catch (error) {
        console.error("Forgot password error:", error);
        setFormError("We couldn't reach the server. Please check your connection and try again.");
      } finally {
        setPending(false);
      }
    },
  });

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
          Forgot your password?
        </h4>
        <p className="text-muted mb-4" style={{ fontSize: 14, lineHeight: 1.5 }}>
          Enter the email linked to your KagoHC account. We&apos;ll send you instructions to reset your password.
        </p>

        {formError && (
          <div className="alert alert-danger mb-3" role="alert">
            {formError}
          </div>
        )}

        {submitted ? (
          <div>
            <div className="alert alert-success mb-3" role="alert">
              If an account exists for that email, we have sent password reset instructions.
              Please check your inbox and spam folder.
            </div>

            {devResetUrl && (
              <div className="alert alert-info mb-3" role="alert" style={{ fontSize: 13 }}>
                <strong>Development only:</strong>{" "}
                <a href={devResetUrl}>Open reset link</a>
              </div>
            )}

            <div className="w-100 d-grid">
              <Link
                to="/"
                className="btn text-center"
                style={{
                  fontWeight: 600,
                  color: "#fff",
                  borderRadius: "20px",
                  backgroundColor: C.primary,
                  padding: "10px 16px",
                  textDecoration: "none",
                }}
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
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
                  <Label className="form-label">Email</Label>
                  <Input
                    name="email"
                    className="form-control"
                    placeholder="Enter your email address"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.email}
                    disabled={pending}
                    invalid={
                      validation.touched.email && validation.errors.email
                        ? true
                        : false
                    }
                  />
                  {validation.touched.email && validation.errors.email ? (
                    <FormFeedback type="invalid">
                      <div>{validation.errors.email}</div>
                    </FormFeedback>
                  ) : null}
                </div>

                <div className="w-100 d-grid mb-3">
                  <ButtonSubmit
                    Title={pending ? "Sending..." : "Send reset link"}
                    BackgroundColor={C.primary}
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
        )}
      </div>
    </>
  );
};

export default ForgotPasswordForm;
