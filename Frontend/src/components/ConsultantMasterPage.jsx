import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  UserPlus,
  Save, 
  RotateCcw, 
  List, 
  IndianRupee, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Pencil, 
  Trash2,
  Eye,
  Plus, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

const STORAGE_KEY = 'masters_consultants';

const DEFAULT_DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'General Surgery',
  'Neurology',
  'Laboratory',
  'Radiology',
  'Emergency Medicine',
  'Self'
];

const DEFAULT_QUALIFICATIONS = [
  'MBBS',
  'MD',
  'MS',
  'DNB',
  'DM',
  'MCh',
  'BDS',
  'MDS',
  'BAMS',
  'BHMS',
  'Fellowship',
  'Diploma',
  'MD, MBBS',
  'MS (Ortho)'
];

const DEFAULT_DESIGNATIONS = [
  'Senior Consultant',
  'Consultant',
  'Junior Consultant',
  'HOD',
  'HOD Orthopedics',
  'Associate Consultant',
  'Visiting Specialist',
  'Resident Doctor',
  'Duty Doctor',
  'Chief Surgeon',
  'Professor',
  'Assistant Professor'
];

const DEFAULT_TITLES = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.', 'Miss'];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatMinutesTo12Hour = (mins) => {
  const normalizedMins = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalizedMins / 60);
  const m = normalizedMins % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hh = String(h12).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${ampm}`;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const generateSlots = (fromTime, toTime, slotDuration) => {
  const startMins = parseTimeToMinutes(fromTime);
  let endMins = parseTimeToMinutes(toTime);
  if (endMins <= startMins) {
    endMins += 1440;
  }
  const totalMins = endMins - startMins;
  if (totalMins <= 0) return [];

  const slots = [];
  if (slotDuration === '2 slots') {
    const half = Math.round(totalMins / 2);
    const midMins = startMins + half;
    slots.push(`${formatMinutesTo12Hour(startMins)} - ${formatMinutesTo12Hour(midMins)}`);
    slots.push(`${formatMinutesTo12Hour(midMins)} - ${formatMinutesTo12Hour(endMins)}`);
  } else if (slotDuration === '3 slots') {
    const third = Math.round(totalMins / 3);
    for (let i = 0; i < 3; i++) {
      const s = startMins + i * third;
      const e = i === 2 ? endMins : startMins + (i + 1) * third;
      slots.push(`${formatMinutesTo12Hour(s)} - ${formatMinutesTo12Hour(e)}`);
    }
  } else if (slotDuration === '4 slots') {
    const quarter = Math.round(totalMins / 4);
    for (let i = 0; i < 4; i++) {
      const s = startMins + i * quarter;
      const e = i === 3 ? endMins : startMins + (i + 1) * quarter;
      slots.push(`${formatMinutesTo12Hour(s)} - ${formatMinutesTo12Hour(e)}`);
    }
  } else {
    const durationMins = parseInt(slotDuration, 10) || 30;
    let curr = startMins;
    while (curr + durationMins <= endMins) {
      slots.push(`${formatMinutesTo12Hour(curr)} - ${formatMinutesTo12Hour(curr + durationMins)}`);
      curr += durationMins;
    }
    if (curr < endMins && slots.length === 0) {
      slots.push(`${formatMinutesTo12Hour(curr)} - ${formatMinutesTo12Hour(endMins)}`);
    }
  }

  return slots;
};

const createDefaultSlotSettings = () => ({
  Sunday: {
    available: false,
    slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
    slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
  },
  Monday: {
    available: true,
    slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
    slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
  },
  Tuesday: {
    available: true,
    slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
    slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
  },
  Wednesday: {
    available: true,
    slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
    slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
  },
  Thursday: {
    available: true,
    slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
    slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
  },
  Friday: {
    available: true,
    slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
    slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
  },
  Saturday: {
    available: true,
    slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
    slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
  }
});

const INITIAL_CONSULTANTS = [
  {
    id: '1',
    category: 'Consultant',
    prefix: 'Dr.',
    name: 'Sadhana Admin',
    qualification: 'MD, MBBS',
    designation: 'Senior Consultant',
    contactNo: '9876543210',
    hospitalName: 'Gurushree Hospital',
    referralHospital: 'Gurushree Hospital',
    department: 'General Medicine',
    expensesCategory: 'Expenses',
    tokenNoApplicable: true,
    opPlace: true,
    // Fee Setting - OP Section
    opAmount: '200',
    opReview: '100',
    opFollowUp: '50',
    opHospitalShare: '50',
    opHospitalShareAmt: '100',
    opDoctorShare: '50',
    opDoctorShareAmt: '100',
    opReviewHospitalShareAmt: '50',
    opReviewDoctorShareAmt: '50',
    opFollowUpHospitalShareAmt: '25',
    opFollowUpDoctorShareAmt: '25',
    // Fee Setting - IP Section
    ipAmount: '200',
    ipReview: '100',
    ipFollowUp: '50',
    ipHospitalShare: '50',
    ipHospitalShareAmt: '100',
    ipDoctorShare: '50',
    ipDoctorShareAmt: '100',
    ipReviewHospitalShareAmt: '50',
    ipReviewDoctorShareAmt: '50',
    ipFollowUpHospitalShareAmt: '25',
    ipFollowUpDoctorShareAmt: '25',
    // Backward compatibility fields
    opDrAmount: '200',
    opShare: '100',
    opPercent: '50',
    opExpenseShare: '100',
    ipDrAmount: '200',
    ipShare: '100',
    ipPercent: '50',
    ipExpenseShare: '100',
    slotDuration: '15 Mins',
    active: true,
    discountApplicable: true,
    discountOP: true,
    discountIP: true,
    sendSMS: false,
    slotSettings: createDefaultSlotSettings()
  },
  {
    id: '2',
    category: 'Consultant',
    prefix: 'Dr.',
    name: 'Rajesh Kumar',
    qualification: 'MS (Ortho), DNB',
    designation: 'HOD Orthopedics',
    contactNo: '9845123456',
    hospitalName: 'Gurushree Hospital',
    referralHospital: 'Gurushree Hospital',
    department: 'Orthopedics',
    expensesCategory: 'Expenses',
    tokenNoApplicable: true,
    opPlace: true,
    opAmount: '300',
    opReview: '150',
    opFollowUp: '100',
    opHospitalShare: '50',
    opHospitalShareAmt: '150',
    opDoctorShare: '50',
    opDoctorShareAmt: '150',
    ipAmount: '500',
    ipReview: '250',
    ipFollowUp: '200',
    ipHospitalShare: '50',
    ipHospitalShareAmt: '250',
    ipDoctorShare: '50',
    ipDoctorShareAmt: '250',
    opDrAmount: '300',
    opShare: '150',
    opPercent: '50',
    opExpenseShare: '150',
    ipDrAmount: '500',
    ipShare: '250',
    ipPercent: '50',
    ipExpenseShare: '250',
    slotDuration: '30 Mins',
    active: true,
    discountApplicable: true,
    discountOP: true,
    discountIP: true,
    sendSMS: true,
    slotSettings: createDefaultSlotSettings()
  }
];

/**
 * Three-way balanced billing calculation:
 * Total Amount = Hospital Share + Doctor Share
 *
 * Automatically calculates whichever value is missing based on user input:
 * 1. User enters Amount + Hospital Share -> Doctor Share = Amount - Hospital Share
 * 2. User enters Amount + Doctor Share -> Hospital Share = Amount - Doctor Share
 * 3. User enters Hospital Share + Doctor Share -> Amount = Hospital Share + Doctor Share
 */
const calculateBillingShares = (changedKey, rawVal, currentValues, previousKey) => {
  const result = {
    amount: currentValues.amount ?? '',
    hospital: currentValues.hospital ?? '',
    doctor: currentValues.doctor ?? ''
  };

  result[changedKey] = rawVal;

  if (rawVal === '') {
    return {
      amount: result.amount,
      hospital: result.hospital,
      doctor: result.doctor,
      newPreviousKey: previousKey
    };
  }

  let missingKey = 'doctor';

  if (changedKey === 'amount') {
    if (previousKey === 'doctor') {
      missingKey = 'hospital';
    } else if (previousKey === 'hospital') {
      missingKey = 'doctor';
    } else {
      const tot = parseFloat(rawVal) || 0;
      const half = Math.round(tot / 2);
      result.hospital = String(half);
      result.doctor = String(Math.max(0, Math.round(tot - half)));
      return {
        amount: result.amount,
        hospital: result.hospital,
        doctor: result.doctor,
        newPreviousKey: 'amount'
      };
    }
  } else if (changedKey === 'hospital') {
    if (previousKey === 'doctor') {
      missingKey = 'amount';
    } else if (previousKey === 'amount' && (parseFloat(result.amount) || 0) > 0) {
      missingKey = 'doctor';
    } else if ((parseFloat(result.amount) || 0) === 0 && (parseFloat(result.doctor) || 0) > 0) {
      missingKey = 'amount';
    } else {
      missingKey = 'doctor';
    }
  } else if (changedKey === 'doctor') {
    if (previousKey === 'hospital') {
      missingKey = 'amount';
    } else if (previousKey === 'amount' && (parseFloat(result.amount) || 0) > 0) {
      missingKey = 'hospital';
    } else if ((parseFloat(result.amount) || 0) === 0 && (parseFloat(result.hospital) || 0) > 0) {
      missingKey = 'amount';
    } else {
      missingKey = 'hospital';
    }
  }

  if (missingKey === 'amount') {
    const hosp = parseFloat(result.hospital) || 0;
    const doc = parseFloat(result.doctor) || 0;
    result.amount = String(Math.round((hosp + doc) * 100) / 100);
  } else if (missingKey === 'doctor') {
    const tot = parseFloat(result.amount) || 0;
    const hosp = parseFloat(result.hospital) || 0;
    if (hosp > tot) {
      const doc = parseFloat(result.doctor) || 0;
      result.amount = String(Math.round((hosp + doc) * 100) / 100);
    } else {
      result.doctor = String(Math.round(Math.max(0, tot - hosp) * 100) / 100);
    }
  } else if (missingKey === 'hospital') {
    const tot = parseFloat(result.amount) || 0;
    const doc = parseFloat(result.doctor) || 0;
    if (doc > tot) {
      const hosp = parseFloat(result.hospital) || 0;
      result.amount = String(Math.round((hosp + doc) * 100) / 100);
    } else {
      result.hospital = String(Math.round(Math.max(0, tot - doc) * 100) / 100);
    }
  }

  return {
    amount: result.amount,
    hospital: result.hospital,
    doctor: result.doctor,
    newPreviousKey: changedKey
  };
};

export default function ConsultantMasterPage({ setSidebarOpen }) {
  const opPrevKeyRef = useRef('amount');
  const ipPrevKeyRef = useRef('amount');
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'list'
  const [isConsultantInfoOpen, setIsConsultantInfoOpen] = useState(true);
  const [isFeeSettingOpen, setIsFeeSettingOpen] = useState(true);
  const [isSlotSettingOpen, setIsSlotSettingOpen] = useState(false);
  const [listSubView, setListSubView] = useState('all'); // 'all', 'fee', 'slot'

  const [consultants, setConsultants] = useState([]);
  const [registerMasterOptions, setRegisterMasterOptions] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [viewRecord, setViewRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    category: 'Consultant',
    prefix: 'Dr.',
    name: '',
    qualification: '',
    designation: '',
    department: 'General Medicine',
    hospitalName: '',
    contactNo: '',
    tokenNoApplicable: true,
    opPlace: false,
    active: true,
    discountApplicable: true,
    discountOP: true,
    discountIP: true,
    sendSMS: false,
    expensesCategory: 'Expenses',
    // Fee Setting - OP Section
    opAmount: '200',
    opReview: '100',
    opFollowUp: '50',
    opHospitalShare: '50',
    opHospitalShareAmt: '100',
    opDoctorShare: '50',
    opDoctorShareAmt: '100',
    // Fee Setting - IP Section
    ipAmount: '200',
    ipReview: '100',
    ipFollowUp: '50',
    ipHospitalShare: '50',
    ipHospitalShareAmt: '100',
    ipDoctorShare: '50',
    ipDoctorShareAmt: '100',
    // Compatibility fields
    opDrAmount: '200',
    opShare: '100',
    opPercent: '50',
    opExpenseShare: '100',
    ipDrAmount: '200',
    ipShare: '100',
    ipPercent: '50',
    ipExpenseShare: '100',
    slotDuration: '15 Mins',
    slotCount: '2',
    slotSettings: createDefaultSlotSettings()
  });

  // Load consultants from localStorage with schema migration for new fields
  useEffect(() => {
    try {
      const savedDepts = localStorage.getItem('masters_departments');
      if (savedDepts) {
        const parsedDepts = JSON.parse(savedDepts);
        if (Array.isArray(parsedDepts) && parsedDepts.length > 0) {
          const names = parsedDepts.map(d => d.deptName || d.name).filter(Boolean);
          const combined = Array.from(new Set([...names, ...DEFAULT_DEPARTMENTS]));
          setAvailableDepartments(combined);
        }
      }

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.length > 0) {
        const migrated = saved.map(item => ({
          ...item,
          designation: item.designation || '',
          hospitalName: item.hospitalName || item.referralHospital || '',
          tokenNoApplicable: item.tokenNoApplicable !== undefined ? item.tokenNoApplicable : true,
          opPlace: item.opPlace !== undefined ? item.opPlace : false,
          opAmount: item.opAmount || item.opDrAmount || '200',
          opReview: item.opReview || '100',
          opFollowUp: item.opFollowUp || '50',
          opHospitalShare: item.opHospitalShare || item.opExpenseShare || '50',
          opHospitalShareAmt: item.opHospitalShareAmt || '100',
          opDoctorShare: item.opDoctorShare || item.opPercent || '50',
          opDoctorShareAmt: item.opDoctorShareAmt || item.opShare || '100',
          ipAmount: item.ipAmount || item.ipDrAmount || '200',
          ipReview: item.ipReview || '100',
          ipFollowUp: item.ipFollowUp || '50',
          ipHospitalShare: item.ipHospitalShare || item.ipExpenseShare || '50',
          ipHospitalShareAmt: item.ipHospitalShareAmt || '100',
          ipDoctorShare: item.ipDoctorShare || item.ipPercent || '50',
          ipDoctorShareAmt: item.ipDoctorShareAmt || item.ipShare || '100',
          opDrAmount: item.opDrAmount || item.opAmount || '200',
          ipDrAmount: item.ipDrAmount || item.ipAmount || '200',
          opShare: item.opShare || item.opDoctorShareAmt || '100',
          ipShare: item.ipShare || item.ipDoctorShareAmt || '100',
          opPercent: item.opPercent || item.opDoctorShare || '50',
          ipPercent: item.ipPercent || item.ipDoctorShare || '50',
          opExpenseShare: item.opExpenseShare || item.opHospitalShareAmt || '100',
          ipExpenseShare: item.ipExpenseShare || item.ipHospitalShareAmt || '100',
          slotDuration: item.slotDuration || '15 Mins',
          slotSettings: item.slotSettings || createDefaultSlotSettings()
        }));
        setConsultants(migrated);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONSULTANTS));
        setConsultants(INITIAL_CONSULTANTS);
      }
    } catch (e) {
      setConsultants(INITIAL_CONSULTANTS);
    }
  }, []);

  // Fetch Register Master options (Title, Qualification, Designation, Department)
  useEffect(() => {
    const fetchRegisterMaster = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/patient-register-master');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setRegisterMasterOptions(data.data.filter(opt => opt.status === 'Active'));
        }
      } catch (err) {
        console.error('Failed to fetch register master options:', err);
      }
    };
    fetchRegisterMaster();
  }, []);

  const getRegisterOptions = (category, fallbackList = []) => {
    const fromMaster = registerMasterOptions
      .filter(opt => opt.category?.toLowerCase() === category.toLowerCase())
      .map(opt => opt.label);
    if (fromMaster.length > 0) return fromMaster;
    return fallbackList;
  };

  const titleOptions = Array.from(new Set([
    ...getRegisterOptions('Title', DEFAULT_TITLES),
    ...(form.prefix ? [form.prefix] : [])
  ]));

  const qualificationOptions = Array.from(new Set([
    ...getRegisterOptions('Qualification', DEFAULT_QUALIFICATIONS),
    ...(form.qualification ? [form.qualification] : [])
  ]));

  const designationOptions = Array.from(new Set([
    ...getRegisterOptions('Designation', DEFAULT_DESIGNATIONS),
    ...(form.designation ? [form.designation] : [])
  ]));

  const departmentOptions = Array.from(new Set([
    ...getRegisterOptions('Department', DEFAULT_DEPARTMENTS),
    ...availableDepartments,
    ...(form.department ? [form.department] : [])
  ]));

  // Keyboard Shortcuts: F1 to Save, F2 to Clear
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, editingId, consultants]);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setConsultants(updatedList);
  };

  const handleFeeFieldChange = (name, value) => {
    setForm(prev => {
      const sectionPrefix = name.startsWith('op') ? 'op' : 'ip';
      const updated = { ...prev, [name]: value };

      const amtKey = `${sectionPrefix}Amount`;
      const revKey = `${sectionPrefix}Review`;
      const fupKey = `${sectionPrefix}FollowUp`;
      const hospPctKey = `${sectionPrefix}HospitalShare`;
      const docPctKey = `${sectionPrefix}DoctorShare`;
      
      const hospAmtKey = `${sectionPrefix}HospitalShareAmt`;
      const docAmtKey = `${sectionPrefix}DoctorShareAmt`;
      const revHospAmtKey = `${sectionPrefix}ReviewHospitalShareAmt`;
      const revDocAmtKey = `${sectionPrefix}ReviewDoctorShareAmt`;
      const fupHospAmtKey = `${sectionPrefix}FollowUpHospitalShareAmt`;
      const fupDocAmtKey = `${sectionPrefix}FollowUpDoctorShareAmt`;

      let hospPct = parseFloat(updated[hospPctKey]);
      if (isNaN(hospPct)) hospPct = 50;
      let docPct = parseFloat(updated[docPctKey]);
      if (isNaN(docPct)) docPct = 50;

      if (name === hospPctKey) {
        hospPct = Math.min(100, Math.max(0, parseFloat(value) || 0));
        docPct = Math.max(0, 100 - hospPct);
        updated[hospPctKey] = value;
        updated[docPctKey] = String(docPct);
      } else if (name === docPctKey) {
        docPct = Math.min(100, Math.max(0, parseFloat(value) || 0));
        hospPct = Math.max(0, 100 - docPct);
        updated[docPctKey] = value;
        updated[hospPctKey] = String(hospPct);
      }

      // 3rd Row: OP/IP Base Share Amounts
      if ([hospPctKey, docPctKey, amtKey].includes(name)) {
        const tot = parseFloat(updated[amtKey]) || 0;
        const hAmt = Math.round((tot * hospPct) / 100);
        const dAmt = Math.max(0, Math.round(tot - hAmt));
        updated[hospAmtKey] = tot > 0 ? String(hAmt) : '';
        updated[docAmtKey] = tot > 0 ? String(dAmt) : '';
      }

      // 4th Row: OP/IP Review Share Amounts
      if ([hospPctKey, docPctKey, revKey].includes(name)) {
        const tot = parseFloat(updated[revKey]) || 0;
        const hAmt = Math.round((tot * hospPct) / 100);
        const dAmt = Math.max(0, Math.round(tot - hAmt));
        updated[revHospAmtKey] = tot > 0 ? String(hAmt) : '';
        updated[revDocAmtKey] = tot > 0 ? String(dAmt) : '';
      }

      // 5th Row: OP/IP Follow-up Share Amounts
      if ([hospPctKey, docPctKey, fupKey].includes(name)) {
        const tot = parseFloat(updated[fupKey]) || 0;
        const hAmt = Math.round((tot * hospPct) / 100);
        const dAmt = Math.max(0, Math.round(tot - hAmt));
        updated[fupHospAmtKey] = tot > 0 ? String(hAmt) : '';
        updated[fupDocAmtKey] = tot > 0 ? String(dAmt) : '';
      }

      // Backward compatibility fields
      if (sectionPrefix === 'op') {
        updated.opDrAmount = updated.opAmount;
        updated.opExpenseShare = updated.opHospitalShareAmt;
        updated.opShare = updated.opDoctorShareAmt;
        updated.opPercent = updated.opDoctorShare;
      } else {
        updated.ipDrAmount = updated.ipAmount;
        updated.ipExpenseShare = updated.ipHospitalShareAmt;
        updated.ipShare = updated.ipDoctorShareAmt;
        updated.ipPercent = updated.ipDoctorShare;
      }

      return updated;
    });
    setErrorMsg('');
  };

  const handleDaySlotChange = (day, field, value, slotKey) => {
    setForm(prev => {
      const daySettings = prev.slotSettings?.[day] || {
        available: day !== 'Sunday',
        slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
        slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
      };

      if (field === 'available') {
        return {
          ...prev,
          slotSettings: {
            ...prev.slotSettings,
            [day]: { ...daySettings, available: value }
          }
        };
      }

      // Nested slot field update (slot1 or slot2)
      if (slotKey) {
        const updatedSlot = { ...(daySettings[slotKey] || {}), [field]: value };
        return {
          ...prev,
          slotSettings: {
            ...prev.slotSettings,
            [day]: { ...daySettings, [slotKey]: updatedSlot }
          }
        };
      }

      return {
        ...prev,
        slotSettings: {
          ...prev.slotSettings,
          [day]: { ...daySettings, [field]: value }
        }
      };
    });
    setErrorMsg('');
  };

  const handleCopyMondayToAll = () => {
    setForm(prev => {
      const mondaySetting = prev.slotSettings?.Monday || {
        available: true,
        slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
        slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
      };

      const newSettings = { ...prev.slotSettings };
      ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
        newSettings[day] = { ...mondaySetting };
      });

      return { ...prev, slotSettings: newSettings };
    });
    setSuccessMsg('Monday schedule applied to Tuesday - Saturday.');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if ([
      'opAmount', 'opReview', 'opFollowUp', 'opHospitalShare', 'opHospitalShareAmt', 'opDoctorShare', 'opDoctorShareAmt',
      'opReviewHospitalShareAmt', 'opReviewDoctorShareAmt', 'opFollowUpHospitalShareAmt', 'opFollowUpDoctorShareAmt',
      'ipAmount', 'ipReview', 'ipFollowUp', 'ipHospitalShare', 'ipHospitalShareAmt', 'ipDoctorShare', 'ipDoctorShareAmt',
      'ipReviewHospitalShareAmt', 'ipReviewDoctorShareAmt', 'ipFollowUpHospitalShareAmt', 'ipFollowUpDoctorShareAmt'
    ].includes(name)) {
      handleFeeFieldChange(name, value);
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      setErrorMsg('');
    }
  };

  const handleSave = () => {
    setErrorMsg('');
    if (!form.name.trim()) {
      setErrorMsg('Consultant Name is required.');
      setIsConsultantInfoOpen(true);
      return;
    }

    const payload = {
      ...form,
      opDrAmount: form.opAmount,
      ipDrAmount: form.ipAmount,
      opShare: form.opDoctorShareAmt,
      ipShare: form.ipDoctorShareAmt,
      opPercent: form.opDoctorShare,
      ipPercent: form.ipDoctorShare,
      opExpenseShare: form.opHospitalShareAmt,
      ipExpenseShare: form.ipHospitalShareAmt,
      referralHospital: form.hospitalName
    };

    if (editingId) {
      const updated = consultants.map(c => c.id === editingId ? { ...payload, id: editingId } : c);
      saveToStorage(updated);
      setSuccessMsg('Consultant updated successfully!');
      setEditingId(null);
    } else {
      const newConsultant = {
        ...payload,
        id: Date.now().toString()
      };
      const updated = [...consultants, newConsultant];
      saveToStorage(updated);
      setSuccessMsg('Consultant saved successfully!');
    }

    handleClear();
    setViewMode('list');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleClear = () => {
    opPrevKeyRef.current = 'amount';
    ipPrevKeyRef.current = 'amount';
    setEditingId(null);
    setErrorMsg('');
    setForm({
      category: 'Consultant',
      prefix: titleOptions[0] || 'Dr.',
      name: '',
      qualification: '',
      designation: '',
      department: departmentOptions[0] || 'General Medicine',
      hospitalName: '',
      contactNo: '',
      tokenNoApplicable: true,
      opPlace: false,
      active: true,
      discountApplicable: true,
      discountOP: true,
      discountIP: true,
      sendSMS: false,
      expensesCategory: 'Expenses',
      // Fee Setting - OP Section (all cleared to blank)
      opAmount: '',
      opReview: '',
      opFollowUp: '',
      opHospitalShare: '',
      opHospitalShareAmt: '',
      opDoctorShare: '',
      opDoctorShareAmt: '',
      opReviewHospitalShareAmt: '',
      opReviewDoctorShareAmt: '',
      opFollowUpHospitalShareAmt: '',
      opFollowUpDoctorShareAmt: '',
      // Fee Setting - IP Section (all cleared to blank)
      ipAmount: '',
      ipReview: '',
      ipFollowUp: '',
      ipHospitalShare: '',
      ipHospitalShareAmt: '',
      ipDoctorShare: '',
      ipDoctorShareAmt: '',
      ipReviewHospitalShareAmt: '',
      ipReviewDoctorShareAmt: '',
      ipFollowUpHospitalShareAmt: '',
      ipFollowUpDoctorShareAmt: '',
      // Compatibility fields (cleared)
      opDrAmount: '',
      opShare: '',
      opPercent: '',
      opExpenseShare: '',
      ipDrAmount: '',
      ipShare: '',
      ipPercent: '',
      ipExpenseShare: '',
      slotDuration: '15 Mins',
      slotCount: '2',
      slotSettings: createDefaultSlotSettings()
    });
  };

  const handleClearConsultantInfo = () => {
    setForm((prev) => ({
      ...prev,
      category: 'Consultant',
      prefix: titleOptions[0] || 'Dr.',
      name: '',
      qualification: '',
      designation: '',
      department: departmentOptions[0] || 'General Medicine',
      hospitalName: '',
      contactNo: '',
      tokenNoApplicable: true,
      opPlace: false,
      active: true,
      discountApplicable: true,
      discountOP: true,
      discountIP: true,
      sendSMS: false,
      expensesCategory: 'Expenses'
    }));
  };

  const handleClearFeeSetting = () => {
    opPrevKeyRef.current = 'amount';
    ipPrevKeyRef.current = 'amount';
    setForm((prev) => ({
      ...prev,
      opAmount: '',
      opReview: '',
      opFollowUp: '',
      opHospitalShare: '',
      opHospitalShareAmt: '',
      opDoctorShare: '',
      opDoctorShareAmt: '',
      opReviewHospitalShareAmt: '',
      opReviewDoctorShareAmt: '',
      opFollowUpHospitalShareAmt: '',
      opFollowUpDoctorShareAmt: '',
      ipAmount: '',
      ipReview: '',
      ipFollowUp: '',
      ipHospitalShare: '',
      ipHospitalShareAmt: '',
      ipDoctorShare: '',
      ipDoctorShareAmt: '',
      ipReviewHospitalShareAmt: '',
      ipReviewDoctorShareAmt: '',
      ipFollowUpHospitalShareAmt: '',
      ipFollowUpDoctorShareAmt: '',
      opDrAmount: '',
      opShare: '',
      opPercent: '',
      opExpenseShare: '',
      ipDrAmount: '',
      ipShare: '',
      ipPercent: '',
      ipExpenseShare: '',
      slotDuration: '15 Mins',
      slotCount: '2'
    }));
  };

  const handleClearOpFees = () => {
    opPrevKeyRef.current = 'amount';
    setForm((prev) => ({
      ...prev,
      opAmount: '',
      opReview: '',
      opFollowUp: '',
      opHospitalShare: '',
      opHospitalShareAmt: '',
      opDoctorShare: '',
      opDoctorShareAmt: '',
      opReviewHospitalShareAmt: '',
      opReviewDoctorShareAmt: '',
      opFollowUpHospitalShareAmt: '',
      opFollowUpDoctorShareAmt: '',
      opDrAmount: '',
      opShare: '',
      opPercent: '',
      opExpenseShare: ''
    }));
  };

  const handleClearIpFees = () => {
    ipPrevKeyRef.current = 'amount';
    setForm((prev) => ({
      ...prev,
      ipAmount: '',
      ipReview: '',
      ipFollowUp: '',
      ipHospitalShare: '',
      ipHospitalShareAmt: '',
      ipDoctorShare: '',
      ipDoctorShareAmt: '',
      ipReviewHospitalShareAmt: '',
      ipReviewDoctorShareAmt: '',
      ipFollowUpHospitalShareAmt: '',
      ipFollowUpDoctorShareAmt: '',
      ipDrAmount: '',
      ipShare: '',
      ipPercent: '',
      ipExpenseShare: ''
    }));
  };

  const handleClearSlotSetting = () => {
    setForm((prev) => ({
      ...prev,
      slotSettings: createDefaultSlotSettings()
    }));
  };

  const handleEdit = (consultant) => {
    opPrevKeyRef.current = 'amount';
    ipPrevKeyRef.current = 'amount';

    const opHospPct = parseFloat(consultant.opHospitalShare || '50') || 50;
    const opDocPct = parseFloat(consultant.opDoctorShare || '50') || 50;
    const opRevVal = parseFloat(consultant.opReview || '100') || 0;
    const opFupVal = parseFloat(consultant.opFollowUp || '50') || 0;

    const ipHospPct = parseFloat(consultant.ipHospitalShare || '50') || 50;
    const ipDocPct = parseFloat(consultant.ipDoctorShare || '50') || 50;
    const ipRevVal = parseFloat(consultant.ipReview || '100') || 0;
    const ipFupVal = parseFloat(consultant.ipFollowUp || '50') || 0;

    setForm({
      category: consultant.category || 'Consultant',
      prefix: consultant.prefix || 'Dr.',
      name: consultant.name || '',
      qualification: consultant.qualification || '',
      designation: consultant.designation || '',
      department: consultant.department || availableDepartments[0] || 'General Medicine',
      hospitalName: consultant.hospitalName || consultant.referralHospital || '',
      contactNo: consultant.contactNo || '',
      tokenNoApplicable: consultant.tokenNoApplicable !== undefined ? consultant.tokenNoApplicable : true,
      opPlace: consultant.opPlace !== undefined ? consultant.opPlace : false,
      active: consultant.active !== undefined ? consultant.active : true,
      discountApplicable: consultant.discountApplicable !== undefined ? consultant.discountApplicable : true,
      discountOP: consultant.discountOP !== undefined ? consultant.discountOP : true,
      discountIP: consultant.discountIP !== undefined ? consultant.discountIP : true,
      sendSMS: consultant.sendSMS !== undefined ? consultant.sendSMS : false,
      expensesCategory: consultant.expensesCategory || 'Expenses',
      opAmount: consultant.opAmount || consultant.opDrAmount || '200',
      opReview: consultant.opReview || '100',
      opFollowUp: consultant.opFollowUp || '50',
      opHospitalShare: consultant.opHospitalShare || consultant.opExpenseShare || '50',
      opHospitalShareAmt: consultant.opHospitalShareAmt || '100',
      opDoctorShare: consultant.opDoctorShare || consultant.opPercent || '50',
      opDoctorShareAmt: consultant.opDoctorShareAmt || consultant.opShare || '100',
      opReviewHospitalShareAmt: consultant.opReviewHospitalShareAmt || String(Math.round((opRevVal * opHospPct) / 100)),
      opReviewDoctorShareAmt: consultant.opReviewDoctorShareAmt || String(Math.round((opRevVal * opDocPct) / 100)),
      opFollowUpHospitalShareAmt: consultant.opFollowUpHospitalShareAmt || String(Math.round((opFupVal * opHospPct) / 100)),
      opFollowUpDoctorShareAmt: consultant.opFollowUpDoctorShareAmt || String(Math.round((opFupVal * opDocPct) / 100)),
      ipAmount: consultant.ipAmount || consultant.ipDrAmount || '200',
      ipReview: consultant.ipReview || '100',
      ipFollowUp: consultant.ipFollowUp || '50',
      ipHospitalShare: consultant.ipHospitalShare || consultant.ipExpenseShare || '50',
      ipHospitalShareAmt: consultant.ipHospitalShareAmt || '100',
      ipDoctorShare: consultant.ipDoctorShare || consultant.ipPercent || '50',
      ipDoctorShareAmt: consultant.ipDoctorShareAmt || consultant.ipShare || '100',
      ipReviewHospitalShareAmt: consultant.ipReviewHospitalShareAmt || String(Math.round((ipRevVal * ipHospPct) / 100)),
      ipReviewDoctorShareAmt: consultant.ipReviewDoctorShareAmt || String(Math.round((ipRevVal * ipDocPct) / 100)),
      ipFollowUpHospitalShareAmt: consultant.ipFollowUpHospitalShareAmt || String(Math.round((ipFupVal * ipHospPct) / 100)),
      ipFollowUpDoctorShareAmt: consultant.ipFollowUpDoctorShareAmt || String(Math.round((ipFupVal * ipDocPct) / 100)),
      opDrAmount: consultant.opDrAmount || consultant.opAmount || '200',
      opShare: consultant.opShare || consultant.opDoctorShareAmt || '100',
      opPercent: consultant.opPercent || consultant.opDoctorShare || '50',
      opExpenseShare: consultant.opExpenseShare || consultant.opHospitalShareAmt || '100',
      ipDrAmount: consultant.ipDrAmount || consultant.ipAmount || '200',
      ipShare: consultant.ipShare || consultant.ipDoctorShareAmt || '100',
      ipPercent: consultant.ipPercent || consultant.ipDoctorShare || '50',
      ipExpenseShare: consultant.ipExpenseShare || consultant.ipHospitalShareAmt || '100',
      slotDuration: consultant.slotDuration || '15 Mins',
      slotCount: consultant.slotCount || '2',
      slotSettings: consultant.slotSettings || createDefaultSlotSettings()
    });
    setEditingId(consultant.id);
    setViewMode('form');
    setIsConsultantInfoOpen(true);
    setIsFeeSettingOpen(true);
    setIsSlotSettingOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this consultant?')) {
      const updated = consultants.filter(c => c.id !== id);
      saveToStorage(updated);
      setSuccessMsg('Consultant deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Category',
      'Prefix',
      'Name',
      'Qualification',
      'Designation',
      'Department',
      'Hospital Name',
      'Contact No',
      'Token No Applicable',
      'OP Place',
      'Active',
      'Discount Applicable',
      'Discount OP',
      'Discount IP',
      'Send SMS',
      'OP Amount',
      'OP Review',
      'OP Follow-up',
      'OP Hospital Share %',
      'OP Hospital Share Amt',
      'OP Doctor Share %',
      'OP Doctor Share Amt',
      'IP Amount',
      'IP Review',
      'IP Follow-up',
      'IP Hospital Share %',
      'IP Hospital Share Amt',
      'IP Doctor Share %',
      'IP Doctor Share Amt',
      'Slot Duration'
    ];
    const rows = consultants.map(c => [
      c.category,
      c.prefix,
      `"${c.name}"`,
      `"${c.qualification || ''}"`,
      `"${c.designation || ''}"`,
      `"${c.department || ''}"`,
      `"${c.hospitalName || c.referralHospital || ''}"`,
      c.contactNo || '',
      c.tokenNoApplicable ? 'Yes' : 'No',
      c.opPlace ? 'Yes' : 'No',
      c.active ? 'Yes' : 'No',
      c.discountApplicable ? 'Yes' : 'No',
      c.discountOP ? 'Yes' : 'No',
      c.discountIP ? 'Yes' : 'No',
      c.sendSMS ? 'Yes' : 'No',
      c.opAmount || c.opDrAmount || '0',
      c.opReview || '0',
      c.opFollowUp || '0',
      c.opHospitalShare || '0',
      c.opHospitalShareAmt || '0',
      c.opDoctorShare || '0',
      c.opDoctorShareAmt || '0',
      c.ipAmount || c.ipDrAmount || '0',
      c.ipReview || '0',
      c.ipFollowUp || '0',
      c.ipHospitalShare || '0',
      c.ipHospitalShareAmt || '0',
      c.ipDoctorShare || '0',
      c.ipDoctorShareAmt || '0',
      c.slotDuration || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Consultant_List_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredConsultants = consultants.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.qualification && c.qualification.toLowerCase().includes(q)) ||
      (c.designation && c.designation.toLowerCase().includes(q)) ||
      (c.hospitalName && c.hospitalName.toLowerCase().includes(q)) ||
      (c.referralHospital && c.referralHospital.toLowerCase().includes(q)) ||
      (c.contactNo && c.contactNo.toLowerCase().includes(q)) ||
      (c.department && c.department.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
    const matchesDept = !filterDepartment || c.department === filterDepartment;
    const matchesCat = !filterCategory || c.category === filterCategory;
    return matchesSearch && matchesDept && matchesCat;
  });

  return (
    <div className="patient-register-container">
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Header Bar (matching Image 2 unified header design) */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">
            {viewMode === 'form' 
              ? (editingId ? `Edit Consultant: ${form.prefix} ${form.name}` : 'Consultant Master') 
              : 'Consultants & Doctors List'}
          </h1>
          <p className="pr-sub-title">
            {viewMode === 'form' 
              ? 'Register or edit consultant details, fee structure, and slot settings.' 
              : 'View, search, edit, or manage registered consultant records.'}
          </p>
        </div>

        <div className="pr-header-actions">
          {/* Dr List / Back to Form Toggle Button */}
          <button 
            type="button" 
            className="btn-export-pdf" 
            title={viewMode === 'form' ? 'Dr List' : 'Back to Form'} 
            onClick={() => {
              const nextMode = viewMode === 'form' ? 'list' : 'form';
              setViewMode(nextMode);
              if (setSidebarOpen) {
                setSidebarOpen(nextMode === 'form');
              }
            }}
          >
            <List size={13} />
            <span>{viewMode === 'form' ? 'Dr List' : 'Back to Form'}</span>
          </button>

          {/* Export to Excel Button */}
          <button 
            type="button" 
            className="btn-export-excel" 
            title="Export to CSV" 
            onClick={handleExportCSV}
          >
            <FileSpreadsheet size={13} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE: FORM (Vertical Accordion Sections matching 2nd image) */}
      {viewMode === 'form' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {errorMsg && (
            <div className="alert-error-banner" style={{ margin: 0 }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: CONSULTANT INFORMATION (Collapsible) */}
          <div className="pr-card-box" style={{ marginBottom: 0 }}>
            <div 
              className="pr-card-header-strip" 
              onClick={() => setIsConsultantInfoOpen(!isConsultantInfoOpen)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} />
                <span>Consultant Information</span>
              </div>
              {isConsultantInfoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isConsultantInfoOpen && (
              <div className="pr-card-body">
                <div className="pr-form-4col-grid">
                  
                  {/* Category Pill Buttons */}
                  <div className="pr-field" style={{ gridColumn: 'span 4' }}>
                    <label className="pr-label">CATEGORY</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {['Consultant', 'Referral', 'DutyDoctor'].map((cat) => {
                        const isSelected = form.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setForm({ ...form, category: cat })}
                            style={{
                              padding: '6px 20px',
                              borderRadius: '20px',
                              border: '1.5px solid #8b5cf6',
                              backgroundColor: isSelected ? '#8b5cf6' : 'white',
                              color: isSelected ? 'white' : '#8b5cf6',
                              fontWeight: isSelected ? '700' : '500',
                              fontSize: '13px',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 2px 4px rgba(139, 92, 246, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Consultant Name with Prefix (Title from Register Master) */}
                  <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                    <label className="pr-label">
                      Consultant Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        name="prefix" 
                        value={form.prefix} 
                        onChange={handleChange} 
                        className="pr-select" 
                        style={{ width: '90px', flexShrink: 0, fontWeight: '600' }}
                        title="Title from Register Master"
                      >
                        {titleOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        placeholder="Consultant Name" 
                        className="pr-input" 
                        style={{ borderColor: errorMsg && !form.name.trim() ? '#ef4444' : undefined }}
                      />
                    </div>
                  </div>

                  {/* Qualification (Dropdown from Register Master) */}
                  <div className="pr-field">
                    <label className="pr-label">Qualification</label>
                    <select 
                      name="qualification" 
                      value={form.qualification} 
                      onChange={handleChange} 
                      className="pr-select"
                    >
                      <option value="">--Select Qualification--</option>
                      {qualificationOptions.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  {/* Designation (Dropdown from Register Master) */}
                  <div className="pr-field">
                    <label className="pr-label">Designation</label>
                    <select 
                      name="designation" 
                      value={form.designation} 
                      onChange={handleChange} 
                      className="pr-select"
                    >
                      <option value="">--Select Designation--</option>
                      {designationOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department (Dropdown from Register Master) */}
                  <div className="pr-field">
                    <label className="pr-label">Department</label>
                    <select 
                      name="department" 
                      value={form.department} 
                      onChange={handleChange} 
                      className="pr-select"
                    >
                      <option value="">--Select Department--</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hospital Name */}
                  <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                    <label className="pr-label">Hospital Name</label>
                    <input 
                      type="text" 
                      name="hospitalName" 
                      value={form.hospitalName} 
                      onChange={handleChange} 
                      placeholder="Hospital Name (e.g. Gurushree Hospital)" 
                      className="pr-input" 
                    />
                  </div>

                  {/* Contact No */}
                  <div className="pr-field">
                    <label className="pr-label">Contact No</label>
                    <input 
                      type="text" 
                      name="contactNo" 
                      value={form.contactNo} 
                      onChange={handleChange} 
                      placeholder="Contact Number (10 digits)" 
                      className="pr-input" 
                    />
                  </div>

                  {/* Checkboxes Area */}
                  <div className="pr-field" style={{ gridColumn: 'span 4', marginTop: '6px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
                      gap: '14px', 
                      backgroundColor: '#f8fafc', 
                      padding: '14px 18px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0' 
                    }}>
                      {/* Token no Applicable */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#334155', fontWeight: '500' }}>
                        <input 
                          type="checkbox" 
                          name="tokenNoApplicable" 
                          checked={form.tokenNoApplicable} 
                          onChange={handleChange} 
                          style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }} 
                        />
                        <span>Token No Applicable</span>
                      </label>

                      {/* OP place */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#334155', fontWeight: '500' }}>
                        <input 
                          type="checkbox" 
                          name="opPlace" 
                          checked={form.opPlace} 
                          onChange={handleChange} 
                          style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }} 
                        />
                        <span>OP Place Allocated</span>
                      </label>

                      {/* Active */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#334155', fontWeight: '500' }}>
                        <input 
                          type="checkbox" 
                          name="active" 
                          checked={form.active} 
                          onChange={handleChange} 
                          style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }} 
                        />
                        <span>Active Status</span>
                      </label>

                      {/* Send SMS */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#334155', fontWeight: '500' }}>
                        <input 
                          type="checkbox" 
                          name="sendSMS" 
                          checked={form.sendSMS} 
                          onChange={handleChange} 
                          style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }} 
                        />
                        <span>Notify via SMS</span>
                      </label>

                      {/* Discount Applicable */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12.5px', color: '#334155', fontWeight: '600' }}>
                          <input 
                            type="checkbox" 
                            name="discountApplicable" 
                            checked={form.discountApplicable} 
                            onChange={handleChange} 
                            style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }} 
                          />
                          <span>Discount Applicable</span>
                        </label>
                        {form.discountApplicable && (
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
                              <input 
                                type="checkbox" 
                                name="discountOP" 
                                checked={form.discountOP} 
                                onChange={handleChange} 
                                style={{ width: '14px', height: '14px', accentColor: '#0284c7' }} 
                              />
                              OP
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
                              <input 
                                type="checkbox" 
                                name="discountIP" 
                                checked={form.discountIP} 
                                onChange={handleChange} 
                                style={{ width: '14px', height: '14px', accentColor: '#0284c7' }} 
                              />
                              IP
                            </label>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

                {/* Bottom of Consultant Information Folder: Separate Clear Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={handleClearConsultantInfo}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                    title="Clear Consultant Information fields"
                  >
                    <RotateCcw size={13} />
                    <span>Clear Consultant Information</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: FEE SETTING (Collapsible) */}
          <div className="pr-card-box" style={{ marginBottom: 0 }}>
            <div 
              className="pr-card-header-strip" 
              onClick={() => setIsFeeSettingOpen(!isFeeSettingOpen)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IndianRupee size={16} />
                <span>Fee Setting</span>
              </div>
              {isFeeSettingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isFeeSettingOpen && (
              <div className="pr-card-body">
                {/* Side-by-Side OP & IP Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>

                  {/* OP SECTION */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #93c5fd',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{
                      backgroundColor: '#eff6ff',
                      borderBottom: '2px solid #3b82f6',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e40af' }}>
                          OP Section
                        </h4>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                        Outpatient (OP)
                      </span>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      
                      {/* 1st Row: OP Amount, OP Review, OP Follow-up */}
                      <div>
                     
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Amount</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opAmount"
                                value={form.opAmount}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%', fontWeight: '600' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Review</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opReview"
                                value={form.opReview}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Follow-up</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opFollowUp"
                                value={form.opFollowUp}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2nd Row: Hospital Share %, Doctor Share % */}
                      <div>
                     
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Hospital Share %</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                name="opHospitalShare"
                                value={form.opHospitalShare}
                                onChange={handleChange}
                                placeholder="Share %"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '6px 0 0 6px', border: '1px solid #cbd5e1', borderRight: 'none', width: '100%' }}
                              />
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>%</span>
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Doctor Share %</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                name="opDoctorShare"
                                value={form.opDoctorShare}
                                onChange={handleChange}
                                placeholder="Share %"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '6px 0 0 6px', border: '1px solid #cbd5e1', borderRight: 'none', width: '100%' }}
                              />
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3rd Row: OP Hospital Share Amt, OP Doctor Share Amt */}
                      <div>
                      
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Hospital Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opHospitalShareAmt"
                                value={form.opHospitalShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Doctor Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opDoctorShareAmt"
                                value={form.opDoctorShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4th Row: OP Review Hospital Share Amt, OP Review Doctor Share Amt */}
                      <div>
                       
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Review Hospital Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opReviewHospitalShareAmt"
                                value={form.opReviewHospitalShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Review Doctor Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opReviewDoctorShareAmt"
                                value={form.opReviewDoctorShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 5th Row: OP Follow-up Hospital Share Amt, OP Follow-up Doctor Share Amt */}
                      <div>
                      
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Follow-up Hospital Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opFollowUpHospitalShareAmt"
                                value={form.opFollowUpHospitalShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>OP Follow-up Doctor Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="opFollowUpDoctorShareAmt"
                                value={form.opFollowUpDoctorShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* IP SECTION */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #c4b5fd',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{
                      backgroundColor: '#f5f3ff',
                      borderBottom: '2px solid #8b5cf6',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#5b21b6' }}>
                          IP Section
                        </h4>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#6d28d9', backgroundColor: '#ede9fe', padding: '2px 8px', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                        Inpatient (IP)
                      </span>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      
                      {/* 1st Row: IP Amount, IP Review, IP Follow-up */}
                      <div>
                       
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Amount</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipAmount"
                                value={form.ipAmount}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%', fontWeight: '600' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Review</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipReview"
                                value={form.ipReview}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Follow-up</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipFollowUp"
                                value={form.ipFollowUp}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2nd Row: Hospital Share %, Doctor Share % */}
                      <div>
                       
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Hospital Share %</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                name="ipHospitalShare"
                                value={form.ipHospitalShare}
                                onChange={handleChange}
                                placeholder="Share %"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '6px 0 0 6px', border: '1px solid #cbd5e1', borderRight: 'none', width: '100%' }}
                              />
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>%</span>
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Doctor Share %</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                name="ipDoctorShare"
                                value={form.ipDoctorShare}
                                onChange={handleChange}
                                placeholder="Share %"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '6px 0 0 6px', border: '1px solid #cbd5e1', borderRight: 'none', width: '100%' }}
                              />
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3rd Row: IP Hospital Share Amt, IP Doctor Share Amt */}
                      <div>
                       
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Hospital Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipHospitalShareAmt"
                                value={form.ipHospitalShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Doctor Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipDoctorShareAmt"
                                value={form.ipDoctorShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4th Row: IP Review Hospital Share Amt, IP Review Doctor Share Amt */}
                      <div>
                       
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Review Hospital Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipReviewHospitalShareAmt"
                                value={form.ipReviewHospitalShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Review Doctor Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipReviewDoctorShareAmt"
                                value={form.ipReviewDoctorShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 5th Row: IP Follow-up Hospital Share Amt, IP Follow-up Doctor Share Amt */}
                      <div>
                       
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Follow-up Hospital Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipFollowUpHospitalShareAmt"
                                value={form.ipFollowUpHospitalShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="pr-label" style={{ fontWeight: '600', color: '#334155', fontSize: '12px', marginBottom: '4px', display: 'block' }}>IP Follow-up Doctor Share Amt</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ height: '34px', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                name="ipFollowUpDoctorShareAmt"
                                value={form.ipFollowUpDoctorShareAmt}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="pr-input"
                                style={{ height: '34px', borderRadius: '0 6px 6px 0', border: '1px solid #cbd5e1', width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Slot & Duration Strip */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                    {/* No. of Slots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label className="pr-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>No. of Slots:</label>
                      <select 
                        name="slotCount" 
                        value={form.slotCount || '2'} 
                        onChange={handleChange} 
                        className="pr-select" 
                        style={{ width: '100px', height: '34px' }}
                      >
                        <option value="1">1 Slot</option>
                        <option value="2">2 Slots</option>
                        <option value="3">3 Slots</option>
                        <option value="4">4 Slots</option>
                        <option value="5">5 Slots</option>
                        <option value="6">6 Slots</option>
                        <option value="8">8 Slots</option>
                        <option value="10">10 Slots</option>
                      </select>
                    </div>

                    {/* Duration per Slot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label className="pr-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Duration per Slot:</label>
                      <select 
                        name="slotDuration" 
                        value={form.slotDuration} 
                        onChange={handleChange} 
                        className="pr-select" 
                        style={{ width: '110px', height: '34px' }}
                      >
                        <option value="10 Mins">10 Mins</option>
                        <option value="15 Mins">15 Mins</option>
                        <option value="20 Mins">20 Mins</option>
                        <option value="30 Mins">30 Mins</option>
                        <option value="45 Mins">45 Mins</option>
                        <option value="60 Mins">60 Mins</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#1e40af', fontWeight: '600', backgroundColor: '#dbeafe', padding: '4px 10px', borderRadius: '4px' }}>
                      OP: ₹{form.opAmount || '0'} (Dr: ₹{form.opDoctorShareAmt || '0'} | Hosp: ₹{form.opHospitalShareAmt || '0'})
                    </span>
                    <span style={{ color: '#5b21b6', fontWeight: '600', backgroundColor: '#ede9fe', padding: '4px 10px', borderRadius: '4px' }}>
                      IP: ₹{form.ipAmount || '0'} (Dr: ₹{form.ipDoctorShareAmt || '0'} | Hosp: ₹{form.ipHospitalShareAmt || '0'})
                    </span>
                  </div>
                </div>

                {/* Bottom of Fee Setting Folder: Separate Clear Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={handleClearFeeSetting}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                    title="Clear Fee Setting fields"
                  >
                    <RotateCcw size={13} />
                    <span>Clear Fee Setting</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: SLOT SETTING (Collapsible) */}
          <div className="pr-card-box" style={{ marginBottom: 0 }}>
            <div 
              className="pr-card-header-strip" 
              onClick={() => setIsSlotSettingOpen(!isSlotSettingOpen)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} />
                <span>Slot Setting</span>
              </div>
              {isSlotSettingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isSlotSettingOpen && (
              <div className="pr-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Configure OPD availability days, timings, and slot generation:
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyMondayToAll}
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Copy Monday Schedule to Weekdays
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '760px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 12px', width: '95px' }}>Day</th>
                        <th style={{ padding: '10px 12px', width: '165px' }}>Availability</th>
                        <th style={{ padding: '10px 12px', width: '50px' }}>Slot</th>
                        <th style={{ padding: '10px 12px', width: '110px' }}>Start Time</th>
                        <th style={{ padding: '10px 12px', width: '110px' }}>End Time</th>
                        <th style={{ padding: '10px 12px', width: '120px' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WEEKDAYS.map((day, index) => {
                        const setting = form.slotSettings?.[day] || {
                          available: day !== 'Sunday',
                          slot1: { fromTime: '09:00', toTime: '13:00', duration: '15 Mins' },
                          slot2: { fromTime: '', toTime: '', duration: '15 Mins', enabled: false }
                        };

                        // Backwards-compat: if old format with fromTime/toTime at top level
                        const slot1 = setting.slot1 || { fromTime: setting.fromTime || '09:00', toTime: setting.toTime || '13:00', duration: setting.slotDuration || '15 Mins' };
                        const slot2 = setting.slot2 || { fromTime: '', toTime: '', duration: '15 Mins', enabled: false };
                        const isAvailable = setting.available;
                        const rowBg = !isAvailable ? '#f8fafc' : (index % 2 === 0 ? '#ffffff' : '#fcfcfd');
                        const inputStyle = (active) => ({
                          height: '32px',
                          padding: '0 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          backgroundColor: active ? '#ffffff' : '#f1f5f9',
                          color: active ? '#0f172a' : '#94a3b8',
                          cursor: active ? 'pointer' : 'not-allowed',
                          width: '100%'
                        });
                        const selectStyle = (active) => ({
                          height: '32px',
                          padding: '0 6px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: active ? '#eff6ff' : '#f1f5f9',
                          color: active ? '#1d4ed8' : '#94a3b8',
                          cursor: active ? 'pointer' : 'not-allowed',
                          width: '100%'
                        });
                        const durationOptions = [
                          '10 Mins', '15 Mins', '20 Mins', '30 Mins', '45 Mins', '60 Mins'
                        ];

                        return (
                          <React.Fragment key={day}>
                            {/* ---- SLOT 1 ROW ---- */}
                            <tr style={{
                              borderTop: '2px solid #e2e8f0',
                              backgroundColor: rowBg
                            }}>
                              {/* Day cell — spans 2 rows */}
                              <td rowSpan={2} style={{ padding: '10px 12px', fontWeight: '700', color: isAvailable ? '#0f172a' : '#94a3b8', verticalAlign: 'middle', borderRight: '1px solid #f1f5f9' }}>
                                {day}
                              </td>

                              {/* Availability cell — spans 2 rows */}
                              <td rowSpan={2} style={{ padding: '10px 12px', verticalAlign: 'middle', borderRight: '1px solid #f1f5f9' }}>
                                {!isAvailable ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                                      <button type="button" onClick={() => handleDaySlotChange(day, 'available', true)}
                                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '500', border: 'none', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer' }}>Available</button>
                                      <button type="button" onClick={() => handleDaySlotChange(day, 'available', false)}
                                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', border: 'none', borderLeft: '1px solid #cbd5e1', backgroundColor: '#64748b', color: '#ffffff', cursor: 'pointer' }}>Not Available</button>
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>Off Day</span>
                                  </div>
                                ) : (
                                  <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                                    <button type="button" onClick={() => handleDaySlotChange(day, 'available', true)}
                                      style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', cursor: 'pointer' }}>Available</button>
                                    <button type="button" onClick={() => handleDaySlotChange(day, 'available', false)}
                                      style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '500', border: 'none', borderLeft: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer' }}>Not Available</button>
                                  </div>
                                )}
                              </td>

                              {/* Slot 1 label */}
                              <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  backgroundColor: isAvailable ? '#dbeafe' : '#f1f5f9',
                                  color: isAvailable ? '#1d4ed8' : '#94a3b8',
                                  whiteSpace: 'nowrap'
                                }}>Slot 1</span>
                              </td>

                              {/* Slot 1 Start Time */}
                              <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                <input type="time" disabled={!isAvailable}
                                  value={slot1.fromTime || '09:00'}
                                  onChange={(e) => handleDaySlotChange(day, 'fromTime', e.target.value, 'slot1')}
                                  style={inputStyle(isAvailable)} />
                              </td>

                              {/* Slot 1 End Time */}
                              <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                <input type="time" disabled={!isAvailable}
                                  value={slot1.toTime || '13:00'}
                                  onChange={(e) => handleDaySlotChange(day, 'toTime', e.target.value, 'slot1')}
                                  style={inputStyle(isAvailable)} />
                              </td>

                              {/* Slot 1 Duration */}
                              <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                <select disabled={!isAvailable}
                                  value={slot1.duration || '15 Mins'}
                                  onChange={(e) => handleDaySlotChange(day, 'duration', e.target.value, 'slot1')}
                                  style={selectStyle(isAvailable)}>
                                  {durationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </td>
                            </tr>

                            {/* ---- SLOT 2 ROW ---- */}
                            <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: rowBg }}>
                              {/* Slot 2 label */}
                              <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  backgroundColor: isAvailable && slot2.enabled ? '#f0fdf4' : '#f1f5f9',
                                  color: isAvailable && slot2.enabled ? '#16a34a' : '#94a3b8',
                                  whiteSpace: 'nowrap'
                                }}>Slot 2</span>
                              </td>

                              {/* Slot 2 Start Time */}
                              <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                <input type="time"
                                  disabled={!isAvailable || !slot2.enabled}
                                  value={slot2.fromTime || ''}
                                  onChange={(e) => handleDaySlotChange(day, 'fromTime', e.target.value, 'slot2')}
                                  style={inputStyle(isAvailable && slot2.enabled)} />
                              </td>

                              {/* Slot 2 End Time */}
                              <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                <input type="time"
                                  disabled={!isAvailable || !slot2.enabled}
                                  value={slot2.toTime || ''}
                                  onChange={(e) => handleDaySlotChange(day, 'toTime', e.target.value, 'slot2')}
                                  style={inputStyle(isAvailable && slot2.enabled)} />
                              </td>

                              {/* Slot 2 Duration + Enable toggle */}
                              <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <select
                                    disabled={!isAvailable || !slot2.enabled}
                                    value={slot2.duration || '15 Mins'}
                                    onChange={(e) => handleDaySlotChange(day, 'duration', e.target.value, 'slot2')}
                                    style={{ ...selectStyle(isAvailable && slot2.enabled), flex: 1 }}>
                                    {durationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={!isAvailable}
                                    title={slot2.enabled ? 'Disable Slot 2' : 'Enable Slot 2'}
                                    onClick={() => handleDaySlotChange(day, 'enabled', !slot2.enabled, 'slot2')}
                                    style={{
                                      height: '28px',
                                      width: '28px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                                      backgroundColor: !isAvailable ? '#f1f5f9' : slot2.enabled ? '#ef4444' : '#16a34a',
                                      color: '#fff',
                                      fontWeight: '700',
                                      fontSize: '14px',
                                      flexShrink: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      lineHeight: 1
                                    }}
                                  >
                                    {slot2.enabled ? '−' : '+'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: FOOTER ACTION BAR (matching 2nd image exactly) */}
          <div className="pr-card-box">
            <div className="pr-form-footer-actions" style={{ padding: '20px', borderTop: 'none', justifyContent: 'flex-end', margin: 0 }}>
              <button 
                type="button" 
                className="btn-pr-clear" 
                onClick={handleClear}
              >
                <RotateCcw size={16} /> Clear Form
              </button>
              <button 
                type="button" 
                className="btn-pr-register"
                onClick={handleSave}
                style={{ backgroundColor: '#0070bb' }}
              >
                <Save size={16} /> {editingId ? 'Update Consultant' : 'Save Consultant'}
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* VIEW MODE: LIST (matching standard patient register list view) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Subview Selector & Filters */}
          <div className="pr-card-box" style={{ padding: '16px 20px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              
              {/* Left: View Tabs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setListSubView('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: listSubView === 'all' ? '#0284c7' : '#cbd5e1',
                    backgroundColor: listSubView === 'all' ? '#e0f2fe' : '#ffffff',
                    color: listSubView === 'all' ? '#0369a1' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  All Doctors ({consultants.length})
                </button>
                <button
                  type="button"
                  onClick={() => setListSubView('fee')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: listSubView === 'fee' ? '#0284c7' : '#cbd5e1',
                    backgroundColor: listSubView === 'fee' ? '#e0f2fe' : '#ffffff',
                    color: listSubView === 'fee' ? '#0369a1' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Fee Matrix
                </button>
                <button
                  type="button"
                  onClick={() => setListSubView('slot')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: listSubView === 'slot' ? '#0284c7' : '#cbd5e1',
                    backgroundColor: listSubView === 'slot' ? '#e0f2fe' : '#ffffff',
                    color: listSubView === 'slot' ? '#0369a1' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Slot Schedule Matrix
                </button>
              </div>

              {/* Right: Search & Department Filter */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="pr-search-bar" style={{ width: '260px' }}>
                  <Search size={14} color="#64748b" className="pr-search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search doctor, dept, designation..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-search-input"
                  />
                </div>

                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="pr-select"
                  style={{ width: '160px', height: '34px', fontSize: '12px' }}
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="pr-select"
                  style={{ width: '140px', height: '34px', fontSize: '12px' }}
                >
                  <option value="">All Categories</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Referral">Referral</option>
                  <option value="DutyDoctor">DutyDoctor</option>
                </select>

                <button
                  type="button"
                  onClick={() => { handleClear(); setViewMode('form'); }}
                  className="btn-pr-register"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}
                >
                  <Plus size={14} /> Add New
                </button>
              </div>

            </div>
          </div>

          {/* Table Content Card Box */}
          <div className="pr-card-box">
            
            {/* SUBVIEW 1: ALL DOCTORS REGISTRY TABLE */}
            {listSubView === 'all' && (
              <div className="pr-table-responsive">
                <table className="pr-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>S.NO</th>
                      <th>CATEGORY</th>
                      <th>DOCTOR NAME</th>
                      <th>QUALIFICATION</th>
                      <th>DESIGNATION</th>
                      <th>DEPARTMENT</th>
                      <th>HOSPITAL NAME</th>
                      <th className="text-center">TOKEN NO</th>
                      <th className="text-center">OP PLACE</th>
                      <th className="text-center">STATUS</th>
                      <th className="text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConsultants.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center" style={{ padding: '30px', color: '#64748b' }}>
                          No consultants found.
                        </td>
                      </tr>
                    ) : (
                      filteredConsultants.map((c, idx) => (
                        <tr key={c.id}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td>
                            <span className="brand-badge" style={{ fontSize: '11px' }}>
                              {c.category}
                            </span>
                          </td>
                          <td className="font-semibold-name">{c.prefix} {c.name}</td>
                          <td>{c.qualification || '—'}</td>
                          <td style={{ fontWeight: '500', color: '#475569' }}>{c.designation || '—'}</td>
                          <td style={{ color: '#0284c7', fontWeight: '600' }}>{c.department}</td>
                          <td>{c.hospitalName || c.referralHospital || '—'}</td>
                          <td className="text-center">
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '11px', 
                              fontWeight: '600',
                              backgroundColor: c.tokenNoApplicable ? '#e0e7ff' : '#f1f5f9',
                              color: c.tokenNoApplicable ? '#4338ca' : '#64748b'
                            }}>
                              {c.tokenNoApplicable ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '11px', 
                              fontWeight: '600',
                              backgroundColor: c.opPlace ? '#dcfce7' : '#f1f5f9',
                              color: c.opPlace ? '#15803d' : '#64748b'
                            }}>
                              {c.opPlace ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge-ins-sm ${c.active ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: c.active ? '#dcfce7' : '#fee2e2', color: c.active ? '#15803d' : '#b91c1c' }}>
                              {c.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                type="button"
                                title="View"
                                style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => setViewRecord(c)}
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                type="button"
                                title="Edit"
                                style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => handleEdit(c)}
                              >
                                <Pencil size={13} />
                              </button>
                              <button 
                                type="button"
                                title="Delete"
                                style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBVIEW 2: FEE SETTING MATRIX */}
            {listSubView === 'fee' && (
              <div className="pr-table-responsive">
                <table className="pr-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }} rowSpan={2}>S.NO</th>
                      <th rowSpan={2}>DOCTOR NAME</th>
                      <th rowSpan={2}>DEPARTMENT</th>
                      <th colSpan={4} style={{ textAlign: 'center', backgroundColor: '#dbeafe', color: '#1e40af', borderBottom: '2px solid #3b82f6' }}>
                        OP SECTION (OUTPATIENT)
                      </th>
                      <th colSpan={4} style={{ textAlign: 'center', backgroundColor: '#ede9fe', color: '#5b21b6', borderBottom: '2px solid #8b5cf6' }}>
                        IP SECTION (INPATIENT)
                      </th>
                      <th style={{ width: '70px', textAlign: 'center' }} rowSpan={2}>ACTIONS</th>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '11px' }}>OP AMT</th>
                      <th style={{ backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '11px' }}>REVIEW / F-UP</th>
                      <th style={{ backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '11px' }}>HOSP SHARE</th>
                      <th style={{ backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '11px' }}>DR SHARE</th>
                      <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', fontSize: '11px' }}>IP AMT</th>
                      <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', fontSize: '11px' }}>REVIEW / F-UP</th>
                      <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', fontSize: '11px' }}>HOSP SHARE</th>
                      <th style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', fontSize: '11px' }}>DR SHARE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConsultants.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center" style={{ padding: '30px', color: '#64748b' }}>
                          No consultants found.
                        </td>
                      </tr>
                    ) : (
                      filteredConsultants.map((c, idx) => (
                        <tr key={c.id}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td className="font-semibold-name">
                            {c.prefix} {c.name}
                            {c.designation && (
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>{c.designation}</div>
                            )}
                          </td>
                          <td style={{ color: '#0284c7', fontWeight: '600' }}>{c.department}</td>
                          <td style={{ fontWeight: '700', color: '#0284c7' }}>
                            ₹ {c.opAmount || c.opDrAmount || '0'}
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <div>₹ {c.opReview || '0'} <span style={{ color: '#64748b', fontSize: '10px' }}>(Rev)</span></div>
                            <div style={{ color: '#64748b', fontSize: '11px' }}>₹ {c.opFollowUp || '0'} (F-up)</div>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <div>₹ {c.opHospitalShareAmt || c.opExpenseShare || '0'}</div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>{c.opHospitalShare || '50'}%</span>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: '600', color: '#15803d' }}>₹ {c.opDoctorShareAmt || c.opShare || '0'}</div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>{c.opDoctorShare || c.opPercent || '50'}%</span>
                          </td>
                          <td style={{ fontWeight: '700', color: '#7c3aed' }}>
                            ₹ {c.ipAmount || c.ipDrAmount || '0'}
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <div>₹ {c.ipReview || '0'} <span style={{ color: '#64748b', fontSize: '10px' }}>(Rev)</span></div>
                            <div style={{ color: '#64748b', fontSize: '11px' }}>₹ {c.ipFollowUp || '0'} (F-up)</div>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <div>₹ {c.ipHospitalShareAmt || c.ipExpenseShare || '0'}</div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>{c.ipHospitalShare || '50'}%</span>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: '600', color: '#15803d' }}>₹ {c.ipDoctorShareAmt || c.ipShare || '0'}</div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>{c.ipDoctorShare || c.ipPercent || '50'}%</span>
                          </td>
                          <td className="text-center">
                            <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                type="button"
                                title="View"
                                style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => setViewRecord(c)}
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                type="button"
                                title="Edit Fee Settings"
                                style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => handleEdit(c)}
                              >
                                <Pencil size={13} />
                              </button>
                              <button 
                                type="button"
                                title="Delete"
                                style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBVIEW 3: WEEKLY SLOT SCHEDULE MATRIX */}
            {listSubView === 'slot' && (
              <div className="pr-table-responsive">
                <table className="pr-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>S.NO</th>
                      <th>DOCTOR NAME</th>
                      <th>DEPARTMENT</th>
                      {WEEKDAYS.map(day => (
                        <th key={day} style={{ fontSize: '11px', textAlign: 'center' }}>{day.slice(0, 3).toUpperCase()}</th>
                      ))}
                      <th style={{ width: '70px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConsultants.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center" style={{ padding: '30px', color: '#64748b' }}>
                          No slot schedules available.
                        </td>
                      </tr>
                    ) : (
                      filteredConsultants.map((c, idx) => (
                        <tr key={c.id}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td className="font-semibold-name">
                            {c.prefix} {c.name}
                            {c.designation && (
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>{c.designation}</div>
                            )}
                          </td>
                          <td style={{ color: '#0284c7', fontWeight: '600' }}>{c.department}</td>
                          {WEEKDAYS.map(day => {
                            const dSet = c.slotSettings?.[day];
                            const isAvail = dSet ? dSet.available : day !== 'Sunday';
                            const slots = isAvail
                              ? (dSet?.generatedSlots?.length ? dSet.generatedSlots : generateSlots(dSet?.fromTime || '09:00', dSet?.toTime || '13:00', dSet?.slotDuration || '2 slots'))
                              : [];

                            return (
                              <td key={day} style={{ textAlign: 'center', verticalAlign: 'top', padding: '8px 6px' }}>
                                {isAvail ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                                      {dSet?.fromTime || '09:00'} - {dSet?.toTime || '13:00'}
                                    </span>
                                    {slots.map((s, sIdx) => (
                                      <span key={sIdx} style={{ fontSize: '9px', color: '#4338ca', backgroundColor: '#e0e7ff', padding: '1px 4px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                                        S{sIdx + 1}: {s}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                                    Off
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="text-center">
                            <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                type="button"
                                title="View"
                                style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => setViewRecord(c)}
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                type="button"
                                title="Edit Slots"
                                style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => handleEdit(c)}
                              >
                                <Pencil size={13} />
                              </button>
                              <button 
                                type="button"
                                title="Delete"
                                style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

      {/* VIEW CONSULTANT MODAL */}
      {viewRecord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setViewRecord(null)}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '720px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Consultant Master Record</div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '2px' }}>{viewRecord.prefix} {viewRecord.name}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                  {viewRecord.qualification && <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>{viewRecord.qualification}</span>}
                  <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>{viewRecord.category || 'Consultant'}</span>
                  <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '20px', fontWeight: '700', backgroundColor: viewRecord.active ? '#dcfce7' : '#fee2e2', color: viewRecord.active ? '#15803d' : '#b91c1c' }}>
                    {viewRecord.active ? '● Active' : '● Inactive'}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: '#fff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. Basic Information */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  1. Basic & Professional Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Title / Prefix', value: viewRecord.prefix },
                    { label: 'Full Name', value: viewRecord.name },
                    { label: 'Qualification', value: viewRecord.qualification },
                    { label: 'Designation', value: viewRecord.designation },
                    { label: 'Department', value: viewRecord.department },
                    { label: 'Category', value: viewRecord.category },
                    { label: 'Hospital / Referral', value: viewRecord.hospitalName || viewRecord.referralHospital },
                    { label: 'Contact Number', value: viewRecord.contactNo },
                    { label: 'Email Address', value: viewRecord.email },
                    { label: 'Expenses Category', value: viewRecord.expensesCategory },
                    { label: 'Status', value: viewRecord.active ? 'Active' : 'Inactive' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. System Preferences & Flags */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  2. System Preferences & Feature Flags
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Token No Applicable', flag: viewRecord.tokenNoApplicable },
                    { label: 'OP Place Practice', flag: viewRecord.opPlace },
                    { label: 'Discount Applicable', flag: viewRecord.discountApplicable },
                    { label: 'OP Discount Allowed', flag: viewRecord.discountOP },
                    { label: 'IP Discount Allowed', flag: viewRecord.discountIP },
                    { label: 'Send SMS Notifications', flag: viewRecord.sendSMS },
                  ].map(({ label, flag }) => {
                    const isYes = Boolean(flag);
                    return (
                      <div key={label} style={{ background: isYes ? '#f0fdf4' : '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${isYes ? '#bbf7d0' : '#e2e8f0'}` }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: isYes ? '#15803d' : '#64748b' }}>
                          {isYes ? '✓ Enabled / Yes' : '✕ Disabled / No'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Fee Settings - OP & IP */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  3. Fee Structure & Revenue Sharing (OP & IP)
                </div>

                {/* OP Section */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', marginBottom: '6px' }}>OUTPATIENT (OP) FEE SETTINGS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {[
                      { label: 'OP Amount', value: viewRecord.opAmount ? `₹ ${viewRecord.opAmount}` : '₹ 0' },
                      { label: 'OP Review Fee', value: viewRecord.opReview ? `₹ ${viewRecord.opReview}` : '₹ 0' },
                      { label: 'OP Follow-up', value: viewRecord.opFollowUp ? `₹ ${viewRecord.opFollowUp}` : '₹ 0' },
                      { label: 'Hosp Share %', value: viewRecord.opHospitalShare ? `${viewRecord.opHospitalShare}%` : '—' },
                      { label: 'Hosp Share Amt', value: viewRecord.opHospitalShareAmt ? `₹ ${viewRecord.opHospitalShareAmt}` : '—' },
                      { label: 'Doctor Share %', value: viewRecord.opDoctorShare ? `${viewRecord.opDoctorShare}%` : '—' },
                      { label: 'Doctor Share Amt', value: viewRecord.opDoctorShareAmt ? `₹ ${viewRecord.opDoctorShareAmt}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#eff6ff', borderRadius: '6px', padding: '8px 10px', border: '1px solid #dbeafe' }}>
                        <div style={{ fontSize: '9px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IP Section */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', marginBottom: '6px' }}>INPATIENT (IP) FEE SETTINGS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {[
                      { label: 'IP Amount', value: viewRecord.ipAmount ? `₹ ${viewRecord.ipAmount}` : '₹ 0' },
                      { label: 'IP Review Fee', value: viewRecord.ipReview ? `₹ ${viewRecord.ipReview}` : '₹ 0' },
                      { label: 'IP Follow-up', value: viewRecord.ipFollowUp ? `₹ ${viewRecord.ipFollowUp}` : '₹ 0' },
                      { label: 'Hosp Share %', value: viewRecord.ipHospitalShare ? `${viewRecord.ipHospitalShare}%` : '—' },
                      { label: 'Hosp Share Amt', value: viewRecord.ipHospitalShareAmt ? `₹ ${viewRecord.ipHospitalShareAmt}` : '—' },
                      { label: 'Doctor Share %', value: viewRecord.ipDoctorShare ? `${viewRecord.ipDoctorShare}%` : '—' },
                      { label: 'Doctor Share Amt', value: viewRecord.ipDoctorShareAmt ? `₹ ${viewRecord.ipDoctorShareAmt}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#f0f9ff', borderRadius: '6px', padding: '8px 10px', border: '1px solid #e0f2fe' }}>
                        <div style={{ fontSize: '9px', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Slot & Schedule Settings */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    4. Working Schedule & Slot Settings
                  </div>
                  <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '600', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                    Default Duration: {viewRecord.slotDuration || '15 Mins'}
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '8px 12px', fontWeight: '700' }}>DAY</th>
                        <th style={{ padding: '8px 12px', fontWeight: '700' }}>AVAILABILITY</th>
                        <th style={{ padding: '8px 12px', fontWeight: '700' }}>SLOT 1</th>
                        <th style={{ padding: '8px 12px', fontWeight: '700' }}>SLOT 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WEEKDAYS.map(day => {
                        const dayData = viewRecord.slotSettings?.[day] || { available: false, slot1: {}, slot2: {} };
                        const isAvail = dayData.available;
                        const slot1Str = isAvail && dayData.slot1?.fromTime && dayData.slot1?.toTime
                          ? `${formatMinutesTo12Hour(parseTimeToMinutes(dayData.slot1.fromTime))} - ${formatMinutesTo12Hour(parseTimeToMinutes(dayData.slot1.toTime))} (${dayData.slot1.duration || viewRecord.slotDuration || '15 Mins'})`
                          : isAvail ? 'Configured' : '—';
                        
                        const slot2Str = isAvail && dayData.slot2?.enabled && dayData.slot2?.fromTime && dayData.slot2?.toTime
                          ? `${formatMinutesTo12Hour(parseTimeToMinutes(dayData.slot2.fromTime))} - ${formatMinutesTo12Hour(parseTimeToMinutes(dayData.slot2.toTime))} (${dayData.slot2.duration || viewRecord.slotDuration || '15 Mins'})`
                          : '—';

                        return (
                          <tr key={day} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isAvail ? '#ffffff' : '#fafafa' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '600', color: '#334155' }}>{day}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', backgroundColor: isAvail ? '#dcfce7' : '#f1f5f9', color: isAvail ? '#15803d' : '#94a3b8' }}>
                                {isAvail ? 'Available' : 'Closed / Off'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', color: isAvail ? '#0284c7' : '#94a3b8', fontWeight: isAvail ? '600' : 'normal' }}>{slot1Str}</td>
                            <td style={{ padding: '8px 12px', color: slot2Str !== '—' ? '#0284c7' : '#94a3b8', fontWeight: slot2Str !== '—' ? '600' : 'normal' }}>{slot2Str}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
