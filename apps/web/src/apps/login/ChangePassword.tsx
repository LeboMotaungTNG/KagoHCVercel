import React, { useEffect } from "react";
import Slider from "./Slider/Slider";
import ChangePasswordPage from "./ChangePasswordPage";

// Drop into: web/src/apps/login/ChangePassword.tsx
// Mirrors Login.tsx exactly — same shell, same Slider, same layout classes —
// so this page doesn't look broken/unstyled compared to the rest of the
// auth flow. ChangePasswordPage.tsx holds the actual form logic, same
// relationship as Login.tsx -> LoginForm.tsx.

const ChangePassword = () => {
  document.title = "Set your password | Kago - Human Capital";

  useEffect(() => {
    document.body.className = "bg-pattern";
    return function cleanup() {
      document.body.className = "";
    };
  });

  return (
    <React.Fragment>
      <div className="account-pages">
        <div className="account-pages-auth-main">
          <div className="account-pages-container">
            <div className="account-pages-warpper">
              <div className="account-pages-warpper-first">
                <Slider />
              </div>
              <div className="account-pages-warpper-second">
                <ChangePasswordPage />
              </div>
            </div>
          </div>
          <div className="account-pages-brandMark">
            <a href="https://tngsolutions.co.za/">
              By TNG Solutions | Developed in South Africa
            </a>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ChangePassword;