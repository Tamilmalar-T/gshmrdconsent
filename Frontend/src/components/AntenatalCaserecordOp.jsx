import { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  FolderCheck,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'antenatal_case_record_op';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const defaultPatient = {
  name: '',
  age: '',
  uhidNo: '',
  opNo: '',
  date: getCurrentDate(),
  time: getCurrentTime(),
  husbandName: '',
  husbandAge: '',
  husbandBloodGroup: '',
  address: '',
  mobile1: '',
  emergencyContact: '',
  mobile2: '',
  aadhaarNo: '',
  wifeOccupation: '',
  husbandOccupation: '',
  education: '',
  bookingStatus: 'Booked here', // 'Booked here' | 'Booked elsewhere' | 'Unbooked' | 'Referred'
  referredFromReason: '',
  paymentScheme: 'Self-paying', // 'Private insurance' | 'Self-paying'
  insuranceName: ''
};

const defaultPreviousPregnancies = [
  { no: '1', year: '', gaAtBirth: '', placeOfBirth: '', modeOfDelivery: '', onsetOfLabour: '', birthWeightSex: '', babyStatus: '', complications: '' },
  { no: '2', year: '', gaAtBirth: '', placeOfBirth: '', modeOfDelivery: '', onsetOfLabour: '', birthWeightSex: '', babyStatus: '', complications: '' }
];

const defaultPreviousAbortions = [
  { no: '1', year: '', gaWeeks: '', type: '', management: '', place: '', complications: '' }
];

const defaultPreviousEctopics = [
  { no: '1', year: '', site: '', management: '', ruptured: '', place: '', complications: '' }
];

const defaultImmunisations = [
  { item: 'Td / TT – 1st dose', dueAt: 'At registration', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'Td / TT – 2nd dose', dueAt: '4 wks after 1st', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'Td booster (if < 3 yrs)', dueAt: 'Single dose', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'Folic acid 400 mcg / 5 mg', dueAt: 'Till 12 wks', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'IFA (60 mg elemental iron)', dueAt: 'From 14 wks, daily', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'Calcium 500 mg twice daily', dueAt: 'From 14 wks', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'Albendazole 400 mg', dueAt: 'After 1st trimester', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'Anti-D (if Rh negative)', dueAt: '28 wks & postpartum', dateGiven: '', batchNo: '', remarks: '' },
  { item: 'Influenza / COVID vaccine', dueAt: 'As advised', dateGiven: '', batchNo: '', remarks: '' }
];

const defaultInvestigations = [
  { test: 'Blood group & Rh typing', whenDue: 'Booking', t1: '', t2: '', t3: '' },
  { test: 'Haemoglobin / PCV', whenDue: 'Booking, 26-28 & 32-34 wks', t1: '', t2: '', t3: '' },
  { test: 'TC, DC, Platelet count', whenDue: 'Booking', t1: '', t2: '', t3: '' },
  { test: 'Peripheral smear (if Hb <9)', whenDue: 'As indicated', t1: '', t2: '', t3: '' },
  { test: 'Urine routine & microscopy', whenDue: 'Every trimester', t1: '', t2: '', t3: '' },
  { test: 'Urine culture & sensitivity', whenDue: 'Booking (asymptomatic bacteriuria)', t1: '', t2: '', t3: '' },
  { test: 'Blood sugar F / PP', whenDue: 'Booking', t1: '', t2: '', t3: '' },
  { test: 'OGTT 75 g – DIPSI / IADPSG', whenDue: 'Booking & 24-28 wks', t1: '', t2: '', t3: '' },
  { test: 'HIV (ICTC)', whenDue: 'Booking', t1: '', t2: '', t3: '' },
  { test: 'HBsAg', whenDue: 'Booking', t1: '', t2: '', t3: '' },
  { test: 'VDRL / RPR', whenDue: 'Booking & 3rd trimester', t1: '', t2: '', t3: '' },
  { test: 'HCV', whenDue: 'Booking (if indicated)', t1: '', t2: '', t3: '' },
  { test: 'TSH (± FT4)', whenDue: 'Booking', t1: '', t2: '', t3: '' },
  { test: 'Serum urea / creatinine', whenDue: 'Booking / if PIH', t1: '', t2: '', t3: '' },
  { test: 'LFT (± LDH, uric acid)', whenDue: 'If PIH / indicated', t1: '', t2: '', t3: '' },
  { test: 'Sickling / Hb electrophoresis', whenDue: 'High-prevalence area / family h/o', t1: '', t2: '', t3: '' },
  { test: 'Indirect Coombs test (Rh-negative)', whenDue: '≤ 12, 28 wks', t1: '', t2: '', t3: '' },
  { test: 'Vitamin D / B12 (optional)', whenDue: 'As indicated', t1: '', t2: '', t3: '' }
];

const defaultUltrasound = [
  { scan: 'Dating / viability', dueAt: '6–10 wks', dateDone: '', reportSummary: '' },
  { scan: 'NT + NB / dual marker', dueAt: '11–13⁺⁶ wks', dateDone: '', reportSummary: '' },
  { scan: 'Quadruple marker / NIPT', dueAt: '15–20 wks', dateDone: '', reportSummary: '' },
  { scan: 'Anomaly (TIFFA) scan', dueAt: '18–20 wks', dateDone: '', reportSummary: '' },
  { scan: 'Fetal echo (if indicated)', dueAt: '22–24 wks', dateDone: '', reportSummary: '' },
  { scan: 'Growth scan I', dueAt: '28–32 wks', dateDone: '', reportSummary: '' },
  { scan: 'Growth scan II + Doppler', dueAt: '34–36 wks', dateDone: '', reportSummary: '' },
  { scan: 'Pre-delivery scan / BPP', dueAt: '≥ 37 wks', dateDone: '', reportSummary: '' }
];

const defaultDfmcRows = [
  { date: '', timeStarted: '', time10thMovement: '', totalLt10: 'No', actionTaken: '', remarks: '' },
  { date: '', timeStarted: '', time10thMovement: '', totalLt10: 'No', actionTaken: '', remarks: '' },
  { date: '', timeStarted: '', time10thMovement: '', totalLt10: 'No', actionTaken: '', remarks: '' },
  { date: '', timeStarted: '', time10thMovement: '', totalLt10: 'No', actionTaken: '', remarks: '' }
];

const createVisitRow = (visitNo) => ({
  visitNo,
  date: '',
  gaWeeks: '',
  weightKg: '',
  bp: '',
  pallor: '',
  oedema: '',
  fundalHtCm: '',
  liePres: '',
  fhrBpm: '',
  urineAlbumin: '',
  urineSugar: '',
  hbGdl: '',
  complaintsFindings: '',
  adviceTreatment: '',
  nextVisitDate: '',
  doctorSign: ''
});

const defaultAntenatalVisitsPart1 = Array.from({ length: 6 }, (_, i) => createVisitRow(i + 1));
const defaultAntenatalVisitsPart2 = Array.from({ length: 6 }, (_, i) => createVisitRow(i + 7));
const defaultAntenatalVisitsPart3 = Array.from({ length: 6 }, (_, i) => createVisitRow(i + 13));

const defaultForm = {
  allergies: { nkda: false, yes: false, details: '' },
  presentingComplaints: '',
  menstrualHistory: {
    ageMenarche: '',
    lmp: '',
    lmpCertainty: 'Certain',
    eddLmp: '',
    pastCyclesType: 'Regular',
    cycleDays: '',
    flow: 'Normal',
    dysmenorrhea: 'No',
    eddUsgWeeks: '',
    eddUsgDate: '',
    correctedEdd: '',
    contraception: '',
    gaWeeks: '',
    gaDays: '',
    conceptionMode: 'Spontaneous',
    ivfTransferDate: '',
    pregnancyPlan: 'Planned',
    preconceptionFolicAcid: 'No',
    folicAcidFromDate: ''
  },
  obstetricHistory: {
    g: '',
    p: '',
    l: '',
    a: '',
    e: '',
    d: '',
    primiNote: '',
    interpregnancyInterval: '',
    interpregnancyNote: '',
    previousLscs: 'No',
    lscsCount: '',
    lscsYears: '',
    lscsIndication: ''
  },
  previousObstetricRemarks: '',
  eventsPresentPregnancy: {
    firstTrimester: {
      nauseaVomiting: false,
      hyperemesis: false,
      bleedingPV: false,
      feverWithRash: false,
      drugExposure: false,
      uti: false,
      folicAcidStartedDate: '',
      remarks: ''
    },
    secondTrimester: {
      quickeningDate: '',
      fetalMovementsGood: false,
      bleedingPV: false,
      leakingPV: false,
      fever: false,
      painAbdomen: false,
      ifaCalStartedDate: '',
      remarks: ''
    },
    thirdTrimester: {
      decreasedMovements: false,
      bleedingPV: false,
      leakingPV: false,
      headacheBlurring: false,
      epigastricPain: false,
      swellingFaceHands: false,
      breathlessness: false,
      contractions: false,
      remarks: ''
    }
  },
  pastMedicalHistory: {
    hypertension: false,
    diabetes: false,
    gdmPast: false,
    thyroid: false,
    cardiac: false,
    tb: false,
    asthma: false,
    epilepsy: false,
    renal: false,
    liver: false,
    dvt: false,
    sleApla: false,
    anemia: false,
    psychiatric: false,
    infertility: false,
    hivHbsagVdrl: false,
    covid19: false,
    migraine: false,
    malaria: false,
    rhd: false,
    bleedingDisorder: false,
    others: false,
    othersDetails: '',
    details: ''
  },
  pastSurgicalHistory: {
    lscs: false,
    myomectomy: false,
    laparotomy: false,
    laparoscopy: false,
    cervicalLeep: false,
    appendicectomy: false,
    others: false,
    otherDetails: '',
    bloodTransfusion: 'No',
    transfusionDetails: '',
    currentMedications: ''
  },
  personalMaritalFamily: {
    marriedYears: '',
    marriedMonths: '',
    consanguineous: 'No',
    consanguinityDegree: '',
    diet: 'Vegetarian',
    appetite: 'Normal',
    bowelBladder: 'Normal',
    sleep: 'Adequate',
    substanceUse: {
      nil: true,
      self: false,
      spouse: false,
      household: false
    },
    familyHistory: {
      diabetes: false,
      hypertension: false,
      twins: false,
      tb: false,
      congenitalAnomaly: false,
      thalassemia: false,
      hereditaryDisease: false,
      mentalIllness: false,
      details: ''
    },
    psychosocial: {
      feltDown: 'No',
      littleInterest: 'No',
      feelsSafeAtHome: 'Yes'
    }
  },
  immunisationRemarksOmission: '',
  generalExam: {
    condition: 'Good', // 'Good' | 'Fair' | 'Poor'
    consciousness: 'Conscious, oriented', // 'Conscious, oriented' | 'Altered'
    height: '',
    weight: '',
    prePregnancyWeight: '',
    totalWeightGain: '',
    bmi: '',
    pr: '',
    bpRtArm: '',
    bpRepeatLL: '',
    rr: '',
    spo2: '',
    temp: '',
    grbs: '',
    pallor: 'Nil', // 'Nil' | 'Mild' | 'Moderate' | 'Severe'
    oedema: 'Nil', // 'Nil' | 'Pedal' | 'Generalised / facial'
    icterus: 'Nil', // 'Nil' | 'Present'
    lymphadenopathy: 'Nil', // 'Nil' | 'Present'
    cyanosisClubbing: 'Nil', // 'Nil' | 'Present'
    thyroid: 'Normal', // 'Normal' | 'Enlarged'
    breast: 'Normal', // 'Normal' | 'Abnormal'
    nipple: 'Everted', // 'Everted' | 'Flat' | 'Inverted'
    spine: 'Normal', // 'Normal' | 'Deformity'
    oralHygiene: 'Good', // 'Good' | 'Needs referral'
    nutritionalStatus: '',
    wifeBloodGroup: '',
    husbandBloodGroup: ''
  },
  systemicExam: {
    cvs: '',
    rs: '',
    cns: '',
    others: ''
  },
  obstetricExam: {
    uterusRelaxed: false,
    scarPreviousSurgery: false,
    scarTenderness: false,
    striaeGravidarum: false,
    lineaNigra: false,
    flankFullness: false,
    fundalHeight: '',
    sfh: '',
    abdominalGirth: '',
    lie: '',
    presentation: '',
    position: '',
    engagement: '',
    correspondsToGA: 'Yes', // 'Yes' | 'No'
    efw: '',
    fhs: '',
    fhsRhythm: 'Regular', // 'Regular' | 'Irregular'
    liquor: '',
    contractionsPresent: 'Absent', // 'Absent' | 'Present'
    contractions10Min: '',
    contractionsDurationSec: ''
  },
  localExam: {
    psFindings: '',
    pvFindings: '',
    bishopScore: {
      dilatation: '',
      dilatationScore: '',
      effacement: '',
      effacementScore: '',
      station: '',
      stationScore: '',
      consistency: '',
      consistencyScore: '',
      position: '',
      positionScore: '',
      totalScore: ''
    },
    consentTaken: 'Yes',
    chaperonePresent: 'Yes',
    pelvimetry: {
      sacralPromontoryNotReached: false,
      ischialSpinesNotProminent: false,
      sacroSciaticNotchAdequate: false,
      subpubicAngleGt90: false,
      intertuberousAdequate: false
    },
    pelvisImpression: 'Adequate', // 'Adequate' | 'Borderline' | 'Inadequate'
    summaryPositiveFindings: ''
  },
  highRiskScreening: {
    ageLt19: false,
    ageGte35: false,
    heightLt145: false,
    bmiLt18_5_Gte30: false,
    grandMultipara: false,
    interpregnancyLt18m: false,
    prevLscsScar: false,
    prevStillbirthNeonatalDeath: false,
    gte3ConsecutiveAbortions: false,
    prevPretermBirth: false,
    prevIugrSga: false,
    prevPphRetainedPlacenta: false,
    prevPreeclampsiaEclampsia: false,
    prevGdm: false,
    prevCongenitalAnomaly: false,
    multiplePregnancy: false,
    malpresentationGte36wks: false,
    placentaPraeviaAph: false,
    severeAnaemiaHbLt7: false,
    hypertensionPresent: false,
    gdmOvertDiabetes: false,
    heartDisease: false,
    thyroidDisorder: false,
    rhNegativeMother: false,
    hivHbsagVdrlPositive: false,
    tuberculosis: false,
    epilepsyPsychiatric: false,
    renalLiverDisease: false,
    postDatedGte40wks: false,
    reducedFetalMovements: false,
    otherRiskFactors: '',
    riskCategory: 'LOW RISK', // 'LOW RISK' | 'HIGH RISK'
    highRiskReason: '',
    needsReferralTo: ''
  },
  riskBasedManagement: {
    preeclampsia: {
      riskFactorsPresent: 'No',
      tabAspirin: 'Not indicated', // 'Not indicated' | 'Started on'
      aspirinWks: '',
      calcium1g: 'Not started' // 'Started' | 'Not started'
    },
    anaemia: {
      hb: '',
      category: 'Normal', // 'Normal' | 'Mild' | 'Moderate' | 'Severe'
      planOralIfa: false,
      planIvIronSucrose: false,
      ivIronDose: '',
      planBloodTransfusion: false,
      planDeworming: false
    },
    glucoseThyroid: {
      ogtt2h: '',
      tsh: '',
      planMnt: false,
      planMetformin: false,
      planInsulin: false,
      planThyroxine: false,
      thyroxineDose: ''
    },
    rhNegativeVte: {
      ict: 'Negative', // 'Negative' | 'Positive'
      antiD300mcg: 'Not indicated', // 'Not indicated' | 'Given at 28 wks'
      antiDDate: '',
      vteRisk: 'Low', // 'Low' | 'Intermediate / High'
      lmwhFromDate: ''
    }
  },
  multidisciplinaryReferrals: '',
  otherInvestigations: [
    { date: '', test: '', result: '', actionTaken: '' }
  ],
  birthPreparedness: {
    plannedPlaceOfDelivery: '',
    anticipatedModeVaginal: true,
    anticipatedModeElectiveLscs: false,
    electiveLscsWeeksDate: '',
    anticipatedModeTrialOfLabour: false,
    transportArranged: 'Yes',
    transportContact: '',
    birthCompanion: '',
    bloodGroupDonorArranged: 'Yes',
    fundsSchemeArranged: true,
    fundsSchemeToBeArranged: false,
    ppiucd: false,
    sterilisation: false,
    barrier: false,
    injectable: false,
    undecided: true,
    emergencyContactGiven: 'Yes',
    newbornCareExplained: 'Yes'
  },
  dangerSignsCounselled: {
    bleedingPV: false,
    severeHeadacheBlurring: false,
    convulsionsLossConsciousness: false,
    severePainAbdomen: false,
    leakingFluidPV: false,
    decreasedFetalMovements: false,
    highFeverChills: false,
    persistentVomiting: false,
    swellingFaceHands: false,
    breathlessnessAtRest: false,
    burningMicturition: false,
    foulSmellingDischarge: false,
    counselledBy: '',
    languageUsed: 'Kannada / English / Hindi',
    understoodByPatient: 'Yes'
  },
  provisionalDiagnosis: '',
  planOfCare: '',
  page10Signatures: {
    residentDoctorName: '',
    date: getCurrentDate(),
    time: getCurrentTime(),
    consultantName: '',
    consultantSignature: '',
    regNoStamp: '',
    reviewedOn: getCurrentDate(),
    nextReview: ''
  }
};

export default function AntenatalCaserecordOp({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('antenatalOpCurrentPage');
    const parsed = saved ? parseInt(saved, 10) : 1;
    return (parsed >= 1 && parsed <= 5) ? parsed : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('antenatalOpCurrentPage', currentPage);
  }, [currentPage]);

  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const expandAll = () => setCollapsedSections({});
  const collapseAll = () => {
    const allKeys = [
      'patientId', 'allergies', 'complaints', 'menstrual', 'obstetricSummary',
      'previousPregnancies', 'presentEvents', 'pastMedical', 'pastSurgical', 'personalFamily',
      'generalExam', 'systemicExam', 'obstetricExam', 'localExam', 'bishopScore', 'pelvimetry',
      'immunisation', 'visitsPart1', 'visitsPart2', 'visitsPart3', 'dfmc',
      'investigations', 'ultrasound', 'highRisk', 'riskManagement', 'referrals',
      'birthPlan', 'dangerSigns', 'provisionalDiag', 'planCare', 'signatures'
    ];
    const collapsedMap = {};
    allKeys.forEach(k => { collapsedMap[k] = true; });
    setCollapsedSections(collapsedMap);
  };

  const [patient, setPatient] = useState(defaultPatient);
  const [previousPregnancies, setPreviousPregnancies] = useState(defaultPreviousPregnancies);
  const [previousAbortions, setPreviousAbortions] = useState(defaultPreviousAbortions);
  const [previousEctopics, setPreviousEctopics] = useState(defaultPreviousEctopics);
  const [immunisations, setImmunisations] = useState(defaultImmunisations);
  const [investigations, setInvestigations] = useState(defaultInvestigations);
  const [ultrasound, setUltrasound] = useState(defaultUltrasound);
  const [dfmcRows, setDfmcRows] = useState(defaultDfmcRows);
  const [antenatalVisitsPart1, setAntenatalVisitsPart1] = useState(defaultAntenatalVisitsPart1);
  const [antenatalVisitsPart2, setAntenatalVisitsPart2] = useState(defaultAntenatalVisitsPart2);
  const [antenatalVisitsPart3, setAntenatalVisitsPart3] = useState(defaultAntenatalVisitsPart3);
  const [form, setForm] = useState(defaultForm);
  const [recordId, setRecordId] = useState(editRecordId || null);
  const [toastMsg, setToastMsg] = useState('');

  // Restore or load edit data
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(editData.patient);
      if (editData.previousPregnancies) setPreviousPregnancies(editData.previousPregnancies);
      if (editData.previousAbortions) setPreviousAbortions(editData.previousAbortions);
      if (editData.previousEctopics) setPreviousEctopics(editData.previousEctopics);
      if (editData.immunisations) setImmunisations(editData.immunisations);
      if (editData.investigations) setInvestigations(editData.investigations);
      if (editData.ultrasound) setUltrasound(editData.ultrasound);
      if (editData.dfmcRows) setDfmcRows(editData.dfmcRows);
      if (editData.antenatalVisitsPart1) setAntenatalVisitsPart1(editData.antenatalVisitsPart1);
      if (editData.antenatalVisitsPart2) setAntenatalVisitsPart2(editData.antenatalVisitsPart2);
      if (editData.antenatalVisitsPart3) setAntenatalVisitsPart3(editData.antenatalVisitsPart3);
      if (editData.form) setForm(editData.form);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(saved.patient);
        if (saved.previousPregnancies) setPreviousPregnancies(saved.previousPregnancies);
        if (saved.previousAbortions) setPreviousAbortions(saved.previousAbortions);
        if (saved.previousEctopics) setPreviousEctopics(saved.previousEctopics);
        if (saved.immunisations) setImmunisations(saved.immunisations);
        if (saved.investigations) setInvestigations(saved.investigations);
        if (saved.ultrasound) setUltrasound(saved.ultrasound);
        if (saved.dfmcRows) setDfmcRows(saved.dfmcRows);
        if (saved.antenatalVisitsPart1) setAntenatalVisitsPart1(saved.antenatalVisitsPart1);
        if (saved.antenatalVisitsPart2) setAntenatalVisitsPart2(saved.antenatalVisitsPart2);
        if (saved.antenatalVisitsPart3) setAntenatalVisitsPart3(saved.antenatalVisitsPart3);
        if (saved.form) setForm(saved.form);
      }
    }
  }, [editData, editRecordId]);

  // Auto-save draft
  useEffect(() => {
    persistForm(PERSIST_KEY, {
      patient,
      previousPregnancies,
      previousAbortions,
      previousEctopics,
      immunisations,
      investigations,
      ultrasound,
      dfmcRows,
      antenatalVisitsPart1,
      antenatalVisitsPart2,
      antenatalVisitsPart3,
      form,
      recordId
    });
    const t = setTimeout(() => {
      if (patient.name || patient.opNo || patient.uhidNo) {
        autoSaveFormDraft(
          recordId,
          'Antenatal Case Record (OP)',
          patient,
          { patient, previousPregnancies, previousAbortions, previousEctopics, immunisations, investigations, ultrasound, dfmcRows, antenatalVisitsPart1, antenatalVisitsPart2, antenatalVisitsPart3, form },
          setRecordId
        );
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, previousPregnancies, previousAbortions, previousEctopics, immunisations, investigations, ultrasound, dfmcRows, antenatalVisitsPart1, antenatalVisitsPart2, antenatalVisitsPart3, form, recordId]);

  // Auto calculate BMI from Height (cm) & Weight (kg)
  useEffect(() => {
    const h = parseFloat(form.generalExam?.height);
    const w = parseFloat(form.generalExam?.weight);
    if (!isNaN(h) && !isNaN(w) && h > 0 && w > 0) {
      const heightInMeters = h / 100;
      const computedBmi = (w / (heightInMeters * heightInMeters)).toFixed(1);
      if (computedBmi !== form.generalExam?.bmi) {
        setForm(prev => ({
          ...prev,
          generalExam: {
            ...prev.generalExam,
            bmi: computedBmi
          }
        }));
      }
    }
  }, [form.generalExam?.height, form.generalExam?.weight]);

  // Auto calculate Total Weight Gain from Present Weight & Pre-Pregnancy Weight
  useEffect(() => {
    const currW = parseFloat(form.generalExam?.weight);
    const preW = parseFloat(form.generalExam?.prePregnancyWeight);
    if (!isNaN(currW) && !isNaN(preW) && currW > 0 && preW > 0) {
      const gain = (currW - preW).toFixed(1);
      if (gain !== form.generalExam?.totalWeightGain) {
        setForm(prev => ({
          ...prev,
          generalExam: {
            ...prev.generalExam,
            totalWeightGain: gain
          }
        }));
      }
    }
  }, [form.generalExam?.weight, form.generalExam?.prePregnancyWeight]);

  const handleBishopChange = (scoreKey, scoreVal, findingKey, findingVal) => {
    setForm(prev => {
      const bs = { ...prev.localExam?.bishopScore };
      if (scoreKey) bs[scoreKey] = scoreVal;
      if (findingKey) bs[findingKey] = findingVal;

      const s1 = parseInt(scoreKey === 'dilatationScore' ? scoreVal : bs.dilatationScore || 0, 10);
      const s2 = parseInt(scoreKey === 'effacementScore' ? scoreVal : bs.effacementScore || 0, 10);
      const s3 = parseInt(scoreKey === 'stationScore' ? scoreVal : bs.stationScore || 0, 10);
      const s4 = parseInt(scoreKey === 'consistencyScore' ? scoreVal : bs.consistencyScore || 0, 10);
      const s5 = parseInt(scoreKey === 'positionScore' ? scoreVal : bs.positionScore || 0, 10);

      const hasAny = [bs.dilatationScore, bs.effacementScore, bs.stationScore, bs.consistencyScore, bs.positionScore].some(v => v !== '' && v !== undefined && v !== null);
      if (hasAny) {
        bs.totalScore = String((isNaN(s1) ? 0 : s1) + (isNaN(s2) ? 0 : s2) + (isNaN(s3) ? 0 : s3) + (isNaN(s4) ? 0 : s4) + (isNaN(s5) ? 0 : s5));
      }

      return {
        ...prev,
        localExam: {
          ...prev.localExam,
          bishopScore: bs
        }
      };
    });
  };

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleOpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const found = findPatientByIpNo(e.target.value);
      if (found) {
        setPatient(prev => ({
          ...prev,
          name: found.patientName || prev.name,
          age: found.age || prev.age,
          uhidNo: found.uhidNo || prev.uhidNo,
          opNo: found.ipNo || prev.opNo,
          mobile1: found.mobile || prev.mobile1,
          address: found.address || prev.address
        }));
      }
    }
  };

  const handleSave = () => {
    const ip = patient.opNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Antenatal Case Record (OP)', ip, {
      patient,
      previousPregnancies,
      previousAbortions,
      previousEctopics,
      immunisations,
      investigations,
      ultrasound,
      dfmcRows,
      antenatalVisitsPart1,
      antenatalVisitsPart2,
      antenatalVisitsPart3,
      form
    });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    showToast('Antenatal Case Record (OP) saved successfully!');
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear this Antenatal Case Record (OP)?')) {
      setPatient(defaultPatient);
      setPreviousPregnancies(defaultPreviousPregnancies);
      setPreviousAbortions(defaultPreviousAbortions);
      setPreviousEctopics(defaultPreviousEctopics);
      setImmunisations(defaultImmunisations);
      setInvestigations(defaultInvestigations);
      setUltrasound(defaultUltrasound);
      setDfmcRows(defaultDfmcRows);
      setAntenatalVisitsPart1(defaultAntenatalVisitsPart1);
      setAntenatalVisitsPart2(defaultAntenatalVisitsPart2);
      setAntenatalVisitsPart3(defaultAntenatalVisitsPart3);
      setForm(defaultForm);
      setRecordId(null);
      clearPersistedForm(PERSIST_KEY);
      showToast('Form cleared.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Helper function to render a visit table with collapsible wrapper
  const renderVisitTable = (rows, setRows, title, sectionId) => {
    const isCollapsed = !!collapsedSections[sectionId];
    return (
      <div className="op-section-box">
        <div
          className="op-section-header cursor-pointer select-none"
          onClick={() => toggleSection(sectionId)}
          style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
              <ChevronDown size={15} />
            </span>
            <span>{title}</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
            {isCollapsed ? 'Click to expand' : 'Click to collapse'}
          </span>
        </div>
        <div className={`op-section-collapse-body ${isCollapsed ? 'collapsed-body-screen' : ''}`}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="op-table" style={{ minWidth: '1100px', border: 'none', marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>No</th>
                  <th style={{ width: '90px' }}>Date</th>
                  <th style={{ width: '50px' }}>GA (wks)</th>
                  <th style={{ width: '55px' }}>Weight (kg)</th>
                  <th style={{ width: '70px' }}>BP (mmHg)</th>
                  <th style={{ width: '55px' }}>Pallor</th>
                  <th style={{ width: '55px' }}>Oedema</th>
                  <th style={{ width: '60px' }}>Fundal ht (cm)</th>
                  <th style={{ width: '70px' }}>Lie / Pres.</th>
                  <th style={{ width: '60px' }}>FHR (bpm)</th>
                  <th style={{ width: '60px' }}>Urine albumin</th>
                  <th style={{ width: '60px' }}>Urine sugar</th>
                  <th style={{ width: '55px' }}>Hb (g/dL)</th>
                  <th style={{ width: '180px' }}>Complaints & examination findings</th>
                  <th style={{ width: '180px' }}>Advice / treatment given</th>
                  <th style={{ width: '90px' }}>Next visit</th>
                  <th style={{ width: '70px' }}>Sign</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.visitNo || idx + 1}</td>
                    <td><input type="date" value={row.date} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].date = e.target.value; return u; })} style={{ width: '100%' }} min={new Date().toISOString().split('T')[0]} /></td>
                    <td><input type="text" value={row.gaWeeks} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].gaWeeks = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.weightKg} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].weightKg = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.bp} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].bp = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.pallor} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].pallor = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.oedema} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].oedema = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.fundalHtCm} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].fundalHtCm = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.liePres} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].liePres = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.fhrBpm} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].fhrBpm = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.urineAlbumin} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].urineAlbumin = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.urineSugar} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].urineSugar = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><input type="text" value={row.hbGdl} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].hbGdl = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                    <td><textarea value={row.complaintsFindings} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].complaintsFindings = e.target.value; return u; })} rows={2} style={{ width: '100%', fontSize: '11px' }} /></td>
                    <td><textarea value={row.adviceTreatment} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].adviceTreatment = e.target.value; return u; })} rows={2} style={{ width: '100%', fontSize: '11px' }} /></td>
                    <td><input type="date" value={row.nextVisitDate} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].nextVisitDate = e.target.value; return u; })} style={{ width: '100%' }} min={new Date().toISOString().split('T')[0]} /></td>
                    <td><input type="text" value={row.doctorSign} onChange={(e) => setRows(prev => { const u = [...prev]; u[idx].doctorSign = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="nursing-assessment-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Header Bar */}
      <div className="no-print page-action-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', borderRadius: '8px 8px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="vitals-page-heading" style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Antenatal Case Record (OP)
          </h2>
          <span style={{ background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px' }}>
            5 Pages Total
          </span>
        </div>

        {/* Quick Page Nav Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '6px' }}>
          {[
            { page: 1, label: 'Page 1: Identification & History' },
            { page: 2, label: 'Page 2: Obstetric & Medical Hx' },
            { page: 3, label: 'Page 3: Clinical Examinations' },
            { page: 4, label: 'Page 4: Visits & Immunisation' },
            { page: 5, label: 'Page 5: Lab, Plan & Signatures' }
          ].map(p => (
            <button
              key={p.page}
              type="button"
              onClick={() => setCurrentPage(p.page)}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentPage === p.page ? '#0284c7' : 'transparent',
                color: currentPage === p.page ? '#ffffff' : '#334155',
                fontWeight: currentPage === p.page ? '800' : '600',
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={p.label}
            >
              Page {p.page}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="action-btns-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => Object.values(collapsedSections).some(Boolean) ? expandAll() : collapseAll()}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #94a3b8',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Expand or Collapse All Table Sections"
          >
            <ChevronsUpDown size={14} />
            <span>{Object.values(collapsedSections).some(Boolean) ? 'Expand All' : 'Collapse All'}</span>
          </button>
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handleSave} style={{ backgroundColor: '#16a34a', color: '#fff' }}>
            <Save size={14} />
            <span>Save Record</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint} style={{ backgroundColor: '#2563eb', color: '#fff' }}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handleClearForm} style={{ backgroundColor: '#ef4444', color: '#fff' }}>
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <style>{`
        @media screen {
          .hide-on-screen {
            display: none !important;
          }
          .collapsed-body-screen {
            display: none !important;
          }
        }
        @media print {
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          .no-print {
            display: none !important;
          }
          .collapsed-body-screen {
            display: block !important;
          }
        }
        .op-section-box {
          border: 1.5px solid #0f172a;
          border-radius: 4px;
          margin-bottom: 12px;
          overflow: hidden;
          background-color: #ffffff;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
        }
        .op-section-header {
          font-weight: 800;
          font-size: 12.5px;
          color: #0f172a;
          background-color: #e2e8f0;
          border-bottom: 1.5px solid #0f172a;
          border-left: 5px solid #0284c7;
          padding: 6px 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background-color 0.15s ease;
        }
        .op-section-header:hover {
          background-color: #cbd5e1;
        }
        .op-sub-header {
          font-weight: 800;
          font-size: 11.5px;
          color: #0f172a;
          background-color: #f1f5f9;
          border-left: 3px solid #0284c7;
          border-bottom: 1.5px solid #0f172a;
          padding: 4px 8px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .op-section-body {
          padding: 10px;
        }
        .op-section-box .mint-patient-info-table,
        .op-section-box .op-table {
          border: none;
          margin-bottom: 0;
        }
        .op-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .op-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        /* Open Text Box Styling for all inputs and textareas across the form */
        .green-paper-container input[type="text"],
        .green-paper-container input[type="date"],
        .green-paper-container input[type="time"],
        .green-paper-container input[type="number"],
        .op-section-box input[type="text"],
        .op-section-box input[type="date"],
        .op-section-box input[type="time"],
        .op-section-box input[type="number"] {
          border: none;
          border-bottom: 1px solid #0f172a;
          background: transparent;
          outline: none;
          border-radius: 0;
          padding: 2px 4px;
          font-family: inherit;
          font-size: inherit;
          color: #0f172a;
          box-shadow: none;
        }
        .green-paper-container select,
        .op-section-box select {
          border: none;
          border-bottom: 1px solid #0f172a;
          background: transparent;
          outline: none;
          border-radius: 0;
          padding: 1px 4px;
          font-family: inherit;
          font-size: inherit;
          color: #0f172a;
          cursor: pointer;
        }
        .green-paper-container textarea,
        .op-section-box textarea,
        .assessment-textarea {
          border: none !important;
          border-bottom: 1px solid #0f172a !important;
          background: transparent !important;
          outline: none !important;
          border-radius: 0 !important;
          padding: 4px 6px !important;
          font-family: inherit;
          font-size: inherit;
          color: #0f172a;
          resize: vertical;
          box-shadow: none !important;
        }
        .green-paper-container input[type="text"]:focus,
        .green-paper-container input[type="date"]:focus,
        .green-paper-container input[type="time"]:focus,
        .green-paper-container input[type="number"]:focus,
        .green-paper-container select:focus,
        .green-paper-container textarea:focus,
        .op-section-box input:focus,
        .op-section-box textarea:focus,
        .op-section-box select:focus {
          border-bottom: 2px solid #0284c7 !important;
          background-color: #f0f9ff !important;
        }
        .op-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #0f172a;
          margin-bottom: 10px;
          font-size: 12px;
        }
        .op-table th, .op-table td {
          border: 1px solid #0f172a;
          padding: 4px 6px;
        }
        .op-table td input[type="text"],
        .op-table td input[type="date"],
        .op-table td input[type="time"],
        .op-table td textarea,
        .op-table td select {
          border: none !important;
          border-bottom: none !important;
          outline: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 4px 6px !important;
          border-radius: 0 !important;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .op-table td textarea {
          resize: vertical;
        }
        .op-table td input:focus,
        .op-table td textarea:focus,
        .op-table td select:focus {
          background-color: #f0f9ff !important;
          border-bottom: none !important;
        }
        .op-table th {
          background-color: #e2e8f0;
          font-weight: 800;
          color: #0f172a;
        }
        .op-checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
          align-items: center;
        }
        .op-checkbox-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
        }
        input[type="checkbox"], input[type="radio"] {
          accent-color: #0284c7;
          cursor: pointer;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* PAGE 1: PATIENT IDENTIFICATION, ALLERGIES, PRESENTING COMPLAINTS, MENSTRUAL & OBSTETRIC HISTORY */}
      {/* ========================================================================= */}
      <div className={currentPage !== 1 ? 'hide-on-screen' : ''}>
        <div className="green-paper-container" style={{ backgroundColor: '#ffffff', borderColor: '#0f172a', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <HospitalPaperHeader />

          <div className="care-plan-form-title" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1.5px solid #0f172a', padding: '6px', marginBottom: '8px', textAlign: 'center', fontWeight: '900', fontSize: '15px' }}>
            ANTENATAL CASE RECORD
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginTop: '2px' }}>
              Page 1 • To be completed at booking visit • Record to be carried by the patient at every visit
            </div>
          </div>

          {/* A. PATIENT IDENTIFICATION */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('patientId')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['patientId'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>A. PATIENT IDENTIFICATION</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['patientId'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['patientId'] ? 'collapsed-body-screen' : ''}`}>
              <table className="mint-patient-info-table">
                <tbody>
                  <tr>
                    <td colSpan={3} style={{ width: '50%' }}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Name of the Patient :</span>
                        <input type="text" name="name" value={patient.name} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={1} style={{ width: '20%' }}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Age :</span>
                        <input type="text" name="age" value={patient.age} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={2} style={{ width: '30%' }}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">UHID No. :</span>
                        <input type="text" name="uhidNo" value={patient.uhidNo} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">IP / OP No. :</span>
                        <input type="text" name="opNo" value={patient.opNo} onChange={handlePatientChange} onKeyDown={handleOpKeyDown} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold" style={{ fontSize: '10px' }}>Date :</span>
                        <input type="date" name="date" value={patient.date} onChange={handlePatientChange} className="info-input-plain" style={{ fontSize: '10px' }} min={new Date().toISOString().split('T')[0]} />
                      </div>
                    </td>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold" style={{ fontSize: '10px' }}>Time :</span>
                        <input type="time" name="time" value={patient.time} onChange={handlePatientChange} className="info-input-plain" style={{ fontSize: '10px' }} />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Husband's / Guardian's Name :</span>
                        <input type="text" name="husbandName" value={patient.husbandName} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={1}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Age :</span>
                        <input type="text" name="husbandAge" value={patient.husbandAge} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Blood Group (Husband) :</span>
                        <input type="text" name="husbandBloodGroup" value={patient.husbandBloodGroup} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Address :</span>
                        <input type="text" name="address" value={patient.address} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Mobile No. 1 :</span>
                        <input type="text" name="mobile1" value={patient.mobile1} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Emergency Contact & No. :</span>
                        <input type="text" name="emergencyContact" value={patient.emergencyContact} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Mobile No. 2 :</span>
                        <input type="text" name="mobile2" value={patient.mobile2} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Aadhaar No :</span>
                        <input type="text" name="aadhaarNo" value={patient.aadhaarNo} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Wife's Occupation :</span>
                        <input type="text" name="wifeOccupation" value={patient.wifeOccupation} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Husband's / Guardian's Occupation :</span>
                        <input type="text" name="husbandOccupation" value={patient.husbandOccupation} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                    <td colSpan={2}>
                      <div className="info-field-inline">
                        <span className="info-lbl-bold">Patient's Education :</span>
                        <input type="text" name="education" value={patient.education} onChange={handlePatientChange} className="info-input-plain" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6}>
                      <div className="info-field-inline" style={{ flexWrap: 'wrap', gap: '12px' }}>
                        <span className="info-lbl-bold">Booking status :</span>
                        {['Booked here', 'Booked elsewhere', 'Unbooked', 'Referred'].map(status => (
                          <label key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="bookingStatus"
                              value={status}
                              checked={patient.bookingStatus === status}
                              onChange={handlePatientChange}
                            />
                            {status}
                          </label>
                        ))}
                        {patient.bookingStatus === 'Referred' && (
                          <input
                            type="text"
                            name="referredFromReason"
                            placeholder="Referred from / Reason"
                            value={patient.referredFromReason}
                            onChange={handlePatientChange}
                            className="info-input-plain"
                            style={{ width: '220px', marginLeft: '6px' }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6}>
                      <div className="info-field-inline" style={{ flexWrap: 'wrap', gap: '10px' }}>
                        <span className="info-lbl-bold">Scheme / Payment :</span>
                        {['Private insurance', 'Self-paying'].map(scheme => (
                          <label key={scheme} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="paymentScheme"
                              value={scheme}
                              checked={patient.paymentScheme === scheme}
                              onChange={handlePatientChange}
                            />
                            {scheme}
                          </label>
                        ))}
                        {patient.paymentScheme === 'Private insurance' && (
                          <input
                            type="text"
                            name="insuranceName"
                            placeholder="Insurance Name"
                            value={patient.insuranceName}
                            onChange={handlePatientChange}
                            className="info-input-plain"
                            style={{ width: '180px', marginLeft: '6px' }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ALLERGIES / ADVERSE DRUG REACTIONS */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('allergies')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['allergies'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>ALLERGIES / ADVERSE DRUG REACTIONS</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['allergies'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['allergies'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <div className="op-checkbox-group">
                  <label className="op-checkbox-item">
                    <input
                      type="checkbox"
                      checked={form.allergies.nkda}
                      onChange={(e) => setForm(prev => ({ ...prev, allergies: { ...prev.allergies, nkda: e.target.checked, yes: e.target.checked ? false : prev.allergies.yes } }))}
                    />
                    No known allergy (NKDA)
                  </label>
                  <label className="op-checkbox-item">
                    <input
                      type="checkbox"
                      checked={form.allergies.yes}
                      onChange={(e) => setForm(prev => ({ ...prev, allergies: { ...prev.allergies, yes: e.target.checked, nkda: e.target.checked ? false : prev.allergies.nkda } }))}
                    />
                    Yes (specify drug / food / substance & reaction)
                  </label>
                </div>
                {form.allergies.yes && (
                  <textarea
                    value={form.allergies.details}
                    onChange={(e) => setForm(prev => ({ ...prev, allergies: { ...prev.allergies, details: e.target.value } }))}
                    placeholder="Specify drug, food, substance and reaction..."
                    rows={2}
                    className="assessment-textarea"
                    style={{ marginTop: '6px', width: '100%' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* B. PRESENTING COMPLAINTS */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('complaints')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['complaints'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>B. PRESENTING COMPLAINTS (with duration, in chronological order)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['complaints'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['complaints'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <textarea
                  name="presentingComplaints"
                  value={form.presentingComplaints}
                  onChange={(e) => setForm(prev => ({ ...prev, presentingComplaints: e.target.value }))}
                  rows={3}
                  placeholder="Enter presenting complaints with duration..."
                  className="assessment-textarea"
                  style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* C. MENSTRUAL HISTORY & DATING OF PREGNANCY */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('menstrual')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['menstrual'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>C. MENSTRUAL HISTORY & DATING OF PREGNANCY</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['menstrual'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['menstrual'] ? 'collapsed-body-screen' : ''}`}>
              <div style={{ fontSize: '11.5px' }}>
                {/* Top 2-Column Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #0f172a' }}>
                  {/* LEFT COLUMN */}
                  <div style={{ borderRight: '1px solid #0f172a', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <strong>Age at Menarche :</strong>
                      <input
                        type="text"
                        value={form.menstrualHistory.ageMenarche}
                        onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, ageMenarche: e.target.value } }))}
                        style={{ width: '60px', marginLeft: '6px', borderBottom: '1px solid #0f172a' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>Past cycles :</strong>
                      <label><input type="radio" name="pastCyclesType" value="Regular" checked={form.menstrualHistory.pastCyclesType === 'Regular'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, pastCyclesType: e.target.value } }))} /> Regular</label>
                      <span>/</span>
                      <label><input type="radio" name="pastCyclesType" value="Irregular" checked={form.menstrualHistory.pastCyclesType === 'Irregular'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, pastCyclesType: e.target.value } }))} /> Irregular</label>
                      <input
                        type="text"
                        placeholder="cycle days"
                        value={form.menstrualHistory.cycleDays}
                        onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, cycleDays: e.target.value } }))}
                        style={{ width: '60px', marginLeft: '6px' }}
                      />
                      <span>days</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <strong>Flow :</strong>
                        {['Scanty', 'Normal', 'Heavy'].map(fl => (
                          <label key={fl} style={{ marginLeft: '4px' }}>
                            <input type="radio" name="flow" value={fl} checked={form.menstrualHistory.flow === fl} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, flow: e.target.value } }))} /> {fl}
                          </label>
                        ))}
                      </div>
                      <div>
                        <strong>Dysmenorrhoea :</strong>
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="dysmenorrhea" value="Yes" checked={form.menstrualHistory.dysmenorrhea === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, dysmenorrhea: e.target.value } }))} /> Yes</label>
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="dysmenorrhea" value="No" checked={form.menstrualHistory.dysmenorrhea === 'No'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, dysmenorrhea: e.target.value } }))} /> No</label>
                      </div>
                    </div>

                    <div>
                      <strong>Contraception used before conception :</strong>
                      <input
                        type="text"
                        value={form.menstrualHistory.contraception}
                        onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, contraception: e.target.value } }))}
                        style={{ width: '180px', marginLeft: '6px', borderBottom: '1px solid #0f172a' }}
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <strong>LMP :</strong>
                      <input
                        type="date"
                        value={form.menstrualHistory.lmp}
                        onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, lmp: e.target.value } }))}
                        style={{ marginLeft: '6px' }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'gap', gap: '6px', alignItems: 'center' }}>
                      <strong>LMP is :</strong>
                      <label><input type="radio" name="lmpCertainty" value="Certain" checked={form.menstrualHistory.lmpCertainty === 'Certain'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, lmpCertainty: e.target.value } }))} /> Certain</label>
                      <label><input type="radio" name="lmpCertainty" value="Uncertain" checked={form.menstrualHistory.lmpCertainty === 'Uncertain'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, lmpCertainty: e.target.value } }))} /> Uncertain</label>
                      <label><input type="radio" name="lmpCertainty" value="On OCP / lactational amenorrhoea" checked={form.menstrualHistory.lmpCertainty === 'On OCP / lactational amenorrhoea' || form.menstrualHistory.lmpCertainty === 'On OCP / lactational'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, lmpCertainty: e.target.value } }))} /> On OCP / lactational amenorrhoea</label>
                    </div>

                    <div>
                      <strong>EDD by LMP (Naegele) :</strong>
                      <input
                        type="date"
                        value={form.menstrualHistory.eddLmp}
                        onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, eddLmp: e.target.value } }))}
                        style={{ marginLeft: '6px' }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      <strong>EDD by earliest USG (</strong>
                      <input type="text" placeholder="wks" value={form.menstrualHistory.eddUsgWeeks} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, eddUsgWeeks: e.target.value } }))} style={{ width: '40px' }} />
                      <span>wks, dated</span>
                      <input type="date" value={form.menstrualHistory.eddUsgDate} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, eddUsgDate: e.target.value } }))} min={new Date().toISOString().split('T')[0]} />
                      <span>) :</span>
                    </div>

                    <div>
                      <strong>CORRECTED / FINAL EDD :</strong>
                      <input
                        type="date"
                        value={form.menstrualHistory.correctedEdd}
                        onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, correctedEdd: e.target.value } }))}
                        style={{ marginLeft: '6px' }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <strong>Gestational Age today :</strong>
                      <input type="text" value={form.menstrualHistory.gaWeeks} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, gaWeeks: e.target.value } }))} style={{ width: '45px' }} />
                      <span>weeks</span>
                      <input type="text" value={form.menstrualHistory.gaDays} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, gaDays: e.target.value } }))} style={{ width: '45px' }} />
                      <span>days</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Rows Across Box */}
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <strong>Conception :</strong>
                    {['Spontaneous', 'Ovulation induction', 'IUI'].map(mode => (
                      <label key={mode} style={{ marginLeft: '4px', cursor: 'pointer' }}>
                        <input type="radio" name="conceptionMode" value={mode} checked={form.menstrualHistory.conceptionMode === mode} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, conceptionMode: e.target.value } }))} /> {mode}
                      </label>
                    ))}
                    <label style={{ marginLeft: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="conceptionMode" value="IVF / ICSI" checked={form.menstrualHistory.conceptionMode === 'IVF / ICSI'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, conceptionMode: e.target.value } }))} /> IVF / ICSI
                    </label>
                    {form.menstrualHistory.conceptionMode === 'IVF / ICSI' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
                        Date of transfer :
                        <input
                          type="date"
                          value={form.menstrualHistory.ivfTransferDate || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, ivfTransferDate: e.target.value } }))}
                          style={{ marginLeft: '4px' }}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <strong>Pregnancy :</strong>
                    {['Planned', 'Unplanned'].map(plan => (
                      <label key={plan} style={{ marginLeft: '4px' }}>
                        <input type="radio" name="pregnancyPlan" value={plan} checked={form.menstrualHistory.pregnancyPlan === plan} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, pregnancyPlan: e.target.value } }))} /> {plan}
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>Pre-conception folic acid :</strong>
                    <label style={{ marginLeft: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="preconceptionFolicAcid" value="Yes" checked={form.menstrualHistory.preconceptionFolicAcid === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, preconceptionFolicAcid: e.target.value } }))} /> Yes
                    </label>
                    {form.menstrualHistory.preconceptionFolicAcid === 'Yes' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
                        → from
                        <input type="date" value={form.menstrualHistory.folicAcidFromDate} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, folicAcidFromDate: e.target.value } }))} style={{ marginLeft: '4px' }} min={new Date().toISOString().split('T')[0]} />
                      </span>
                    )}
                    <label style={{ marginLeft: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="preconceptionFolicAcid" value="No" checked={form.menstrualHistory.preconceptionFolicAcid === 'No'} onChange={(e) => setForm(prev => ({ ...prev, menstrualHistory: { ...prev.menstrualHistory, preconceptionFolicAcid: e.target.value } }))} /> No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D. OBSTETRIC HISTORY */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('obstetricSummary')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['obstetricSummary'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>D. OBSTETRIC HISTORY (Obstetric Formula &amp; LSCS Summary)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['obstetricSummary'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['obstetricSummary'] ? 'collapsed-body-screen' : ''}`}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {/* LEFT COLUMN */}
                <div style={{ borderRight: '1px solid #0f172a', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontWeight: '800' }}>
                    <span>G: <input type="text" value={form.obstetricHistory.g} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, g: e.target.value } }))} style={{ width: '32px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} /></span>
                    <span>P: <input type="text" value={form.obstetricHistory.p} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, p: e.target.value } }))} style={{ width: '32px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} /></span>
                    <span>L: <input type="text" value={form.obstetricHistory.l} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, l: e.target.value } }))} style={{ width: '32px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} /></span>
                    <span>A: <input type="text" value={form.obstetricHistory.a} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, a: e.target.value } }))} style={{ width: '32px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} /></span>
                    <span>E: <input type="text" value={form.obstetricHistory.e} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, e: e.target.value } }))} style={{ width: '32px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} /></span>
                    <span>D: <input type="text" value={form.obstetricHistory.d} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, d: e.target.value } }))} style={{ width: '32px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} /></span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter details / notes below G P L A E D..."
                      value={form.obstetricHistory.primiNote || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, primiNote: e.target.value } }))}
                      style={{ width: '100%', borderBottom: '1px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                  <div>
                    <strong>Inter-pregnancy interval (last delivery → LMP) :</strong>{' '}
                    <input
                      type="text"
                      value={form.obstetricHistory.interpregnancyInterval}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, interpregnancyInterval: e.target.value } }))}
                      style={{ width: '50px', borderBottom: '1px solid #0f172a', textAlign: 'center' }}
                    />{' '}
                    months
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter details / notes below Inter-pregnancy interval..."
                      value={form.obstetricHistory.interpregnancyNote || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, interpregnancyNote: e.target.value } }))}
                      style={{ width: '100%', borderBottom: '1px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>Previous LSCS :</strong>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="radio" name="previousLscs" value="No" checked={form.obstetricHistory.previousLscs === 'No'} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, previousLscs: e.target.value } }))} /> No
                    </label>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="radio" name="previousLscs" value="Yes" checked={form.obstetricHistory.previousLscs === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, previousLscs: e.target.value } }))} /> Yes
                    </label>
                    {form.obstetricHistory.previousLscs === 'Yes' && (
                      <>
                        <span>→ number</span>
                        <input type="text" value={form.obstetricHistory.lscsCount} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, lscsCount: e.target.value } }))} style={{ width: '40px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} />
                        <span>year(s)</span>
                        <input type="text" value={form.obstetricHistory.lscsYears} onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, lscsYears: e.target.value } }))} style={{ width: '50px', borderBottom: '1px solid #0f172a', textAlign: 'center' }} />
                      </>
                    )}
                  </div>
                  {form.obstetricHistory.previousLscs === 'Yes' && (
                    <div>
                      <strong>Indication of previous LSCS :</strong>{' '}
                      <input
                        type="text"
                        value={form.obstetricHistory.lscsIndication}
                        onChange={(e) => setForm(prev => ({ ...prev, obstetricHistory: { ...prev.obstetricHistory, lscsIndication: e.target.value } }))}
                        style={{ width: 'calc(100% - 190px)', minWidth: '150px', borderBottom: '1px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: PREVIOUS PREGNANCIES, EVENTS IN PRESENT PREGNANCY, MEDICAL/SURGICAL & FAMILY HISTORY */}
      {/* ========================================================================= */}
      <div className={`page-break-before ${currentPage !== 2 ? 'hide-on-screen' : ''}`}>
        <div className="green-paper-container" style={{ backgroundColor: '#ffffff', borderColor: '#0f172a', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <HospitalPaperHeader />

          {/* E. DETAILS OF PREVIOUS PREGNANCIES */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('previousPregnancies')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['previousPregnancies'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>E. DETAILS OF PREVIOUS PREGNANCIES (most recent last)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['previousPregnancies'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['previousPregnancies'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                {/* 1. DELIVERY TABLE */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '11.5px', color: '#0f172a' }}>Delivery Details (Previous Deliveries)</strong>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviousPregnancies(prev => [...prev, { no: String(prev.length + 1), year: '', gaAtBirth: '', placeOfBirth: '', modeOfDelivery: '', onsetOfLabour: '', birthWeightSex: '', babyStatus: '', complications: '' }]);
                      }}
                      style={{ fontSize: '10.5px', fontWeight: 'bold', padding: '2px 7px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Plus size={12} /> Add Row
                    </button>
                  </div>
                  <table className="op-table" style={{ width: '100%', marginBottom: '4px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '35px' }}>No.</th>
                        <th>Year</th>
                        <th>GA at birth</th>
                        <th>Place of birth</th>
                        <th>Mode of delivery</th>
                        <th>Onset of labour</th>
                        <th>Birth weight & sex</th>
                        <th>Baby alive / dead</th>
                        <th>Complications (ANC / labour / PNC)</th>
                        <th style={{ width: '45px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousPregnancies.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.no}</td>
                          <td><input type="text" value={row.year} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].year = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.gaAtBirth} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].gaAtBirth = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.placeOfBirth} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].placeOfBirth = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.modeOfDelivery} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].modeOfDelivery = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.onsetOfLabour} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].onsetOfLabour = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.birthWeightSex} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].birthWeightSex = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.babyStatus} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].babyStatus = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.complications} onChange={(e) => setPreviousPregnancies(prev => { const u = [...prev]; u[idx].complications = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setPreviousPregnancies(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, no: String(i + 1) })))}
                              title="Delete Row"
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. ABORTION TABLE */}
                <div style={{ marginBottom: '12px', borderTop: '1px dashed #94a3b8', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '11.5px', color: '#0f172a' }}>Abortion Details</strong>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviousAbortions(prev => [...prev, { no: String(prev.length + 1), year: '', gaWeeks: '', type: '', management: '', place: '', complications: '' }]);
                      }}
                      style={{ fontSize: '10.5px', fontWeight: 'bold', padding: '2px 7px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Plus size={12} /> Add Row
                    </button>
                  </div>
                  <table className="op-table" style={{ width: '100%', marginBottom: '4px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '35px' }}>No.</th>
                        <th>Year</th>
                        <th>GA (weeks)</th>
                        <th>Type of Abortion (Spontaneous / MTP / etc.)</th>
                        <th>Management / Procedure</th>
                        <th>Place of Abortion</th>
                        <th>Complications / Remarks</th>
                        <th style={{ width: '45px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousAbortions.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.no}</td>
                          <td><input type="text" value={row.year} onChange={(e) => setPreviousAbortions(prev => { const u = [...prev]; u[idx].year = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.gaWeeks} onChange={(e) => setPreviousAbortions(prev => { const u = [...prev]; u[idx].gaWeeks = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.type} onChange={(e) => setPreviousAbortions(prev => { const u = [...prev]; u[idx].type = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.management} onChange={(e) => setPreviousAbortions(prev => { const u = [...prev]; u[idx].management = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.place} onChange={(e) => setPreviousAbortions(prev => { const u = [...prev]; u[idx].place = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.complications} onChange={(e) => setPreviousAbortions(prev => { const u = [...prev]; u[idx].complications = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setPreviousAbortions(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, no: String(i + 1) })))}
                              title="Delete Row"
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 3. ECTOPIC TABLE */}
                <div style={{ marginBottom: '6px', borderTop: '1px dashed #94a3b8', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '11.5px', color: '#0f172a' }}>Ectopic Pregnancy Details</strong>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviousEctopics(prev => [...prev, { no: String(prev.length + 1), year: '', site: '', management: '', ruptured: '', place: '', complications: '' }]);
                      }}
                      style={{ fontSize: '10.5px', fontWeight: 'bold', padding: '2px 7px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Plus size={12} /> Add Row
                    </button>
                  </div>
                  <table className="op-table" style={{ width: '100%', marginBottom: '4px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '35px' }}>No.</th>
                        <th>Year</th>
                        <th>Site / Location</th>
                        <th>Management (Medical / Surgical)</th>
                        <th>Ruptured / Unruptured</th>
                        <th>Place of Treatment</th>
                        <th>Complications / Remarks</th>
                        <th style={{ width: '45px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousEctopics.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.no}</td>
                          <td><input type="text" value={row.year} onChange={(e) => setPreviousEctopics(prev => { const u = [...prev]; u[idx].year = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.site} onChange={(e) => setPreviousEctopics(prev => { const u = [...prev]; u[idx].site = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.management} onChange={(e) => setPreviousEctopics(prev => { const u = [...prev]; u[idx].management = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.ruptured} onChange={(e) => setPreviousEctopics(prev => { const u = [...prev]; u[idx].ruptured = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.place} onChange={(e) => setPreviousEctopics(prev => { const u = [...prev]; u[idx].place = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td><input type="text" value={row.complications} onChange={(e) => setPreviousEctopics(prev => { const u = [...prev]; u[idx].complications = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setPreviousEctopics(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, no: String(i + 1) })))}
                              title="Delete Row"
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '8px', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                  <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Summary / remarks on previous obstetric events (indications, complications, neonatal outcome, lactation):</span>
                  <textarea
                    value={form.previousObstetricRemarks}
                    onChange={(e) => setForm(prev => ({ ...prev, previousObstetricRemarks: e.target.value }))}
                    rows={2}
                    className="assessment-textarea"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* F. EVENTS IN THE PRESENT PREGNANCY */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('presentEvents')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['presentEvents'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>F. EVENTS IN THE PRESENT PREGNANCY</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['presentEvents'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['presentEvents'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <div className="op-grid-3">
                  {/* FIRST TRIMESTER */}
                  <div style={{ borderRight: '1px solid #cbd5e1', paddingRight: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="op-sub-header">FIRST TRIMESTER (1st to 12th week)</div>
                      {[
                        ['nauseaVomiting', 'Nausea / vomiting'],
                        ['hyperemesis', 'Hyperemesis'],
                        ['bleedingPV', 'Bleeding PV'],
                        ['feverWithRash', 'Fever with rash'],
                        ['drugExposure', 'Drug / radiation exposure'],
                        ['uti', 'UTI']
                      ].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', marginBottom: '4px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.eventsPresentPregnancy.firstTrimester[key]}
                            onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, firstTrimester: { ...prev.eventsPresentPregnancy.firstTrimester, [key]: e.target.checked } } }))}
                          />
                          {label}
                        </label>
                      ))}
                      <div style={{ marginTop: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Folic acid started on:</span>
                        <input
                          type="text"
                          placeholder="date / wks"
                          value={form.eventsPresentPregnancy.firstTrimester.folicAcidStartedDate}
                          onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, firstTrimester: { ...prev.eventsPresentPregnancy.firstTrimester, folicAcidStartedDate: e.target.value } } }))}
                          style={{ flex: 1, borderBottom: '1px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '11px' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', borderTop: '1px stroke #e2e8f0', paddingTop: '6px' }}>
                      <strong style={{ fontSize: '11px', color: '#0f172a' }}>Remarks :</strong>
                      <textarea
                        value={form.eventsPresentPregnancy.firstTrimester.remarks || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, firstTrimester: { ...prev.eventsPresentPregnancy.firstTrimester, remarks: e.target.value } } }))}
                        placeholder="Enter remarks..."
                        rows={2}
                        style={{ width: '100%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11px', marginTop: '2px', backgroundColor: 'transparent', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  {/* SECOND TRIMESTER */}
                  <div style={{ borderRight: '1px solid #cbd5e1', paddingRight: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="op-sub-header">SECOND TRIMESTER (13th to 26th week)</div>
                      <div style={{ marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Quickening → date :</span>
                        <input
                          type="text"
                          placeholder="date"
                          value={form.eventsPresentPregnancy.secondTrimester.quickeningDate}
                          onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, secondTrimester: { ...prev.eventsPresentPregnancy.secondTrimester, quickeningDate: e.target.value } } }))}
                          style={{ flex: 1, borderBottom: '1px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '11px' }}
                        />
                      </div>
                      {[
                        ['fetalMovementsGood', 'Fetal movements good'],
                        ['bleedingPV', 'Bleeding PV'],
                        ['leakingPV', 'Leaking PV'],
                        ['fever', 'Fever'],
                        ['painAbdomen', 'Pain abdomen']
                      ].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', marginBottom: '4px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.eventsPresentPregnancy.secondTrimester[key]}
                            onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, secondTrimester: { ...prev.eventsPresentPregnancy.secondTrimester, [key]: e.target.checked } } }))}
                          />
                          {label}
                        </label>
                      ))}
                      <div style={{ marginTop: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>IFA / Calcium started on :</span>
                        <input
                          type="text"
                          placeholder="date / wks"
                          value={form.eventsPresentPregnancy.secondTrimester.ifaCalStartedDate || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, secondTrimester: { ...prev.eventsPresentPregnancy.secondTrimester, ifaCalStartedDate: e.target.value } } }))}
                          style={{ flex: 1, borderBottom: '1px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', fontSize: '11px' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', borderTop: '1px stroke #e2e8f0', paddingTop: '6px' }}>
                      <strong style={{ fontSize: '11px', color: '#0f172a' }}>Remarks :</strong>
                      <textarea
                        value={form.eventsPresentPregnancy.secondTrimester.remarks || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, secondTrimester: { ...prev.eventsPresentPregnancy.secondTrimester, remarks: e.target.value } } }))}
                        placeholder="Enter remarks..."
                        rows={2}
                        style={{ width: '100%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11px', marginTop: '2px', backgroundColor: 'transparent', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  {/* THIRD TRIMESTER */}
                  <div style={{ paddingRight: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="op-sub-header">THIRD TRIMESTER (27th week onwards)</div>
                      {[
                        ['decreasedMovements', 'Decreased / altered fetal movements'],
                        ['bleedingPV', 'Bleeding PV (APH)'],
                        ['leakingPV', 'Leaking PV (PROM)'],
                        ['headacheBlurring', 'Headache / visual blurring'],
                        ['epigastricPain', 'Epigastric pain / vomiting'],
                        ['swellingFaceHands', 'Sudden swelling face & hands'],
                        ['breathlessness', 'Breathlessness / chest pain'],
                        ['contractions', 'Painful uterine contractions']
                      ].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', marginBottom: '3px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.eventsPresentPregnancy.thirdTrimester[key]}
                            onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, thirdTrimester: { ...prev.eventsPresentPregnancy.thirdTrimester, [key]: e.target.checked } } }))}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: '10px', borderTop: '1px stroke #e2e8f0', paddingTop: '6px' }}>
                      <strong style={{ fontSize: '11px', color: '#0f172a' }}>Remarks :</strong>
                      <textarea
                        value={form.eventsPresentPregnancy.thirdTrimester.remarks || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, eventsPresentPregnancy: { ...prev.eventsPresentPregnancy, thirdTrimester: { ...prev.eventsPresentPregnancy.thirdTrimester, remarks: e.target.value } } }))}
                        placeholder="Enter remarks..."
                        rows={2}
                        style={{ width: '100%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11px', marginTop: '2px', backgroundColor: 'transparent', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* G. PAST MEDICAL HISTORY */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('pastMedical')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['pastMedical'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>G. PAST MEDICAL HISTORY (tick if present, give details below)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['pastMedical'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['pastMedical'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 12px', fontSize: '11px', fontWeight: '600' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.hypertension} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, hypertension: e.target.checked } }))} /> Hypertension</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.diabetes} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, diabetes: e.target.checked } }))} /> Diabetes mellitus</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.gdmPast} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, gdmPast: e.target.checked } }))} /> GDM in past pregnancy</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.thyroid} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, thyroid: e.target.checked } }))} /> Thyroid disorder</label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.cardiac} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, cardiac: e.target.checked } }))} /> Cardiac disease</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.tb} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, tb: e.target.checked } }))} /> Tuberculosis</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.asthma} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, asthma: e.target.checked } }))} /> Bronchial asthma</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.epilepsy} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, epilepsy: e.target.checked } }))} /> Epilepsy / seizures</label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.renal} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, renal: e.target.checked } }))} /> Renal disease</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.liver} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, liver: e.target.checked } }))} /> Jaundice / liver disease</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.dvt} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, dvt: e.target.checked } }))} /> DVT / PE / Thrombophilia</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.sleApla} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, sleApla: e.target.checked } }))} /> SLE / APLA / Autoimmune</label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.anemia} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, anemia: e.target.checked } }))} /> Chronic anaemia</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.psychiatric} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, psychiatric: e.target.checked } }))} /> Psychiatric illness</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.infertility} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, infertility: e.target.checked } }))} /> H/o infertility treatment</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.hivHbsagVdrl} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, hivHbsagVdrl: e.target.checked } }))} /> HIV / HBsAg / VDRL</label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.covid19} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, covid19: e.target.checked } }))} /> COVID-19 in past</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.migraine} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, migraine: e.target.checked } }))} /> Migraine / chronic headache</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.malaria} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, malaria: e.target.checked } }))} /> Malaria / Dengue</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={form.pastMedicalHistory.rhd} onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, rhd: e.target.checked } }))} /> RHD / valvular disease</label>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <strong>Details of medical conditions, drugs, doses & duration :</strong>
                  <textarea
                    value={form.pastMedicalHistory.details}
                    onChange={(e) => setForm(prev => ({ ...prev, pastMedicalHistory: { ...prev.pastMedicalHistory, details: e.target.value } }))}
                    rows={2}
                    className="assessment-textarea"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* H. PAST SURGICAL & GYNAECOLOGICAL HISTORY */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('pastSurgical')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['pastSurgical'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>H. PAST SURGICAL & GYNAECOLOGICAL HISTORY</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['pastSurgical'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['pastSurgical'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ fontSize: '11.5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                      <label><input type="checkbox" checked={form.pastSurgicalHistory.lscs} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, lscs: e.target.checked } }))} /> Previous LSCS</label>
                      <label><input type="checkbox" checked={form.pastSurgicalHistory.myomectomy} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, myomectomy: e.target.checked } }))} /> Myomectomy (scar integrity)</label>
                      <label><input type="checkbox" checked={form.pastSurgicalHistory.laparotomy} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, laparotomy: e.target.checked } }))} /> Exploratory laparotomy</label>
                      <label><input type="checkbox" checked={form.pastSurgicalHistory.laparoscopy} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, laparoscopy: e.target.checked } }))} /> Operative laparoscopy</label>
                      <label><input type="checkbox" checked={form.pastSurgicalHistory.cervicalLeep} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, cervicalLeep: e.target.checked } }))} /> Cervical surgery / LEEP</label>
                      <label><input type="checkbox" checked={form.pastSurgicalHistory.appendicectomy} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, appendicectomy: e.target.checked } }))} /> Appendicectomy / cholecystectomy</label>
                    </div>
                  </div>

                  <div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Blood transfusion :</strong>
                      <label style={{ marginLeft: '6px', cursor: 'pointer' }}><input type="radio" name="bloodTransfusion" value="No" checked={form.pastSurgicalHistory.bloodTransfusion === 'No'} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, bloodTransfusion: e.target.value } }))} /> No</label>
                      <label style={{ marginLeft: '6px', cursor: 'pointer' }}><input type="radio" name="bloodTransfusion" value="Yes" checked={form.pastSurgicalHistory.bloodTransfusion === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, bloodTransfusion: e.target.value } }))} /> Yes</label>
                      {form.pastSurgicalHistory.bloodTransfusion === 'Yes' && (
                        <span style={{ marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>→ when / reason :</span>
                          <input
                            type="text"
                            placeholder="When & reason..."
                            value={form.pastSurgicalHistory.transfusionDetails}
                            onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, transfusionDetails: e.target.value } }))}
                            style={{ width: '160px', marginLeft: '4px', borderBottom: '1px solid #0f172a' }}
                          />
                        </span>
                      )}
                    </div>

                    <div>
                      <strong>Current medications (dose & duration) :</strong>
                      <input
                        type="text"
                        value={form.pastSurgicalHistory.currentMedications}
                        onChange={(e) => setForm(prev => ({ ...prev, pastSurgicalHistory: { ...prev.pastSurgicalHistory, currentMedications: e.target.value } }))}
                        style={{ width: '100%', marginTop: '4px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* I. PERSONAL, MARITAL & FAMILY HISTORY */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('personalFamily')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['personalFamily'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>I. PERSONAL, MARITAL & FAMILY HISTORY</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['personalFamily'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['personalFamily'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ fontSize: '11.5px' }}>
                <div className="op-grid-2">
                  {/* Left Column */}
                  <div style={{ borderRight: '1px solid #cbd5e1', paddingRight: '12px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Married since :</strong>
                      <input type="text" value={form.personalMaritalFamily.marriedYears} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, marriedYears: e.target.value } }))} style={{ width: '40px', marginLeft: '4px', marginRight: '2px' }} /> years
                      <input type="text" value={form.personalMaritalFamily.marriedMonths} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, marriedMonths: e.target.value } }))} style={{ width: '40px', marginLeft: '4px', marginRight: '2px' }} /> months
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <strong>Consanguineous marriage :</strong>
                      <label style={{ marginLeft: '4px', cursor: 'pointer' }}><input type="radio" name="consang" value="No" checked={form.personalMaritalFamily.consanguineous === 'No'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, consanguineous: e.target.value } }))} /> No</label>
                      <label style={{ marginLeft: '4px', cursor: 'pointer' }}><input type="radio" name="consang" value="Yes" checked={form.personalMaritalFamily.consanguineous === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, consanguineous: e.target.value } }))} /> Yes</label>
                      {form.personalMaritalFamily.consanguineous === 'Yes' && (
                        <span style={{ marginLeft: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>→ degree</span>
                          <input type="text" value={form.personalMaritalFamily.consanguinityDegree} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, consanguinityDegree: e.target.value } }))} style={{ width: '70px', marginLeft: '4px' }} />
                        </span>
                      )}
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <strong>Diet :</strong>
                      {['Vegetarian', 'Mixed', 'Eggetarian'].map(d => (
                        <label key={d} style={{ marginLeft: '6px' }}>
                          <input type="radio" name="dietType" value={d} checked={form.personalMaritalFamily.diet === d} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, diet: e.target.value } }))} /> {d}
                        </label>
                      ))}
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <strong>Appetite :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="appType" value="Normal" checked={form.personalMaritalFamily.appetite === 'Normal'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, appetite: e.target.value } }))} /> Normal</label>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="appType" value="Reduced" checked={form.personalMaritalFamily.appetite === 'Reduced'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, appetite: e.target.value } }))} /> Reduced</label>
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <strong>Bowel / bladder :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="bbType" value="Normal" checked={form.personalMaritalFamily.bowelBladder === 'Normal'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, bowelBladder: e.target.value } }))} /> Normal</label>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="bbType" value="Altered" checked={form.personalMaritalFamily.bowelBladder === 'Altered'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, bowelBladder: e.target.value } }))} /> Altered</label>
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <strong>Sleep :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="sleepType" value="Adequate" checked={form.personalMaritalFamily.sleep === 'Adequate'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, sleep: e.target.value } }))} /> Adequate</label>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="sleepType" value="Disturbed" checked={form.personalMaritalFamily.sleep === 'Disturbed'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, sleep: e.target.value } }))} /> Disturbed</label>
                    </div>

                    <div>
                      <strong>Tobacco / alcohol / substance use :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="checkbox" checked={form.personalMaritalFamily.substanceUse.nil} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, substanceUse: { ...prev.personalMaritalFamily.substanceUse, nil: e.target.checked } } }))} /> Nil</label>
                      <label style={{ marginLeft: '6px' }}><input type="checkbox" checked={form.personalMaritalFamily.substanceUse.self} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, substanceUse: { ...prev.personalMaritalFamily.substanceUse, self: e.target.checked } } }))} /> Self</label>
                      <label style={{ marginLeft: '6px' }}><input type="checkbox" checked={form.personalMaritalFamily.substanceUse.spouse} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, substanceUse: { ...prev.personalMaritalFamily.substanceUse, spouse: e.target.checked } } }))} /> Spouse / household</label>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div style={{ fontWeight: '700', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
                      FAMILY HISTORY (tick, specify relation)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: '6px' }}>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.diabetes} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, diabetes: e.target.checked } } }))} /> Diabetes</label>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.hypertension} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, hypertension: e.target.checked } } }))} /> Hypertension</label>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.twins} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, twins: e.target.checked } } }))} /> Twins</label>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.tb} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, tb: e.target.checked } } }))} /> Tuberculosis</label>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.congenitalAnomaly} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, congenitalAnomaly: e.target.checked } } }))} /> Congenital anomaly</label>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.thalassemia} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, thalassemia: e.target.checked } } }))} /> Thalassaemia / sickle cell</label>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.hereditaryDisease} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, hereditaryDisease: e.target.checked } } }))} /> Hereditary disease</label>
                      <label><input type="checkbox" checked={form.personalMaritalFamily.familyHistory.mentalIllness} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, mentalIllness: e.target.checked } } }))} /> Mental illness</label>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Details :</strong>
                      <input type="text" value={form.personalMaritalFamily.familyHistory.details} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, familyHistory: { ...prev.personalMaritalFamily.familyHistory, details: e.target.value } } }))} style={{ width: '75%', marginLeft: '4px' }} />
                    </div>

                    <div style={{ fontWeight: '700', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginBottom: '4px' }}>
                      PSYCHOSOCIAL SCREEN
                    </div>
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div>
                        Felt down / hopeless in the past month :
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="psFeltDown" value="No" checked={form.personalMaritalFamily.psychosocial.feltDown === 'No'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, psychosocial: { ...prev.personalMaritalFamily.psychosocial, feltDown: e.target.value } } }))} /> No</label>
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="psFeltDown" value="Yes" checked={form.personalMaritalFamily.psychosocial.feltDown === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, psychosocial: { ...prev.personalMaritalFamily.psychosocial, feltDown: e.target.value } } }))} /> Yes</label>
                      </div>
                      <div>
                        Little interest or pleasure in doing things :
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="psInterest" value="No" checked={form.personalMaritalFamily.psychosocial.littleInterest === 'No'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, psychosocial: { ...prev.personalMaritalFamily.psychosocial, littleInterest: e.target.value } } }))} /> No</label>
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="psInterest" value="Yes" checked={form.personalMaritalFamily.psychosocial.littleInterest === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, psychosocial: { ...prev.personalMaritalFamily.psychosocial, littleInterest: e.target.value } } }))} /> Yes</label>
                      </div>
                      <div>
                        Feels safe at home :
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="psSafe" value="Yes" checked={form.personalMaritalFamily.psychosocial.feelsSafeAtHome === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, psychosocial: { ...prev.personalMaritalFamily.psychosocial, feelsSafeAtHome: e.target.value } } }))} /> Yes</label>
                        <label style={{ marginLeft: '4px' }}><input type="radio" name="psSafe" value="No" checked={form.personalMaritalFamily.psychosocial.feelsSafeAtHome === 'No'} onChange={(e) => setForm(prev => ({ ...prev, personalMaritalFamily: { ...prev.personalMaritalFamily, psychosocial: { ...prev.personalMaritalFamily.psychosocial, feelsSafeAtHome: e.target.value } } }))} /> No {'->'} refer / counsel</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: GENERAL, SYSTEMIC, OBSTETRIC, LOCAL EXAMINATIONS & BISHOP SCORE */}
      {/* ========================================================================= */}
      <div className={`page-break-before ${currentPage !== 3 ? 'hide-on-screen' : ''}`}>
        <div className="green-paper-container" style={{ backgroundColor: '#ffffff', borderColor: '#0f172a', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <HospitalPaperHeader />

          {/* K. GENERAL PHYSICAL EXAMINATION */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('generalExam')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['generalExam'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>K. GENERAL PHYSICAL EXAMINATION</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['generalExam'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['generalExam'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: '8px 12px' }}>
                {/* Row 1: General condition & Consciousness */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', color: '#0f172a' }}>General condition :</span>
                    {['Good', 'Fair', 'Poor'].map(val => (
                      <label key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11.5px', fontWeight: '500' }}>
                        <input
                          type="radio"
                          name="general_condition"
                          value={val}
                          checked={form.generalExam.condition === val}
                          onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, condition: e.target.value } }))}
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', color: '#0f172a' }}>Consciousness :</span>
                    {['Conscious, oriented', 'Altered'].map(val => (
                      <label key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11.5px', fontWeight: '500' }}>
                        <input
                          type="radio"
                          name="general_consciousness"
                          value={val}
                          checked={form.generalExam.consciousness === val}
                          onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, consciousness: e.target.value } }))}
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Row 2: Anthropometry */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Height :</span>
                    <input
                      type="text"
                      placeholder=""
                      value={form.generalExam.height}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, height: e.target.value } }))}
                      style={{ width: '45px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>cm</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Weight :</span>
                    <input
                      type="text"
                      placeholder=""
                      value={form.generalExam.weight}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, weight: e.target.value } }))}
                      style={{ width: '45px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>kg</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Pre-preg Wt :</span>
                    <input
                      type="text"
                      placeholder=""
                      value={form.generalExam.prePregnancyWeight}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, prePregnancyWeight: e.target.value } }))}
                      style={{ width: '45px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>kg</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Total gain :</span>
                    <input
                      type="text"
                      placeholder=""
                      value={form.generalExam.totalWeightGain}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, totalWeightGain: e.target.value } }))}
                      style={{ width: '45px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>kg</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>BMI :</span>
                    <input
                      type="text"
                      placeholder=""
                      value={form.generalExam.bmi}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, bmi: e.target.value } }))}
                      style={{ width: '50px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>kg/m²</span>
                  </div>
                </div>

                {/* Row 3: Vitals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>PR :</span>
                    <input type="text" value={form.generalExam.pr} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, pr: e.target.value } }))} style={{ width: '35px', textAlign: 'center' }} />
                    <span style={{ fontSize: '10.5px', color: '#475569' }}>bpm</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>BP Rt Arm :</span>
                    <input type="text" value={form.generalExam.bpRtArm} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, bpRtArm: e.target.value } }))} style={{ width: '50px', textAlign: 'center' }} />
                    <span style={{ fontSize: '10.5px', color: '#475569' }}>mmHg</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>BP Repeat :</span>
                    <input type="text" value={form.generalExam.bpRepeatLL} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, bpRepeatLL: e.target.value } }))} style={{ width: '50px', textAlign: 'center' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>RR :</span>
                    <input type="text" value={form.generalExam.rr} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, rr: e.target.value } }))} style={{ width: '30px', textAlign: 'center' }} />
                    <span style={{ fontSize: '10.5px', color: '#475569' }}>/min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>SpO2 :</span>
                    <input type="text" value={form.generalExam.spo2} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, spo2: e.target.value } }))} style={{ width: '35px', textAlign: 'center' }} />
                    <span style={{ fontSize: '10.5px', color: '#475569' }}>%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Temp :</span>
                    <input type="text" value={form.generalExam.temp} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, temp: e.target.value } }))} style={{ width: '35px', textAlign: 'center' }} />
                    <span style={{ fontSize: '10.5px', color: '#475569' }}>°F</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>GRBS :</span>
                    <input type="text" value={form.generalExam.grbs} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, grbs: e.target.value } }))} style={{ width: '35px', textAlign: 'center' }} />
                    <span style={{ fontSize: '10.5px', color: '#475569' }}>mg/dL</span>
                  </div>
                </div>

                {/* Row 4: Signs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Pallor :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Nil', 'Mild', 'Moderate', 'Severe'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_pallor" value={v} checked={form.generalExam.pallor === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, pallor: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Icterus :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Nil', 'Present'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_icterus" value={v} checked={form.generalExam.icterus === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, icterus: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Clubbing / Cyanosis :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Nil', 'Present'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_cyanosis" value={v} checked={form.generalExam.cyanosisClubbing === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, cyanosisClubbing: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Lymphadenopathy :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Nil', 'Present'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_lymph" value={v} checked={form.generalExam.lymphadenopathy === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, lymphadenopathy: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Oedema :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Nil', 'Pedal', 'Generalised'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_oedema" value={v} checked={form.generalExam.oedema === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, oedema: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 5: Breast, Nipple, Spine, Thyroid, Oral hygiene */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Breast :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Normal', 'Abnormal'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_breast" value={v} checked={form.generalExam.breast === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, breast: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Nipple :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Everted', 'Flat', 'Inverted'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_nipple" value={v} checked={form.generalExam.nipple === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, nipple: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Spine :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Normal', 'Deformity'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_spine" value={v} checked={form.generalExam.spine === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, spine: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Thyroid :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Normal', 'Enlarged'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_thyroid" value={v} checked={form.generalExam.thyroid === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, thyroid: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '2px' }}>Oral / dental hygiene :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Good', 'Needs referral'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                          <input type="radio" name="gen_oral" value={v} checked={form.generalExam.oralHygiene === v} onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, oralHygiene: e.target.value } }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 6: Nutritional status, Blood Group, Husband's group */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Nutritional status :</span>
                    <input
                      type="text"
                      value={form.generalExam.nutritionalStatus}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, nutritionalStatus: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Blood Group & Rh Typing :</span>
                    <input
                      type="text"
                      value={form.generalExam.wifeBloodGroup}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, wifeBloodGroup: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Husband's Group :</span>
                    <input
                      type="text"
                      value={form.generalExam.husbandBloodGroup}
                      onChange={(e) => setForm(prev => ({ ...prev, generalExam: { ...prev.generalExam, husbandBloodGroup: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* L. SYSTEMIC EXAMINATION */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('systemicExam')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['systemicExam'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>L. SYSTEMIC EXAMINATION</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['systemicExam'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['systemicExam'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', minWidth: '40px' }}>CVS :</span>
                    <input
                      type="text"
                      value={form.systemicExam.cvs}
                      onChange={(e) => setForm(prev => ({ ...prev, systemicExam: { ...prev.systemicExam, cvs: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', minWidth: '40px' }}>RS :</span>
                    <input
                      type="text"
                      value={form.systemicExam.rs}
                      onChange={(e) => setForm(prev => ({ ...prev, systemicExam: { ...prev.systemicExam, rs: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', minWidth: '220px', whiteSpace: 'nowrap' }}>CNS (reflexes, clonus if hypertensive) :</span>
                    <input
                      type="text"
                      value={form.systemicExam.cns}
                      onChange={(e) => setForm(prev => ({ ...prev, systemicExam: { ...prev.systemicExam, cns: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', minWidth: '55px' }}>Others :</span>
                    <input
                      type="text"
                      value={form.systemicExam.others}
                      onChange={(e) => setForm(prev => ({ ...prev, systemicExam: { ...prev.systemicExam, others: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* M. OBSTETRIC EXAMINATION (Per Abdomen) */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('obstetricExam')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['obstetricExam'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>M. OBSTETRIC EXAMINATION (Per Abdomen)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['obstetricExam'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['obstetricExam'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: '8px 12px' }}>
                {/* Checkboxes Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  {[
                    ['uterusRelaxed', 'Uterus relaxed'],
                    ['scarPreviousSurgery', 'Scar of previous surgery'],
                    ['scarTenderness', 'Scar tenderness'],
                    ['striaeGravidarum', 'Striae gravidarum'],
                    ['lineaNigra', 'Linea nigra'],
                    ['flankFullness', 'Flank fullness']
                  ].map(([k, label]) => (
                    <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11.5px', fontWeight: '500' }}>
                      <input
                        type="checkbox"
                        checked={!!form.obstetricExam[k]}
                        onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, [k]: e.target.checked } }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Measurements Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Fundal height :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.fundalHeight}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, fundalHeight: e.target.value } }))}
                      style={{ width: '60px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>weeks</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Symphysio-fundal ht :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.sfh}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, sfh: e.target.value } }))}
                      style={{ width: '60px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>cm</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Abdominal girth :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.abdominalGirth}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, abdominalGirth: e.target.value } }))}
                      style={{ width: '60px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>cm</span>
                  </div>
                </div>

                {/* Row 2: Lie, Presentation, Position, Engagement */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: '12px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Lie :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.lie}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, lie: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Presentation :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.presentation}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, presentation: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Position :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.position}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, position: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Engagement :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.engagement}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, engagement: e.target.value } }))}
                      style={{ width: '40px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>/5 palpable</span>
                  </div>
                </div>

                {/* Row 3: Corresponds to GA, Estimated fetal weight, FHS, Liquor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.5fr 1fr', gap: '12px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Corresponds to GA :</span>
                    {['Yes', 'No'].map(v => (
                      <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="obs_corresponds"
                          value={v}
                          checked={form.obstetricExam.correspondsToGA === v}
                          onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, correspondsToGA: e.target.value } }))}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Estimated fetal weight :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.efw}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, efw: e.target.value } }))}
                      style={{ width: '50px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>g</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>FHS :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.fhs}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, fhs: e.target.value } }))}
                      style={{ width: '45px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: '#475569' }}>bpm,</span>
                    {['Regular', 'Irregular'].map(v => (
                      <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="obs_fhs_rhythm"
                          value={v}
                          checked={form.obstetricExam.fhsRhythm === v}
                          onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, fhsRhythm: e.target.value } }))}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Liquor (clinical) :</span>
                    <input
                      type="text"
                      value={form.obstetricExam.liquor}
                      onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, liquor: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Row 4: Uterine contractions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Uterine contractions :</span>
                  {['Absent', 'Present'].map(v => (
                    <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="obs_contractions"
                        value={v}
                        checked={form.obstetricExam.contractionsPresent === v}
                        onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, contractionsPresent: e.target.value } }))}
                      />
                      {v}
                    </label>
                  ))}
                  {form.obstetricExam.contractionsPresent === 'Present' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>—</span>
                      <input
                        type="text"
                        placeholder=""
                        value={form.obstetricExam.contractions10Min}
                        onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, contractions10Min: e.target.value } }))}
                        style={{ width: '40px', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '11px', color: '#475569' }}>in 10 min, lasting</span>
                      <input
                        type="text"
                        placeholder=""
                        value={form.obstetricExam.contractionsDurationSec}
                        onChange={(e) => setForm(prev => ({ ...prev, obstetricExam: { ...prev.obstetricExam, contractionsDurationSec: e.target.value } }))}
                        style={{ width: '40px', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '11px', color: '#475569' }}>sec</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* N. LOCAL EXAMINATION — P/S and P/V */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('localExam')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['localExam'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>N. LOCAL EXAMINATION — P/S and P/V (only when clinically indicated)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['localExam'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['localExam'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: '8px 12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '4px' }}>
                    P/S (cervix, os, discharge, bleeding, leaking) :
                  </div>
                  <textarea
                    rows={2}
                    value={form.localExam.psFindings}
                    onChange={(e) => setForm(prev => ({ ...prev, localExam: { ...prev.localExam, psFindings: e.target.value } }))}
                    placeholder="Enter P/S examination findings..."
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '4px' }}>
                    P/V (cervix, os, effacement, station, membranes, pelvis) :
                  </div>
                  <textarea
                    rows={2}
                    value={form.localExam.pvFindings}
                    onChange={(e) => setForm(prev => ({ ...prev, localExam: { ...prev.localExam, pvFindings: e.target.value } }))}
                    placeholder="Enter P/V examination findings..."
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MODIFIED BISHOP SCORE & CLINICAL PELVIMETRY GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '12px' }}>
            {/* MODIFIED BISHOP SCORE */}
            <div className="op-section-box">
              <div
                className="op-section-header"
                onClick={() => toggleSection('bishopScore')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-flex', transform: collapsedSections['bishopScore'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <ChevronDown size={15} />
                  </span>
                  <span>MODIFIED BISHOP SCORE</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                  {collapsedSections['bishopScore'] ? 'Expand' : 'Collapse'}
                </span>
              </div>
              <div className={`op-section-collapse-body ${collapsedSections['bishopScore'] ? 'collapsed-body-screen' : ''}`}>
                <div className="op-section-body" style={{ padding: '6px 8px' }}>
                  <table className="op-table" style={{ marginBottom: '6px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '38%', fontSize: '11.5px', textAlign: 'left' }}>Parameter</th>
                        <th style={{ width: '42%', fontSize: '11.5px', textAlign: 'left' }}>Finding</th>
                        <th style={{ width: '20%', fontSize: '11.5px', textAlign: 'center' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { param: 'Dilatation (cm)', fKey: 'dilatation', sKey: 'dilatationScore', placeholder: 'e.g. 1-2 cm' },
                        { param: 'Effacement (%)', fKey: 'effacement', sKey: 'effacementScore', placeholder: 'e.g. 40-50%' },
                        { param: 'Station', fKey: 'station', sKey: 'stationScore', placeholder: 'e.g. -2' },
                        { param: 'Consistency', fKey: 'consistency', sKey: 'consistencyScore', placeholder: 'e.g. Soft / Medium' },
                        { param: 'Position', fKey: 'position', sKey: 'positionScore', placeholder: 'e.g. Mid / Anterior' }
                      ].map(row => (
                        <tr key={row.sKey}>
                          <td style={{ fontWeight: '700', fontSize: '11px' }}>{row.param}</td>
                          <td>
                            <input
                              type="text"
                              placeholder={row.placeholder}
                              value={form.localExam.bishopScore[row.fKey] || ''}
                              onChange={(e) => handleBishopChange(null, null, row.fKey, e.target.value)}
                              style={{ width: '100%', fontSize: '11px' }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="3"
                              value={form.localExam.bishopScore[row.sKey] || ''}
                              onChange={(e) => handleBishopChange(row.sKey, e.target.value, null, null)}
                              style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', paddingTop: '4px', borderTop: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ fontSize: '11.5px' }}>Total Bishop Score :</strong>
                      <input
                        type="text"
                        value={form.localExam.bishopScore.totalScore || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, localExam: { ...prev.localExam, bishopScore: { ...prev.localExam, bishopScore, totalScore: e.target.value } } }))}
                        style={{ width: '35px', textAlign: 'center', fontWeight: 'bold' }}
                      />
                      <span>/ 13</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong>Consent :</strong>
                      {['Yes', 'No'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="bishop_consent"
                            value={v}
                            checked={form.localExam.consentTaken === v}
                            onChange={(e) => setForm(prev => ({ ...prev, localExam: { ...prev.localExam, consentTaken: e.target.value } }))}
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong>Chaperone :</strong>
                      {['Yes', 'No'].map(v => (
                        <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="bishop_chaperone"
                            value={v}
                            checked={form.localExam.chaperonePresent === v}
                            onChange={(e) => setForm(prev => ({ ...prev, localExam: { ...prev.localExam, chaperonePresent: e.target.value } }))}
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CLINICAL PELVIMETRY & SUMMARY */}
            <div className="op-section-box">
              <div
                className="op-section-header"
                onClick={() => toggleSection('pelvimetry')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-flex', transform: collapsedSections['pelvimetry'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <ChevronDown size={15} />
                  </span>
                  <span>Clinical Pelvimetry &amp; Summary</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                  {collapsedSections['pelvimetry'] ? 'Expand' : 'Collapse'}
                </span>
              </div>
              <div className={`op-section-collapse-body ${collapsedSections['pelvimetry'] ? 'collapsed-body-screen' : ''}`}>
                <div className="op-section-body" style={{ padding: '6px 10px', fontSize: '11.5px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', marginBottom: '8px' }}>
                    {[
                      ['sacralPromontoryNotReached', 'Sacral promontory not reached'],
                      ['ischialSpinesNotProminent', 'Ischial spines not prominent'],
                      ['sacroSciaticNotchAdequate', 'Sacro-sciatic notch adequate'],
                      ['subpubicAngleGt90', 'Sub-pubic angle > 90°'],
                      ['intertuberousAdequate', 'Intertuberous diameter adequate']
                    ].map(([k, label]) => (
                      <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
                        <input
                          type="checkbox"
                          checked={!!form.localExam.pelvimetry[k]}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            localExam: {
                              ...prev.localExam,
                              pelvimetry: {
                                ...prev.localExam.pelvimetry,
                                [k]: e.target.checked
                              }
                            }
                          }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                    <strong style={{ fontSize: '11px' }}>Impression :</strong>
                    {['Adequate', 'Borderline', 'Inadequate pelvis'].map(v => (
                      <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px' }}>
                        <input
                          type="radio"
                          name="pelvis_impression"
                          value={v}
                          checked={form.localExam.pelvisImpression === v}
                          onChange={(e) => setForm(prev => ({ ...prev, localExam: { ...prev.localExam, pelvisImpression: e.target.value } }))}
                        />
                        {v}
                      </label>
                    ))}
                  </div>

                  <div>
                    <strong style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Summary of positive findings :</strong>
                    <textarea
                      rows={2}
                      value={form.localExam.summaryPositiveFindings}
                      onChange={(e) => setForm(prev => ({ ...prev, localExam: { ...prev.localExam, summaryPositiveFindings: e.target.value } }))}
                      placeholder="Summary of abnormal or key positive findings..."
                      style={{ width: '100%', fontSize: '11px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: IMMUNISATION & ANTENATAL VISITS FLOW CHART & DFMC */}
      {/* ========================================================================= */}
      <div className={`page-break-before ${currentPage !== 4 ? 'hide-on-screen' : ''}`}>
        <div className="green-paper-container" style={{ backgroundColor: '#ffffff', borderColor: '#0f172a', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <HospitalPaperHeader />

          {/* J. IMMUNISATION & SUPPLEMENTATION */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('immunisation')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['immunisation'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>J. IMMUNISATION & SUPPLEMENTATION IN THIS PREGNANCY</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['immunisation'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['immunisation'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <table className="op-table" style={{ marginBottom: '8px' }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Due at</th>
                      <th>Date given</th>
                      <th>Batch no.</th>
                      <th>Remarks / compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {immunisations.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.item}</strong></td>
                        <td style={{ fontSize: '11px', color: '#475569' }}>{row.dueAt}</td>
                        <td><input type="date" value={row.dateGiven} onChange={(e) => setImmunisations(prev => { const u = [...prev]; u[idx].dateGiven = e.target.value; return u; })} min={new Date().toISOString().split('T')[0]} /></td>
                        <td><input type="text" value={row.batchNo} onChange={(e) => setImmunisations(prev => { const u = [...prev]; u[idx].batchNo = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                        <td><input type="text" value={row.remarks} onChange={(e) => setImmunisations(prev => { const u = [...prev]; u[idx].remarks = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                  <strong>Reasons for omission / adverse reactions / additional vaccines :</strong>
                  <input
                    type="text"
                    value={form.immunisationRemarksOmission}
                    onChange={(e) => setForm(prev => ({ ...prev, immunisationRemarksOmission: e.target.value }))}
                    style={{ flex: 1, borderBottom: '1px solid #0f172a' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* T. ANTENATAL VISIT FLOW CHART - PART 1 */}
          {renderVisitTable(antenatalVisitsPart1, setAntenatalVisitsPart1, 'T. ANTENATAL VISIT FLOW CHART — Part 1 (Visits 1 to 6)', 'visitsPart1')}

          {/* T. ANTENATAL VISIT FLOW CHART - PART 2 */}
          {renderVisitTable(antenatalVisitsPart2, setAntenatalVisitsPart2, 'T. ANTENATAL VISIT FLOW CHART — Part 2 (Visits 7 to 12)', 'visitsPart2')}

          {/* T. ANTENATAL VISIT FLOW CHART - PART 3 (Visits 13 to 18) */}
          {renderVisitTable(antenatalVisitsPart3, setAntenatalVisitsPart3, 'T. ANTENATAL VISIT FLOW CHART — Part 3 (Visits 13 to 18 - Extended / High-Risk)', 'visitsPart3')}

          {/* DFMC TABLE */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('dfmc')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['dfmc'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>Daily Fetal Movement Count (DFMC) – "count-to-ten", from 28 weeks; report if &lt;10 movements in 12 hours</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['dfmc'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['dfmc'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: 0 }}>
                <table className="op-table" style={{ margin: 0, border: 'none' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time started</th>
                      <th>Time of 10th movement</th>
                      <th>Total &lt; 10 ?</th>
                      <th>Action taken</th>
                      <th>Remarks / signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dfmcRows.map((row, idx) => (
                      <tr key={idx}>
                        <td><input type="date" value={row.date} onChange={(e) => setDfmcRows(prev => { const u = [...prev]; u[idx].date = e.target.value; return u; })} min={new Date().toISOString().split('T')[0]} /></td>
                        <td><input type="time" value={row.timeStarted} onChange={(e) => setDfmcRows(prev => { const u = [...prev]; u[idx].timeStarted = e.target.value; return u; })} /></td>
                        <td><input type="time" value={row.time10thMovement} onChange={(e) => setDfmcRows(prev => { const u = [...prev]; u[idx].time10thMovement = e.target.value; return u; })} /></td>
                        <td>
                          <select value={row.totalLt10} onChange={(e) => setDfmcRows(prev => { const u = [...prev]; u[idx].totalLt10 = e.target.value; return u; })}>
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </td>
                        <td><input type="text" value={row.actionTaken} onChange={(e) => setDfmcRows(prev => { const u = [...prev]; u[idx].actionTaken = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                        <td><input type="text" value={row.remarks} onChange={(e) => setDfmcRows(prev => { const u = [...prev]; u[idx].remarks = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: INVESTIGATIONS, HIGH-RISK, BIRTH PLAN, DIAGNOSIS, PLAN OF CARE & SIGNATURES */}
      {/* ========================================================================= */}
      <div className={`page-break-before ${currentPage !== 5 ? 'hide-on-screen' : ''}`}>
        <div className="green-paper-container" style={{ backgroundColor: '#ffffff', borderColor: '#0f172a', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <HospitalPaperHeader />

          {/* O. INVESTIGATIONS */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('investigations')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['investigations'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>O. INVESTIGATIONS (Routine / Trimester-wise Lab Tests)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['investigations'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['investigations'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: 0 }}>
                <table className="op-table" style={{ margin: 0, border: 'none' }}>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>When due</th>
                      <th>1st trimester (date / result)</th>
                      <th>2nd trimester (date / result)</th>
                      <th>3rd trimester (date / result)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investigations.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.test}</strong></td>
                        <td style={{ fontSize: '11px', color: '#475569' }}>{row.whenDue}</td>
                        <td><input type="text" value={row.t1} onChange={(e) => setInvestigations(prev => { const u = [...prev]; u[idx].t1 = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                        <td><input type="text" value={row.t2} onChange={(e) => setInvestigations(prev => { const u = [...prev]; u[idx].t2 = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                        <td><input type="text" value={row.t3} onChange={(e) => setInvestigations(prev => { const u = [...prev]; u[idx].t3 = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* P. OBSTETRIC ULTRASOUND & SCREENING */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('ultrasound')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['ultrasound'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>P. OBSTETRIC ULTRASOUND & SCREENING</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['ultrasound'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['ultrasound'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: 0 }}>
                <table className="op-table" style={{ margin: 0, border: 'none' }}>
                  <thead>
                    <tr>
                      <th>Scan</th>
                      <th>Due at</th>
                      <th>Date done</th>
                      <th>Report summary (GA, EFW, placenta, AFI, Doppler, remarks)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultrasound.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.scan}</strong></td>
                        <td style={{ fontSize: '11px', color: '#475569' }}>{row.dueAt}</td>
                        <td><input type="date" value={row.dateDone} onChange={(e) => setUltrasound(prev => { const u = [...prev]; u[idx].dateDone = e.target.value; return u; })} min={new Date().toISOString().split('T')[0]} /></td>
                        <td><input type="text" value={row.reportSummary} onChange={(e) => setUltrasound(prev => { const u = [...prev]; u[idx].reportSummary = e.target.value; return u; })} style={{ width: '100%' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Q. HIGH-RISK PREGNANCY SCREENING */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('highRisk')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['highRisk'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>Q. HIGH-RISK PREGNANCY SCREENING (PMSMA-style checklist)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['highRisk'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['highRisk'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px', fontSize: '11px', fontWeight: '600' }}>
                  {[
                    ['ageLt19', 'Age < 19 yrs'],
                    ['ageGte35', 'Age ≥ 35 yrs'],
                    ['heightLt145', 'Height < 145 cm'],
                    ['bmiLt18_5_Gte30', 'BMI < 18.5 or ≥ 30'],
                    ['grandMultipara', 'Grand multipara (≥ 5)'],
                    ['interpregnancyLt18m', 'Inter-pregnancy interval < 18 months'],
                    ['prevLscsScar', 'Previous LSCS / uterine scar'],
                    ['prevStillbirthNeonatalDeath', 'Prev stillbirth / neonatal death'],
                    ['gte3ConsecutiveAbortions', '≥ 3 consecutive abortions / RPL'],
                    ['prevPretermBirth', 'Prev preterm birth / late miscarriage'],
                    ['prevIugrSga', 'Prev IUGR / SGA baby'],
                    ['prevPphRetainedPlacenta', 'Prev PPH / retained placenta'],
                    ['prevPreeclampsiaEclampsia', 'Prev pre-eclampsia / eclampsia'],
                    ['prevGdm', 'Prev GDM / macrosomia'],
                    ['prevCongenitalAnomaly', 'Prev baby with congenital anomaly'],
                    ['multiplePregnancy', 'Multiple pregnancy (current)'],
                    ['malpresentationGte36wks', 'Malpresentation ≥ 36 wks'],
                    ['placentaPraeviaAph', 'Placenta praevia / APH'],
                    ['severeAnaemiaHbLt7', 'Severe anaemia (Hb < 7 g/dL)'],
                    ['hypertensionPresent', 'Hypertension / Pre-eclampsia'],
                    ['gdmOvertDiabetes', 'GDM / Overt diabetes mellitus'],
                    ['heartDisease', 'Heart disease'],
                    ['thyroidDisorder', 'Thyroid disorder'],
                    ['rhNegativeMother', 'Rh-negative mother (Rh isoimmunisation)'],
                    ['hivHbsagVdrlPositive', 'HIV / HBsAg / VDRL positive'],
                    ['tuberculosis', 'Tuberculosis'],
                    ['epilepsyPsychiatric', 'Epilepsy / Psychiatric illness'],
                    ['renalLiverDisease', 'Renal / liver disease'],
                    ['postDatedGte40wks', 'Post-dated pregnancy (≥ 40 wks)'],
                    ['reducedFetalMovements', 'Reduced fetal movements']
                  ].map(([k, label]) => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!form.highRiskScreening[k]}
                        onChange={(e) => setForm(prev => ({ ...prev, highRiskScreening: { ...prev.highRiskScreening, [k]: e.target.checked } }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px' }}>
                  <strong>Other high-risk factors / notes :</strong>
                  <input
                    type="text"
                    value={form.highRiskScreening.otherRiskFactors}
                    onChange={(e) => setForm(prev => ({ ...prev, highRiskScreening: { ...prev.highRiskScreening, otherRiskFactors: e.target.value } }))}
                    style={{ width: '80%', marginLeft: '6px' }}
                  />
                </div>
                <div style={{ marginTop: '10px', padding: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12px' }}>
                  <span>
                    <strong>RISK CATEGORY:</strong>{' '}
                    {['LOW RISK', 'HIGH RISK'].map(cat => (
                      <label key={cat} style={{ marginRight: '10px', fontWeight: 'bold' }}>
                        <input
                          type="radio"
                          name="riskCategory"
                          value={cat}
                          checked={form.highRiskScreening.riskCategory === cat}
                          onChange={(e) => setForm(prev => ({ ...prev, highRiskScreening: { ...prev.highRiskScreening, riskCategory: e.target.value } }))}
                        />
                        {cat}
                      </label>
                    ))}
                  </span>
                  {form.highRiskScreening.riskCategory === 'HIGH RISK' && (
                    <span>
                      <strong>Reason:</strong>
                      <input
                        type="text"
                        value={form.highRiskScreening.highRiskReason}
                        onChange={(e) => setForm(prev => ({ ...prev, highRiskScreening: { ...prev.highRiskScreening, highRiskReason: e.target.value } }))}
                        style={{ width: '220px', marginLeft: '6px' }}
                      />
                    </span>
                  )}
                  <span>
                    <strong>NEEDS REFERRAL TO:</strong>
                    <input
                      type="text"
                      value={form.highRiskScreening.needsReferralTo}
                      onChange={(e) => setForm(prev => ({ ...prev, highRiskScreening: { ...prev.highRiskScreening, needsReferralTo: e.target.value } }))}
                      style={{ width: '200px', marginLeft: '6px' }}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* R. RISK-BASED MANAGEMENT & PROPHYLAXIS */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('riskManagement')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['riskManagement'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>R. RISK-BASED MANAGEMENT & PROPHYLAXIS</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['riskManagement'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['riskManagement'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <div className="op-grid-2">
                  {/* PRE-ECLAMPSIA PROPHYLAXIS */}
                  <div style={{ borderRight: '1px solid #cbd5e1', paddingRight: '12px' }}>
                    <div style={{ fontWeight: '800', borderBottom: '1px solid #0f172a', paddingBottom: '4px', marginBottom: '6px', fontSize: '12px', color: '#0f172a' }}>PRE-ECLAMPSIA PROPHYLAXIS</div>
                    <div style={{ fontSize: '11.5px' }}>
                      <div><strong>Risk factors present:</strong> <label><input type="radio" name="peRisk" value="No" checked={form.riskBasedManagement.preeclampsia.riskFactorsPresent === 'No'} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, preeclampsia: { ...prev.riskBasedManagement.preeclampsia, riskFactorsPresent: e.target.value } } }))} /> No</label> <label><input type="radio" name="peRisk" value="Yes" checked={form.riskBasedManagement.preeclampsia.riskFactorsPresent === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, preeclampsia: { ...prev.riskBasedManagement.preeclampsia, riskFactorsPresent: e.target.value } } }))} /> Yes</label></div>
                      <div style={{ marginTop: '4px' }}>
                        <strong>Tab Aspirin 150 mg at bedtime:</strong>
                        <select value={form.riskBasedManagement.preeclampsia.tabAspirin} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, preeclampsia: { ...prev.riskBasedManagement.preeclampsia, tabAspirin: e.target.value } } }))} style={{ marginLeft: '4px' }}>
                          <option value="Not indicated">Not indicated</option>
                          <option value="Started on">Started on</option>
                        </select>
                        {form.riskBasedManagement.preeclampsia.tabAspirin === 'Started on' && (
                          <input type="text" placeholder="at ___ wks" value={form.riskBasedManagement.preeclampsia.aspirinWks} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, preeclampsia: { ...prev.riskBasedManagement.preeclampsia, aspirinWks: e.target.value } } }))} style={{ width: '70px', marginLeft: '4px' }} />
                        )}
                      </div>
                      <div style={{ marginTop: '4px' }}><strong>Calcium 1 g/day:</strong> <select value={form.riskBasedManagement.preeclampsia.calcium1g} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, preeclampsia: { ...prev.riskBasedManagement.preeclampsia, calcium1g: e.target.value } } }))}><option value="Not started">Not started</option><option value="Started">Started</option></select></div>
                    </div>
                  </div>

                  {/* ANAEMIA (Anemia Mukt Bharat) */}
                  <div>
                    <div style={{ fontWeight: '800', borderBottom: '1px solid #0f172a', paddingBottom: '4px', marginBottom: '6px', fontSize: '12px', color: '#0f172a' }}>ANAEMIA (Anemia Mukt Bharat)</div>
                    <div style={{ fontSize: '11.5px' }}>
                      <div><strong>Hb:</strong> <input type="text" value={form.riskBasedManagement.anaemia.hb} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, anaemia: { ...prev.riskBasedManagement.anaemia, hb: e.target.value } } }))} style={{ width: '50px' }} /> g/dL | <strong>Category:</strong> <select value={form.riskBasedManagement.anaemia.category} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, anaemia: { ...prev.riskBasedManagement.anaemia, category: e.target.value } } }))}><option value="Normal">Normal</option><option value="Mild">Mild</option><option value="Moderate">Moderate</option><option value="Severe">Severe</option></select></div>
                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <label><input type="checkbox" checked={form.riskBasedManagement.anaemia.planOralIfa} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, anaemia: { ...prev.riskBasedManagement.anaemia, planOralIfa: e.target.checked } } }))} /> Oral IFA</label>
                        <label><input type="checkbox" checked={form.riskBasedManagement.anaemia.planIvIronSucrose} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, anaemia: { ...prev.riskBasedManagement.anaemia, planIvIronSucrose: e.target.checked } } }))} /> IV Iron Sucrose</label>
                        <label><input type="checkbox" checked={form.riskBasedManagement.anaemia.planBloodTransfusion} onChange={(e) => setForm(prev => ({ ...prev, riskBasedManagement: { ...prev.riskBasedManagement, anaemia: { ...prev.riskBasedManagement.anaemia, planBloodTransfusion: e.target.checked } } }))} /> Blood Transfusion</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* S. MULTIDISCIPLINARY REFERRALS / OPINIONS */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('referrals')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['referrals'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>S. MULTIDISCIPLINARY REFERRALS / OPINIONS</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['referrals'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['referrals'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <textarea
                  value={form.multidisciplinaryReferrals}
                  onChange={(e) => setForm(prev => ({ ...prev, multidisciplinaryReferrals: e.target.value }))}
                  rows={2}
                  placeholder="Record referral opinions, dates and multidisciplinary advice..."
                  className="assessment-textarea"
                  style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* U. BIRTH PREPAREDNESS & COMPLICATION READINESS PLAN */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('birthPlan')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['birthPlan'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>U. BIRTH PREPAREDNESS & COMPLICATION READINESS PLAN</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['birthPlan'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['birthPlan'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ fontSize: '11.5px' }}>
                <div className="op-grid-2">
                  {/* Left Column */}
                  <div style={{ borderRight: '1px solid #cbd5e1', paddingRight: '12px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Planned place of delivery :</strong>
                      <input
                        type="text"
                        value={form.birthPreparedness.plannedPlaceOfDelivery}
                        onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, plannedPlaceOfDelivery: e.target.value } }))}
                        style={{ marginLeft: '6px', width: '220px' }}
                      />
                    </div>

                    <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <strong>Anticipated mode :</strong>
                      <label><input type="checkbox" checked={form.birthPreparedness.anticipatedModeVaginal} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, anticipatedModeVaginal: e.target.checked } }))} /> Vaginal</label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" checked={form.birthPreparedness.anticipatedModeElectiveLscs} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, anticipatedModeElectiveLscs: e.target.checked } }))} /> Elective LSCS on
                        {form.birthPreparedness.anticipatedModeElectiveLscs && (
                          <input type="text" placeholder="wks/date" value={form.birthPreparedness.electiveLscsWeeksDate} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, electiveLscsWeeksDate: e.target.value } }))} style={{ width: '80px', marginLeft: '4px' }} />
                        )}
                      </label>
                      <label><input type="checkbox" checked={form.birthPreparedness.anticipatedModeTrialOfLabour} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, anticipatedModeTrialOfLabour: e.target.checked } }))} /> Trial of labour after LSCS</label>
                    </div>

                    <div style={{ marginBottom: '6px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <strong>Transport arranged :</strong>
                        <label style={{ marginLeft: '4px', cursor: 'pointer' }}><input type="radio" name="transArr" value="Yes" checked={form.birthPreparedness.transportArranged === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, transportArranged: e.target.value } }))} /> Yes</label>
                        <label style={{ marginLeft: '4px', cursor: 'pointer' }}><input type="radio" name="transArr" value="No" checked={form.birthPreparedness.transportArranged === 'No'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, transportArranged: e.target.value } }))} /> No</label>
                      </div>
                      {form.birthPreparedness.transportArranged === 'Yes' && (
                        <div>
                          <strong>Contact :</strong>
                          <input type="text" value={form.birthPreparedness.transportContact} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, transportContact: e.target.value } }))} style={{ width: '120px', marginLeft: '4px' }} />
                        </div>
                      )}
                    </div>

                    <div>
                      <strong>Birth companion :</strong>
                      <input type="text" value={form.birthPreparedness.birthCompanion} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, birthCompanion: e.target.value } }))} style={{ marginLeft: '6px', width: '230px' }} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Blood group arranged / donor identified :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="bgArr" value="Yes" checked={form.birthPreparedness.bloodGroupDonorArranged === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, bloodGroupDonorArranged: e.target.value } }))} /> Yes</label>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="bgArr" value="No" checked={form.birthPreparedness.bloodGroupDonorArranged === 'No'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, bloodGroupDonorArranged: e.target.value } }))} /> No</label>
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <strong>Funds / scheme :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="checkbox" checked={form.birthPreparedness.fundsSchemeArranged} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, fundsSchemeArranged: e.target.checked } }))} /> Arranged</label>
                      <label style={{ marginLeft: '6px' }}><input type="checkbox" checked={form.birthPreparedness.fundsSchemeToBeArranged} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, fundsSchemeToBeArranged: e.target.checked } }))} /> To be arranged</label>
                    </div>

                    <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <strong>Postpartum contraception counselled :</strong>
                      <label><input type="checkbox" checked={form.birthPreparedness.ppiucd} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, ppiucd: e.target.checked } }))} /> PPIUCD</label>
                      <label><input type="checkbox" checked={form.birthPreparedness.sterilisation} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, sterilisation: e.target.checked } }))} /> Sterilisation</label>
                      <label><input type="checkbox" checked={form.birthPreparedness.barrier} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, barrier: e.target.checked } }))} /> Barrier</label>
                      <label><input type="checkbox" checked={form.birthPreparedness.injectable} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, injectable: e.target.checked } }))} /> Injectable</label>
                      <label><input type="checkbox" checked={form.birthPreparedness.undecided} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, undecided: e.target.checked } }))} /> Undecided</label>
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <strong>Emergency contact number given to family :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="emergNo" value="Yes" checked={form.birthPreparedness.emergencyContactGiven === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, emergencyContactGiven: e.target.value } }))} /> Yes</label>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="emergNo" value="No" checked={form.birthPreparedness.emergencyContactGiven === 'No'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, emergencyContactGiven: e.target.value } }))} /> No</label>
                    </div>

                    <div>
                      <strong>Newborn care & exclusive breastfeeding explained :</strong>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="newbornExp" value="Yes" checked={form.birthPreparedness.newbornCareExplained === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, newbornCareExplained: e.target.value } }))} /> Yes</label>
                      <label style={{ marginLeft: '6px' }}><input type="radio" name="newbornExp" value="No" checked={form.birthPreparedness.newbornCareExplained === 'No'} onChange={(e) => setForm(prev => ({ ...prev, birthPreparedness: { ...prev.birthPreparedness, newbornCareExplained: e.target.value } }))} /> No</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* V. DANGER SIGNS EXPLAINED TO WOMAN & FAMILY */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('dangerSigns')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['dangerSigns'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>V. DANGER SIGNS EXPLAINED TO WOMAN & FAMILY (tick when counselled)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['dangerSigns'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['dangerSigns'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <div className="op-grid-3" style={{ fontSize: '11.5px', marginBottom: '8px' }}>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.bleedingPV} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, bleedingPV: e.target.checked } }))} /> Bleeding PV</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.severeHeadacheBlurring} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, severeHeadacheBlurring: e.target.checked } }))} /> Severe headache / blurring of vision</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.convulsionsLossConsciousness} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, convulsionsLossConsciousness: e.target.checked } }))} /> Convulsions / loss of consciousness</label>

                  <label><input type="checkbox" checked={form.dangerSignsCounselled.severePainAbdomen} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, severePainAbdomen: e.target.checked } }))} /> Severe pain abdomen</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.leakingFluidPV} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, leakingFluidPV: e.target.checked } }))} /> Leaking of fluid PV</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.decreasedFetalMovements} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, decreasedFetalMovements: e.target.checked } }))} /> Decreased or absent fetal movements</label>

                  <label><input type="checkbox" checked={form.dangerSignsCounselled.highFeverChills} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, highFeverChills: e.target.checked } }))} /> High fever with chills</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.persistentVomiting} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, persistentVomiting: e.target.checked } }))} /> Persistent vomiting</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.swellingFaceHands} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, swellingFaceHands: e.target.checked } }))} /> Swelling of face & hands</label>

                  <label><input type="checkbox" checked={form.dangerSignsCounselled.breathlessnessAtRest} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, breathlessnessAtRest: e.target.checked } }))} /> Breathlessness at rest</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.burningMicturition} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, burningMicturition: e.target.checked } }))} /> Burning micturition / reduced urine</label>
                  <label><input type="checkbox" checked={form.dangerSignsCounselled.foulSmellingDischarge} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, foulSmellingDischarge: e.target.checked } }))} /> Foul-smelling discharge</label>
                </div>

                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontSize: '11.5px' }}>
                  <div>
                    <strong>Counselled by :</strong>
                    <input type="text" value={form.dangerSignsCounselled.counselledBy} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, counselledBy: e.target.value } }))} style={{ width: '150px', marginLeft: '4px' }} />
                  </div>
                  <div>
                    <strong>Language used :</strong>
                    <input type="text" value={form.dangerSignsCounselled.languageUsed} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, languageUsed: e.target.value } }))} style={{ width: '120px', marginLeft: '4px' }} />
                  </div>
                  <div>
                    <strong>Understood by patient / attendant :</strong>
                    <label style={{ marginLeft: '4px' }}><input type="radio" name="undPat" value="Yes" checked={form.dangerSignsCounselled.understoodByPatient === 'Yes'} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, understoodByPatient: e.target.value } }))} /> Yes</label>
                    <label style={{ marginLeft: '4px' }}><input type="radio" name="undPat" value="No" checked={form.dangerSignsCounselled.understoodByPatient === 'No'} onChange={(e) => setForm(prev => ({ ...prev, dangerSignsCounselled: { ...prev.dangerSignsCounselled, understoodByPatient: e.target.value } }))} /> No</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* W. PROVISIONAL DIAGNOSIS */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('provisionalDiag')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['provisionalDiag'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>W. PROVISIONAL DIAGNOSIS</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['provisionalDiag'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['provisionalDiag'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <textarea
                  value={form.provisionalDiagnosis}
                  onChange={(e) => setForm(prev => ({ ...prev, provisionalDiagnosis: e.target.value }))}
                  rows={2}
                  placeholder="Record provisional diagnosis, obstetric formula, GA, risk factors..."
                  className="assessment-textarea"
                  style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* X. PLAN OF CARE */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('planCare')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['planCare'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>X. PLAN OF CARE (Investigations, Drugs, Timing &amp; Mode of Delivery)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['planCare'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['planCare'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body">
                <textarea
                  value={form.planOfCare}
                  onChange={(e) => setForm(prev => ({ ...prev, planOfCare: e.target.value }))}
                  rows={4}
                  placeholder="Detail investigations, medications with dose & route, monitoring plan, timing & mode of delivery, follow-up..."
                  className="assessment-textarea"
                  style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* SIGNATURES TABLE & FOOTER */}
          <div className="op-section-box">
            <div
              className="op-section-header"
              onClick={() => toggleSection('signatures')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', transform: collapsedSections['signatures'] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={15} />
                </span>
                <span>DOCTOR SIGNATURES &amp; REVIEW RECORD</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1', textTransform: 'none' }}>
                {collapsedSections['signatures'] ? 'Expand' : 'Collapse'}
              </span>
            </div>
            <div className={`op-section-collapse-body ${collapsedSections['signatures'] ? 'collapsed-body-screen' : ''}`}>
              <div className="op-section-body" style={{ padding: '8px' }}>
                <table className="op-table" style={{ marginBottom: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Name of the Resident Doctor</th>
                      <th style={{ width: '15%' }}>Date</th>
                      <th style={{ width: '15%' }}>Time</th>
                      <th style={{ width: '25%' }}>Consultant Name</th>
                      <th style={{ width: '20%' }}>Signature of the Consultant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><input type="text" value={form.page10Signatures.residentDoctorName} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, residentDoctorName: e.target.value } }))} style={{ width: '100%' }} /></td>
                      <td><input type="date" value={form.page10Signatures.date} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, date: e.target.value } }))} style={{ width: '100%' }} min={new Date().toISOString().split('T')[0]} /></td>
                      <td><input type="time" value={form.page10Signatures.time} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, time: e.target.value } }))} style={{ width: '100%' }} /></td>
                      <td><input type="text" value={form.page10Signatures.consultantName} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, consultantName: e.target.value } }))} style={{ width: '100%' }} /></td>
                      <td><input type="text" placeholder="Sign / Stamp" value={form.page10Signatures.consultantSignature} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, consultantSignature: e.target.value } }))} style={{ width: '100%' }} /></td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '11.5px', borderTop: '1px solid #0f172a', paddingTop: '8px' }}>
                  <div>
                    <strong>Reg. No. / Stamp :</strong>
                    <input type="text" value={form.page10Signatures.regNoStamp} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, regNoStamp: e.target.value } }))} style={{ marginLeft: '4px', width: '150px', borderBottom: '1px solid #0f172a' }} />
                  </div>
                  <div>
                    <strong>Reviewed on :</strong>
                    <input type="date" value={form.page10Signatures.reviewedOn} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, reviewedOn: e.target.value } }))} style={{ marginLeft: '4px', borderBottom: '1px solid #0f172a' }} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <strong>Next review :</strong>
                    <input type="text" placeholder="Date / Event" value={form.page10Signatures.nextReview} onChange={(e) => setForm(prev => ({ ...prev, page10Signatures: { ...prev.page10Signatures, nextReview: e.target.value } }))} style={{ marginLeft: '4px', width: '150px', borderBottom: '1px solid #0f172a' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Pagination Footer Bar */}
      {/* ========================================================================= */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={{
            padding: '6px 14px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: currentPage === 1 ? '#cbd5e1' : '#2563eb',
            color: currentPage === 1 ? '#94a3b8' : '#ffffff',
            fontWeight: '700',
            fontSize: '12px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ChevronLeft size={16} />
          <span>Previous Page</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[1, 2, 3, 4, 5].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPage(p)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: currentPage === p ? '2px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: currentPage === p ? '#0284c7' : '#ffffff',
                color: currentPage === p ? '#ffffff' : '#0f172a',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <span style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>
          Page {currentPage} of 5
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, 5))}
          disabled={currentPage === 5}
          style={{
            padding: '6px 14px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: currentPage === 5 ? '#cbd5e1' : '#2563eb',
            color: currentPage === 5 ? '#94a3b8' : '#ffffff',
            fontWeight: '700',
            fontSize: '12px',
            cursor: currentPage === 5 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>Next Page</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
