import React from "react";

/**
 * A single login slider slide. Used by the three Slider entries.
 *
 * Visually:
 *   - A soft circular halo behind a rounded square image card
 *   - A bold tagline and a smaller supporting line
 *   - Reads beautifully on both desktop and mobile thanks to the SCSS
 *     in `_authentication.scss` (look for `.login-slide`).
 */
const Slide = ({ image, title, subtitle }) => (
  <div className="login-slide">
    <div className="login-slide-art" aria-hidden="true">
      <span className="login-slide-halo" />
      <div className="login-slide-card">
        <img src={image} alt="" />
      </div>
    </div>
    <div className="login-slide-copy">
      <h3 className="login-slide-title">{title}</h3>
      <p className="login-slide-sub">{subtitle}</p>
    </div>
  </div>
);

export default Slide;
