// Consultant Master utility to load consultant and referral doctors

const STORAGE_KEY = 'masters_consultants';

export const INITIAL_CONSULTANTS = [
  {
    id: '1',
    empId: 'DOC001',
    category: 'Consultant',
    prefix: 'Dr.',
    name: 'SADHANA ADMIN',
    gender: 'Female',
    qualification: 'MD, MBBS',
    designation: 'Senior Consultant',
    contactNo: '9876543210',
    hospitalName: 'Gurushree Hospital',
    referralHospital: 'Gurushree Hospital',
    department: 'General Medicine',
    active: true
  },
  {
    id: '2',
    empId: 'DOC002',
    category: 'Consultant',
    prefix: 'Dr.',
    name: 'RAJESH KUMAR',
    qualification: 'MS (Ortho), DNB',
    designation: 'HOD Orthopedics',
    contactNo: '9845123456',
    hospitalName: 'Gurushree Hospital',
    referralHospital: 'Gurushree Hospital',
    department: 'Orthopedics',
    active: true
  },
  {
    id: '3',
    empId: 'DOC003',
    category: 'Referral',
    prefix: 'Dr.',
    name: 'NANI',
    qualification: 'MBBS',
    designation: 'Referral Doctor',
    contactNo: '9845999888',
    hospitalName: 'City Hospital',
    department: 'General Medicine',
    active: true
  }
];

/**
 * Returns all consultants from Consultant Master (localStorage 'masters_consultants').
 * If none exists, seeds with INITIAL_CONSULTANTS.
 */
export const getConsultantsFromMaster = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading masters_consultants:', e);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONSULTANTS));
  } catch (e) {}

  return INITIAL_CONSULTANTS;
};

/**
 * Returns active consultants for dropdown options.
 */
export const getActiveConsultants = () => {
  const all = getConsultantsFromMaster();
  return all.filter(c => c.active !== false);
};

/**
 * Returns active doctors with category 'Consultant' (or unspecified category).
 */
export const getConsultantDoctors = () => {
  const all = getActiveConsultants();
  return all.filter(c => !c.category || String(c.category).toLowerCase() === 'consultant');
};

/**
 * Returns active doctors with category 'Referral'.
 */
export const getReferralDoctors = () => {
  const all = getActiveConsultants();
  return all.filter(c => c.category && String(c.category).toLowerCase().includes('referral'));
};

/**
 * Returns formatted doctor names (e.g. "Dr. SADHANA ADMIN")
 */
export const getFormattedDoctorName = (c) => {
  if (!c) return '';
  if (typeof c === 'string') return c;
  const prefix = c.prefix ? c.prefix.trim() + ' ' : '';
  const name = (c.name || '').trim();
  return `${prefix}${name}`.trim();
};
