import React from "react";
import { FaCheck } from "react-icons/fa";
import { C } from "../../shared/utils/employee";

const Styles = {
  container: {
    maxWidth: "800px",
    padding: "24px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "24px",
  },
  plansContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
  },
  planCard: {
    flex: "1",
    padding: "16px",
    borderRadius: "8px",
    border: `1px solid ${C.primary}`,
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    minHeight: "160px",
    userSelect: "none" as const,
  },
  selectedPlan: {
    border: `1px solid ${C.primary}`,
  },
  cardIcon: {
    position: "absolute" as const,
    top: "-8px",
    right: "-8px",
    backgroundColor: C.primary,
    borderRadius: "50%",
    padding: "2px",
    color: "white",
    width: "25px",
    height: "25px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  contactUsPlan: {
    background: `linear-gradient(to right, ${C.primary}, ${C.primaryLight})`,
    color: "white",
    border: "none",
  },
  planHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  planName: {
    fontWeight: "500",
  },
  price: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  priceAmount: {
    fontSize: "18px",
    fontWeight: "600",
  },
  priceInterval: {
    fontSize: "14px",
    color: "#6b7280",
  },
  activationNotice: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  whiteText: {
    color: "white",
  },
  button: {
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    border: "none",
    background: "none",
  },
  cancelButton: {
    width: "180px",
    height: "30px",
    color: "#ff0000",
    backgroundColor: "#fff",
    textAlign: "center" as const,
    padding: "0px 0px 0px 4px",
    borderStyle: "solid",
    border: "2px solid #ff0000",
    borderRadius: 7,
  },
  upgradeButton: {
    width: "180px",
    height: "30px",
    backgroundColor: "white",
    color: C.primary,
    marginRight: "12px",
    borderRadius: 5,
    borderStyle: "none",
  },
  buttonContainer: {
    display: "flex",
    alignItems: "center",
  },
  toggleDescription: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "8px",
  },
};

export const SubscriptionsPage = () => {
  const mockSubscription = {
    price: "0.00"
  };

  return (
    <div className="w-100 d-flex justify-content-center">
      <div style={Styles.container}>
        <h2 style={Styles.title}>Plan</h2>

        <div style={Styles.plansContainer}>
          {/* Current Plan */}
          <div style={{ ...Styles.planCard, ...Styles.selectedPlan }}>
            <div style={Styles.cardIcon}>
              <FaCheck size={15} color="white" />
            </div>

            <div>
              <div style={Styles.planHeader}>
                <span style={Styles.planName}>Current Plan</span>
                <div style={Styles.price}>
                  <span style={Styles.priceAmount}>
                    R{mockSubscription.price}
                  </span>
                  <span style={Styles.priceInterval}>/month</span>
                </div>
              </div>
              <div style={Styles.activationNotice}>Your package is active</div>
            </div>
            <button style={Styles.cancelButton}>Cancel Subscription</button>
          </div>

          {/* Contact Us */}
          <div style={{ ...Styles.planCard, ...Styles.contactUsPlan }}>
            <div>
              <div style={Styles.planHeader}>
                <span
                  style={{
                    ...Styles.planName,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Contact Us
                </span>
              </div>
              <div style={{ ...Styles.activationNotice, ...Styles.whiteText }}>
                Want to update your subscription? Please click below.
              </div>
            </div>
            <div style={Styles.buttonContainer}>
              <button style={Styles.upgradeButton}>Upgrade</button>
            </div>
          </div>
        </div>

        <p style={Styles.toggleDescription}>
          This option, if checked, will renew your subscription automatically
          when the current plan expires.
        </p>
      </div>
    </div>
  );
};
