import React from 'react';
import {
  FlaskConical,
  CheckSquare,
  Activity,
  Droplet,
  FileSpreadsheet,
  FileText,
  Info,
  SquareCheck,
  ClipboardCheck,
  ClipboardList,
  UserPlus,
  UserCog,
  Users,
  Layers,
  Settings
} from 'lucide-react';

export default function Sidebar({ sidebarOpen, activeTab, setActiveTab }) {
  const menuSections = [
    {
      title: 'MASTERS',
      items: [
        { id: 'user-master', label: 'User Master', icon: UserCog },
        { id: 'type-master', label: 'Type Master', icon: Layers },
        { id: 'case-sheet-master', label: 'Case Sheet Master', icon: Settings },
        { id: 'nurse-master', label: 'Nurse Master', icon: Users },
        { id: 'assessment-master', label: 'Assessment Master', icon: FileText }
      ]
    },
    {
      title: 'PATIENT REGISTER',
      items: [
        { id: 'patient-registration', label: 'Patient Register', icon: UserPlus }
      ]
    },
    {
      title: 'GENERAL ADMISSION CONSENT',
      items: [
        { id: 'general-admission-consent', label: 'Consent for General Admission', icon: ClipboardCheck }
      ]
    },
    {
      title: 'NURSE CARE PLAN',
      items: [
        { id: 'nurse-care-plan', label: 'Nurse Care Plan', icon: Info },
        { id: 'nurses-daily-assessment', label: 'Nurses Daily Assessment Care Plan', icon: ClipboardList },
        { id: 'nursing-initial-assessment', label: 'Nursing Initial Assessment', icon: FileText },
        { id: 'resident-doctor-progress', label: 'Progress & Reassessment Record - Resident Doctor', icon: FileText },
        { id: 'progress-sheet', label: 'Progress Sheet', icon: SquareCheck },
        { id: 'internal-transfer-form', label: 'Internal Transfer Form', icon: FileText },
        { id: 'regular-drug-prescription', label: 'Regular Drug Prescription', icon: FileText }
      ]
    },
    {
      title: 'LABORATORY REQUISITION',
      items: [
        { id: 'lab-requisition', label: 'Laboratory Requisition', icon: FlaskConical },
        { id: 'investigation-chart', label: 'Investigation Chart', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'ACTIVITY & BILLING',
      items: [
        { id: 'activity-record-billing', label: 'Activity Record Billing', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'MEDICAL RECORD CHECKLIST',
      items: [
        { id: 'mrd-checklist', label: 'Medical Record Checklist', icon: CheckSquare }
      ]
    },
    {
      title: 'DIABETIC CHART',
      items: [
        { id: 'diabetic-chart', label: 'Diabetic Chart', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'VITALS & I/O RECORD',
      items: [
        { id: 'vitals-chart', label: 'Vitals Chart', icon: Activity },
        { id: 'bp-chart', label: 'BP Chart', icon: Activity },
        { id: 'intake-output', label: 'Intake & Output Record', icon: Droplet }
      ]
    }
  ];

  return (
    <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-scroll-content">
        {menuSections.map((section, idx) => (
          <div key={idx} className="sidebar-section">
            <h3 className="section-title">{section.title}</h3>
            <ul className="section-menu">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <IconComponent size={18} className="item-icon" />
                      <span className="item-label">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <p className="hospital-name">Gurushree Hospital</p>
        <p className="app-version">MRD Consent v1.0.4</p>
      </div>
    </aside>
  );
}
