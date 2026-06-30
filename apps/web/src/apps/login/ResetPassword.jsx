import React, { useEffect } from "react";
import Slider from "./Slider/Slider";
import ResetPasswordForm from "./ResetPasswordForm";

const ResetPassword = () => {
  document.title = "Reset Password | Kago - Human Capital";

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
                <ResetPasswordForm />
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

export default ResetPassword;
