import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Row, Col, Form, Input, FormFeedback, Label } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";

import logoKago from "../../assets/images/kago-logo.png";
import ButtonSubmit from "./ButtonSubmit";

// API URL - connects to your backend
const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const loginSchema = Yup.object({
  email: Yup.string()
    .required("Email address is required.")
    .email("Invalid email address."),
  password: Yup.string().required("Password is required."),
});

const LoginForm = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const [pending, setPending] = useState(false);

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
          
          // Navigate based on role
           if (data.data.user.role === 'admin') {
            navigate("/manager");
          } else {
            navigate("/employee");
          }
        } else {
          setLoginError(data.error?.message || "Invalid email or password.");
        }
      } catch (error) {
        console.error("Login error:", error);
        setLoginError("Network error. Is the backend running?");
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
          style={{
            objectFit: "contain",
          }}
        />
      </div>

      <div className="w-100 mt-3">
        {/* Show error message if login fails */}
        {loginError && (
          <div className="alert alert-danger mb-3" role="alert">
            {loginError}
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
                <Input
                  name="password"
                  type="password"
                  placeholder="Enter Password"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.password}
                  disabled={pending}
                  invalid={
                    validation.touched.password && validation.errors.password
                      ? true
                      : false
                  }
                />
                {validation.touched.password && validation.errors.password ? (
                  <FormFeedback type="invalid">
                    <div> {validation.errors.password} </div>
                  </FormFeedback>
                ) : null}
              </div>
              
              <div className="w-100 mb-2 d-flex justify-content-end">
                <Link to="/forgot-password" className="text-muted">
                  <i className="mdi mdi-lock"></i> Forgot your password?
                </Link>
              </div>

              <div className="w-100 d-grid">
                <ButtonSubmit
                  Title={pending ? "Logging in..." : "Login"}
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

export default LoginForm;
