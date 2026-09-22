import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'nursing_initial_assessment_obstetrics';

const INITIAL_MEDICATIONS = Array.from({ length: 6 }, () => ({
  dateTime: '',
  drugName: '',
  dose: '',
  route: '',
  givenBy: '',
  remarks: ''
}));

export default function NursingInitialAssessmentObstetricsPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    // Page 1: A. PATIENT IDENTIFICATION & ADMISSION DETAILS
    patientName: '',
    age: '',
    sex: 'Female',
    uhidNo: '',
    ipNo: '',
    wardBed: '',
    dateOfAdmission: new Date().toISOString().split('T')[0],
    timeOfAdmission: new Date().toTimeString().slice(0, 5),
    timeNurseAssessed: new Date().toTimeString().slice(0, 5),
    consultant: '',
    informantRelationship: '',
    admittedFrom: '', // Casualty/Emergency, OPD, Labour room, OT/recovery, Referred from other hospital
    modeOfArrival: '', // Ambulant, Wheelchair, Trolley/stretcher, Ambulance
    accompaniedBy: '', // Husband, Mother/mother-in-law, Other relative, Unaccompanied
    idBandApplied: 'Yes',
    caseFileMcpCardReceived: 'Yes',
    attenderContactVerified: 'Yes',

    // ALLERGIES & ALERTS
    allergyType: 'No known allergy', // 'No known allergy' | 'Yes'
    allergyDetails: '',
    alertRhNegative: false,
    alertHighRiskPregnancy: false,
    alertPreviousLSCS: false,
    alertDiabetic: false,
    alertHypertensive: false,
    alertSeizureRisk: false,
    alertInfectionIsolation: false,
    alertNil: false,
    allergyBandApplied: 'NA',
    informedDoctor: false,
    informedPharmacy: false,
    informedDietician: false,

    // B. VITAL SIGNS & ANTHROPOMETRY ON ADMISSION
    bpSystolic: '',
    bpDiastolic: '',
    pulse: '',
    respiratoryRate: '',
    temperature: '',
    spO2: '',
    grbs: '',
    height: '',
    weight: '',
    bmi: '',
    painScore: '',
    urineOutput: '',
    vitalsAbnormal: 'No',
    vitalsInformedTime: '',
    vitalsInformedDoctorName: '',

    // C. OBSTETRIC DATA
    lmp: '',
    edd: '',
    gestationalWeeks: '',
    gestationalDays: '',
    gravida: '',
    para: '',
    living: '',
    abortions: '',
    ectopic: '',
    deaths: '',
    bloodGroupRh: '',
    ancStatus: 'Booked here', // Booked here, Booked elsewhere, Unbooked
    previousLSCS: 'No',
    previousLSCSDetails: '',
    tdDoses: 'Complete', // Complete, Incomplete

    // D. REASON FOR ADMISSION / COMPLAINTS
    reasonForAdmission: '',

    // E. BRIEF HISTORY
    illnessNil: false,
    illnessHypertension: false,
    illnessDiabetes: false,
    illnessThyroid: false,
    illnessCardiac: false,
    illnessAsthma: false,
    illnessEpilepsy: false,
    illnessTuberculosis: false,
    illnessAnaemia: false,
    illnessJaundice: false,
    illnessOthers: false,
    illnessOthersDetails: '',
    previousSurgeryHospitalisation: 'No',
    previousSurgeryDetails: '',
    bloodTransfusionPast: 'No',
    medicationsTakenAtHome: '',
    habitNil: false,
    habitTobacco: false,
    habitAlcohol: false,
    habitOther: false,

    // Page 2: F. OBSTETRIC NURSING ASSESSMENT
    uterineContractions: 'Absent', // Absent, Present
    contractionsFrequency: '',
    contractionsDuration: '',
    leakingPV: 'No',
    leakingPVSince: '',
    liquorColourOdour: 'Clear', // Clear, Meconium, Blood-stained, Foul
    showStatus: 'Absent',
    bearingDownSensation: 'No',
    dangerNil: false,
    dangerSevereHeadache: false,
    dangerBlurringVision: false,
    dangerEpigastricPain: false,
    dangerConvulsions: false,
    dangerBreathlessness: false,
    dangerHeavyBleeding: false,
    dangerHighFever: false,
    dangerDoctorInformedTime: '',
    dangerDoctorName: '',
    fetalMovements: 'Good', // Good, Reduced, Absent
    fhrBpm: '',
    fhrRhythm: 'Regular', // Regular, Irregular
    bleedingPV: 'No',
    bleedingPVAmount: 'Spotting', // Spotting, Moderate, Heavy
    bleedingPVPadsUsed: '',
    membranesStatus: 'Intact', // Intact, Ruptured
    membranesRupturedTime: '',
    perinealPadApplied: 'Yes',

    // G. GENERAL NURSING ASSESSMENT
    levelOfConsciousness: 'Alert & oriented', // Alert & oriented, Drowsy, Confused, Unresponsive
    gcsE: '',
    gcsV: '',
    gcsM: '',
    gcsTotal: '',
    skinIntegrity: 'Intact', // Intact, Dry, Bruise, Rash, Wound / ulcer, Surgical scar
    skinDescription: '',
    respiratoryStatus: 'Normal', // Normal, Dyspnoea, Tachypnoea, Cough, Wheeze
    oxygenSupport: 'Not required', // Not required, Nasal prongs, Mask
    oxygenLiters: '',
    observationPallor: false,
    observationIcterus: false,
    observationPedalOedema: false,
    observationGeneralisedOedema: false,
    observationDehydration: false,
    observationNil: false,
    ivCannula: 'Not sited', // Not sited, Sited
    ivCannulaSiteGauge: '',
    otherGeneralFindings: '',

    // H. ELIMINATION, NUTRITION, MOBILITY & SLEEP
    bladderStatus: 'Normal', // Normal, Burning, Retention, Incontinence
    catheterStatus: 'No',
    catheterInsertedDate: '',
    bowelStatus: 'Regular', // Regular, Constipation, Diarrhoea
    lastBowelMovement: '',
    dietPreference: 'Vegetarian', // Vegetarian, Mixed
    appetite: 'Normal', // Normal, Reduced
    lastMealTime: '',
    npoStatus: 'No',
    npoSinceTime: '',
    nauseaVomiting: 'No',
    mobilityStatus: 'Independent', // Independent, Needs support, Bed-bound
    mobilityAids: 'None',
    sleepQuality: 'Adequate', // Adequate, Disturbed
    prosthesisDentures: 'None',
    prosthesisDetails: '',

    // I. PSYCHOSOCIAL, COMMUNICATION & CULTURAL NEEDS
    emotionalState: 'Calm', // Calm, Anxious, Fearful, Tearful, Irritable
    communicationStatus: 'Yes', // Yes, Hearing impaired, Speech difficulty, Language barrier
    languagePreferred: '',
    supportPerson: 'Available', // Available, Not available
    supportPersonName: '',
    religiousDietaryPref: 'None stated',
    religiousPrefDetails: '',
    eduNeedLabour: false,
    eduNeedBreastfeeding: false,
    eduNeedDiet: false,
    eduNeedMedication: false,
    eduNeedPostnatal: false,

    // J. IF ADMITTED AFTER DELIVERY / OPERATION
    postnatalUterus: 'NA', // Well contracted, Atonic, NA
    postnatalLochia: 'NA', // Normal, Excessive, Foul smelling, NA
    postnatalPerineum: 'NA', // Healthy, Gaping, Soaked dressing, NA
    postnatalBabyLocation: 'NA', // Yes, In NICU, NA
    postnatalBreastfeeding: 'NA', // Established, Difficulty, NA
    postnatalCatheterDrain: 'No',
    postnatalCatheterDetails: '',

    // Page 3: K. PAIN ASSESSMENT
    painScoreRating: 0,
    painSite: '',
    painType: 'Continuous', // Intermittent (labour), Continuous, Cramping, Burning
    painActionNonPharm: false,
    painActionDoctorInformed: false,
    painActionAnalgesiaGiven: false,
    painReassessmentDueTime: '',

    // L. RISK ASSESSMENT & SAFETY
    fallRiskHistory: false,
    fallRiskDizziness: false,
    fallRiskSedatives: false,
    fallRiskImpairedVision: false,
    fallRiskIVLine: false,
    fallRiskAdvancedGestation: false,
    fallRiskLevel: 'Low', // Low, Moderate, High
    fallPrecautionBedRails: false,
    fallPrecautionLowBed: false,
    fallPrecautionCallBell: false,
    fallPrecautionSign: false,
    fallPrecautionAssistedAmbulation: false,
    fallPrecautionNonSlipFootwear: false,

    pressureSoreProlongedBedRest: false,
    pressureSoreReducedMobility: false,
    pressureSoreIncontinence: false,
    pressureSorePoorNutrition: false,
    pressureSoreOedema: false,
    pressureSoreEpidural: false,
    pressureSorePresent: 'No',
    pressureSoreSiteStage: '',
    pressurePrecaution2HrChange: false,
    pressurePrecautionAirMattress: false,
    pressurePrecautionSkinCare: false,
    pressurePrecautionHeelProtection: false,

    vteAgeOver35: false,
    vteBmiOver30: false,
    vteImmobility: false,
    vtePreviousVTE: false,
    vteVaricoseVeins: false,
    vtePostOperative: false,
    vteMultiplePregnancy: false,
    vteDehydration: false,
    vteRiskLevel: 'Low', // Low, Moderate, High
    vtePrecautionEarlyAmbulation: false,
    vtePrecautionLegExercises: false,
    vtePrecautionHydration: false,
    vtePrecautionStockings: false,
    vtePrecautionLMWH: false,

    vulnerablePatient: 'No',
    vulnerableReason: '',
    restraintsUsed: 'Not used',
    restraintsTypeReason: '',
    restraintConsentTaken: 'No',
    restraintDoctorOrder: 'No',
    infectionStandard: false,
    infectionContact: false,
    infectionDroplet: false,
    infectionIsolation: false,
    specialCareAdditionalPrecautions: '',

    // M. MEDICATIONS GIVEN IN CASUALTY
    casualtyMedications: INITIAL_MEDICATIONS,
    homeMedicationsBrought: 'No',
    homeMedicationsHandedTo: 'Relative', // Relative, Pharmacy, Retained with consent

    // Nurse Handover Sign
    nurseName: '',
    nurseSignDate: new Date().toISOString().split('T')[0],
    nurseSignTime: new Date().toTimeString().slice(0, 5)
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      if (key === 'casualtyMedications') {
        sanitized.casualtyMedications = Array.isArray(data.casualtyMedications) && data.casualtyMedications.length === 6
          ? data.casualtyMedications
          : INITIAL_MEDICATIONS;
      } else {
        sanitized[key] = data[key] ?? '';
      }
    }
    return sanitized;
  };

  useEffect(() => {
    if (editData) {
      setForm(prev => ({ ...prev, ...sanitizeFormData(editData) }));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.form) setForm(f => ({ ...f, ...sanitizeFormData(saved.form) }));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = { form, recordId };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.reasonForAdmission;
      const patientHeader = {
        name: form.patientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.wardBed
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Nursing Initial Assessment - Obstetrics', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  // Auto-resize textareas dynamically
  useEffect(() => {
    const adjustHeight = () => {
      document.querySelectorAll('textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    };
    adjustHeight();
    const t = setTimeout(adjustHeight, 50);
    return () => clearTimeout(t);
  }, [form, currentPage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.casualtyMedications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, casualtyMedications: updated };
    });
  };

  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setForm(prev => ({
        ...prev,
        patientName: found.patientName || prev.patientName,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        wardBed: found.ward && found.bedNo ? `${found.ward} / ${found.bedNo}` : (found.ward || prev.wardBed)
      }));
    }
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  const handleSave = () => {
    const patientHeader = {
      name: form.patientName || 'Patient',
      ipNo: form.ipNo,
      uhidNo: form.uhidNo,
      ward: form.wardBed
    };

    const newId = upsertFormRecord(recordId, 'Nursing Initial Assessment - Obstetrics', patientHeader, { form, recordId });
    if (newId) {
      setRecordId(newId);
      setToastMsg('Record saved successfully!');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset this form? All unsaved data will be cleared.')) {
      clearPersistedForm(PERSIST_KEY);
      setRecordId(null);
      setForm({
        patientName: '', age: '', sex: 'Female', uhidNo: '', ipNo: '', wardBed: '',
        dateOfAdmission: new Date().toISOString().split('T')[0],
        timeOfAdmission: new Date().toTimeString().slice(0, 5),
        timeNurseAssessed: new Date().toTimeString().slice(0, 5),
        consultant: '', informantRelationship: '', admittedFrom: '', modeOfArrival: '', accompaniedBy: '',
        idBandApplied: 'Yes', caseFileMcpCardReceived: 'Yes', attenderContactVerified: 'Yes',
        allergyType: 'No known allergy', allergyDetails: '', alertRhNegative: false, alertHighRiskPregnancy: false,
        alertPreviousLSCS: false, alertDiabetic: false, alertHypertensive: false, alertSeizureRisk: false,
        alertInfectionIsolation: false, alertNil: false, allergyBandApplied: 'NA', informedDoctor: false, informedPharmacy: false, informedDietician: false,
        bpSystolic: '', bpDiastolic: '', pulse: '', respiratoryRate: '', temperature: '', spO2: '', grbs: '', height: '', weight: '', bmi: '', painScore: '', urineOutput: '', vitalsAbnormal: 'No', vitalsInformedTime: '', vitalsInformedDoctorName: '',
        lmp: '', edd: '', gestationalWeeks: '', gestationalDays: '', gravida: '', para: '', living: '', abortions: '', ectopic: '', deaths: '', bloodGroupRh: '', ancStatus: 'Booked here', previousLSCS: 'No', previousLSCSDetails: '', tdDoses: 'Complete',
        reasonForAdmission: '', illnessNil: false, illnessHypertension: false, illnessDiabetes: false, illnessThyroid: false, illnessCardiac: false, illnessAsthma: false, illnessEpilepsy: false, illnessTuberculosis: false, illnessAnaemia: false, illnessJaundice: false, illnessOthers: false, illnessOthersDetails: '', previousSurgeryHospitalisation: 'No', previousSurgeryDetails: '', bloodTransfusionPast: 'No', medicationsTakenAtHome: '', habitNil: false, habitTobacco: false, habitAlcohol: false, habitOther: false,
        uterineContractions: 'Absent', contractionsFrequency: '', contractionsDuration: '', leakingPV: 'No', leakingPVSince: '', liquorColourOdour: 'Clear', showStatus: 'Absent', bearingDownSensation: 'No', dangerNil: false, dangerSevereHeadache: false, dangerBlurringVision: false, dangerEpigastricPain: false, dangerConvulsions: false, dangerBreathlessness: false, dangerHeavyBleeding: false, dangerHighFever: false, dangerDoctorInformedTime: '', dangerDoctorName: '', fetalMovements: 'Good', fhrBpm: '', fhrRhythm: 'Regular', bleedingPV: 'No', bleedingPVAmount: 'Spotting', bleedingPVPadsUsed: '', membranesStatus: 'Intact', membranesRupturedTime: '', perinealPadApplied: 'Yes',
        levelOfConsciousness: 'Alert & oriented', gcsE: '', gcsV: '', gcsM: '', gcsTotal: '', skinIntegrity: 'Intact', skinDescription: '', respiratoryStatus: 'Normal', oxygenSupport: 'Not required', oxygenLiters: '', observationPallor: false, observationIcterus: false, observationPedalOedema: false, observationGeneralisedOedema: false, observationDehydration: false, observationNil: false, ivCannula: 'Not sited', ivCannulaSiteGauge: '', otherGeneralFindings: '',
        bladderStatus: 'Normal', catheterStatus: 'No', catheterInsertedDate: '', bowelStatus: 'Regular', lastBowelMovement: '', dietPreference: 'Vegetarian', appetite: 'Normal', lastMealTime: '', npoStatus: 'No', npoSinceTime: '', nauseaVomiting: 'No', mobilityStatus: 'Independent', mobilityAids: 'None', sleepQuality: 'Adequate', prosthesisDentures: 'None', prosthesisDetails: '',
        emotionalState: 'Calm', communicationStatus: 'Yes', languagePreferred: '', supportPerson: 'Available', supportPersonName: '', religiousDietaryPref: 'None stated', religiousPrefDetails: '', eduNeedLabour: false, eduNeedBreastfeeding: false, eduNeedDiet: false, eduNeedMedication: false, eduNeedPostnatal: false,
        postnatalUterus: 'NA', postnatalLochia: 'NA', postnatalPerineum: 'NA', postnatalBabyLocation: 'NA', postnatalBreastfeeding: 'NA', postnatalCatheterDrain: 'No', postnatalCatheterDetails: '',
        painScoreRating: 0, painSite: '', painType: 'Continuous', painActionNonPharm: false, painActionDoctorInformed: false, painActionAnalgesiaGiven: false, painReassessmentDueTime: '',
        fallRiskHistory: false, fallRiskDizziness: false, fallRiskSedatives: false, fallRiskImpairedVision: false, fallRiskIVLine: false, fallRiskAdvancedGestation: false, fallRiskLevel: 'Low', fallPrecautionBedRails: false, fallPrecautionLowBed: false, fallPrecautionCallBell: false, fallPrecautionSign: false, fallPrecautionAssistedAmbulation: false, fallPrecautionNonSlipFootwear: false,
        pressureSoreProlongedBedRest: false, pressureSoreReducedMobility: false, pressureSoreIncontinence: false, pressureSorePoorNutrition: false, pressureSoreOedema: false, pressureSoreEpidural: false, pressureSorePresent: 'No', pressureSoreSiteStage: '', pressurePrecaution2HrChange: false, pressurePrecautionAirMattress: false, pressurePrecautionSkinCare: false, pressurePrecautionHeelProtection: false,
        vteAgeOver35: false, vteBmiOver30: false, vteImmobility: false, vtePreviousVTE: false, vteVaricoseVeins: false, vtePostOperative: false, vteMultiplePregnancy: false, vteDehydration: false, vteRiskLevel: 'Low', vtePrecautionEarlyAmbulation: false, vtePrecautionLegExercises: false, vtePrecautionHydration: false, vtePrecautionStockings: false, vtePrecautionLMWH: false,
        vulnerablePatient: 'No', vulnerableReason: '', restraintsUsed: 'Not used', restraintsTypeReason: '', restraintConsentTaken: 'No', restraintDoctorOrder: 'No', infectionStandard: false, infectionContact: false, infectionDroplet: false, infectionIsolation: false, specialCareAdditionalPrecautions: '',
        casualtyMedications: INITIAL_MEDICATIONS, homeMedicationsBrought: 'No', homeMedicationsHandedTo: 'Relative',
        nurseName: '', nurseSignDate: new Date().toISOString().split('T')[0], nurseSignTime: new Date().toTimeString().slice(0, 5)
      });
      setCurrentPage(1);
      setToastMsg('Form cleared.');
      setTimeout(() => setToastMsg(''), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="paper-consent-wrapper full-width-layout">
      {/* Top Page Action Header Bar */}
      <div className="no-print page-header-row">
        <div className="page-title-group">
          <div className="title-icon-badge">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="page-title">NURSING INITIAL ASSESSMENT – OBSTETRICS</h1>
            <p className="page-subtitle">ನರ್ಸಿಂಗ್ ಆರಂಭಿಕ ಮೌಲ್ಯಮಾಪನ – ಪ್ರಸೂತಿಶಾಸ್ತ್ರ</p>
          </div>
        </div>

        <div className="page-actions">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint} style={{ backgroundColor: '#0284c7' }}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className={`no-print ${toastMsg.startsWith('⚠️') ? 'alert-warning-toast' : 'alert-success-toast'}`} style={{ marginBottom: '15px' }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SINGLE PAGE FULL WIDTH DOCUMENT SHEET */}
      <div className="single-page-fullwidth-sheet">
        {/* PAGE 1 CONTENT */}
        <div className={`obs-page-sheet obs-print-page-1 ${currentPage !== 1 ? 'obs-hide-on-screen' : ''}`}>
          <HospitalPaperHeader />

          <div className="form-banner-header">
            <h2>NURSING INITIAL ASSESSMENT – OBSTETRICS</h2>
            <h3 style={{ fontSize: '11px', fontWeight: 'normal', fontStyle: 'italic', marginTop: '3px' }}>
              To be completed by the receiving nurse within 30 minutes of admission and filed with the Obstetric Inpatient Case File
            </h3>
          </div>

          {/* A. PATIENT IDENTIFICATION & ADMISSION DETAILS */}
          <div style={{ fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            A. PATIENT IDENTIFICATION &amp; ADMISSION DETAILS
          </div>

          <table className="patient-info-table">
            <colgroup>
              <col style={{ width: '33%' }} />
              <col style={{ width: '33%' }} />
              <col style={{ width: '34%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Name of the Patient :</span>
                    <input type="text" name="patientName" value={form.patientName} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Age :</span>
                    <input type="text" name="age" value={form.age} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Sex :</span>
                    <select name="sex" value={form.sex} onChange={handleChange} className="tbl-select">
                      <option value="Female">F / Female</option>
                      <option value="Male">M / Male</option>
                    </select>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">UHID No. :</span>
                    <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">IP No. :</span>
                    <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Ward / Bed No :</span>
                    <input type="text" name="wardBed" value={form.wardBed} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Date of admission :</span>
                    <input type="date" name="dateOfAdmission" value={form.dateOfAdmission} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Time of admission :</span>
                    <input type="time" name="timeOfAdmission" value={form.timeOfAdmission} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Time nurse assessed :</span>
                    <input type="time" name="timeNurseAssessed" value={form.timeNurseAssessed} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan="2">
                  <div className="tbl-field">
                    <span className="tbl-lbl">Consultant :</span>
                    <input type="text" name="consultant" value={form.consultant} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Informant &amp; relationship :</span>
                    <input type="text" name="informantRelationship" value={form.informantRelationship} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Admission Options Box */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px', padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontWeight: 'bold' }}>Admitted from :</span>
              {['Casualty / Emergency', 'OPD', 'Labour room', 'OT / recovery', 'Referred from other hospital'].map(opt => (
                <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.admittedFrom === opt} onChange={() => setForm(p => ({ ...p, admittedFrom: p.admittedFrom === opt ? '' : opt }))} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
              <span style={{ fontWeight: 'bold' }}>Mode of arrival :</span>
              {['Ambulant', 'Wheelchair', 'Trolley / stretcher', 'Ambulance'].map(opt => (
                <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.modeOfArrival === opt} onChange={() => setForm(p => ({ ...p, modeOfArrival: p.modeOfArrival === opt ? '' : opt }))} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
              <span style={{ fontWeight: 'bold' }}>Accompanied by :</span>
              {['Husband', 'Mother / mother-in-law', 'Other relative', 'Unaccompanied'].map(opt => (
                <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.accompaniedBy === opt} onChange={() => setForm(p => ({ ...p, accompaniedBy: p.accompaniedBy === opt ? '' : opt }))} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>ID band applied :</span>
                <label><input type="radio" name="idBandApplied" value="Yes" checked={form.idBandApplied === 'Yes'} onChange={handleChange} /> Yes</label>
                <label><input type="radio" name="idBandApplied" value="No" checked={form.idBandApplied === 'No'} onChange={handleChange} /> No</label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Case file &amp; MCP card received :</span>
                <label><input type="radio" name="caseFileMcpCardReceived" value="Yes" checked={form.caseFileMcpCardReceived === 'Yes'} onChange={handleChange} /> Yes</label>
                <label><input type="radio" name="caseFileMcpCardReceived" value="No" checked={form.caseFileMcpCardReceived === 'No'} onChange={handleChange} /> No</label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Attender contact no. verified :</span>
                <label><input type="radio" name="attenderContactVerified" value="Yes" checked={form.attenderContactVerified === 'Yes'} onChange={handleChange} /> Yes</label>
                <label><input type="radio" name="attenderContactVerified" value="No" checked={form.attenderContactVerified === 'No'} onChange={handleChange} /> No</label>
              </div>
            </div>
          </div>

          {/* ALLERGIES & ALERTS BOX */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              ALLERGIES &amp; ALERTS
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold' }}>Allergy :</span>
                <label><input type="radio" name="allergyType" value="No known allergy" checked={form.allergyType === 'No known allergy'} onChange={handleChange} /> No known allergy</label>
                <label><input type="radio" name="allergyType" value="Yes" checked={form.allergyType === 'Yes'} onChange={handleChange} /> Yes – drug / food / substance and reaction :</label>
                <input type="text" name="allergyDetails" value={form.allergyDetails} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1, minWidth: '150px' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Alerts :</span>
                {[
                  { name: 'alertRhNegative', label: 'Rh negative' },
                  { name: 'alertHighRiskPregnancy', label: 'High-risk pregnancy' },
                  { name: 'alertPreviousLSCS', label: 'Previous LSCS' },
                  { name: 'alertDiabetic', label: 'Diabetic' },
                  { name: 'alertHypertensive', label: 'Hypertensive' },
                  { name: 'alertSeizureRisk', label: 'Seizure risk' },
                  { name: 'alertInfectionIsolation', label: 'Infection / isolation precautions' },
                  { name: 'alertNil', label: 'Nil' }
                ].map(item => (
                  <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Allergy band applied :</span>
                  {['Yes', 'No', 'NA'].map(opt => (
                    <label key={opt}><input type="radio" name="allergyBandApplied" value={opt} checked={form.allergyBandApplied === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Informed to :</span>
                  <label><input type="checkbox" name="informedDoctor" checked={form.informedDoctor} onChange={handleChange} /> Doctor</label>
                  <label><input type="checkbox" name="informedPharmacy" checked={form.informedPharmacy} onChange={handleChange} /> Pharmacy</label>
                  <label><input type="checkbox" name="informedDietician" checked={form.informedDietician} onChange={handleChange} /> Dietician</label>
                </div>
              </div>
            </div>
          </div>

          {/* B. VITAL SIGNS & ANTHROPOMETRY ON ADMISSION */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              B. VITAL SIGNS &amp; ANTHROPOMETRY ON ADMISSION
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <div>BP : <input type="text" name="bpSystolic" value={form.bpSystolic} onChange={handleChange} style={{ width: '45px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> / <input type="text" name="bpDiastolic" value={form.bpDiastolic} onChange={handleChange} style={{ width: '45px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> mmHg</div>
                <div>Pulse : <input type="text" name="pulse" value={form.pulse} onChange={handleChange} style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> /min</div>
                <div>Respiratory rate : <input type="text" name="respiratoryRate" value={form.respiratoryRate} onChange={handleChange} style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> /min</div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div>Temperature : <input type="text" name="temperature" value={form.temperature} onChange={handleChange} style={{ width: '55px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> °F</div>
                <div>SpO2 : <input type="text" name="spO2" value={form.spO2} onChange={handleChange} style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> % on room air</div>
                <div>GRBS (if done) : <input type="text" name="grbs" value={form.grbs} onChange={handleChange} style={{ width: '60px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> mg/dL</div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div>Height : <input type="text" name="height" value={form.height} onChange={handleChange} style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> cm</div>
                <div>Weight : <input type="text" name="weight" value={form.weight} onChange={handleChange} style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> kg</div>
                <div>BMI : <input type="text" name="bmi" value={form.bmi} onChange={handleChange} style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
                <div>Pain score : <input type="text" name="painScore" value={form.painScore} onChange={handleChange} style={{ width: '40px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> /10</div>
                <div>Urine output : <input type="text" name="urineOutput" value={form.urineOutput} onChange={handleChange} style={{ width: '70px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Vitals abnormal / outside limits :</span>
                <label><input type="radio" name="vitalsAbnormal" value="No" checked={form.vitalsAbnormal === 'No'} onChange={handleChange} /> No</label>
                <label><input type="radio" name="vitalsAbnormal" value="Yes" checked={form.vitalsAbnormal === 'Yes'} onChange={handleChange} /> Yes -&gt; doctor informed at</label>
                <input type="time" name="vitalsInformedTime" value={form.vitalsInformedTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
                <span>name :</span>
                <input type="text" name="vitalsInformedDoctorName" value={form.vitalsInformedDoctorName} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1, minWidth: '120px' }} />
              </div>
            </div>
          </div>

          {/* C. OBSTETRIC DATA */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              C. OBSTETRIC DATA (from case file / MCP card)
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <div>LMP : <input type="date" name="lmp" value={form.lmp} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} /></div>
                <div>EDD : <input type="date" name="edd" value={form.edd} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} /></div>
                <div>Gestational age : <input type="text" name="gestationalWeeks" value={form.gestationalWeeks} onChange={handleChange} style={{ width: '40px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> wks <input type="text" name="gestationalDays" value={form.gestationalDays} onChange={handleChange} style={{ width: '40px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> d</div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Obstetric formula :</span>
                <div>G <input type="text" name="gravida" value={form.gravida} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
                <div>P <input type="text" name="para" value={form.para} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
                <div>L <input type="text" name="living" value={form.living} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
                <div>A <input type="text" name="abortions" value={form.abortions} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
                <div>E <input type="text" name="ectopic" value={form.ectopic} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
                <div>D <input type="text" name="deaths" value={form.deaths} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /></div>
                <div style={{ marginLeft: '12px' }}>Blood group &amp; Rh : <input type="text" name="bloodGroupRh" value={form.bloodGroupRh} onChange={handleChange} style={{ width: '90px', border: 'none', borderBottom: '1px solid #000', outline: 'none' }} /></div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>ANC :</span>
                  {['Booked here', 'Booked elsewhere', 'Unbooked'].map(opt => (
                    <label key={opt}><input type="radio" name="ancStatus" value={opt} checked={form.ancStatus === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Previous LSCS :</span>
                  <label><input type="radio" name="previousLSCS" value="No" checked={form.previousLSCS === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="previousLSCS" value="Yes" checked={form.previousLSCS === 'Yes'} onChange={handleChange} /> Yes -&gt;</label>
                  <input type="text" name="previousLSCSDetails" value={form.previousLSCSDetails} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '120px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Td doses :</span>
                  <label><input type="radio" name="tdDoses" value="Complete" checked={form.tdDoses === 'Complete'} onChange={handleChange} /> Complete</label>
                  <label><input type="radio" name="tdDoses" value="Incomplete" checked={form.tdDoses === 'Incomplete'} onChange={handleChange} /> Incomplete</label>
                </div>
              </div>
            </div>
          </div>

          {/* D. REASON FOR ADMISSION / COMPLAINTS */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              D. REASON FOR ADMISSION / COMPLAINTS (in the patient's own words, with duration)
            </div>
            <div style={{ padding: '8px 10px' }}>
              <textarea
                name="reasonForAdmission"
                value={form.reasonForAdmission}
                onChange={handleChange}
                rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', overflow: 'hidden', fontSize: '12px', fontFamily: 'inherit' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
          </div>

          {/* E. BRIEF HISTORY AS GIVEN BY THE PATIENT / RELATIVE */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              E. BRIEF HISTORY AS GIVEN BY THE PATIENT / RELATIVE
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Known illnesses :</span>
                {[
                  { name: 'illnessNil', label: 'Nil' },
                  { name: 'illnessHypertension', label: 'Hypertension' },
                  { name: 'illnessDiabetes', label: 'Diabetes' },
                  { name: 'illnessThyroid', label: 'Thyroid' },
                  { name: 'illnessCardiac', label: 'Cardiac' },
                  { name: 'illnessAsthma', label: 'Asthma' },
                  { name: 'illnessEpilepsy', label: 'Epilepsy' },
                  { name: 'illnessTuberculosis', label: 'Tuberculosis' },
                  { name: 'illnessAnaemia', label: 'Anaemia' },
                  { name: 'illnessJaundice', label: 'Jaundice' },
                  { name: 'illnessOthers', label: 'Others' }
                ].map(item => (
                  <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                    <span>{item.label}</span>
                  </label>
                ))}
                <span>Details :</span>
                <input type="text" name="illnessOthersDetails" value={form.illnessOthersDetails} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1, minWidth: '120px' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Previous surgery / hospitalisation :</span>
                  <label><input type="radio" name="previousSurgeryHospitalisation" value="No" checked={form.previousSurgeryHospitalisation === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="previousSurgeryHospitalisation" value="Yes" checked={form.previousSurgeryHospitalisation === 'Yes'} onChange={handleChange} /> Yes -&gt;</label>
                  <input type="text" name="previousSurgeryDetails" value={form.previousSurgeryDetails} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '150px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Blood transfusion in the past :</span>
                  <label><input type="radio" name="bloodTransfusionPast" value="No" checked={form.bloodTransfusionPast === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="bloodTransfusionPast" value="Yes" checked={form.bloodTransfusionPast === 'Yes'} onChange={handleChange} /> Yes</label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Medications being taken at home :</span>
                <input type="text" name="medicationsTakenAtHome" value={form.medicationsTakenAtHome} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1 }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Habits :</span>
                {[
                  { name: 'habitNil', label: 'Nil' },
                  { name: 'habitTobacco', label: 'Tobacco' },
                  { name: 'habitAlcohol', label: 'Alcohol' },
                  { name: 'habitOther', label: 'Other' }
                ].map(item => (
                  <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2 CONTENT */}
        <div className={`obs-page-sheet obs-print-page-2 ${currentPage !== 2 ? 'obs-hide-on-screen' : ''}`}>
          <div className="no-screen-print-only">
            <HospitalPaperHeader />
          </div>

          {/* F. OBSTETRIC NURSING ASSESSMENT */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              F. OBSTETRIC NURSING ASSESSMENT
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 'bold' }}>Uterine contractions :</span>
                <label><input type="radio" name="uterineContractions" value="Absent" checked={form.uterineContractions === 'Absent'} onChange={handleChange} /> Absent</label>
                <label><input type="radio" name="uterineContractions" value="Present" checked={form.uterineContractions === 'Present'} onChange={handleChange} /> Present</label>
                <span>Frequency : <input type="text" name="contractionsFrequency" value={form.contractionsFrequency} onChange={handleChange} style={{ width: '40px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> in 10 min</span>
                <span>Duration : <input type="text" name="contractionsDuration" value={form.contractionsDuration} onChange={handleChange} style={{ width: '40px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> sec</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Leaking PV :</span>
                  <label><input type="radio" name="leakingPV" value="No" checked={form.leakingPV === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="leakingPV" value="Yes" checked={form.leakingPV === 'Yes'} onChange={handleChange} /> Yes -&gt; since</label>
                  <input type="text" name="leakingPVSince" value={form.leakingPVSince} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '100px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Colour / odour of liquor :</span>
                  {['Clear', 'Meconium', 'Blood-stained', 'Foul'].map(opt => (
                    <label key={opt}><input type="radio" name="liquorColourOdour" value={opt} checked={form.liquorColourOdour === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Show :</span>
                  <label><input type="radio" name="showStatus" value="Present" checked={form.showStatus === 'Present'} onChange={handleChange} /> Present</label>
                  <label><input type="radio" name="showStatus" value="Absent" checked={form.showStatus === 'Absent'} onChange={handleChange} /> Absent</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Bearing-down sensation :</span>
                  <label><input type="radio" name="bearingDownSensation" value="Yes" checked={form.bearingDownSensation === 'Yes'} onChange={handleChange} /> Yes</label>
                  <label><input type="radio" name="bearingDownSensation" value="No" checked={form.bearingDownSensation === 'No'} onChange={handleChange} /> No</label>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Danger signs observed :</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { name: 'dangerNil', label: 'Nil' },
                    { name: 'dangerSevereHeadache', label: 'Severe headache' },
                    { name: 'dangerBlurringVision', label: 'Blurring of vision' },
                    { name: 'dangerEpigastricPain', label: 'Epigastric pain' },
                    { name: 'dangerConvulsions', label: 'Convulsions' },
                    { name: 'dangerBreathlessness', label: 'Breathlessness' },
                    { name: 'dangerHeavyBleeding', label: 'Heavy bleeding' },
                    { name: 'dangerHighFever', label: 'High fever' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <span>If any present, doctor informed at :</span>
                  <input type="time" name="dangerDoctorInformedTime" value={form.dangerDoctorInformedTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
                  <span>Name of doctor :</span>
                  <input type="text" name="dangerDoctorName" value={form.dangerDoctorName} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1 }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Fetal movements :</span>
                  {['Good', 'Reduced', 'Absent'].map(opt => (
                    <label key={opt}><input type="radio" name="fetalMovements" value={opt} checked={form.fetalMovements === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>FHR :</span>
                  <input type="text" name="fhrBpm" value={form.fhrBpm} onChange={handleChange} style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> bpm
                  <label><input type="radio" name="fhrRhythm" value="Regular" checked={form.fhrRhythm === 'Regular'} onChange={handleChange} /> Regular</label>
                  <label><input type="radio" name="fhrRhythm" value="Irregular" checked={form.fhrRhythm === 'Irregular'} onChange={handleChange} /> Irregular</label>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Bleeding PV :</span>
                  <label><input type="radio" name="bleedingPV" value="No" checked={form.bleedingPV === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="bleedingPV" value="Yes" checked={form.bleedingPV === 'Yes'} onChange={handleChange} /> Yes</label>
                  <span>Amount :</span>
                  {['Spotting', 'Moderate', 'Heavy'].map(opt => (
                    <label key={opt}><input type="radio" name="bleedingPVAmount" value={opt} checked={form.bleedingPVAmount === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                  <span>Pads used :</span>
                  <input type="text" name="bleedingPVPadsUsed" value={form.bleedingPVPadsUsed} onChange={handleChange} style={{ width: '40px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Membranes :</span>
                  <label><input type="radio" name="membranesStatus" value="Intact" checked={form.membranesStatus === 'Intact'} onChange={handleChange} /> Intact</label>
                  <label><input type="radio" name="membranesStatus" value="Ruptured" checked={form.membranesStatus === 'Ruptured'} onChange={handleChange} /> Ruptured -&gt; time :</label>
                  <input type="time" name="membranesRupturedTime" value={form.membranesRupturedTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Perineal pad applied :</span>
                  <label><input type="radio" name="perinealPadApplied" value="Yes" checked={form.perinealPadApplied === 'Yes'} onChange={handleChange} /> Yes</label>
                  <label><input type="radio" name="perinealPadApplied" value="No" checked={form.perinealPadApplied === 'No'} onChange={handleChange} /> No</label>
                </div>
              </div>
            </div>
          </div>

          {/* G. GENERAL NURSING ASSESSMENT */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              G. GENERAL NURSING ASSESSMENT
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 'bold' }}>Level of consciousness :</span>
                {['Alert & oriented', 'Drowsy', 'Confused', 'Unresponsive'].map(opt => (
                  <label key={opt}><input type="radio" name="levelOfConsciousness" value={opt} checked={form.levelOfConsciousness === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span>GCS: E <input type="text" name="gcsE" value={form.gcsE} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center' }} /> V <input type="text" name="gcsV" value={form.gcsV} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center' }} /> M <input type="text" name="gcsM" value={form.gcsM} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center' }} /> Total <input type="text" name="gcsTotal" value={form.gcsTotal} onChange={handleChange} style={{ width: '35px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center' }} /> / 15</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Skin integrity :</span>
                {['Intact', 'Dry', 'Bruise', 'Rash', 'Wound / ulcer', 'Surgical scar'].map(opt => (
                  <label key={opt}><input type="radio" name="skinIntegrity" value={opt} checked={form.skinIntegrity === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span>Site &amp; description :</span>
                <input type="text" name="skinDescription" value={form.skinDescription} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1, minWidth: '120px' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Respiratory status :</span>
                {['Normal', 'Dyspnoea', 'Tachypnoea', 'Cough', 'Wheeze'].map(opt => (
                  <label key={opt}><input type="radio" name="respiratoryStatus" value={opt} checked={form.respiratoryStatus === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Oxygen support :</span>
                <label><input type="radio" name="oxygenSupport" value="Not required" checked={form.oxygenSupport === 'Not required'} onChange={handleChange} /> Not required</label>
                <label><input type="radio" name="oxygenSupport" value="Nasal prongs" checked={form.oxygenSupport === 'Nasal prongs'} onChange={handleChange} /> Nasal prongs</label>
                <input type="text" name="oxygenLiters" value={form.oxygenLiters} onChange={handleChange} style={{ width: '30px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center' }} /> L/min
                <label><input type="radio" name="oxygenSupport" value="Mask" checked={form.oxygenSupport === 'Mask'} onChange={handleChange} /> Mask</label>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>General observation :</span>
                {[
                  { name: 'observationPallor', label: 'Pallor' },
                  { name: 'observationIcterus', label: 'Icterus' },
                  { name: 'observationPedalOedema', label: 'Pedal oedema' },
                  { name: 'observationGeneralisedOedema', label: 'Generalised oedema' },
                  { name: 'observationDehydration', label: 'Dehydration' },
                  { name: 'observationNil', label: 'Nil significant' }
                ].map(item => (
                  <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>IV cannula :</span>
                  <label><input type="radio" name="ivCannula" value="Not sited" checked={form.ivCannula === 'Not sited'} onChange={handleChange} /> Not sited</label>
                  <label><input type="radio" name="ivCannula" value="Sited" checked={form.ivCannula === 'Sited'} onChange={handleChange} /> Sited -&gt; site &amp; gauge :</label>
                  <input type="text" name="ivCannulaSiteGauge" value={form.ivCannulaSiteGauge} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '150px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ fontWeight: 'bold' }}>Any other finding :</span>
                  <input type="text" name="otherGeneralFindings" value={form.otherGeneralFindings} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1 }} />
                </div>
              </div>
            </div>
          </div>

          {/* H. ELIMINATION, NUTRITION, MOBILITY & SLEEP */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              H. ELIMINATION, NUTRITION, MOBILITY &amp; SLEEP
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 'bold' }}>Bladder :</span>
                {['Normal', 'Burning', 'Retention', 'Incontinence'].map(opt => (
                  <label key={opt}><input type="radio" name="bladderStatus" value={opt} checked={form.bladderStatus === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Catheter :</span>
                <label><input type="radio" name="catheterStatus" value="No" checked={form.catheterStatus === 'No'} onChange={handleChange} /> No</label>
                <label><input type="radio" name="catheterStatus" value="Yes" checked={form.catheterStatus === 'Yes'} onChange={handleChange} /> Yes -&gt; inserted on :</label>
                <input type="date" name="catheterInsertedDate" value={form.catheterInsertedDate} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Bowel :</span>
                {['Regular', 'Constipation', 'Diarrhoea'].map(opt => (
                  <label key={opt}><input type="radio" name="bowelStatus" value={opt} checked={form.bowelStatus === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span>Last bowel movement :</span>
                <input type="text" name="lastBowelMovement" value={form.lastBowelMovement} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '120px' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Nutrition &amp; hydration :</span>
                <label><input type="radio" name="dietPreference" value="Vegetarian" checked={form.dietPreference === 'Vegetarian'} onChange={handleChange} /> Vegetarian</label>
                <label><input type="radio" name="dietPreference" value="Mixed" checked={form.dietPreference === 'Mixed'} onChange={handleChange} /> Mixed</label>
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Appetite :</span>
                <label><input type="radio" name="appetite" value="Normal" checked={form.appetite === 'Normal'} onChange={handleChange} /> Normal</label>
                <label><input type="radio" name="appetite" value="Reduced" checked={form.appetite === 'Reduced'} onChange={handleChange} /> Reduced</label>
                <span>Last meal taken at :</span>
                <input type="time" name="lastMealTime" value={form.lastMealTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>NPO :</span>
                <label><input type="radio" name="npoStatus" value="No" checked={form.npoStatus === 'No'} onChange={handleChange} /> No</label>
                <label><input type="radio" name="npoStatus" value="Yes" checked={form.npoStatus === 'Yes'} onChange={handleChange} /> Yes -&gt; since :</label>
                <input type="time" name="npoSinceTime" value={form.npoSinceTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Nausea / vomiting :</span>
                <label><input type="radio" name="nauseaVomiting" value="No" checked={form.nauseaVomiting === 'No'} onChange={handleChange} /> No</label>
                <label><input type="radio" name="nauseaVomiting" value="Yes" checked={form.nauseaVomiting === 'Yes'} onChange={handleChange} /> Yes</label>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Mobility :</span>
                {['Independent', 'Needs support', 'Bed-bound'].map(opt => (
                  <label key={opt}><input type="radio" name="mobilityStatus" value={opt} checked={form.mobilityStatus === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span>Aids :</span>
                {['None', 'Walker', 'Wheelchair'].map(opt => (
                  <label key={opt}><input type="radio" name="mobilityAids" value={opt} checked={form.mobilityAids === opt} onChange={handleChange} /> {opt}</label>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Sleep :</span>
                {['Adequate', 'Disturbed'].map(opt => (
                  <label key={opt}><input type="radio" name="sleepQuality" value={opt} checked={form.sleepQuality === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Prosthesis / dentures / lenses :</span>
                <label><input type="radio" name="prosthesisDentures" value="None" checked={form.prosthesisDentures === 'None'} onChange={handleChange} /> None</label>
                <label><input type="radio" name="prosthesisDentures" value="Yes" checked={form.prosthesisDentures === 'Yes'} onChange={handleChange} /> Yes -&gt;</label>
                <input type="text" name="prosthesisDetails" value={form.prosthesisDetails} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1 }} />
              </div>
            </div>
          </div>

          {/* I. PSYCHOSOCIAL, COMMUNICATION & CULTURAL NEEDS */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              I. PSYCHOSOCIAL, COMMUNICATION &amp; CULTURAL NEEDS
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>Emotional state :</span>
                {['Calm', 'Anxious', 'Fearful', 'Tearful', 'Irritable'].map(opt => (
                  <label key={opt}><input type="radio" name="emotionalState" value={opt} checked={form.emotionalState === opt} onChange={handleChange} /> {opt}</label>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Able to communicate :</span>
                {['Yes', 'Hearing impaired', 'Speech difficulty', 'Language barrier'].map(opt => (
                  <label key={opt}><input type="radio" name="communicationStatus" value={opt} checked={form.communicationStatus === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span>Language preferred :</span>
                <input type="text" name="languagePreferred" value={form.languagePreferred} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '100px' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Support person / birth companion :</span>
                <label><input type="radio" name="supportPerson" value="Available" checked={form.supportPerson === 'Available'} onChange={handleChange} /> Available -&gt; name :</label>
                <input type="text" name="supportPersonName" value={form.supportPersonName} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '130px' }} />
                <label><input type="radio" name="supportPerson" value="Not available" checked={form.supportPerson === 'Not available'} onChange={handleChange} /> Not available</label>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Religious / cultural / dietary preference :</span>
                <label><input type="radio" name="religiousDietaryPref" value="None stated" checked={form.religiousDietaryPref === 'None stated'} onChange={handleChange} /> None stated</label>
                <label><input type="radio" name="religiousDietaryPref" value="Yes" checked={form.religiousDietaryPref === 'Yes'} onChange={handleChange} /> Yes -&gt;</label>
                <input type="text" name="religiousPrefDetails" value={form.religiousPrefDetails} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1 }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Educational need identified :</span>
                <label><input type="checkbox" name="eduNeedLabour" checked={form.eduNeedLabour} onChange={handleChange} /> Labour process</label>
                <label><input type="checkbox" name="eduNeedBreastfeeding" checked={form.eduNeedBreastfeeding} onChange={handleChange} /> Breastfeeding</label>
                <label><input type="checkbox" name="eduNeedDiet" checked={form.eduNeedDiet} onChange={handleChange} /> Diet</label>
                <label><input type="checkbox" name="eduNeedMedication" checked={form.eduNeedMedication} onChange={handleChange} /> Medication</label>
                <label><input type="checkbox" name="eduNeedPostnatal" checked={form.eduNeedPostnatal} onChange={handleChange} /> Postnatal care</label>
              </div>
            </div>
          </div>

          {/* J. IF ADMITTED AFTER DELIVERY / OPERATION */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              J. IF ADMITTED AFTER DELIVERY / OPERATION (postnatal or post-operative admission — else mark NA)
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 'bold' }}>Uterus :</span>
                {['Well contracted', 'Atonic', 'NA'].map(opt => (
                  <label key={opt}><input type="radio" name="postnatalUterus" value={opt} checked={form.postnatalUterus === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Lochia :</span>
                {['Normal', 'Excessive', 'Foul smelling', 'NA'].map(opt => (
                  <label key={opt}><input type="radio" name="postnatalLochia" value={opt} checked={form.postnatalLochia === opt} onChange={handleChange} /> {opt}</label>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Perineum / wound :</span>
                {['Healthy', 'Gaping', 'Soaked dressing', 'NA'].map(opt => (
                  <label key={opt}><input type="radio" name="postnatalPerineum" value={opt} checked={form.postnatalPerineum === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Baby with mother :</span>
                {['Yes', 'In NICU', 'NA'].map(opt => (
                  <label key={opt}><input type="radio" name="postnatalBabyLocation" value={opt} checked={form.postnatalBabyLocation === opt} onChange={handleChange} /> {opt}</label>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Breastfeeding :</span>
                {['Established', 'Difficulty', 'NA'].map(opt => (
                  <label key={opt}><input type="radio" name="postnatalBreastfeeding" value={opt} checked={form.postnatalBreastfeeding === opt} onChange={handleChange} /> {opt}</label>
                ))}
                <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Catheter / drain in situ :</span>
                <label><input type="radio" name="postnatalCatheterDrain" value="No" checked={form.postnatalCatheterDrain === 'No'} onChange={handleChange} /> No</label>
                <label><input type="radio" name="postnatalCatheterDrain" value="Yes" checked={form.postnatalCatheterDrain === 'Yes'} onChange={handleChange} /> Yes -&gt;</label>
                <input type="text" name="postnatalCatheterDetails" value={form.postnatalCatheterDetails} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 3 CONTENT */}
        <div className={`obs-page-sheet obs-print-page-3 ${currentPage !== 3 ? 'obs-hide-on-screen' : ''}`}>
          <div className="no-screen-print-only">
            <HospitalPaperHeader />
          </div>

          {/* K. PAIN ASSESSMENT */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              K. PAIN ASSESSMENT (numeric rating scale — circle or tick the score reported by the patient)
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Pain Scale Table */}
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #000' }}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                        <th key={score} style={{ borderRight: score < 10 ? '1px solid #000' : 'none', padding: '4px' }}>{score}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000', fontSize: '9.5px' }}>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>No pain</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Just noticeable</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Mild</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Uncomfortable</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Annoying</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Moderate</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Distressing</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Strong</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Severe</td>
                      <td style={{ borderRight: '1px solid #000', padding: '4px' }}>Very severe</td>
                      <td style={{ padding: '4px' }}>Worst possible</td>
                    </tr>
                    <tr>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                        <td key={score} style={{ borderRight: score < 10 ? '1px solid #000' : 'none', padding: '4px' }}>
                          <input
                            type="radio"
                            name="painScoreRating"
                            value={score}
                            checked={Number(form.painScoreRating) === score}
                            onChange={() => setForm(p => ({ ...p, painScoreRating: score }))}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <div>Pain score : <input type="text" name="painScoreRatingVal" value={form.painScoreRating} onChange={handleChange} style={{ width: '40px', border: 'none', borderBottom: '1px solid #000', textAlign: 'center', outline: 'none' }} /> / 10</div>
                <div>Site : <input type="text" name="painSite" value={form.painSite} onChange={handleChange} style={{ width: '120px', border: 'none', borderBottom: '1px solid #000', outline: 'none' }} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Type :</span>
                  {['Intermittent (labour)', 'Continuous', 'Cramping', 'Burning'].map(opt => (
                    <label key={opt}><input type="radio" name="painType" value={opt} checked={form.painType === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Action taken :</span>
                <label><input type="checkbox" name="painActionNonPharm" checked={form.painActionNonPharm} onChange={handleChange} /> Non-pharmacological (position, breathing, back rub, ambulation)</label>
                <label><input type="checkbox" name="painActionDoctorInformed" checked={form.painActionDoctorInformed} onChange={handleChange} /> Doctor informed</label>
                <label><input type="checkbox" name="painActionAnalgesiaGiven" checked={form.painActionAnalgesiaGiven} onChange={handleChange} /> Analgesia given</label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span>Re-assessment due at :</span>
                <input type="time" name="painReassessmentDueTime" value={form.painReassessmentDueTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
                <span style={{ fontSize: '11px', color: '#64748b', italic: 'true' }}>(re-assess within 30–60 min of intervention and every shift)</span>
              </div>
            </div>
          </div>

          {/* L. RISK ASSESSMENT & SAFETY */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              L. RISK ASSESSMENT &amp; SAFETY
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* FALL RISK */}
              <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }}>FALL RISK</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
                  {[
                    { name: 'fallRiskHistory', label: 'History of fall' },
                    { name: 'fallRiskDizziness', label: 'Dizziness / giddiness' },
                    { name: 'fallRiskSedatives', label: 'Sedatives / anaesthesia' },
                    { name: 'fallRiskImpairedVision', label: 'Impaired vision' },
                    { name: 'fallRiskIVLine', label: 'IV line / catheter in situ' },
                    { name: 'fallRiskAdvancedGestation', label: 'Advanced gestation / unsteady gait' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Fall risk :</span>
                  {['Low', 'Moderate', 'High'].map(opt => (
                    <label key={opt}><input type="radio" name="fallRiskLevel" value={opt} checked={form.fallRiskLevel === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                  <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Precautions :</span>
                  {[
                    { name: 'fallPrecautionBedRails', label: 'Bed rails up' },
                    { name: 'fallPrecautionLowBed', label: 'Bed in low position' },
                    { name: 'fallPrecautionCallBell', label: 'Call bell in reach' },
                    { name: 'fallPrecautionSign', label: 'Fall-risk sign' },
                    { name: 'fallPrecautionAssistedAmbulation', label: 'Assisted ambulation' },
                    { name: 'fallPrecautionNonSlipFootwear', label: 'Non-slip footwear' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PRESSURE SORE RISK */}
              <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }}>PRESSURE SORE RISK</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
                  {[
                    { name: 'pressureSoreProlongedBedRest', label: 'Prolonged bed rest' },
                    { name: 'pressureSoreReducedMobility', label: 'Reduced mobility' },
                    { name: 'pressureSoreIncontinence', label: 'Incontinence / moisture' },
                    { name: 'pressureSorePoorNutrition', label: 'Poor nutrition' },
                    { name: 'pressureSoreOedema', label: 'Oedema' },
                    { name: 'pressureSoreEpidural', label: 'Epidural in situ' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Pressure sore present :</span>
                  <label><input type="radio" name="pressureSorePresent" value="No" checked={form.pressureSorePresent === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="pressureSorePresent" value="Yes" checked={form.pressureSorePresent === 'Yes'} onChange={handleChange} /> Yes -&gt; site &amp; stage :</label>
                  <input type="text" name="pressureSoreSiteStage" value={form.pressureSoreSiteStage} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '120px' }} />
                  <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Precautions :</span>
                  {[
                    { name: 'pressurePrecaution2HrChange', label: '2-hourly position change' },
                    { name: 'pressurePrecautionAirMattress', label: 'Air / foam mattress' },
                    { name: 'pressurePrecautionSkinCare', label: 'Skin care & hygiene' },
                    { name: 'pressurePrecautionHeelProtection', label: 'Heel protection' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* VTE / DVT RISK */}
              <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }}>VTE / DVT RISK</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
                  {[
                    { name: 'vteAgeOver35', label: 'Age > 35 yrs' },
                    { name: 'vteBmiOver30', label: 'BMI ≥ 30' },
                    { name: 'vteImmobility', label: 'Immobility / bed rest' },
                    { name: 'vtePreviousVTE', label: 'Previous VTE' },
                    { name: 'vteVaricoseVeins', label: 'Varicose veins' },
                    { name: 'vtePostOperative', label: 'Post-operative' },
                    { name: 'vteMultiplePregnancy', label: 'Multiple pregnancy' },
                    { name: 'vteDehydration', label: 'Dehydration' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>DVT risk :</span>
                  {['Low', 'Moderate', 'High'].map(opt => (
                    <label key={opt}><input type="radio" name="vteRiskLevel" value={opt} checked={form.vteRiskLevel === opt} onChange={handleChange} /> {opt}</label>
                  ))}
                  <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Precautions :</span>
                  {[
                    { name: 'vtePrecautionEarlyAmbulation', label: 'Early ambulation' },
                    { name: 'vtePrecautionLegExercises', label: 'Leg exercises' },
                    { name: 'vtePrecautionHydration', label: 'Hydration' },
                    { name: 'vtePrecautionStockings', label: 'Compression stockings' },
                    { name: 'vtePrecautionLMWH', label: 'LMWH as prescribed' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* VULNERABILITY & RESTRAINTS */}
              <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }}>VULNERABILITY &amp; RESTRAINTS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Vulnerable patient :</span>
                  <label><input type="radio" name="vulnerablePatient" value="No" checked={form.vulnerablePatient === 'No'} onChange={handleChange} /> No</label>
                  <label><input type="radio" name="vulnerablePatient" value="Yes" checked={form.vulnerablePatient === 'Yes'} onChange={handleChange} /> Yes -&gt; reason :</label>
                  <input type="text" name="vulnerableReason" value={form.vulnerableReason} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', flex: 1, minWidth: '120px' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Restraints :</span>
                  <label><input type="radio" name="restraintsUsed" value="Not used" checked={form.restraintsUsed === 'Not used'} onChange={handleChange} /> Not used</label>
                  <label><input type="radio" name="restraintsUsed" value="Used" checked={form.restraintsUsed === 'Used'} onChange={handleChange} /> Used -&gt; type &amp; reason :</label>
                  <input type="text" name="restraintsTypeReason" value={form.restraintsTypeReason} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '130px' }} />
                  <span>Consent taken :</span>
                  <label><input type="radio" name="restraintConsentTaken" value="Yes" checked={form.restraintConsentTaken === 'Yes'} onChange={handleChange} /> Yes</label>
                  <label><input type="radio" name="restraintConsentTaken" value="No" checked={form.restraintConsentTaken === 'No'} onChange={handleChange} /> No</label>
                  <span>Doctor's order :</span>
                  <label><input type="radio" name="restraintDoctorOrder" value="Yes" checked={form.restraintDoctorOrder === 'Yes'} onChange={handleChange} /> Yes</label>
                  <label><input type="radio" name="restraintDoctorOrder" value="No" checked={form.restraintDoctorOrder === 'No'} onChange={handleChange} /> No</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Infection precautions :</span>
                  {[
                    { name: 'infectionStandard', label: 'Standard' },
                    { name: 'infectionContact', label: 'Contact' },
                    { name: 'infectionDroplet', label: 'Droplet' },
                    { name: 'infectionIsolation', label: 'Isolation required' }
                  ].map(item => (
                    <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" name={item.name} checked={!!form[item.name]} onChange={handleChange} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Any special care given / additional precautions :</div>
                <textarea
                  name="specialCareAdditionalPrecautions"
                  value={form.specialCareAdditionalPrecautions}
                  onChange={handleChange}
                  rows={2}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', overflow: 'hidden', fontSize: '12px', fontFamily: 'inherit' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </div>
            </div>
          </div>

          {/* M. MEDICATIONS GIVEN IN CASUALTY / BEFORE SHIFTING TO WARD */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              M. MEDICATIONS GIVEN IN CASUALTY / BEFORE SHIFTING TO WARD
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11.5px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'left', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #000' }}>
                    <th style={{ borderRight: '1px solid #000', padding: '4px', width: '120px' }}>Date &amp; time</th>
                    <th style={{ borderRight: '1px solid #000', padding: '4px' }}>Drug (generic name)</th>
                    <th style={{ borderRight: '1px solid #000', padding: '4px', width: '80px' }}>Dose</th>
                    <th style={{ borderRight: '1px solid #000', padding: '4px', width: '80px' }}>Route</th>
                    <th style={{ borderRight: '1px solid #000', padding: '4px', width: '100px' }}>Given by</th>
                    <th style={{ padding: '4px', width: '150px' }}>Remarks / response</th>
                  </tr>
                </thead>
                <tbody>
                  {form.casualtyMedications.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ borderRight: '1px solid #000', padding: '2px' }}>
                        <input type="text" value={row.dateTime} onChange={(e) => handleMedicationChange(idx, 'dateTime', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11px' }} />
                      </td>
                      <td style={{ borderRight: '1px solid #000', padding: '2px' }}>
                        <input type="text" value={row.drugName} onChange={(e) => handleMedicationChange(idx, 'drugName', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11px' }} />
                      </td>
                      <td style={{ borderRight: '1px solid #000', padding: '2px' }}>
                        <input type="text" value={row.dose} onChange={(e) => handleMedicationChange(idx, 'dose', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11px' }} />
                      </td>
                      <td style={{ borderRight: '1px solid #000', padding: '2px' }}>
                        <input type="text" value={row.route} onChange={(e) => handleMedicationChange(idx, 'route', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11px' }} />
                      </td>
                      <td style={{ borderRight: '1px solid #000', padding: '2px' }}>
                        <input type="text" value={row.givenBy} onChange={(e) => handleMedicationChange(idx, 'givenBy', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11px' }} />
                      </td>
                      <td style={{ padding: '2px' }}>
                        <input type="text" value={row.remarks} onChange={(e) => handleMedicationChange(idx, 'remarks', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11px' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 'bold' }}>Home medications brought by patient :</span>
                <label><input type="radio" name="homeMedicationsBrought" value="No" checked={form.homeMedicationsBrought === 'No'} onChange={handleChange} /> No</label>
                <label><input type="radio" name="homeMedicationsBrought" value="Yes" checked={form.homeMedicationsBrought === 'Yes'} onChange={handleChange} /> Yes -&gt; handed over to :</label>
                {['Relative', 'Pharmacy', 'Retained with consent'].map(opt => (
                  <label key={opt}><input type="radio" name="homeMedicationsHandedTo" value={opt} checked={form.homeMedicationsHandedTo === opt} onChange={handleChange} /> {opt}</label>
                ))}
              </div>
            </div>
          </div>

          {/* NURSE SIGNATURE & HANDOVER DETAILS */}
          <div style={{ border: '1.5px solid #000', padding: '8px 10px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Nurse Name &amp; Signature :</span>
                <input type="text" name="nurseName" value={form.nurseName} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: '200px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Date :</span>
                <input type="date" name="nurseSignDate" value={form.nurseSignDate} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Time :</span>
                <input type="time" name="nurseSignTime" value={form.nurseSignTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGINATION CONTROLS BAR (SCREEN ONLY) */}
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '20px',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2ece9',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
      }}>
        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronLeft size={18} /> Previous Page
        </button>

        <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
          Page {currentPage} of 3
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.min(3, p + 1))}
          disabled={currentPage === 3}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 3 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 3 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 3 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          Next Page <ChevronRight size={18} />
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px dashed #cbd5e1',
        display: 'flex',
        justify: 'center',
        gap: '16px'
      }}>
        <button
          type="button"
          onClick={handleReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#ffffff',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <Trash2 size={16} /> Clear Form
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 28px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <Save size={16} /> {recordId ? 'Update Record' : 'Save Record'}
        </button>
      </div>

      {/* Page Break CSS for Print */}
      <style>{`
        @media screen {
          .obs-hide-on-screen {
            display: none !important;
          }
          .no-screen-print-only {
            display: none !important;
          }
        }
        @media print {
          .obs-hide-on-screen {
            display: block !important;
          }
          .obs-print-page-1, .obs-print-page-2 {
            page-break-after: always;
            break-after: page;
          }
          .obs-print-page-2, .obs-print-page-3 {
            page-break-before: always;
            break-before: page;
            border-top: none !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          .pagination-controls {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
