import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo, fetchRegisteredPatientsFromBackend, updatePatientWardTransfer } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';
import { focusFirstInputOfVisiblePage } from '../utils/keyboardNavigation';

const PERSIST_KEY = 'admission_record_form';

export default function AdmissionRecordPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchRegisteredPatientsFromBackend();
  }, []);

  useEffect(() => {
    focusFirstInputOfVisiblePage();
  }, [currentPage]);

  const [form, setForm] = useState({
    // --- PAGE 1: DEMOGRAPHICS & ADMISSION RECORD ---
    uhidNo: '',
    ipNo: '',
    isMlc: '', // 'yes', 'no'
    patientName: '',
    dob: '',
    age: '',
    address: '',
    hasInsurance: '', // 'yes', 'no'
    sex: '',
    tpaCompanyName: '',
    bloodGroup: '',
    religion: '',
    nationality: '',
    phoneOffice: '',
    phoneResi: '',
    maritalStatus: '',
    occupation: '',
    mobileNo: '',
    dateOfAdmission: new Date().toISOString().split('T')[0],
    timeOfAdmission: new Date().toTimeString().slice(0, 5),
    email: '',
    dateOfDischarge: '',
    timeOfDischarge: '',
    broughtByName: '',
    wardType: '',
    roomNo: '',
    bedNo: '',
    hospitalDays: '',
    mainConsultant: '',
    referredByDoctor: '',
    otherConsultants: '',

    wardTransfers: [
      { date: '', time: '', ward: '', roomNo: '', bedNo: '' },
      { date: '', time: '', ward: '', roomNo: '', bedNo: '' }
    ],

    emergencyContactName: '',
    emergencyContactRel: '',
    emergencyContactMobile: '',
    emergencyContactEmail: '',
    emergencyContactPhoneOffice: '',
    emergencyContactPhoneResi: '',
    emergencyContactAddress: '',

    // --- PAGE 2: CONSENT FOR HOSPITALIZATION & CONDUCT OF ALL PROCEDURES + FINANCIAL AUTHORIZATION ---
    consentDate: new Date().toISOString().split('T')[0],
    consentTime: new Date().toTimeString().slice(0, 5),
    patientConsentSignature: '',
    repFullNameBlock: '',
    repRelationship: '',
    consultantConsentSignature: '',

    declarantType: 'attender', // 'patient' | 'attender'
    declarantName: '',
    declarantAddress: '',
    targetRelativeRelationship: '',
    finSignDate: new Date().toISOString().split('T')[0],
    finSignTime: new Date().toTimeString().slice(0, 5),
    finSignature: '',

    // --- PAGE 3: DIAGNOSES, PROCEDURES, RESULT & SIGNATURES ---
    provisionalDiagnosis: '',
    finalDiagnosis: '',
    secondaryDiagnosis: '',
    operativeProcedures: '',
    result: '', // 'recovered', 'improved', 'unchanged', 'diagnosis_only', 'worse', 'dama', 'expired'
    causeOfDeath: '',
    isAccident: false,
    modeOfAccident: '',
    isPoison: false,
    modeOfPoisoning: '',
    residentDoctorSignature: '',
    residentDoctorSignDate: new Date().toISOString().split('T')[0],
    consultantSignature: '',
    consultantSignDate: new Date().toISOString().split('T')[0]
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      if (key === 'wardTransfers') {
        sanitized[key] = Array.isArray(data[key])
          ? data[key].map(wt => ({ ...wt, date: toISODate(wt?.date) || (wt?.date || '') }))
          : [];
      } else {
        sanitized[key] = data[key] ?? '';
      }
    }
    if (sanitized.dateOfAdmission) sanitized.dateOfAdmission = toISODate(sanitized.dateOfAdmission);
    if (sanitized.dateOfDischarge) sanitized.dateOfDischarge = toISODate(sanitized.dateOfDischarge);
    if (sanitized.dob) sanitized.dob = toISODate(sanitized.dob);
    if (sanitized.consentDate) sanitized.consentDate = toISODate(sanitized.consentDate);
    if (sanitized.finSignDate) sanitized.finSignDate = toISODate(sanitized.finSignDate);
    if (sanitized.residentDoctorSignDate) sanitized.residentDoctorSignDate = toISODate(sanitized.residentDoctorSignDate);
    if (sanitized.consultantSignDate) sanitized.consultantSignDate = toISODate(sanitized.consultantSignDate);
    return sanitized;
  };

  useEffect(() => {
    if (editData) {
      const sanitized = sanitizeFormData(editData);
      setForm(prev => ({ ...prev, ...sanitized }));
      if (editRecordId) setRecordId(editRecordId);
      if (sanitized.ipNo || sanitized.uhidNo) {
        triggerAutofill(sanitized.ipNo || sanitized.uhidNo);
      }
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.form) {
          const sanitized = sanitizeFormData(saved.form);
          setForm(f => ({ ...f, ...sanitized }));
          if (sanitized.ipNo || sanitized.uhidNo) {
            triggerAutofill(sanitized.ipNo || sanitized.uhidNo);
          }
        }
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = { form, recordId };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.provisionalDiagnosis || form.declarantName;
      const patientHeader = {
        name: form.patientName || form.declarantName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.wardType
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Admission Record', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  useEffect(() => {
    const textareas = document.querySelectorAll('.auto-expand-textarea');
    textareas.forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    });
  }, [form, currentPage]);

  // Month mapping for parsing formatted dates (e.g. 06-Oct-2026)
  const MONTH_MAP = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  // Helper: convert DD-MM-YYYY or DD-MMM-YYYY or ISO date string to standard YYYY-MM-DD
  const toISODate = (dateStr) => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.substring(0, 10);
    }
    const parts = str.split(/[-/\s]+/);
    if (parts.length === 3) {
      const m1 = parts[1].toLowerCase();
      const monthNum1 = MONTH_MAP[m1] || (/^\d+$/.test(parts[1]) && parts[1].length <= 2 ? parts[1].padStart(2, '0') : '');
      const dClean = parts[0].replace(/[^0-9]/g, '').padStart(2, '0');
      const yClean = parts[2].replace(/[^0-9]/g, '');
      
      if (yClean.length === 4 && monthNum1 && dClean) {
        // DD-Month-YYYY -> YYYY-MM-DD
        return `${yClean}-${monthNum1}-${dClean}`;
      } else if (parts[0].length === 4 && monthNum1) {
        const lastClean = parts[2].replace(/[^0-9]/g, '').padStart(2, '0');
        return `${parts[0]}-${monthNum1}-${lastClean}`;
      }
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  // Helper: Calculate hospital stay days between admission date and discharge date (or today)
  const calculateHospitalDays = (doaStr, dodStr) => {
    const isoDoa = toISODate(doaStr);
    if (!isoDoa) return '';
    const dAdmission = new Date(isoDoa + 'T00:00:00');
    if (isNaN(dAdmission.getTime())) return '';

    let dEnd;
    const isoDod = toISODate(dodStr);
    if (isoDod) {
      dEnd = new Date(isoDod + 'T00:00:00');
      if (isNaN(dEnd.getTime())) {
        const now = new Date();
        dEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
    } else {
      const now = new Date();
      dEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const start = new Date(dAdmission.getFullYear(), dAdmission.getMonth(), dAdmission.getDate());
    const end = new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate());

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const totalDays = Math.max(1, diffDays <= 0 ? 1 : diffDays);
    return `${totalDays} Day${totalDays > 1 ? 's' : ''}`;
  };

  useEffect(() => {
    if (form.dateOfAdmission) {
      const days = calculateHospitalDays(form.dateOfAdmission, form.dateOfDischarge);
      if (days && form.hospitalDays !== days) {
        setForm(prev => ({ ...prev, hospitalDays: days }));
      }
    }
  }, [form.dateOfAdmission, form.dateOfDischarge]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'hasInsurance') {
      const isYes = value.toLowerCase() === 'yes';
      setForm(prev => ({
        ...prev,
        hasInsurance: isYes ? 'yes' : 'no',
        tpaCompanyName: isYes ? prev.tpaCompanyName : ''
      }));
      return;
    }

    if (name === 'dateOfAdmission' || name === 'dateOfDischarge') {
      const doa = name === 'dateOfAdmission' ? value : form.dateOfAdmission;
      const dod = name === 'dateOfDischarge' ? value : form.dateOfDischarge;
      const days = calculateHospitalDays(doa, dod);
      setForm(prev => ({
        ...prev,
        [name]: value,
        hospitalDays: days || prev.hospitalDays
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleWardTransferChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.wardTransfers];
      updated[index] = { ...updated[index], [field]: value };

      let latestWard = '';
      let latestRoom = '';
      let latestBed = '';
      for (let i = updated.length - 1; i >= 0; i--) {
        const row = updated[i];
        if (row.ward && row.ward.trim() !== '') {
          latestWard = row.ward.trim();
          latestRoom = row.roomNo || '';
          latestBed = row.bedNo || '';
          break;
        }
      }

      const ipOrUhid = prev.ipNo || prev.uhidNo;
      if (ipOrUhid) {
        updatePatientWardTransfer(ipOrUhid, updated, latestWard ? { ward: latestWard, roomNo: latestRoom, bedNo: latestBed } : null);
      }

      return {
        ...prev,
        wardTransfers: updated,
        ...(latestWard ? {
          wardType: latestWard,
          ...(latestRoom ? { roomNo: latestRoom } : {}),
          ...(latestBed ? { bedNo: latestBed } : {})
        } : {})
      };
    });
  };

  const addWardTransferRow = () => {
    setForm(prev => ({
      ...prev,
      wardTransfers: [...prev.wardTransfers, { date: '', time: '', ward: '', roomNo: '', bedNo: '' }]
    }));
  };

  const removeWardTransferRow = (index) => {
    setForm(prev => ({
      ...prev,
      wardTransfers: prev.wardTransfers.filter((_, i) => i !== index)
    }));
  };

  const handleDeclarantTypeChange = (type) => {
    setForm(prev => {
      if (type === 'patient') {
        return {
          ...prev,
          declarantType: 'patient',
          declarantName: prev.patientName || '',
          declarantAddress: prev.address || '',
          targetRelativeRelationship: 'myself / self',
          finSignature: prev.patientName || ''
        };
      } else {
        const attName = prev.emergencyContactName || prev.broughtByName || '';
        const attRel = prev.emergencyContactRel || 'relative';
        const attAddr = prev.emergencyContactAddress || prev.address || '';
        return {
          ...prev,
          declarantType: 'attender',
          declarantName: attName,
          declarantAddress: attAddr,
          targetRelativeRelationship: attRel || 'relative',
          finSignature: attName
        };
      }
    });
  };

  const triggerAutofill = async (value) => {
    if (!value || !String(value).trim()) return;
    const searchVal = String(value).trim().toUpperCase();
    const cleanSearch = searchVal.replace(/[^A-Z0-9]/g, '');

    // Step 1: Autofill from IPRegister / local patient registry
    let found = findPatientByIpNo(value);

    // Step 2: Fetch latest backend database patients to ensure full synchronization
    let backendMatch = null;
    try {
      const res = await fetch('http://localhost:5000/api/patients');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        backendMatch = data.data.find(p => {
          const pIp = (p.ip_no || '').toUpperCase();
          const pUhid = (p.uhid_no || '').toUpperCase();
          const pCleanIp = pIp.replace(/[^A-Z0-9]/g, '');
          const pCleanUhid = pUhid.replace(/[^A-Z0-9]/g, '');

          if (pIp === searchVal || pUhid === searchVal) return true;
          if (cleanSearch && (pCleanIp === cleanSearch || pCleanUhid === cleanSearch)) return true;

          let regData = p.registration_data;
          if (typeof regData === 'string') {
            try { regData = JSON.parse(regData); } catch (e) {}
          }
          if (regData) {
            const regId = (regData.patientId || regData.uhidNo || regData.ipNo || '').toUpperCase();
            const cleanRegId = regId.replace(/[^A-Z0-9]/g, '');
            if (regId === searchVal || (cleanSearch && cleanRegId === cleanSearch)) return true;
          }
          return false;
        });
      }
    } catch (err) {
      console.warn('Admission autofill: backend fetch error', err);
    }

    let backendRegData = {};
    if (backendMatch?.registration_data) {
      if (typeof backendMatch.registration_data === 'string') {
        try { backendRegData = JSON.parse(backendMatch.registration_data); } catch (e) {}
      } else {
        backendRegData = backendMatch.registration_data;
      }
    }

    if (!found && !backendMatch) return;

    const pt = { ...backendRegData, ...(backendMatch || {}), ...(found || {}) };

    // 1. MLC Status
    const rawMlc = pt.isMlc || pt.mlc || backendRegData.isMlc || backendRegData.mlc;
    const isMlcFlag = (rawMlc && String(rawMlc).trim().toLowerCase() === 'yes') ? 'yes' : 'no';

    // 2. Insurance & TPA Company Name
    const payDetails = pt.paymentDetails || backendRegData.paymentDetails || '';
    const rawInsName = pt.insuranceProvider || pt.tpaCompanyName || pt.tpaCompany || backendRegData.insuranceProvider || backendRegData.tpaCompanyName || '';
    const isIns = (
      payDetails === 'Insurance' ||
      String(pt.hasInsurance).toLowerCase() === 'yes' ||
      String(pt.medicalInsurance).toLowerCase() === 'yes' ||
      pt.patientType === 'Insurance' ||
      backendRegData.regType === 'Insurance' ||
      (rawInsName && rawInsName.trim() !== '' && rawInsName.toLowerCase() !== 'self' && rawInsName.toLowerCase() !== 'insurance')
    );
    const hasInsFlag = isIns ? 'yes' : 'no';
    const cleanInsName = isIns ? (rawInsName && rawInsName !== 'Insurance' ? rawInsName : '') : '';

    // 3. Admission Date & Hospital Days
    const rawDoa = pt.doa || backendMatch?.doa || backendRegData.doa || form.dateOfAdmission;
    const doaConverted = toISODate(rawDoa) || form.dateOfAdmission;
    const daysCalculated = calculateHospitalDays(doaConverted, form.dateOfDischarge);

    // 4. DOB & Age
    const dobConverted = toISODate(pt.dob || backendRegData.dob);
    let ageStr = '';
    if (pt.age) {
      ageStr = String(pt.age);
    } else if (backendRegData.ageYear !== undefined || backendRegData.ageMonth !== undefined) {
      ageStr = `${backendRegData.ageYear || 0}Y ${backendRegData.ageMonth || 0}M ${backendRegData.ageDay || 0}D`;
    } else if (backendMatch?.age) {
      ageStr = String(backendMatch.age);
    }

    // 5. Patient Name
    const fullName = pt.patientName || (pt.firstName ? `${pt.title ? pt.title + ' ' : ''}${pt.firstName}`.trim() : (backendMatch?.name || ''));

    // 6. Address
    const fullAddress = pt.presentAddress || pt.address || (backendRegData.presentAddress ? [backendRegData.presentAddress, backendRegData.address2, backendRegData.location, backendRegData.pincode].filter(Boolean).join(', ') : '');

    // 7. Attender Details & Brought By (Multi-attender aware)
    const primaryAttender = (pt.attenders && Array.isArray(pt.attenders) && pt.attenders.length > 0)
      ? (pt.attenders.find(a => a.isPrimary) || pt.attenders[0])
      : ((backendRegData.attenders && Array.isArray(backendRegData.attenders) && backendRegData.attenders.length > 0)
        ? (backendRegData.attenders.find(a => a.isPrimary) || backendRegData.attenders[0])
        : null);

    const attName = primaryAttender?.attenderName || pt.attenderName || backendRegData.attenderName || pt.relationName || backendRegData.relationName || pt.attender || '';
    const attRel = primaryAttender?.relationType || pt.relationType || backendRegData.relationType || pt.attenderRelationType || backendRegData.attenderRelationType || '';
    const attPhone = primaryAttender?.attenderMobileNo || pt.attenderMobileNo || backendRegData.attenderMobileNo || pt.alternateContact || backendRegData.alternateContact || pt.altContact || '';
    const attEmail = primaryAttender?.attenderEmail || pt.attenderEmail || backendRegData.attenderEmail || '';
    const attAddr = primaryAttender?.attenderAddress || pt.attenderAddress || backendRegData.attenderAddress || fullAddress || '';

    const broughtBy = attName ? (attRel ? `${attRel}: ${attName}` : attName) : (pt.attender || pt.relationName || '');

    // 8. Ward Transfers from Billing (Activity Record Billing)
    let billingWardTransfers = [];
    try {
      const storedTransfers = (cleanSearch && localStorage.getItem('patient_ward_transfers_' + cleanSearch)) ||
                              (pt.ipNo && localStorage.getItem('patient_ward_transfers_' + pt.ipNo.replace(/[^A-Z0-9]/g, '').toUpperCase())) ||
                              (pt.uhidNo && localStorage.getItem('patient_ward_transfers_' + pt.uhidNo.replace(/[^A-Z0-9]/g, '').toUpperCase()));
      if (storedTransfers) {
        const parsed = JSON.parse(storedTransfers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          billingWardTransfers = parsed;
        }
      }
    } catch (e) {}

    if (billingWardTransfers.length === 0) {
      try {
        const savedRecs = getSavedRecords();
        const billingRec = savedRecs.find(r => 
          (r.formType === 'Activity Record Billing' || r.formType === 'activity-record-billing') &&
          (
            (r.patientIpNo && (r.patientIpNo.toUpperCase() === searchVal || r.patientIpNo.replace(/[^A-Z0-9]/g, '') === cleanSearch)) ||
            (r.data?.patient?.ipNo && (r.data.patient.ipNo.toUpperCase() === searchVal || r.data.patient.ipNo.replace(/[^A-Z0-9]/g, '') === cleanSearch)) ||
            (r.data?.patient?.uhidNo && (r.data.patient.uhidNo.toUpperCase() === searchVal || r.data.patient.uhidNo.replace(/[^A-Z0-9]/g, '') === cleanSearch))
          )
        );
        if (billingRec?.data?.wardTransfers && Array.isArray(billingRec.data.wardTransfers)) {
          billingWardTransfers = billingRec.data.wardTransfers;
        }
      } catch (e) {}
    }

    if (billingWardTransfers.length === 0) {
      try {
        const activeBilling = restoreForm('activity_record_billing');
        if (activeBilling?.data?.wardTransfers && Array.isArray(activeBilling.data.wardTransfers)) {
          const billIp = (activeBilling.patient?.ipNo || '').toUpperCase();
          const billUhid = (activeBilling.patient?.uhidNo || '').toUpperCase();
          if (billIp === searchVal || billUhid === searchVal || billIp.replace(/[^A-Z0-9]/g, '') === cleanSearch) {
            billingWardTransfers = activeBilling.data.wardTransfers;
          }
        }
      } catch (e) {}
    }

    if (billingWardTransfers.length === 0 && backendMatch?.id) {
      try {
        const bRes = await fetch(`http://localhost:5000/api/activity-record-billing/${backendMatch.id}`);
        const bJson = await bRes.json();
        if (bJson.success && Array.isArray(bJson.data) && bJson.data.length > 0) {
          const latestBilling = bJson.data[0];
          let fData = latestBilling.form_data;
          if (typeof fData === 'string') {
            try { fData = JSON.parse(fData); } catch (e) {}
          }
          if (fData?.wardTransfers && Array.isArray(fData.wardTransfers)) {
            billingWardTransfers = fData.wardTransfers;
          }
        }
      } catch (e) {}
    }

    setForm(prev => {
      let updatedWardTransfers = prev.wardTransfers;
      if (billingWardTransfers.length > 0) {
        updatedWardTransfers = billingWardTransfers.map(item => {
          const toStr = item.to || item.ward || '';
          let ward = item.ward || toStr;
          let roomNo = item.roomNo || '';
          let bedNo = item.bedNo || '';

          const rMatch = toStr.match(/(?:room|rm|r)[\s.:#-]*([a-z0-9]+)/i);
          const bMatch = toStr.match(/(?:bed|b)[\s.:#-]*([a-z0-9]+)/i);
          if (rMatch) roomNo = roomNo || rMatch[1];
          if (bMatch) bedNo = bedNo || bMatch[1];

          return {
            date: toISODate(item.date) || item.date || '',
            time: item.time || '',
            ward: ward,
            roomNo: roomNo,
            bedNo: bedNo
          };
        });
        while (updatedWardTransfers.length < 2) {
          updatedWardTransfers.push({ date: '', time: '', ward: '', roomNo: '', bedNo: '' });
        }
      } else {
        const initialWard = pt.ward || pt.wardType || backendMatch?.ward || backendRegData.ward || prev.wardType || '';
        const initialRoom = pt.room || pt.roomNo || backendRegData.room || prev.roomNo || '';
        const initialBed = pt.bedNo || pt.bed_no || backendMatch?.bed_no || backendRegData.bedNo || prev.bedNo || '';
        if (initialWard || initialRoom || initialBed || doaConverted) {
          updatedWardTransfers = [
            {
              date: doaConverted || prev.dateOfAdmission || '',
              time: pt.doaTime || prev.timeOfAdmission || '',
              ward: initialWard,
              roomNo: initialRoom,
              bedNo: initialBed
            },
            { date: '', time: '', ward: '', roomNo: '', bedNo: '' }
          ];
        }
      }

      return {
        ...prev,
        isMlc:               isMlcFlag,
        hasInsurance:       hasInsFlag,
        tpaCompanyName:     hasInsFlag === 'yes' ? (cleanInsName || prev.tpaCompanyName) : '',
        dateOfAdmission:    doaConverted || prev.dateOfAdmission,
        hospitalDays:       daysCalculated || prev.hospitalDays,
        patientName:        fullName || prev.patientName,
        uhidNo:             pt.uhidNo || pt.uhid_no || pt.patientId || backendMatch?.uhid_no || prev.uhidNo,
        ipNo:               pt.ipNo || pt.ip_no || backendMatch?.ip_no || prev.ipNo,
        dob:                dobConverted || prev.dob,
        age:                ageStr || prev.age,
        sex:                pt.sex || pt.gender || backendRegData.gender || backendMatch?.sex || prev.sex,
        mobileNo:           pt.mobileNo || pt.phone || backendRegData.mobileNo || prev.mobileNo,
        address:            fullAddress || prev.address,
        email:              pt.email || pt.emailId || backendRegData.emailId || attEmail || prev.email,
        phoneResi:          attPhone || pt.altContact || pt.alternateContact || backendRegData.alternateContact || prev.phoneResi,
        phoneOffice:        pt.phoneOffice || backendRegData.phoneOffice || prev.phoneOffice,
        maritalStatus:      pt.maritalStatus || backendRegData.maritalStatus || prev.maritalStatus,
        occupation:         pt.occupation || backendRegData.occupation || prev.occupation,
        bloodGroup:         pt.bloodGroup || backendRegData.bloodGroup || prev.bloodGroup,
        religion:           pt.religion || backendRegData.religion || prev.religion,
        nationality:        pt.nationality || backendRegData.nationality || prev.nationality,
        wardType:           pt.ward || pt.wardType || backendMatch?.ward || backendRegData.ward || prev.wardType,
        roomNo:             pt.room || pt.roomNo || backendRegData.room || prev.roomNo,
        bedNo:              pt.bedNo || pt.bed_no || backendMatch?.bed_no || backendRegData.bedNo || prev.bedNo,
        mainConsultant:     pt.consultant || pt.consultantDr || pt.doctorName || pt.consultantName || backendRegData.consultantDr || prev.mainConsultant,
        referredByDoctor:   pt.referral || pt.referredByDoctor || backendRegData.referenceNo || prev.referredByDoctor,
        timeOfAdmission:    pt.doaTime || prev.timeOfAdmission,
        broughtByName:      broughtBy || prev.broughtByName,
        wardTransfers:      updatedWardTransfers,
        
        // Page 1: Emergency Contact Section Autofill from Attender
        emergencyContactName:   attName || prev.emergencyContactName,
        emergencyContactRel:    attRel || prev.emergencyContactRel,
        emergencyContactMobile: attPhone || prev.emergencyContactMobile,
        emergencyContactEmail:  attEmail || pt.attenderEmail || backendRegData.attenderEmail || pt.emailId || pt.email || prev.emergencyContactEmail,
        emergencyContactAddress: attAddr || fullAddress || prev.emergencyContactAddress,

        // Page 2: Representative Block (Consent) & Signatures
        patientConsentSignature:    prev.patientConsentSignature || fullName || prev.patientName || '',
        repFullNameBlock:           (attName ? attName.toUpperCase() : '') || prev.repFullNameBlock,
        repRelationship:            attRel || prev.repRelationship,
        consultantConsentSignature: prev.consultantConsentSignature || pt.consultant || pt.consultantDr || pt.doctorName || pt.consultantName || backendRegData.consultantDr || prev.mainConsultant || '',
        consultantSignature:        prev.consultantSignature || pt.consultant || pt.consultantDr || pt.doctorName || pt.consultantName || backendRegData.consultantDr || prev.mainConsultant || '',

        // Page 2: Financial Authorization Block (Declarant)
        declarantType:              prev.declarantType || (attName ? 'attender' : 'patient'),
        declarantName:              prev.declarantName || (prev.declarantType === 'patient' ? (fullName || prev.patientName) : (attName || fullName || prev.patientName)),
        declarantAddress:           prev.declarantAddress || (prev.declarantType === 'patient' ? (fullAddress || prev.address) : (attAddr || fullAddress || prev.address)),
        targetRelativeRelationship: prev.targetRelativeRelationship || (prev.declarantType === 'patient' ? 'myself / self' : (attRel || 'relative')),
        finSignature:               prev.finSignature || (prev.declarantType === 'patient' ? (fullName || prev.patientName) : (attName || fullName || prev.patientName))
      };
    });
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  const handlePrint = () => window.print();

  const handleSave = () => {
    const hasValidIp = form.ipNo && form.ipNo.trim() !== '';
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = { form };
    if (form.ipNo || form.uhidNo) {
      updatePatientWardTransfer(form.ipNo || form.uhidNo, form.wardTransfers, { ward: form.wardType, roomNo: form.roomNo, bedNo: form.bedNo });
    }
    const saved = upsertFormRecord(recordId, 'Admission Record', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg('Saved as Draft (No IP No provided)');
      setTimeout(() => setToastMsg(''), 3000);
    } else {
      setToastMsg('Record saved successfully!');
      setTimeout(() => {
        setToastMsg('');
        if (onNavigate) onNavigate('view-records');
      }, 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      clearPersistedForm(PERSIST_KEY);
      setRecordId(null);
      setForm({
        uhidNo: '', ipNo: '', isMlc: '', patientName: '', dob: '', age: '', address: '', hasInsurance: '', sex: '', tpaCompanyName: '', bloodGroup: '', religion: '', nationality: '', phoneOffice: '', phoneResi: '', maritalStatus: '', occupation: '', mobileNo: '', dateOfAdmission: new Date().toISOString().split('T')[0], timeOfAdmission: new Date().toTimeString().slice(0, 5), email: '', dateOfDischarge: '', timeOfDischarge: '', broughtByName: '', wardType: '', roomNo: '', bedNo: '', hospitalDays: '', mainConsultant: '', referredByDoctor: '', otherConsultants: '', wardTransfers: [{ date: '', time: '', ward: '', roomNo: '', bedNo: '' }, { date: '', time: '', ward: '', roomNo: '', bedNo: '' }], emergencyContactName: '', emergencyContactRel: '', emergencyContactMobile: '', emergencyContactEmail: '', emergencyContactPhoneOffice: '', emergencyContactPhoneResi: '', emergencyContactAddress: '', consentDate: new Date().toISOString().split('T')[0], consentTime: new Date().toTimeString().slice(0, 5), patientConsentSignature: '', repFullNameBlock: '', repRelationship: '', consultantConsentSignature: '', declarantName: '', declarantAddress: '', targetRelativeRelationship: '', finSignDate: new Date().toISOString().split('T')[0], finSignTime: new Date().toTimeString().slice(0, 5), finSignature: '', provisionalDiagnosis: '', finalDiagnosis: '', secondaryDiagnosis: '', operativeProcedures: '', result: '', causeOfDeath: '', isAccident: false, modeOfAccident: '', isPoison: false, modeOfPoisoning: '', residentDoctorSignature: '', residentDoctorSignDate: new Date().toISOString().split('T')[0], consultantSignature: '', consultantSignDate: new Date().toISOString().split('T')[0]
      });
    }
  };
  const handleClear = handleReset;

  return (
    <div className="vitals-chart-page-wrapper" style={{ padding: '20px 24px' }}>
      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '20px' }}>
        <h2 className="vitals-page-heading">ADMISSION RECORD / ಪ್ರವೇಶ ದಾಖಲೆ</h2>
        <div className="action-btns-group">
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
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* PAGE 1 CONTENT: DEMOGRAPHICS & ADMISSION DETAILS */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 1 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <HospitalPaperHeader />

        <div style={{ textAlign: 'center', margin: '15px 0 20px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ADMISSION RECORD / ಪ್ರವೇಶ ದಾಖಲೆ
          </h2>
        </div>

        {/* Demographic & Admission Table matching reference image exact box grid structure */}
        <div style={{ width: '100%', border: '1.5px solid #000', boxSizing: 'border-box', fontSize: '12px', color: '#000', backgroundColor: '#fff' }}>
          
          {/* ROW 1: UHID No. | IP No. | MLC */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>UHID No. /ಯುಹೆಚ್‌ಐಡಿ ಸಂಖ್ಯೆ :</strong>
              <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} placeholder="Enter UHID or IP" style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>IP No./ಐ.ಪಿ.ಸಂಖ್ಯೆ :</strong>
                <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', fontWeight: 'bold', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>MLC/ಎಂ.ಎಲ್.ಸಿ. :</strong>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input type="radio" name="isMlc" value="yes" checked={String(form.isMlc).toLowerCase() === 'yes'} onChange={handleChange} /> Yes / ಹೌದು
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input type="radio" name="isMlc" value="no" checked={String(form.isMlc).toLowerCase() !== 'yes'} onChange={handleChange} /> No / ಇಲ್ಲ
                </label>
              </div>
            </div>
          </div>

          {/* ROW 2: Name of the Patient | Date of Birth | AGE */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Name of the Patient /ರೋಗಿಯ ಹೆಸರು :</strong>
              <input type="text" name="patientName" value={form.patientName} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Date of Birth/ಜನ್ಮ ದಿನಾಂಕ :</strong>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>AGE/ವಯಸ್ಸು :</strong>
                <input type="text" name="age" value={form.age} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 3: Address in Full (Left 38% spanning down) vs Right Side Block (Right 62%) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
            {/* Left 38%: Address in Full */}
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: '12px', marginBottom: '4px' }}>Address in Full/ಪೂರ್ಣ ವಿಳಾಸ :</strong>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={6}
                style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: '12px', fontFamily: 'inherit', background: 'transparent' }}
              />
            </div>

            {/* Right 62%: Upper Section (Insurance, Sex, TPA/Blood Group) & Lower Section (Religion, Nationality) */}
            <div style={{ width: '62%', display: 'flex', flexDirection: 'column' }}>
              
              {/* Upper Section: Insurance | Sex (16.5% width) | (TPA & Blood Group stacked - 50% width) */}
              <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                {/* 1. Insurance / ವಿಮೆ */}
                <div style={{ width: '33.5%', borderRight: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '11px' }}>Insurance / ವಿಮೆ</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <input type="radio" name="hasInsurance" value="yes" checked={String(form.hasInsurance).toLowerCase() === 'yes'} onChange={handleChange} /> Yes / ಹೌದು
                    </label>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <input type="radio" name="hasInsurance" value="no" checked={String(form.hasInsurance).toLowerCase() !== 'yes'} onChange={handleChange} /> No / ಇಲ್ಲ
                    </label>
                  </div>
                </div>

                {/* 2. Sex / ಲಿಂಗ (16.5% width - reduced by 25%) */}
                <div style={{ width: '16.5%', borderRight: '1px solid #000', padding: '6px 6px', display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '11px' }}>Sex / ಲಿಂಗ</strong>
                  <input type="text" name="sex" value={form.sex} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '6px' }} />
                </div>

                {/* 3. Stacked TPA Company Name & Blood Group (50% width) */}
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '11px' }}>TPA Company Name / ಟಿ.ಪಿ.ಎ. ಕಂಪನಿಯ ಹೆಸರು</strong>
                    <input type="text" name="tpaCompanyName" value={form.tpaCompanyName} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
                  </div>
                  <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                    <strong style={{ fontSize: '11px' }}>Blood Group / ರಕ್ತದ ಗುಂಪು</strong>
                    <input type="text" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
                  </div>
                </div>
              </div>

              {/* Lower Section: Religion / ಧರ್ಮ | Nationality / ರಾಷ್ಟ್ರೀಯತೆ */}
              <div style={{ display: 'flex', flex: 1, minHeight: '36px' }}>
                <div style={{ width: '50%', borderRight: '1px solid #000', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Religion / ಧರ್ಮ :</strong>
                  <input type="text" name="religion" value={form.religion} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                </div>
                <div style={{ width: '50%', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Nationality / ರಾಷ್ಟ್ರೀಯತೆ :</strong>
                  <input type="text" name="nationality" value={form.nationality} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                </div>
              </div>

            </div>
          </div>

          {/* ROW 5: Phone No. (Office / Resi) | Marital Status | Occupation */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Phone No. / ದೂರವಾಣಿ ಸಂಖ್ಯೆ</strong>
              <span style={{ fontSize: '10px' }}>Off / ಕಛೇರಿ :</span>
              <input type="text" name="phoneOffice" value={form.phoneOffice} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '11px', background: 'transparent', minWidth: '35px' }} />
              <span style={{ fontSize: '10px' }}>Res / ಮನೆ :</span>
              <input type="text" name="phoneResi" value={form.phoneResi} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '11px', background: 'transparent', minWidth: '35px' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Marital Status / ವೈವಾಹಿಕ ಸ್ಥಿತಿ :</strong>
                <input type="text" name="maritalStatus" value={form.maritalStatus} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Occupation / ಉದ್ಯೋಗ :</strong>
                <input type="text" name="occupation" value={form.occupation} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 6: Mobile No. | Date of Admission | Time of Admission */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Mobile No. / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ :</strong>
              <input type="text" name="mobileNo" value={form.mobileNo} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Date of Admission / ಅಡ್ಮಿಷನ್ ದಿನಾಂಕ :</strong>
                <input type="date" name="dateOfAdmission" value={form.dateOfAdmission} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div style={{ width: '50%', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Time of Admission / ಅಡ್ಮಿಷನ್ ಸಮಯ :</strong>
                <input type="time" name="timeOfAdmission" value={form.timeOfAdmission} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 7: E-Mail | Date of Discharge | Time of Discharge */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>E-Mail / ಈ-ಮೇಲ್ :</strong>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Date of Discharge / ಡಿಸ್ಚಾರ್ಜ್ ದಿನಾಂಕ :</strong>
                <input type="date" name="dateOfDischarge" value={form.dateOfDischarge} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div style={{ width: '50%', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Time of Discharge / ಡಿಸ್ಚಾರ್ಜ್ ಸಮಯ :</strong>
                <input type="time" name="timeOfDischarge" value={form.timeOfDischarge} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 8: Father's / Mother's / Husband's / Attender / Others Name (Brought By) | Ward Type | Room No | Bed No | Hospital Days */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '40px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: '11px', lineHeight: '1.3' }}>Father's / Mother's / Husband's / Attender / Others Name (Brought By) / ತಂದೆ / ತಾಯಿ / ಪತಿಯ / ಅಟೆಂಡರ್ / ಇತರೆ ಹೆಸರು (ಕರೆದು ತಂದವರು) :</strong>
              <input type="text" name="broughtByName" value={form.broughtByName} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '28%', borderRight: '1px solid #000', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Ward Type / ವಾರ್ಡ್ ಟೈಪ್</strong>
                <input type="text" name="wardType" value={form.wardType} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ width: '24%', borderRight: '1px solid #000', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Room No. / ರೂಮ್ ಸಂಖ್ಯೆ</strong>
                <input type="text" name="roomNo" value={form.roomNo} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ width: '24%', borderRight: '1px solid #000', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Bed No. / ಬೆಡ್ ಸಂಖ್ಯೆ</strong>
                <input type="text" name="bedNo" value={form.bedNo} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ width: '24%', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Hospital Days / ಆಸ್ಪತ್ರೆಯಲ್ಲಿದ್ದ ದಿನಗಳು</strong>
                <input type="text" name="hospitalDays" value={form.hospitalDays} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
            </div>
          </div>

          {/* ROW 9: Main Consultant / Referred By Doctor / Other Consultant(s) (Left) vs Ward Transfers Table (Right) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
            {/* Left 38%: 3 stacked consultant rows */}
            <div style={{ width: '38%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <strong style={{ fontSize: '12px' }}>Main Consultant / ಮುಖ್ಯ ಸಲಹೆಗಾರ :</strong>
                <input type="text" name="mainConsultant" value={form.mainConsultant} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', fontWeight: 'bold', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <strong style={{ fontSize: '12px' }}>Referred By Doctor / ರೆಫರ್ ಮಾಡಿದ ಡಾಕ್ಟರ್ :</strong>
                <input type="text" name="referredByDoctor" value={form.referredByDoctor} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <strong style={{ fontSize: '12px' }}>Other Consultant(s) / ಇತರೆ ಸಲಹೆಗಾರ :</strong>
                <input type="text" name="otherConsultants" value={form.otherConsultants} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
            </div>

            {/* Right 62%: Ward Transfers Section */}
            <div style={{ width: '62%', padding: '4px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', padding: '2px 4px' }}>
                <strong style={{ fontSize: '12px' }}>Ward Transfers / ವಾರ್ಡ್ ವರ್ಗಾವಣೆ</strong>
                <button type="button" onClick={addWardTransferRow} className="no-print" style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 'bold' }}>
                  <Plus size={12} /> Add Row
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #000' }}>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Date / ದಿನಾಂಕ</th>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Time / ಸಮಯ</th>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Ward / ವಾರ್ಡ್</th>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Room No. / ರೂಮ್ ಸಂಖ್ಯೆ</th>
                    <th style={{ padding: '3px 4px', textAlign: 'left', fontSize: '10px' }}>Bed No. / ಬೆಡ್ ಸಂಖ್ಯೆ</th>
                  </tr>
                </thead>
                <tbody>
                  {form.wardTransfers.map((wt, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < form.wardTransfers.length - 1 ? '1px solid #000' : 'none' }}>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="date" value={wt.date} onChange={(e) => handleWardTransferChange(idx, 'date', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }}  min={new Date().toISOString().split('T')[0]} />
                      </td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="time" value={wt.time} onChange={(e) => handleWardTransferChange(idx, 'time', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }} />
                      </td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="text" value={wt.ward} onChange={(e) => handleWardTransferChange(idx, 'ward', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }} />
                      </td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="text" value={wt.roomNo} onChange={(e) => handleWardTransferChange(idx, 'roomNo', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }} />
                      </td>
                      <td style={{ padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                        <input type="text" value={wt.bedNo} onChange={(e) => handleWardTransferChange(idx, 'bedNo', e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '10px', background: 'transparent', minWidth: '20px' }} />
                        {form.wardTransfers.length > 1 && (
                          <button type="button" onClick={() => removeWardTransferRow(idx)} className="no-print" style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 10: In Emergency Contact Section */}
          <div style={{ display: 'flex' }}>
            {/* Left 38%: Header + Name, Relationship, Mobile, Email */}
            <div style={{ width: '38%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', backgroundColor: '#f9fafb' }}>
                <strong style={{ fontSize: '12px' }}>In Emergency Contact / ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಸಂಪರ್ಕಿಸಲು</strong>
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Name / ಹೆಸರು :</strong>
                <input type="text" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Relationship / ಸಂಬಂಧ :</strong>
                <input type="text" name="emergencyContactRel" value={form.emergencyContactRel} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Mobile No. / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ :</strong>
                <input type="text" name="emergencyContactMobile" value={form.emergencyContactMobile} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>E-Mail / ಈ-ಮೇಲ್ :</strong>
                <input type="email" name="emergencyContactEmail" value={form.emergencyContactEmail} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>

            {/* Right 62%: Phone No. (Office/Resi) + Address in Full */}
            <div style={{ width: '62%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ fontSize: '12px' }}>Phone No. / ದೂರವಾಣಿ ಸಂಖ್ಯೆ</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px' }}>Office / ಕಛೇರಿ :</span>
                  <input type="text" name="emergencyContactPhoneOffice" value={form.emergencyContactPhoneOffice} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                  <span style={{ fontSize: '11px' }}>Resi. / ಮನೆ :</span>
                  <input type="text" name="emergencyContactPhoneResi" value={form.emergencyContactPhoneResi} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                </div>
              </div>
              <div style={{ padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '12px', marginBottom: '4px' }}>Address in Full / ಪೂರ್ಣ ವಿಳಾಸ :</strong>
                <textarea name="emergencyContactAddress" value={form.emergencyContactAddress} onChange={handleChange} rows={3} style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: '12px', fontFamily: 'inherit', background: 'transparent' }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PAGE 2 CONTENT: CONSENT FOR HOSPITALIZATION & FINANCIAL AUTHORIZATION (EXACT BOX FRAMED AS PAPER IMAGE) */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 2 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <div style={{ border: '1.5px solid #000', padding: '20px' }}>
          {/* SECTION 1: CONSENT FOR HOSPITALIZATION AND CONDUCT OF ALL PROCEDURES */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 14px', borderBottom: '1px solid #000', paddingBottom: '6px' }}>
              CONSENT FOR HOSPITALIZATION AND CONDUCT OF ALL PROCEDURES<br />
              <span style={{ fontSize: '14px', fontWeight: 'normal' }}>ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು ಮಾಡಿಕೊಳ್ಳುವಿಕೆಗೆ ಮತ್ತು ಎಲ್ಲಾ ತರಹದ ಕ್ರಿಯಾವಿಧಿಗಳನ್ನು ನೆರವೇರಿಸುವುದಕ್ಕೆ ಒಪ್ಪಿಗೆ ಪತ್ರ</span>
            </h2>

            <div style={{ fontSize: '12px', lineHeight: '1.65', textAlign: 'justify', color: '#111827', marginBottom: '12px' }}>
              <p style={{ marginBottom: '10px' }}>
                I unreservedly, and in my full senses, give complete and informed consent for hospitalization and for performance of any diagnosis examination, biopsy, transfusion or operation and for the administration of any anaesthetic as may be deemed advisable in the course of this hospital admission, for which I have a professional service contract with the hospital. The procedures and risks involved in the course of treatment have been fully explained to me in the language that I understand and also the rate of success with the different procedures. I have understood the same to the best of my satisfaction and I abide by this contract.
              </p>

              <p style={{ marginBottom: '14px', color: '#1f2937' }}>
                ನಾನು ಯಾವುದೇ ಬಲವಂತವಿಲ್ಲದೆ ಇಚ್ಛೆಯಿಂದ ಮತ್ತು ಸಂಪೂರ್ಣ ಜ್ಞಾನದಿಂದ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು ಮಾಡಿಕೊಳ್ಳಲು ಮತ್ತು ಯಾವುದೇ ರೀತಿಯ ತಪಾಸಣೆ, ಪರೀಕ್ಷೆಗಳಾದ ಅ ಬಯಾಪ್ಸಿ, ರಕ್ತಪೂರಣ ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮತ್ತು ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವುದರ ಚಿಕಿತ್ಸಾ ಸಂಬಂಧ ಯಾವುದೇ ಅಗತ್ಯವಿರುವಂತಹ ಅರವಳಿಕೆ ಔಷಧಿಯನ್ನು ನೀಡಲು ಈ ಮೂಲಕ ನನ್ನ ಸಂಪೂರ್ಣ ಮತ್ತು ಮುಕ್ತಮನಸ್ಸಿನ ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಅದಕ್ಕಾಗಿ, ಆಸ್ಪತ್ರೆಯೊಡನೆ ನಾನು ವೃತ್ತಿಪರಸೇವೆಯ ಒಪ್ಪಂದಕ್ಕೆ ಸಹಿಹಾಕಿಕೊಳ್ಳುತ್ತೇನೆ. ನನಗೆ ಅಗತ್ಯವಾಗುವ ಚಿಕಿತ್ಸಾ ಅವಧಿಯಲ್ಲಿ ಒಳಗೊಳ್ಳುವಂತಹ ಕ್ರಿಯಾವಿಧಿಗಳು ಮತ್ತು ತೊಂದರೆ ಆಪತ್ತುಗಳ ಬಗ್ಗೆ ಸಂಪೂರ್ಣವಾಗಿ ವಿವರಿಸಲಾಗಿದೆ. ಅಂತೆಯೇ ವಿವಿಧ ಕ್ರಿಯಾವಿಧಿಗಳ ಯಶಸ್ವಿ ಪ್ರಮಾಣಗಳ ಬಗ್ಗೆಯೂ ವಿವರಿಸಲಾಗಿದೆ. ನನಗೆ ತೃಪ್ತಿ ಆಗುವ ರೀತಿಯಲ್ಲಿ ನಾನು ಅವುಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಮತ್ತು ನಾನು ಒಪ್ಪಂದಕ್ಕೆ ಬದ್ಧನಾಗಿರುತ್ತೇನೆ.
              </p>

              <p style={{ marginBottom: '4px' }}>
                I consent to undergo tests for parenterally transmissible viral infections such as Hepatitis B, HIV, HCV etc.
              </p>
              <p style={{ marginBottom: '18px' }}>
                ರಕ್ತದ ಮೂಲಕ ಹರಡಬಹುದಾದ ವೈರಾಣು ಸೋಂಕುಗಳಾದ ಹೆಪಟೈಟಿಸ್, ಹೆಚ್.ಐ.ವಿ., ಹೆಚ್.ಸಿ.ವಿ. ಇತ್ಯಾದಿಗಳ ಪರೀಕ್ಷೆ ನಡೆಸುವುದಕ್ಕೆ ನಾನು ನನ್ನ ಒಪ್ಪಿಗೆಯನ್ನು ನೀಡುತ್ತಿದ್ದೇನೆ.
              </p>
            </div>

            <div style={{ fontSize: '12px', margin: '30px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'flex-end', marginBottom: '25px' }}>
                <div style={{ paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ:</span>
                    <input type="date" name="consentDate" value={form.consentDate} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} min={new Date().toISOString().split('T')[0]} />
                    <input type="time" name="consentTime" value={form.consentTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} />
                  </div>
                </div>

                <div style={{ textAlign: 'center', margin: '15px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    name="patientConsentSignature" 
                    value={form.patientConsentSignature || form.patientName} 
                    onChange={handleChange} 
                    placeholder="Signature" 
                    style={{ 
                      width: '85%', 
                      maxWidth: '300px', 
                      border: 'none', 
                      borderBottom: '1px solid #000', 
                      outline: 'none', 
                      textAlign: 'center', 
                      marginBottom: '4px',
                      fontFamily: (form.patientConsentSignature || form.patientName) ? "'Brush Script MT', 'Dancing Script', cursive, sans-serif" : 'inherit',
                      fontSize: '16px'
                    }} 
                  />
                  {form.patientName && (
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                      ({form.patientName})
                    </div>
                  )}
                  <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '2px', lineHeight: '1.4' }}>
                    Signature of the Patient / LTI / Representative<br />
                    <span>ರೋಗಿ/ನ್ಯಾಯೋಚಿತ ವಾರಸುದಾರರು / ಪ್ರತಿನಿಧಿಗಳು</span>
                  </div>
                </div>
              </div>

              <div style={{ margin: '25px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}>
                  If representative, full name in BLOCK LETTERS and relationship to patient / ಒಂದು ವೇಳೆ ಪ್ರತಿನಿಧಿಯಾಗಿದ್ದರೆ ಸಂಪೂರ್ಣ ಹೆಸರು ಮತ್ತು ರೋಗಿಯೊಂದಿಗಿನ ಸಂಬಂಧವನ್ನು ದಪ್ಪ ಅಕ್ಷರದಲ್ಲಿ ಬರೆಯಬೇಕು:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '8px' }}>
                  <input 
                    type="text" 
                    name="repFullNameBlock" 
                    value={form.repFullNameBlock || (form.emergencyContactName ? form.emergencyContactName.toUpperCase() : '')} 
                    onChange={handleChange} 
                    placeholder="FULL NAME IN BLOCK LETTERS" 
                    style={{ width: '260px', border: 'none', borderBottom: '1px dotted #000', outline: 'none', textTransform: 'uppercase', textAlign: 'center', fontWeight: '600' }} 
                  />
                  <input 
                    type="text" 
                    name="repRelationship" 
                    value={form.repRelationship || form.emergencyContactRel || ''} 
                    onChange={handleChange} 
                    placeholder="Relationship to patient" 
                    style={{ width: '190px', border: 'none', borderBottom: '1px dotted #000', outline: 'none', textAlign: 'center', fontWeight: '600' }} 
                  />
                </div>
              </div>

              <div style={{ margin: '30px 0 15px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input 
                  type="text" 
                  name="consultantConsentSignature" 
                  value={form.consultantConsentSignature || form.mainConsultant} 
                  onChange={handleChange} 
                  placeholder="Consultant Signature" 
                  style={{ 
                    width: '280px', 
                    border: 'none', 
                    borderBottom: '1px solid #000', 
                    outline: 'none', 
                    textAlign: 'center', 
                    marginBottom: '4px',
                    fontFamily: (form.consultantConsentSignature || form.mainConsultant) ? "'Brush Script MT', 'Dancing Script', cursive, sans-serif" : 'inherit',
                    fontSize: '16px'
                  }} 
                />
                {form.mainConsultant && (
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                    ({form.mainConsultant})
                  </div>
                )}
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
                  Signature of consultant / ಸಮಾಲೋಚಕರ ಸಹಿ
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: AUTHORIZATION FOR FINANCIAL TRANSACTIONS */}
          <div style={{ borderTop: '1px solid #000', paddingTop: '20px', marginTop: '20px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 14px', borderBottom: '1px solid #000', paddingBottom: '6px' }}>
              AUTHORIZATION FOR FINANCIAL TRANSACTIONS<br />
              <span style={{ fontSize: '14px', fontWeight: 'normal' }}>ಹಣಕಾಸು ವ್ಯವಹಾರಕ್ಕಾಗಿ ಅಧಿಕಾರ ನೀಡುವಿಕೆ</span>
            </h2>

            <div style={{ fontSize: '12px', lineHeight: '1.65', textAlign: 'justify', color: '#111827', marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px' }}>
                I have been explained in details the facilities at the Hospital. I am aware of the rules and regulations of the Hospital. I undertake to pay any advance/deposit as and when required by the Hospital and agree that I will settle bills before the discharging of the said patient. I understand that the filling of this form does not automatically entitle the patient to admission, which is the subject to the discretion of the Hospital. I further give my consent to the release of professional and / or other information from the medical record as may be deemed necessary in accordance with policies, rules and regulations of the Hospital. I undertake to pay any amount not covered by the Insurance/TPA(if any) and any amount denied by the Insurance/TPA company.
              </p>

              <p style={{ marginBottom: '15px', color: '#1f2937' }}>
                ಆಸ್ಪತ್ರೆಯಲ್ಲಿರುವ ಸೌಲಭ್ಯಗಳ ಬಗ್ಗೆ ನನಗೆ ವಿವರಿಸಲಾಗಿದೆ. ಆಸ್ಪತ್ರೆಯ ನಿಯಮ ಮತ್ತು ಕಾನೂನುಗಳ ಬಗ್ಗೆ ನನಗೆ ಅರಿವಿದೆ. ಆಸ್ಪತ್ರೆಯವರಿಗೆ ಯಾವಾಗ ಅಗತ್ಯವೆನಿಸುತ್ತದೋ ಆವಾಗ ನಾನು ಮುಂಗಡ ಹಣ/ಠೇವಣಿ ಇರಿಸಬೇಕಾಗುತ್ತದೆ. ಮೇಲೆ ಹೇಳಿದ ರೋಗಿಯನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸುವ ಮುಂಚೆಯೇ ಆಸ್ಪತ್ರೆ ಬಿಲ್‌ಗಳನ್ನು ಸಂಪೂರ್ಣಗೊಳಿಸಲು ನಾನು ಒಪ್ಪುತ್ತೇನೆ. ನಾನು ತಿಳಿದುಕೊಳ್ಳುವುದೇನೆಂದರೆ ಈ ನಮೂನೆಯನ್ನು ತುಂಬಿದಾಕ್ಷಣ ರೋಗಿಯನ್ನು ಬಿಡುಗಡೆ  ಮಾಡಬಹುದು. ಅದು ಆಸ್ಪತ್ರೆಯವರ ವಿವೇಚನೆಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯವಾಗಿರುತ್ತದೆ. ಆಸ್ಪತ್ರೆಯ ನೀತಿ ನಿಯಮಗಳು ಮತ್ತು ಸಿದ್ಧಾಂತಗಳ ಪ್ರಕಾರ ಯಾವುದೇ ಅಗತ್ಯವಿದೆಯೆಂದು ತೋರುತ್ತದೋ ಅಂತಹ ವೃತ್ತಿಪರ ಮತ್ತು ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳಿಂದ ಇತರೆ ಮಾಹಿತಿಗಳನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಮುಂಗಡ ಹಣ/ ಠೇವಣಿಗೆ ಒಳಪಡದಿರುವ ಯಾವುದೇ ಮೊತ್ತವನ್ನು / ಟಿ.ಪಿ.ಎ. (ಏನಾದರೂ ಇದ್ದರೆ) ಮತ್ತು ವಿಮೆ / ಟಿ.ಪಿ.ಎ. ಕಂಪನಿಯು ತಿರಸ್ಕರಿಸುವ ಯಾವುದೇ ಮೊತ್ತವನ್ನು ಪಾವತಿಸುತ್ತೇನೆ.
              </p>

              {/* Declarant Dotted Lines Fillable Block with Patient / Attender Option */}
              <div style={{ marginTop: '15px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px dashed #cbd5e1' }}>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: '#0f766e' }}>
                    Select Declarant / ಘೋಷಣೆದಾರರ ಆಯ್ಕೆ:
                  </span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: form.declarantType === 'patient' ? '#0f766e' : '#475569' }}>
                    <input 
                      type="radio" 
                      name="declarantType" 
                      value="patient" 
                      checked={form.declarantType === 'patient'} 
                      onChange={() => handleDeclarantTypeChange('patient')} 
                    />
                    Patient / ರೋಗಿ {form.patientName ? `(${form.patientName})` : ''}
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: form.declarantType === 'attender' ? '#0f766e' : '#475569' }}>
                    <input 
                      type="radio" 
                      name="declarantType" 
                      value="attender" 
                      checked={form.declarantType === 'attender'} 
                      onChange={() => handleDeclarantTypeChange('attender')} 
                    />
                    Attender / Representative / ಸಹಾಯಕರು / ಪ್ರತಿನಿಧಿ {form.emergencyContactName ? `(${form.emergencyContactName})` : ''}
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>I / ನಾನು</span>
                    <input type="text" name="declarantName" value={form.declarantName} onChange={handleChange} style={{ flex: 1, minWidth: '200px', border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontWeight: 'bold' }} />
                    <span>residing at / ವಾಸಸ್ಥಳ</span>
                    <input type="text" name="declarantAddress" value={form.declarantAddress} onChange={handleChange} style={{ flex: 2, minWidth: '250px', border: 'none', borderBottom: '1px dotted #000', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>hereby give consent to admit myself / my - ಈ ಮೂಲಕ ನನ್ನನ್ನು / ನನ್ನ</span>
                    <input type="text" name="targetRelativeRelationship" value={form.targetRelativeRelationship} onChange={handleChange} placeholder="myself / relative" style={{ flex: 1, minWidth: '160px', border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontWeight: '600' }} />
                  </div>
                  <div>
                    <span>whose details have been mentioned herein above / ಒಳರೋಗಿಯಾಗಿ ದಾಖಲಾಗಲು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಈ ಮೇಲೆ ನನ್ನ/ಅವರ ವಿವರಗಳು ತಿಳಿಸಲಾಗಿದೆ.</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '12px', marginTop: '30px', alignItems: 'flex-end' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ:</span>
                  <input type="date" name="finSignDate" value={form.finSignDate} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} min={new Date().toISOString().split('T')[0]} />
                  <input type="time" name="finSignTime" value={form.finSignTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <input 
                  type="text" 
                  name="finSignature" 
                  value={form.finSignature || form.declarantName} 
                  onChange={handleChange} 
                  placeholder="Signature" 
                  style={{ 
                    width: '80%', 
                    border: 'none', 
                    borderBottom: '1px solid #000', 
                    outline: 'none', 
                    textAlign: 'center',
                    fontFamily: (form.finSignature || form.declarantName) ? "'Brush Script MT', 'Dancing Script', cursive, sans-serif" : 'inherit',
                    fontSize: '16px',
                    marginBottom: '4px'
                  }} 
                />
                {form.declarantName && (
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>
                    ({form.declarantName})
                  </div>
                )}
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
                  Signature / ಸಹಿ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3 CONTENT: DIAGNOSES, OPERATIVE PROCEDURES, RESULT & SIGNATURES */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 3 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <div style={{ border: '1.5px solid #000', padding: '15px' }}>
          {/* Provisional Diagnosis */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Provisional Diagnosis (in Block Letters) / ತಾತ್ಕಾಲಿಕ ರೋಗ ನಿರ್ಣಯ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="provisionalDiagnosis"
              className="auto-expand-textarea"
              value={form.provisionalDiagnosis}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Final Diagnosis */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Final Diagnosis (in Block Letters) / ಅಂತಿಮ ರೋಗ ನಿರ್ಣಯ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="finalDiagnosis"
              className="auto-expand-textarea"
              value={form.finalDiagnosis}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Secondary Diagnosis */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Secondary Diagnosis (in Block Letters) / ಮಾಧ್ಯಮಿಕ ರೋಗ ನಿರ್ಣಯ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="secondaryDiagnosis"
              className="auto-expand-textarea"
              value={form.secondaryDiagnosis}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Operative Procedures */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Operative Procedures (in Block Letters) / ಅಪರೇಟಿವ್ ಕಾರ್ಯವಿಧಾನಗಳು (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="operativeProcedures"
              className="auto-expand-textarea"
              value={form.operativeProcedures}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Result / ಫಲಿತಾಂಶ Checkboxes Grid */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>
              Result / ಫಲಿತಾಂಶ
            </strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="recovered" checked={form.result === 'recovered'} onChange={handleChange} />
                <span>Recovered / ಚೇತರಿಸಿಕೊಂಡ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="improved" checked={form.result === 'improved'} onChange={handleChange} />
                <span>Improved / ಸುಧಾರಿತ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="unchanged" checked={form.result === 'unchanged'} onChange={handleChange} />
                <span>Unchanged / ಬದಲಾಗಿಲ್ಲ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="diagnosis_only" checked={form.result === 'diagnosis_only'} onChange={handleChange} />
                <span>Diagnosis only / ರೋಗ ನಿರ್ಣಯ ಮಾತ್ರ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="worse" checked={form.result === 'worse'} onChange={handleChange} />
                <span>Worse / ಕೆಟ್ಟದಾಗಿ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="dama" checked={form.result === 'dama'} onChange={handleChange} />
                <span>Dama / ಡಾಮ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', gridColumn: 'span 2' }}>
                <input type="radio" name="result" value="expired" checked={form.result === 'expired'} onChange={handleChange} />
                <span>Expired u/48hrs or o/48 hrs / 48 ಗಂಟೆ ಅಥವಾ 48 ಗಂಟೆಗಳ ನಂತರ ಜೀವಹೋಗಿರುತ್ತದೆ</span>
              </label>
            </div>
          </div>

          {/* Cause of Death */}
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
              Cause of Death (in Block Letters) / ಸಾವಿನ ಕಾರಣ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="causeOfDeath"
              className="auto-expand-textarea"
              value={form.causeOfDeath}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '36px',
                border: 'none',
                borderBottom: '1px dotted #666',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.4',
                boxSizing: 'border-box',
                background: 'transparent'
              }}
            />
          </div>

          {/* Patient Details Inline Summary (UHID No, IP No, Patient Name) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>Name of the patient / ರೋಗಿಯ ಹೆಸರು:</strong>
              <input type="text" name="patientName" value={form.patientName} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #666', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>IP No. / ಐ.ಪಿ. ಸಂಖ್ಯೆ:</strong>
              <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #666', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>UHID No. / ಯುಹೆಚ್‌ಐಡಿ:</strong>
              <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #666', outline: 'none', background: 'transparent' }} />
            </div>
          </div>

          {/* Accident & Poison Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px', borderBottom: '1px solid #000', paddingBottom: '15px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', paddingTop: '3px', whiteSpace: 'nowrap' }}>
                <input type="checkbox" name="isAccident" checked={form.isAccident} onChange={handleChange} />
                Accident - Mode of Accident / ಅಪಘಾತ - ಯಾವ ರೀತಿಯ ಅಪಘಾತ:
              </label>
              <textarea
                name="modeOfAccident"
                className="auto-expand-textarea"
                value={form.modeOfAccident}
                onChange={handleChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{
                  flex: 1,
                  minHeight: '28px',
                  border: 'none',
                  borderBottom: '1px dotted #666',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  background: 'transparent'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', paddingTop: '3px', whiteSpace: 'nowrap' }}>
                <input type="checkbox" name="isPoison" checked={form.isPoison} onChange={handleChange} />
                Poison - Mode of Poisoning / ವಿಷ - ವಿಷ ತೆಗೆದುಕೊಳ್ಳುವ ಕಾರಣ:
              </label>
              <textarea
                name="modeOfPoisoning"
                className="auto-expand-textarea"
                value={form.modeOfPoisoning}
                onChange={handleChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{
                  flex: 1,
                  minHeight: '28px',
                  border: 'none',
                  borderBottom: '1px dotted #666',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', fontSize: '13px' }}>
            <div style={{ textAlign: 'center' }}>
              <input 
                type="text" 
                name="residentDoctorSignature" 
                value={form.residentDoctorSignature} 
                onChange={handleChange} 
                placeholder="Resident Doctor Name / Signature" 
                style={{ 
                  width: '80%', 
                  textAlign: 'center', 
                  border: 'none', 
                  borderBottom: '1px solid #000', 
                  outline: 'none', 
                  marginBottom: '4px',
                  fontSize: '14px'
                }} 
              />
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>(Manual Entry)</div>
              <div><strong>Signature of Resident Doctor / ನಿವಾಸಿ ವೈದ್ಯರ ಸಹಿ</strong></div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <input 
                type="text" 
                name="consultantSignature" 
                value={form.consultantSignature || form.mainConsultant} 
                onChange={handleChange} 
                placeholder="Consultant Signature" 
                style={{ 
                  width: '80%', 
                  textAlign: 'center', 
                  border: 'none', 
                  borderBottom: '1px solid #000', 
                  outline: 'none', 
                  marginBottom: '4px',
                  fontFamily: (form.consultantSignature || form.mainConsultant) ? "'Brush Script MT', 'Dancing Script', cursive, sans-serif" : 'inherit',
                  fontSize: '16px'
                }} 
              />
              {form.mainConsultant && (
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>
                  ({form.mainConsultant})
                </div>
              )}
              <div><strong>Signature of Consultant / ಸಮಾಲೋಚಕರ ಸಹಿ</strong></div>
            </div>
          </div>
        </div>
      </div>
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
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
          <ChevronLeft size={18} /> Previous
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                type="button"
                className={`page-number-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155', marginLeft: '4px' }}>
            Page {currentPage} of 3
          </span>
        </div>

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
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px dashed #cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <button
          type="button"
          onClick={handleClear}
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

    </div>
  );
}
