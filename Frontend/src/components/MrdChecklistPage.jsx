import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  Search, 
  User, 
  Calendar, 
  Building2, 
  BedDouble, 
  Stethoscope, 
  FileText, 
  ExternalLink, 
  Printer, 
  Filter, 
  Check, 
  X, 
  AlertCircle,
  FileCheck2,
  ListFilter,
  RefreshCw,
  Sparkles,
  Download
} from 'lucide-react';
import { findPatientByIpNo, getRegisteredPatients } from '../utils/patientRegistry';
import { getSavedRecords, API_BASE_URL } from '../utils/savedRecordsDB';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

// Complete registry of all 31 clinical patient forms and records in the system
export const ALL_MRD_FORMS = [
  // 1. Admission & Consent Records
  {
    id: 'admission-record',
    name: 'Admission Record',
    category: 'Admission & Consent',
    aliases: ['Admission Record', 'ADMISSION RECORD', 'admission-record'],
    description: 'Patient demographic, admission vitals, diagnosis & admission authorization',
    requiredForDischarge: true
  },
  {
    id: 'general-admission-consent',
    name: 'Consent for General Admission',
    category: 'Admission & Consent',
    aliases: ['Consent for General Admission', 'General Admission', 'general-admission-consent', 'General Admission Consent'],
    description: 'General admission terms, treatment agreement & casualty department consent',
    requiredForDischarge: true
  },
  {
    id: 'consent-hospitalization-conditions-of-service',
    name: 'Hospitalization & Conditions of Service',
    category: 'Admission & Consent',
    aliases: ['Consent for Hospitalization & Conditions of Service', 'Hospitalization & Conditions of Service', 'consent-hospitalization-conditions-of-service'],
    description: 'Hospital rules, financial liability, release of medical info & service conditions',
    requiredForDischarge: true
  },
  {
    id: 'consent-hospitalization-conduct-procedures',
    name: 'Consent for Hospitalization & Procedures',
    category: 'Admission & Consent',
    aliases: ['Consent for Hospitalization and Conduct of All Procedures', 'consent-hospitalization-conduct-procedures', 'Hospitalization Conduct Procedures'],
    description: 'Informed agreement for surgical procedures, anesthesia, transfusions & care',
    requiredForDischarge: false
  },
  {
    id: 'consent-hiv-antibodies-test',
    name: 'Informed Consent for HIV Antibodies Test',
    category: 'Admission & Consent',
    aliases: ['Informed Consent for HIV Antibodies Test', 'INFORMED CONSENT FOR HIV ANTIBODIES TEST', 'consent-hiv-antibodies-test', 'HIV Antibodies Test Consent'],
    description: 'Pre-test counseling acknowledgment and voluntary HIV testing consent',
    requiredForDischarge: false
  },
  {
    id: 'room-tariff',
    name: 'Room Tariff & Bed Agreement',
    category: 'Admission & Consent',
    aliases: ['Room Tariff', 'room-tariff', 'Room Tariff Agreement'],
    description: 'Room category selection, daily tariff agreement and bed allocation record',
    requiredForDischarge: true
  },

  // 2. Assessments & Doctor Notes
  {
    id: 'initial-assessment-form',
    name: 'Initial Assessment Form (Inpatient)',
    category: 'Assessments & Doctor Notes',
    aliases: ['Initial Assessment Form', 'initial-assessment-form', 'Inpatient Initial Assessment'],
    description: 'Comprehensive baseline history, systemic exam, provisional diagnosis & care plan',
    requiredForDischarge: true
  },
  {
    id: 'initial-assessment-by-doctor',
    name: 'Initial Assessment By Doctor (OP)',
    category: 'Assessments & Doctor Notes',
    aliases: ['Initial Assessment By Doctor - OP', 'Initial Assessment By Doctor', 'initial-assessment-by-doctor', 'OP -IA', 'OP - IA'],
    description: 'Outpatient consultation notes, clinical impressions and prescription advice',
    requiredForDischarge: false
  },
  {
    id: 'emergency-doctor-initial-assessment',
    name: 'Emergency Doctor Initial Assessment (EDIA)',
    category: 'Assessments & Doctor Notes',
    aliases: ['Emergency Doctor Initial Assessment', 'emergency-doctor-initial-assessment', 'EDIA', 'Emergency Assessment'],
    description: 'Triage assessment, emergency interventions, trauma evaluation & casualty notes',
    requiredForDischarge: false
  },
  {
    id: 'progress-sheet',
    name: 'Progress Sheet - Consultant',
    category: 'Assessments & Doctor Notes',
    aliases: ['Progress Sheet - Consultant', 'Progress Sheet', 'progress-sheet', 'Consultant Progress Sheet'],
    description: 'Daily consultant rounds, patient progress notes, treatment revisions & orders',
    requiredForDischarge: true
  },
  {
    id: 'resident-doctor-progress',
    name: 'Progress & Reassessment - Resident Doctor',
    category: 'Assessments & Doctor Notes',
    aliases: ['Progress & Reassessment Record - Resident Doctor', 'Progress and Reassessment Record - Resident Doctor', 'resident-doctor-progress', 'Reassessment-R Dr', 'Progress and Reassessment Record'],
    description: 'Duty doctor hourly tracking, response to treatment and overnight reassessments',
    requiredForDischarge: true
  },

  // 3. Nursing & Clinical Care
  {
    id: 'nursing-initial-assessment',
    name: 'Nursing Initial Assessment',
    category: 'Nursing & Care Plans',
    aliases: ['Nursing Initial Assessment', 'nursing-initial-assessment', 'Nursing IA'],
    description: 'Nursing admission triage, fall risk score, pressure ulcer scale & hygiene status',
    requiredForDischarge: true
  },
  {
    id: 'nursing-initial-assessment-obstetrics',
    name: 'Nursing Initial Assessment - Obstetrics',
    category: 'Nursing & Care Plans',
    aliases: ['Nursing Initial Assessment - Obstetrics', 'nursing-initial-assessment-obstetrics', 'Nursing IA - Obstetrics'],
    description: 'Obstetric nursing evaluation, gestational age, fetal heart rate & labor triage',
    requiredForDischarge: false
  },
  {
    id: 'nurse-care-plan',
    name: 'Nurses Care Plan',
    category: 'Nursing & Care Plans',
    aliases: ['Nurses Care Plan', 'nurse-care-plan', 'Nurse Care Plan'],
    description: 'Goal-oriented nursing interventions, diagnosis prioritization & evaluation',
    requiredForDischarge: true
  },
  {
    id: 'nurses-daily-assessment',
    name: 'Nurses Daily Assessment',
    category: 'Nursing & Care Plans',
    aliases: ['Nurses Daily Assessment Care Plan', 'Nurses Daily Assessment', 'nurses-daily-assessment', 'N.Daily Assessment'],
    description: 'Shift-by-shift nursing status, IV line checks, catheter care & wound monitoring',
    requiredForDischarge: true
  },

  // 4. Clinical Charts & Prescriptions
  {
    id: 'vitals-chart',
    name: 'Vitals Chart (TPR)',
    category: 'Clinical Charts & Vitals',
    aliases: ['Vitals Chart', 'vitals-chart', 'TPR Chart'],
    description: 'Temperature, pulse, respiration, SpO2 & consciousness tracking',
    requiredForDischarge: true
  },
  {
    id: 'bp-chart',
    name: 'Blood Pressure (BP) Chart',
    category: 'Clinical Charts & Vitals',
    aliases: ['BP Chart', 'bp-chart', 'Blood Pressure Chart'],
    description: 'Serial systolic/diastolic blood pressure graph and MAP monitoring',
    requiredForDischarge: true
  },
  {
    id: 'diabetic-chart',
    name: 'Diabetic & GRBS Chart',
    category: 'Clinical Charts & Vitals',
    aliases: ['Diabetic Chart', 'diabetic-chart', 'GRBS Chart', 'Blood Sugar Chart'],
    description: 'Pre/post-prandial blood glucose values and sliding scale insulin administration',
    requiredForDischarge: false
  },
  {
    id: 'intake-output',
    name: 'Intake & Output Record',
    category: 'Clinical Charts & Vitals',
    aliases: ['Intake & Output Record', 'Intake Output Record', 'intake-output', 'Intake & Output'],
    description: '24-hour oral/IV fluid intake, urine output, drain fluid and fluid balance calculation',
    requiredForDischarge: true
  },
  {
    id: 'regular-drug-prescription',
    name: 'Regular Drug Prescriptions & Administration',
    category: 'Clinical Charts & Vitals',
    aliases: ['Regular Drug Prescriptions', 'Regular Drug Prescription', 'regular-drug-prescription', 'Medication Chart'],
    description: 'Doctor medication orders and nurse scheduled drug administration sign-off',
    requiredForDischarge: true
  },
  {
    id: 'investigation-chart',
    name: 'Investigation Chart',
    category: 'Clinical Charts & Vitals',
    aliases: ['Investigation Chart', 'investigation-chart'],
    description: 'Consolidated lab, biochemistry, hematology & microbiology test results tracker',
    requiredForDischarge: true
  },
  {
    id: 'lab-requisition',
    name: 'Laboratory Requisition Form',
    category: 'Clinical Charts & Vitals',
    aliases: ['Laboratory Requisition', 'lab-requisition', 'Lab', 'Lab Requisition'],
    description: 'Pathology/diagnostic investigation requisition slip with clinical indications',
    requiredForDischarge: false
  },
  {
    id: 'culture-chart',
    name: 'Culture & Sensitivity Chart',
    category: 'Clinical Charts & Vitals',
    aliases: ['Culture Chart', 'culture-chart', 'Microbiology Culture Chart'],
    description: 'Blood/urine/pus culture organism identification and antibiotic sensitivity record',
    requiredForDischarge: false
  },
  {
    id: 'activity-record-billing',
    name: 'Activity Record & Billing Sheet',
    category: 'Clinical Charts & Vitals',
    aliases: ['Activity Record Billing', 'activity-record-billing', 'Billing', 'Hospital Billing Sheet'],
    description: 'Daily consumable usage, procedure billing codes and ward activity register',
    requiredForDischarge: true
  },

  // 5. Surgical & OT Checklists
  {
    id: 'pre-operative-checklist',
    name: 'Pre-Operative Checklist',
    category: 'Surgical & Operative',
    aliases: ['Pre-Operative Checklist', 'PRE-OPERATIVE CHECKLIST', 'pre-operative-checklist', 'Pre-Op Checklist'],
    description: 'Pre-surgery verification: NPO status, consent, site marking, jewelry removal & premeds',
    requiredForDischarge: false
  },
  {
    id: 'surgical-safety-checklist',
    name: 'WHO Surgical Safety Check List',
    category: 'Surgical & Operative',
    aliases: ['Surgical Safety Check List', 'surgical-safety-checklist', 'Surgical Safety Checklist'],
    description: 'Sign-in, Time-out & Sign-out checks during operative procedures for patient safety',
    requiredForDischarge: false
  },
  {
    id: 'post-operative-checklist',
    name: 'Post Operative Check List',
    category: 'Surgical & Operative',
    aliases: ['Post Operative Check List', 'post-operative-checklist', 'Post-Op Checklist'],
    description: 'PACU recovery handover, post-op vitals, drain outputs and anesthesia recovery score',
    requiredForDischarge: false
  },
  {
    id: 'operation-notes',
    name: 'Operation Notes (General Surgery)',
    category: 'Surgical & Operative',
    aliases: ['Operation Notes', 'operation-notes', 'Surgical Notes'],
    description: 'Surgeon intra-operative findings, operative technique, suture type & specimen details',
    requiredForDischarge: false
  },
  {
    id: 'operation-notes-caesarean-section',
    name: 'Operation Notes for Caesarean Section',
    category: 'Surgical & Operative',
    aliases: ['Operation Notes for Caesarean Section', 'operation-notes-caesarean-section', 'LSCS Operation Notes'],
    description: 'Obstetric LSCS surgical note, liquor color, baby extraction time & placental delivery',
    requiredForDischarge: false
  },

  // 6. Maternity & Neonatal Records
  {
    id: 'antenatal-case-record',
    name: 'Antenatal Case Record (IP)',
    category: 'Maternity & Neonatal',
    aliases: ['Antenatal Case Record', 'antenatal-case-record', 'Antenatal Case'],
    description: 'Obstetric inpatient history, gravidogram, ultrasound findings and delivery plan',
    requiredForDischarge: false
  },
  {
    id: 'antenatal-case-record-op',
    name: 'Antenatal Case Record (OP)',
    category: 'Maternity & Neonatal',
    aliases: ['Antenatal Case Record (OP)', 'antenatal-case-record-op', 'Antenatal OP Record'],
    description: 'OP antenatal visits tracker, high-risk scoring, immunization & trimester labs',
    requiredForDischarge: false
  },
  {
    id: 'partograph',
    name: 'Partograph (Labor Progress Chart)',
    category: 'Maternity & Neonatal',
    aliases: ['Partograph', 'partograph', 'Labour Progress Chart'],
    description: 'Cervical dilatation curve, alert/action lines, fetal descent & uterine contractions',
    requiredForDischarge: false
  },
  {
    id: 'labour-record',
    name: 'Labour & Delivery Record',
    category: 'Maternity & Neonatal',
    aliases: ['Labour Record', 'labour-record', 'Delivery Record'],
    description: 'Third stage labor notes, episiotomy/tear repair, blood loss & newborn summary',
    requiredForDischarge: false
  },
  {
    id: 'neonatal-inpatient-medical-record',
    name: 'Neonatal In-Patient Medical Record',
    category: 'Maternity & Neonatal',
    aliases: ['Neonatal In-Patient Medical Record', 'neonatal-inpatient-medical-record', 'Neonatal Medical Record'],
    description: 'APGAR scores, birth weight, neonatal reflexes, immunization & NICU care notes',
    requiredForDischarge: false
  },

  // 7. Transfers, Incident & Specialty Reports
  {
    id: 'internal-transfer-form',
    name: 'Internal Transfer Form',
    category: 'Transfers & Special Reports',
    aliases: ['Internal Transfer Form', 'internal-transfer-form', 'Internal Transfer'],
    description: 'Intra-hospital ward/ICU transfer handover, current vitals & medication handoff',
    requiredForDischarge: false
  },
  {
    id: 'external-transfer-form',
    name: 'External Transfer Form (Referral Out)',
    category: 'Transfers & Special Reports',
    aliases: ['External Transfer Form', 'external-transfer-form', 'Transfer Form - External', 'Referral Form'],
    description: 'Inter-hospital transfer summary, transit vitals, reason for transfer & receiving facility',
    requiredForDischarge: false
  },
  {
    id: 'incident-report',
    name: 'Clinical Incident / Sentinel Event Report',
    category: 'Transfers & Special Reports',
    aliases: ['Incident Report', 'incident-report', 'Clinical Incident Report'],
    description: 'Adverse clinical event, patient fall or medication error reporting and root cause analysis',
    requiredForDischarge: false
  },
  {
    id: 'adverse-drug-reaction-report',
    name: 'Adverse Drug Reaction (ADR) Report',
    category: 'Transfers & Special Reports',
    aliases: ['Adverse Drug Reaction Report Form', 'adverse-drug-reaction-report', 'Adverse Drug Reaction Report'],
    description: 'Pharmacovigilance ADR details, suspected medication, causality assessment & outcome',
    requiredForDischarge: false
  },
  {
    id: 'physiotherapy-assessment',
    name: 'Physiotherapy Assessment & Reassessment',
    category: 'Transfers & Special Reports',
    aliases: ['Physiotherapy Assessment & Reassessment Form', 'physiotherapy-assessment', 'Physiotherapy Assessment Form'],
    description: 'Musculoskeletal evaluation, range of motion, muscle strength & mobility rehabilitation',
    requiredForDischarge: false
  }
];

