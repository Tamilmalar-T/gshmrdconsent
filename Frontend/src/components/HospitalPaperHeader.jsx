import React from "react";

export default function HospitalPaperHeader() {
  return (
    <div className="care-plan-hospital-header">
      <div className="center-hospital-brand">
        <div className="hospital-logo-row">
          <div className="gs-square-logo">
            <span className="gs-text">GS</span>
          </div>

          <div className="hospital-titles">
            <h1 className="eng-title-large">GURUSHREE</h1>
            <h2 className="eng-title-medium">
              HI-TECH MULTI SPECIALITY HOSPITAL
            </h2>
            <p className="eng-tagline">A touch can instill faith</p>
          </div>
        </div>
      </div>
    </div>
  );
}