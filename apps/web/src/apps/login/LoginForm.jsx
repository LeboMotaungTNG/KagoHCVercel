import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Row, Col, Form, Input, FormFeedback, Label } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Lock } from "lucide-react";
import { C } from "../../shared/utils/employee";
import { touchActivity } from "../../shared/utils/auth";

import logoKago from "../../assets/images/kago-logo.png";
import ButtonSubmit from "./ButtonSubmit";
import { API_BASE } from "../../shared/utils/apiBase";

const API_URL = API_BASE;

const loginSchema = Yup.object({
  email: Yup.string()
    .required("Email address is required.")
    .email("Invalid email address."),
  password: Yup.string().required("Password is required."),
});

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passwordResetSuccess = location.state?.passwordReset === true;
  const sessionExpired = location.state?.sessionExpired === true;
  const [loginError, setLoginError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setPending(true);
      setLoginError("");
      
      try {
        const email = values.email ? values.email.toLowerCase() : "";
        const password = values.password || "";

        console.log("Attempting login for:", email);
        
        // CALL YOUR REAL BACKEND API
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log("Login response:", data);

        if (data.success) {
          // Store token and user data
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          touchActivity();

          // Assigned a temp password (e.g. new employee onboarding) — must
          // set their own before touching anything else. This check has to
          // come before the role-based routing below, since the backend
          // will 403 PASSWORD_CHANGE_REQUIRED on every other route anyway.
          if (data.data.user.mustChangePassword) {
            navigate("/change-password");
            return;
          }

          // Navigate based on role
          const role = data.data.user.role;
          if (role === 'platform_admin') {
            navigate("/platform");
          } else if (role === 'owner') {
            navigate("/owner");
          } else if (role === 'manager' || role === 'admin' || role === 'hr') {
            navigate("/manager");
          } else {
            navigate("/employee");
          }
        } else {
          setLoginError(data.error?.message || "Invalid email or password.");
        }
      } catch (error) {
        console.error("Login error:", error);
        setLoginError("We couldn't reach the server. Please check your connection and try again.");
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
        <h1>Welcome back</h1>
        <p>Sign in to your Kago Human Capital account.</p>
      </div>

      <div className="w-100">
        {/* Show error message if login fails */}
        {loginError && (
          <div className="alert alert-danger mb-3" role="alert">
            {loginError}
          </div>
        )}

        {sessionExpired && !loginError && (
          <div className="alert alert-warning mb-3" role="alert">
            Your session ended due to inactivity. Please sign in again.
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
                <Label className="form-label">Email</Label>
                <Input
                  name="email"
                  className="form-control"
                  placeholder="Enter email"
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
              
              <div className="mb-3">
                <Label className="form-label">Password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.password}
                    disabled={pending}
                    style={{ paddingRight: 44 }}
                    invalid={
                      validation.touched.password && validation.errors.password
                        ? true
                        : false
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    style={{
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
                    }}
                  >
                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
                {validation.touched.password && validation.errors.password ? (
                  <FormFeedback type="invalid">
                    <div> {validation.errors.password} </div>
                  </FormFeedback>
                ) : null}
              </div>
              
              <div className="login-forgot-row">
                <Link to="/forgot-password" className="login-forgot-link">
                  <Lock size={14} aria-hidden="true" />
                  <span>Forgot your password?</span>
                </Link>
              </div>

              <div className="w-100 d-grid">
                <ButtonSubmit
                  Title={pending ? "Logging in..." : "Login"}
                  BackgroundColor={C.primary}
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

export default LoginForm;