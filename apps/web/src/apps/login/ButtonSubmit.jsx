import React from "react";
import { Spinner } from "reactstrap";

function ButtonSubmit({
  Title,
  BackgroundColor,
  ColorText,
  BorderColor,
  borderRadius,
  pending,
}) {
  return (
    <button
      className="btn"
      type="submit"
      style={{
        fontWeight: "600",
        color: ColorText,
        borderColor: BorderColor,
        borderWidth: "2px",
        borderStyle: "solid",
        borderRadius: borderRadius,
        backgroundColor: BackgroundColor,
      }}
    >
      <div className="d-flex justify-content-center align-items-center">
        {!pending ? <span>{Title}</span> : null}
        {pending ? (
          <>
            <Spinner size="sm">Loading...</Spinner>
            <span> Loading</span>
          </>
        ) : null}
      </div>
    </button>
  );
}

export default ButtonSubmit;
