import { ChevronRight, Home } from 'lucide-react';

const BREADCRUMB_MAP = {
  'user-master': ['Master', 'User Master', 'User Accounts Registry'],
  'type-master': ['Master', 'Type Master', 'User Types & Roles'],
  'case-sheet-master': ['Master', 'Case Sheet Master', 'Case Sheet Types'],
  'nurse-master': ['Master', 'Nurse Master', 'Nursing Staff Registry'],
  'ward-master': ['Master', 'Ward Master', 'Ward & Bed Allocation'],
  'general-master': ['Master', 'General Master', 'General Suggestions'],
  'patient-register-master': ['Master', 'Patient Register Master', 'Registration Dropdowns'],
  'consultant-master': ['Master', 'Consultant Master', 'Consultants Registry'],
  'control-master': ['Master', 'Control Master', 'Control Parameters'],
  'package-mapping': ['Master', 'Package Mapping', 'Package Services'],
  'product-master': ['Master', 'Service Master', 'Services Catalog'],
  'hospital-branch-master': ['Master', 'Hospital Branch Master', 'Branches Registry'],
  'department-master': ['Master', 'Department Master', 'Departments List'],
  'sub-department-master': ['Master', 'Sub Department Master', 'Sub-Departments List'],

  'new-patient-registration': ['Patient Register', 'New Patient Registration', 'Registration Form'],
  'patient-registration': ['Patient Register', 'IP Register', 'Admitted Patients'],
  'admission-record': ['Patient Register', 'Admission Record', 'Inpatient Admission Record'],
  'medico-legal-register': ['Patient Register', 'Medico Legal Register', 'Legal Cases List'],
  'ip-list': ['Patient Register', 'IP Patient List', 'Active Inpatients'],

  'consolidated-assessment': ['Clinical Dashboard', 'Consolidated Assessment', 'Patient Summary'],

  'general-admission-consent': ['Patient Forms & Records', 'Consent for General Admission'],
  'initial-assessment-form': ['Patient Forms & Records', 'Initial Assessment Form'],
  'emergency-doctor-initial-assessment': ['Patient Forms & Records', 'Emergency Doctor Initial Assessment'],
  'nursing-initial-assessment': ['Patient Forms & Records', 'Nursing Initial Assessment'],
  'antenatal-case-record': ['Patient Forms & Records', 'Antenatal Case Record'],
  'progress-sheet': ['Patient Forms & Records', 'Progress Sheet - Consultant'],
  'resident-doctor-progress': ['Patient Forms & Records', 'Progress and Reassessment Record - Resident Doctor'],
  'nurse-care-plan': ['Patient Forms & Records', 'Nurses Care Plan'],
  'nurses-daily-assessment': ['Patient Forms & Records', 'Nurses Daily Assessment Care Plan'],
  'regular-drug-prescription': ['Patient Forms & Records', 'Regular Drug Prescriptions'],
  'investigation-chart': ['Patient Forms & Records', 'Investigation Chart'],
  'vitals-chart': ['Patient Forms & Records', 'Vitals Chart'],
  'bp-chart': ['Patient Forms & Records', 'BP Chart'],
  'diabetic-chart': ['Patient Forms & Records', 'Diabetic Chart'],
  'intake-output': ['Patient Forms & Records', 'Intake & Output Record'],
  'culture-chart': ['Patient Forms & Records', 'Culture Chart'],
  'activity-record-billing': ['Patient Forms & Records', 'Activity Record Billing'],
  'initial-assessment-by-doctor': ['Patient Forms & Records', 'Initial Assessment By Doctor - OP'],
  'internal-transfer-form': ['Patient Forms & Records', 'Internal Transfer Form'],
  'lab-requisition': ['Patient Forms & Records', 'Laboratory Requisition'],
  'mrd-checklist': ['Patient Forms & Records', 'Medical Record Checklist'],
  'partograph': ['Patient Forms & Records', 'Partograph'],
  'labour-record': ['Patient Forms & Records', 'Labour Record'],
  'surgical-safety-checklist': ['Patient Forms & Records', 'Surgical Safety Check List'],
  'post-operative-checklist': ['Patient Forms & Records', 'Post Operative Check List'],
  'room-tariff': ['Patient Forms & Records', 'Room Tariff'],
  'pre-operative-checklist': ['Patient Forms & Records', 'PRE-OPERATIVE CHECKLIST'],
  'admission-record': ['Patient Forms & Records', 'ADMISSION RECORD'],
  'consent-hospitalization-conditions-of-service': ['Patient Forms & Records', 'Consent for Hospitalization & Conditions of Service'],
  'operation-notes': ['Patient Forms & Records', 'Operation Notes'],
  'operation-notes-caesarean-section': ['Patient Forms & Records', 'Operation Notes for Caesarean Section'],
  'external-transfer-form': ['Patient Forms & Records', 'Transfer Form - External'],
  'consent-hiv-antibodies-test': ['Patient Forms & Records', 'INFORMED CONSENT FOR HIV ANTIBODIES TEST'],
  'incident-report': ['Patient Forms & Records', 'Incident Report'],
  'adverse-drug-reaction-report': ['Patient Forms & Records', 'Adverse Drug Reaction Report Form'],
  'physiotherapy-assessment': ['Patient Forms & Records', 'Physiotherapy Assessment & Reassessment Form'],

  'view-records': ['Records & Drafts', 'View Patient Records', 'Saved Clinical Records'],
  'view-drafts': ['Records & Drafts', 'View Saved Drafts', 'Pending Draft Forms'],
  'login-details': ['System Settings', 'Login Details', 'User Session Logs']
};

export default function Breadcrumb({ activeTab }) {
  const steps = BREADCRUMB_MAP[activeTab] || ['Dashboard', 'Home'];

  return (
    <nav className="global-breadcrumb-bar no-print" aria-label="Breadcrumb">
      <div className="breadcrumb-steps-container">
        <span className="breadcrumb-home-icon">
          <Home size={15} color="#0d9488" />
        </span>

        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isFirst = index === 0;

          return (
            <span key={index} className="breadcrumb-step-item">
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className={`breadcrumb-step-text ${isLast ? 'active-step' : ''} ${isFirst ? 'category-step' : ''}`}>
                {step}
              </span>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