export default function MrdChecklistPage({ onNavigate }) {
  const [ipInput, setIpInput] = useState(() => localStorage.getItem('mrd_selected_ip') || '');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [registeredPatientsList, setRegisteredPatientsList] = useState([]);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Completed', 'Pending'

  // MRD manual audit checks persistence
  const [manualChecks, setManualChecks] = useState(() => {
    try {
      const saved = localStorage.getItem('mrd_manual_checklist_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [mrdReviewerNotes, setMrdReviewerNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('mrd_reviewer_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load all registered patients for auto-suggestion
  useEffect(() => {
    const list = getRegisteredPatients();
    setRegisteredPatientsList(list);
  }, []);

  // Listen for real-time form save events across the entire app
  useEffect(() => {
    const handleFormSaved = (event) => {
      const savedRec = event?.detail;
      const currentIp = (ipInput || localStorage.getItem('mrd_selected_ip') || '').trim();
      
      // Refresh registered patients list
      setRegisteredPatientsList(getRegisteredPatients());

      if (currentIp) {
        handleFetchPatientAndRecords(currentIp);
      } else if (savedRec?.patientIpNo && savedRec.patientIpNo !== 'Draft (No IP)') {
        // If no IP is selected yet, auto-populate with the newly saved form's IP
        setIpInput(savedRec.patientIpNo);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'saved_form_records_db' || e.key === 'registered_patients_db') {
        setRegisteredPatientsList(getRegisteredPatients());
        const currentIp = (ipInput || localStorage.getItem('mrd_selected_ip') || '').trim();
        if (currentIp) {
          handleFetchPatientAndRecords(currentIp);
        }
      }
    };

    window.addEventListener('form_record_saved', handleFormSaved);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('form_record_saved', handleFormSaved);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [ipInput]);

  // Sync selected IP to localStorage
  useEffect(() => {
    if (ipInput) {
      localStorage.setItem('mrd_selected_ip', ipInput);
    }
  }, [ipInput]);

  // Save manual checks
  useEffect(() => {
    localStorage.setItem('mrd_manual_checklist_notes', JSON.stringify(manualChecks));
  }, [manualChecks]);

  // Save reviewer notes
  useEffect(() => {
    localStorage.setItem('mrd_reviewer_notes', JSON.stringify(mrdReviewerNotes));
  }, [mrdReviewerNotes]);

  // Fetch records whenever IP changes
  useEffect(() => {
    if (ipInput.trim()) {
      handleFetchPatientAndRecords(ipInput);
    } else {
      setSelectedPatient(null);
      setPatientRecords([]);
    }
  }, [ipInput]);

  const handleFetchPatientAndRecords = async (targetIp) => {
    const cleanSearch = (targetIp || '').trim();
    if (!cleanSearch) return;

    setIsLoadingRecords(true);

    // 1. Find patient in local registry
    let pt = findPatientByIpNo(cleanSearch);

    // 2. Fetch all saved records (from Postgres and LocalStorage)
    let combinedRecords = [];

    // A. LocalStorage saved records
    try {
      const localRecords = getSavedRecords();
      const matchingLocal = localRecords.filter(r => {
        const rIp = (r.patientIpNo || r.rawIpNo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sIp = cleanSearch.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return rIp === sIp || (sIp.length >= 3 && rIp.includes(sIp));
      });
      combinedRecords.push(...matchingLocal);
    } catch (e) {
      console.warn('Error reading local records for MRD:', e);
    }

    // B. Postgres Backend records
    try {
      const res = await fetch(`${API_BASE_URL}/records/all`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const matchingDb = json.data.filter(r => {
          const rIp = (r.patientIpNo || r.rawIpNo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const sIp = cleanSearch.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return rIp === sIp || (sIp.length >= 3 && rIp.includes(sIp));
        });

        // Add db records that aren't already present locally
        matchingDb.forEach(dbRec => {
          if (!combinedRecords.some(cr => cr.formType === dbRec.formType && String(cr.id) === String(dbRec.id))) {
            combinedRecords.push(dbRec);
          }
        });
      }
    } catch (err) {
      console.warn('Backend records fetch warning for MRD checklist:', err);
    }

    // If patient was not found in registry, construct from first record
    if (!pt && combinedRecords.length > 0) {
      const first = combinedRecords[0].data || {};
      pt = {
        patientName: first.patientName || first.name || combinedRecords[0].patientName || 'Unknown Patient',
        age: first.age || '--',
        sex: first.sex || first.gender || '--',
        ipNo: combinedRecords[0].patientIpNo || cleanSearch,
        uhidNo: first.uhidNo || '--',
        doa: first.doa || '--',
        ward: first.ward || '--',
        bedNo: first.bedNo || '--',
        consultantName: first.consultantName || first.consultant || '--',
        medicalInsurance: first.medicalInsurance || 'No'
      };
    }

    setSelectedPatient(pt);
    setPatientRecords(combinedRecords);
    setIsLoadingRecords(false);
  };

  // Check if a specific form is filled & saved
  const getFormStatus = (formItem) => {
    if (!ipInput.trim() || patientRecords.length === 0) {
      return { isFilled: false, matchedRecord: null };
    }

    // Normalize form names & aliases for fuzzy matching
    const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetKeys = [formItem.id, formItem.name, ...(formItem.aliases || [])].map(normalize);

    const matchedRecord = patientRecords.find(r => {
      const ft = normalize(r.formType || '');
      return targetKeys.some(k => ft === k || (k.length > 5 && ft.includes(k)) || (ft.length > 5 && k.includes(ft)));
    });

    return {
      isFilled: Boolean(matchedRecord),
      matchedRecord: matchedRecord || null
    };
  };

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_MRD_FORMS.map(f => f.category)));
    return ['All', ...cats];
  }, []);

  // Filtered forms list
  const filteredForms = useMemo(() => {
    return ALL_MRD_FORMS.filter(form => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        form.name.toLowerCase().includes(q) || 
        form.category.toLowerCase().includes(q) ||
        (form.description && form.description.toLowerCase().includes(q));

      // 2. Category Filter
      const matchesCategory = selectedCategory === 'All' || form.category === selectedCategory;

      // 3. Status Filter
      const { isFilled } = getFormStatus(form);
      let matchesStatus = true;
      if (statusFilter === 'Completed') matchesStatus = isFilled;
      if (statusFilter === 'Pending') matchesStatus = !isFilled;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, statusFilter, patientRecords, ipInput]);

  // Statistics calculation
  const stats = useMemo(() => {
    let completedCount = 0;
    ALL_MRD_FORMS.forEach(form => {
      const { isFilled } = getFormStatus(form);
      if (isFilled) completedCount++;
    });

    const totalCount = ALL_MRD_FORMS.length;
    const pendingCount = totalCount - completedCount;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { totalCount, completedCount, pendingCount, percentage };
  }, [patientRecords, ipInput]);

  const handleToggleManualAudit = (formId) => {
    const currentIp = (ipInput || '').trim().toUpperCase();
    if (!currentIp) return;

    setManualChecks(prev => {
      const patientKey = `pt_${currentIp}`;
      const existingPtChecks = prev[patientKey] || {};
      const newStatus = !existingPtChecks[formId];
      return {
        ...prev,
        [patientKey]: {
          ...existingPtChecks,
          [formId]: newStatus
        }
      };
    });
  };

  const isFormManuallyAudited = (formId) => {
    const currentIp = (ipInput || '').trim().toUpperCase();
    if (!currentIp) return false;
    return Boolean(manualChecks[`pt_${currentIp}`]?.[formId]);
  };

  const handleNavigateToForm = (tabId) => {
    if (onNavigate) {
      onNavigate(tabId);
    }
  };

  const handlePrintChecklist = () => {
    window.print();
  };

  // Format date cleanly as DD/MM/YYYY in numbers (e.g. 26/09/2026, 07/10/2026)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === '--') return '—';
    return formatDateToDDMMYYYY(dateStr) || String(dateStr);
  };

  // Format age cleanly (e.g. 23 Y / Male)
  const formatAgeDisplay = (ageStr, sexStr) => {
    let cleanAge = (ageStr || '').trim();
    // Remove extra trailing Y if present
    cleanAge = cleanAge.replace(/\s*Y\s*$/i, '').trim();
    if (!cleanAge) cleanAge = '—';
    else if (!cleanAge.toLowerCase().includes('y') && !cleanAge.includes('M')) cleanAge = `${cleanAge} Y`;
    
    const cleanSex = (sexStr || '').trim() || '—';
    return `${cleanAge} / ${cleanSex}`;
  };

  return (
    <div className="patient-register-container" style={{ maxWidth: '1380px', margin: '0 auto', paddingBottom: '70px' }}>
      
      {/* 1. Header Bar */}
      <div className="pr-page-header" style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
        <div className="pr-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
              color: '#ffffff', 
              padding: '8px', 
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
            }}>
              <CheckSquare size={22} />
            </span>
            <div>
              <h1 className="pr-main-title" style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                MRD Checklist (Medical Record Department)
              </h1>
              <p className="pr-sub-title" style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px', marginBottom: 0 }}>
                Universal verification checklist of all hospital clinical forms & patient documentation status by IP Number.
              </p>
            </div>
          </div>
        </div>

        <div className="pr-header-actions no-print" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => handleFetchPatientAndRecords(ipInput)}
            className="btn-export-excel" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: '#ffffff', 
              color: '#0369a1', 
              borderColor: '#cbd5e1',
              padding: '7px 14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '12.5px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            title="Refresh verification status"
          >
            <RefreshCw size={14} className={isLoadingRecords ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>
          
          <button 
            type="button" 
            onClick={handlePrintChecklist}
            className="btn-pr-register" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '7px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              fontWeight: '600',
              fontSize: '12.5px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Printer size={15} />
            <span>Print Checklist</span>
          </button>
        </div>
      </div>

      {/* 2. Patient IP Lookup & Details Card */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        marginBottom: '20px',
        overflow: 'hidden'
      }}>
        {/* Card Header Strip */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 18px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
            <User size={15} color="#0284c7" />
            <span>Patient IP Verification & Search</span>
          </div>
          {ipInput && (
            <span style={{ 
              fontSize: '11.5px', 
              backgroundColor: '#e0f2fe', 
              color: '#0369a1',
              border: '1px solid #bae6fd',
              padding: '2px 10px', 
              borderRadius: '12px', 
              fontWeight: '700',
              letterSpacing: '0.02em'
            }}>
              Active IP: {ipInput.toUpperCase()}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            
            {/* IP Number Search Input */}
            <div style={{ width: '220px', flexShrink: 0 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                ENTER IP NUMBER <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={ipInput} 
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="e.g. IP01..." 
                  list="registered_ip_suggestions"
                  style={{ 
                    width: '100%',
                    height: '36px', 
                    fontSize: '13px', 
                    fontWeight: '700', 
                    color: '#0f172a', 
                    letterSpacing: '0.03em',
                    paddingLeft: '32px',
                    paddingRight: '28px',
                    borderRadius: '7px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0284c7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)';
                  }}
                  autoFocus
                />
                {ipInput && (
                  <button 
                    type="button"
                    onClick={() => { setIpInput(''); setSelectedPatient(null); setPatientRecords([]); }}
                    style={{ 
                      position: 'absolute', 
                      right: '7px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: '#f1f5f9', 
                      border: 'none', 
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer', 
                      color: '#64748b' 
                    }}
                    title="Clear input"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Datalist suggestions */}
              <datalist id="registered_ip_suggestions">
                {registeredPatientsList.map((pt, idx) => (
                  <option key={idx} value={pt.ipNo}>
                    {pt.patientName || pt.name} • {pt.ward || 'Ward'} (UHID: {pt.uhidNo || '—'})
                  </option>
                ))}
              </datalist>
            </div>

            {/* Patient Details Summary Strip (Next to IP search in same row) */}
            {selectedPatient ? (
              <div style={{
                flex: '1 1 500px',
                padding: '8px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px 14px',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Patient Name
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedPatient.patientName || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    IP No / UHID
                  </span>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0284c7', whiteSpace: 'nowrap' }}>
                    {selectedPatient.ipNo} {selectedPatient.uhidNo ? `• ${selectedPatient.uhidNo}` : ''}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Age / Sex
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                    {formatAgeDisplay(selectedPatient.age, selectedPatient.sex || selectedPatient.gender)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Ward / Bed No
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                    {selectedPatient.ward || '—'} {selectedPatient.bedNo ? `/ ${selectedPatient.bedNo}` : ''}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Date of Admission
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                    {formatDateDisplay(selectedPatient.doa)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Consultant
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedPatient.consultantName || selectedPatient.consultant || 'Dr. Sadhana'}
                  </div>
                </div>
              </div>
            ) : ipInput.trim() && !isLoadingRecords ? (
              <div style={{ 
                flex: '1 1 300px',
                padding: '8px 14px', 
                backgroundColor: '#fffbeb', 
                border: '1px solid #fef3c7', 
                borderRadius: '8px', 
                color: '#b45309', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <AlertCircle size={15} />
                <span>Matching against stored records for IP <strong>"{ipInput}"</strong>.</span>
              </div>
            ) : null}

          </div>
        </div>
      </div>

      {/* 3. Executive Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '18px'
      }}>
        {/* Metric 1: Total Forms */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '10px', 
          padding: '14px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '10px', borderRadius: '10px' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total System Forms</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{stats.totalCount} Forms</div>
          </div>
        </div>

        {/* Metric 2: Completed / Filled Forms */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #bbf7d0', 
          borderRadius: '10px', 
          padding: '14px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '10px', borderRadius: '10px' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Filled & Saved (✓)</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d' }}>
              {stats.completedCount} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>/ {stats.totalCount}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Pending Forms */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #fed7aa', 
          borderRadius: '10px', 
          padding: '14px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '10px', borderRadius: '10px' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Pending / Not Filled</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#c2410c' }}>{stats.pendingCount} Forms</div>
          </div>
        </div>

        {/* Metric 4: Documentation Completion Rate */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #bae6fd', 
          borderRadius: '10px', 
          padding: '14px 18px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.03em' }}>MRD Completion</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: stats.percentage === 100 ? '#15803d' : '#0284c7' }}>{stats.percentage}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${stats.percentage}%`, 
                height: '100%', 
                background: stats.percentage === 100 ? '#16a34a' : 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
                transition: 'width 0.4s ease'
              }} 
            />
          </div>
        </div>
      </div>

      {/* 4. Filter and Search Controls */}
      <div className="no-print" style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Status Segmented Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          {[
            { key: 'All', label: `All Forms (${ALL_MRD_FORMS.length})` },
            { key: 'Completed', label: `✓ Filled (${stats.completedCount})` },
            { key: 'Pending', label: `⏳ Pending (${stats.pendingCount})` }
          ].map(tab => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0369a1' : '#64748b',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '500',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="#0284c7" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pr-select"
              style={{ height: '34px', fontSize: '12px', width: '190px', borderRadius: '6px' }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search forms..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-input"
              style={{ height: '34px', paddingLeft: '30px', fontSize: '12px', borderRadius: '6px' }}
            />
          </div>

        </div>
      </div>

      {/* 5. Master MRD Checklist Table */}
      <div style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        
        {/* Table Top Bar */}
        <div style={{ 
          padding: '12px 18px', 
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
              Clinical Records & Documentation Checklist
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Showing {filteredForms.length} of {ALL_MRD_FORMS.length} Available Hospital Forms
            </span>
          </div>
          {selectedPatient && (
            <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '700', backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: '6px' }}>
              Patient: {selectedPatient.patientName} (IP: {selectedPatient.ipNo})
            </div>
          )}
        </div>

        <div className="pr-table-responsive" style={{ margin: 0 }}>
          <table className="pr-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ width: '70px', textAlign: 'center', padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>S.NO</th>
                <th style={{ width: '170px', textAlign: 'center', padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>STATUS</th>
                <th style={{ padding: '10px 18px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>FORM / RECORD NAME</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
                    No forms match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredForms.map((form, idx) => {
                  const { isFilled } = getFormStatus(form);

                  return (
                    <tr 
                      key={form.id}
                      style={{
                        backgroundColor: isFilled ? '#f0fdf4' : (idx % 2 === 1 ? '#fafafa' : '#ffffff'),
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onClick={() => handleNavigateToForm(form.id)}
                      title={`Click to open ${form.name}`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isFilled ? '#dcfce7' : '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isFilled ? '#f0fdf4' : (idx % 2 === 1 ? '#fafafa' : '#ffffff');
                      }}
                    >
                      {/* S.No */}
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '12.5px', padding: '11px 14px' }}>
                        {idx + 1}
                      </td>

                      {/* Status Badge with Checkmark */}
                      <td style={{ textAlign: 'center', padding: '11px 14px' }}>
                        {isFilled ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            padding: '3px 12px',
                            borderRadius: '16px',
                            fontSize: '11.5px',
                            fontWeight: '700'
                          }}>
                            <Check size={14} strokeWidth={3} />
                            <span>Filled & Saved</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #cbd5e1',
                            padding: '3px 12px',
                            borderRadius: '16px',
                            fontSize: '11.5px',
                            fontWeight: '600'
                          }}>
                            <span>— Pending</span>
                          </div>
                        )}
                      </td>

                      {/* Form Name */}
                      <td style={{ padding: '11px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              fontWeight: '700', 
                              color: isFilled ? '#0f172a' : '#334155',
                              fontSize: '13.5px'
                            }}>
                              {form.name}
                            </span>
                            
                            <span style={{ 
                              fontSize: '10.5px', 
                              fontWeight: '600', 
                              color: '#64748b', 
                              backgroundColor: '#f1f5f9',
                              padding: '1px 7px',
                              borderRadius: '4px'
                            }}>
                              {form.category}
                            </span>

                            {form.requiredForDischarge && (
                              <span style={{ 
                                fontSize: '9.5px', 
                                backgroundColor: '#fee2e2', 
                                color: '#b91c1c', 
                                fontWeight: '700', 
                                padding: '1px 5px', 
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}>
                                Core
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600', opacity: 0.8 }} className="no-print">
                            Open Form ↗
                          </span>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
