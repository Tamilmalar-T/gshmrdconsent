import React from 'react';

export default function HospitalPaperHeader() {
  return (
    <div className="exact-hospital-header-row">
      {/* Left Logos Section (NABH Solid Triangle & GS Monogram) */}
      <div className="exact-header-logos">
        
        {/* 1. Solid Black NABH Triangle Emblem */}
        <div className="nabh-triangle-emblem" title="NABH Pre-Accredited">
          <svg width="86" height="70" viewBox="0 0 100 88">
            <polygon points="50,4 96,81 4,81" fill="#000000" />
            <text x="24" y="32" fill="#ffffff" fontSize="5.5" fontWeight="900" transform="rotate(-58 24 32)" fontFamily="system-ui, sans-serif">PATIENT SAFETY &amp;</text>
            <text x="74" y="32" fill="#ffffff" fontSize="5.5" fontWeight="900" transform="rotate(58 74 32)" fontFamily="system-ui, sans-serif">QUALITY OF CARE</text>
            
            {/* Center NABH Circle Seal */}
            <circle cx="50" cy="46" r="14" fill="#ffffff" />
            <circle cx="50" cy="46" r="12" fill="#000000" />
            <circle cx="50" cy="46" r="9" fill="#ffffff" />
            <text x="50" y="49" fill="#000000" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">NABH</text>

            <text x="50" y="77" fill="#ffffff" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PRE ACCREDITED</text>
          </svg>
        </div>

        {/* 2. GS Corporate Monogram Emblem */}
        <div className="gs-emblem-logo" title="Gurushree GS Emblem">
          <svg width="74" height="62" viewBox="0 0 100 85">
            {/* Outer Rounded Rect Frame */}
            <rect x="5" y="5" width="90" height="74" rx="22" stroke="#000000" strokeWidth="9.5" fill="none" />
            {/* Upper G Monogram Loop */}
            <path d="M 26 25 H 72 C 78 25 80 29 80 35 V 39 L 42 39 V 45 L 75 45" stroke="#000000" strokeWidth="9.5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
            {/* Lower S Monogram Loop */}
            <path d="M 74 59 H 28 C 22 59 20 55 20 49 V 45 L 58 45 V 39 L 25 39" stroke="#000000" strokeWidth="9.5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
          </svg>
        </div>
      </div>

      {/* Center Hospital Name & Address Typography Block */}
      <div className="exact-header-text-block">
        <h2 className="exact-kan-title">ಗುರುಶ್ರೀ</h2>
        <h3 className="exact-kan-sub">ಹೈಟೆಕ್ ಮಲ್ಟಿ ಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ</h3>
        <p className="exact-kan-address">ಆ ಕೃಪಾ ಕಾಂಪ್ಲೆಕ್ಸ್, ಮಾಗಡಿ ಮುಖ್ಯ ರಸ್ತೆ, ಬೆಂಗಳೂರು - 79.</p>

        <h1 className="exact-eng-title">G U R U S H R E E</h1>
        <h2 className="exact-eng-sub">HI-TECH MULTI SPECIALITY HOSPITAL</h2>
        <p className="exact-eng-script">A touch <span className="underline-text">can instill faith</span></p>
      </div>
    </div>
  );
}
