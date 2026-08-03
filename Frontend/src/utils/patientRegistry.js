// Patient Registry Service for global auto-filling across form modules

const STORAGE_KEY = 'registered_patients_db';

// Initial pre-registered sample patients
const DEFAULT_PATIENTS = [
  {
    patientName: 'Suresh Kumar',
    age: '42',
    sex: 'Male',
    uhidNo: 'UHID-2026-881',
    ipNo: 'IP-9901',
    ward: 'ICU Ward 2',
    bedNo: 'Bed 104',
    medicalInsurance: 'Yes',
    doa: '2026-07-20',
    dod: '',
    consultantName: 'Dr. Sadhana'
  },
  {
    patientName: 'Anita Sharma',
    age: '35',
    sex: 'Female',
    uhidNo: 'UHID-2026-442',
    ipNo: 'IP-9902',
    ward: 'General Ward 3',
    bedNo: 'Bed 302',
    medicalInsurance: 'No',
    doa: '2026-07-22',
    dod: '',
    consultantName: 'Dr. Sadhana'
  }
];

export const getRegisteredPatients = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PATIENTS));
      return DEFAULT_PATIENTS;
    }
    return JSON.parse(data);
  } catch (err) {
    return DEFAULT_PATIENTS;
  }
};

export const registerPatient = (patient) => {
  const patients = getRegisteredPatients();
  const trimmedIp = (patient.ipNo || '').trim().toUpperCase();

  if (!trimmedIp) {
    throw new Error('IP No. is required.');
  }

  const existing = patients.find(
    (p) => (p.ipNo || '').trim().toUpperCase() === trimmedIp
  );

  if (existing) {
    throw new Error('IP No. already exists.');
  }

  const updated = [patient, ...patients];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updatePatient = (oldIpNo, updatedPatient) => {
  const patients = getRegisteredPatients();
  const trimmedOldIp = (oldIpNo || '').trim().toUpperCase();
  const trimmedNewIp = (updatedPatient.ipNo || '').trim().toUpperCase();

  if (!trimmedNewIp) {
    throw new Error('IP No. is required.');
  }

  if (trimmedOldIp !== trimmedNewIp) {
    const existing = patients.find(p => (p.ipNo || '').trim().toUpperCase() === trimmedNewIp);
    if (existing) throw new Error('IP No. already exists.');
  }

  const idx = patients.findIndex(p => (p.ipNo || '').trim().toUpperCase() === trimmedOldIp);
  if (idx !== -1) {
    patients[idx] = updatedPatient;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }
  return patients;
};

export const findPatientByIpNo = (ipNo) => {
  if (!ipNo || !ipNo.trim()) return null;
  const patients = getRegisteredPatients();
  const rawSearch = ipNo.trim().toUpperCase();
  const cleanSearch = rawSearch.replace(/[^A-Z0-9]/g, '');
  const numSearch = rawSearch.replace(/[^0-9]/g, '');

  return patients.find((p) => {
    const rawPtIp = (p.ipNo || '').trim().toUpperCase();
    const cleanPtIp = rawPtIp.replace(/[^A-Z0-9]/g, '');
    const numPtIp = rawPtIp.replace(/[^0-9]/g, '');

    const rawPtUhid = (p.uhidNo || '').trim().toUpperCase();
    const cleanPtUhid = rawPtUhid.replace(/[^A-Z0-9]/g, '');
    const numPtUhid = rawPtUhid.replace(/[^0-9]/g, '');

    // 1. Exact raw match (e.g. 'IP-01')
    if (rawPtIp === rawSearch || rawPtUhid === rawSearch) return true;
    
    // 2. Exact alphanumeric match (e.g. 'IP01')
    if (cleanPtIp === cleanSearch || cleanPtUhid === cleanSearch) return true;

    // 3. Exact numeric match (e.g. typing '01' to find 'IP-01', avoiding 'IP-9901')
    if (numSearch && (numPtIp === numSearch || numPtUhid === numSearch)) return true;

    // 4. Safe suffix match (only if search is >= 3 chars, e.g. '881' to find 'UHID-2026-881')
    if (cleanSearch.length >= 3) {
      if (cleanPtIp.endsWith(cleanSearch) || cleanPtUhid.endsWith(cleanSearch)) return true;
    }

    return false;
  }) || null;
};

export const deleteRegisteredPatient = (ipNo) => {
  const patients = getRegisteredPatients();
  const updated = patients.filter((p) => (p.ipNo || '').trim().toUpperCase() !== (ipNo || '').trim().toUpperCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
