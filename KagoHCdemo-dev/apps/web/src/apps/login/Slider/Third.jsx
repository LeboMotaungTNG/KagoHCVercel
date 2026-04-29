import React from "react";
import imgBanner from "../../../assets/images/authentication/Kago_hc_image_3.png";

const Third = () => {
  return (
    <div>
      <div
        className="w-100 d-flex justify-content-center align-items-center"
        style={{ userSelect: "none" }}
      >
        <div className="rounded-4" style={{ width: "17em", height: "17em" }}>
          <img src={imgBanner} alt="img-placeholder" className="w-100 h-100" />
        </div>
      </div>
      <div>
        <div
          className="w-100 d-flex justify-content-center"
          style={{ fontSize: 12, color: "white" }}
        >
          Experience the Future of Exhibitions:
        </div>
        <div
          className="w-100 d-flex justify-content-center"
          style={{ fontSize: 12, color: "white" }}
        >
          Connect. Engage. Convert
        </div>
      </div>
    </div>
  );
};

export default Third;
