import { updatePatientInRecords } from './savedRecordsDB';

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
    doaTime: '',
    dod: '',
    dodTime: '',
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
    doaTime: '',
    dod: '',
    dodTime: '',
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

const updateBedStatus = (wardId, roomId, bedNo, status) => {
  if (!bedNo) return;
  try {
    const bedsStr = localStorage.getItem('masters_beds');
    if (!bedsStr) return;
    const beds = JSON.parse(bedsStr);
    let updated = false;
    const newBeds = beds.map(b => {
      // Robust matching: trim strings and just check bedNo and roomId
      const bBed = String(b.bedNo || '').trim();
      const pBed = String(bedNo || '').trim();
      const bRoom = String(b.roomId || '').trim();
      const pRoom = String(roomId || '').trim();

      if (bBed === pBed && (!pRoom || bRoom === pRoom)) {
        updated = true;
        return { ...b, status: status };
      }
      return b;
    });
    if (updated) {
      localStorage.setItem('masters_beds', JSON.stringify(newBeds));
    }
  } catch (e) {
    console.error('Failed to update bed status:', e);
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
  
  // Mark bed as Occupied
  updateBedStatus(patient.ward, patient.room, patient.bedNo, 'Occupied');
  
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
    const oldPatient = patients[idx];
    patients[idx] = updatedPatient;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    // Propagate updates to saved forms and drafts
    updatePatientInRecords(oldIpNo, updatedPatient.ipNo, updatedPatient.patientName);
    
    // Manage bed status if it changed
    if (oldPatient.bedNo !== updatedPatient.bedNo || oldPatient.room !== updatedPatient.room) {
      updateBedStatus(oldPatient.ward, oldPatient.room, oldPatient.bedNo, 'Available');
      updateBedStatus(updatedPatient.ward, updatedPatient.room, updatedPatient.bedNo, 'Occupied');
    } else if (updatedPatient.bedNo) {
      // Even if it didn't change, ensure it's occupied
      updateBedStatus(updatedPatient.ward, updatedPatient.room, updatedPatient.bedNo, 'Occupied');
    }
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

export const deleteRegisteredPatient = async (ipNo) => {
  const patients = getRegisteredPatients();
  const trimmedIp = (ipNo || '').trim().toUpperCase();
  const patientToDelete = patients.find(p => (p.ipNo || '').trim().toUpperCase() === trimmedIp);
  
  const updated = patients.filter((p) => (p.ipNo || '').trim().toUpperCase() !== trimmedIp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  // Free up the bed
  if (patientToDelete) {
    updateBedStatus(patientToDelete.ward, patientToDelete.room, patientToDelete.bedNo, 'Available');
  }

  // Delete permanently from database table
  try {
    const response = await fetch(`http://localhost:5000/api/patients/${encodeURIComponent(ipNo)}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      console.log(`Patient ${ipNo} deleted from database successfully.`);
    } else {
      console.warn(`Database DELETE response status: ${response.status}`);
    }
  } catch (err) {
    console.warn('Database connection warning during delete:', err);
  }
  
  return updated;
};
