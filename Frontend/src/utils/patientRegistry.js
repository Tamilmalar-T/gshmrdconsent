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

export const findPatientByIpNo = (ipNo) => {
  if (!ipNo || !ipNo.trim()) return null;
  const patients = getRegisteredPatients();
  const rawSearch = ipNo.trim().toUpperCase();
  const cleanSearch = rawSearch.replace(/[^A-Z0-9]/g, '');

  if (!cleanSearch) return null;

  return patients.find((p) => {
    const rawPtIp = (p.ipNo || '').trim().toUpperCase();
    const cleanPtIp = rawPtIp.replace(/[^A-Z0-9]/g, '');
    const rawPtUhid = (p.uhidNo || '').trim().toUpperCase();
    const cleanPtUhid = rawPtUhid.replace(/[^A-Z0-9]/g, '');

    return (
      rawPtIp === rawSearch ||
      rawPtUhid === rawSearch ||
      cleanPtIp === cleanSearch ||
      cleanPtUhid === cleanSearch ||
      (cleanSearch.length >= 2 && cleanPtIp.endsWith(cleanSearch)) ||
      (cleanPtIp.length >= 2 && cleanSearch.endsWith(cleanPtIp))
    );
  }) || null;
};

export const deleteRegisteredPatient = (ipNo) => {
  const patients = getRegisteredPatients();
  const updated = patients.filter((p) => (p.ipNo || '').trim().toUpperCase() !== (ipNo || '').trim().toUpperCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
