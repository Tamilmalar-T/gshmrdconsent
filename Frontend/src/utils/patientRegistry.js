import { updatePatientInRecords } from './savedRecordsDB';
import { parseDateToISO } from './dateUtils';

// Patient Registry Service for global auto-filling across form modules

const STORAGE_KEY = 'registered_patients_db';

export const getWardName = (wardVal) => {
  if (!wardVal) return '';
  const trimmed = String(wardVal).trim();
  if (!trimmed) return '';

  try {
    const wardsStr = localStorage.getItem('masters_wards');
    if (wardsStr) {
      const wards = JSON.parse(wardsStr);
      if (Array.isArray(wards) && wards.length > 0) {
        const found = wards.find(
          w => String(w.wardCode || '').trim().toLowerCase() === trimmed.toLowerCase() ||
               String(w.id || '').trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (found && found.wardName) {
          return found.wardName;
        }
      }
    }
  } catch (e) {}

  const defaultMap = {
    'W01': 'ICU',
    'W02': 'General',
    'W03': 'Special',
    'W04': 'Emergency',
    'W05': 'Pediatric',
    'W06': 'Maternity',
    'W07': 'Surgical',
    'W08': 'Post Operative'
  };

  if (defaultMap[trimmed.toUpperCase()]) {
    return defaultMap[trimmed.toUpperCase()];
  }

  return trimmed;
};

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
  
  // Sync to PostgreSQL backend
  try {
    const payload = {
      name: patient.patientName || patient.name || '',
      uhid_no: patient.uhidNo || null,
      ip_no: trimmedIp,
      age: patient.age || '',
      sex: patient.sex || patient.gender || 'Male',
      doa: patient.doa && patient.doa.trim() !== '' ? patient.doa : new Date().toISOString().split('T')[0],
      ward: patient.ward || '',
      bed_no: patient.bedNo || '',
      registration_data: patient
    };
    fetch('http://localhost:5000/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.warn('PostgreSQL patient register sync warning:', e));
  } catch (err) {
    console.warn('PostgreSQL patient register sync error:', err);
  }

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
    updatePatientInRecords(oldIpNo, updatedPatient.ipNo, updatedPatient);
    
    // Manage bed status if it changed
    if (oldPatient.bedNo !== updatedPatient.bedNo || oldPatient.room !== updatedPatient.room) {
      updateBedStatus(oldPatient.ward, oldPatient.room, oldPatient.bedNo, 'Available');
      updateBedStatus(updatedPatient.ward, updatedPatient.room, updatedPatient.bedNo, 'Occupied');
    } else if (updatedPatient.bedNo) {
      // Even if it didn't change, ensure it's occupied
      updateBedStatus(updatedPatient.ward, updatedPatient.room, updatedPatient.bedNo, 'Occupied');
    }
  }

  // Sync update to PostgreSQL backend
  try {
    const payload = {
      name: updatedPatient.patientName || updatedPatient.name || '',
      uhid_no: updatedPatient.uhidNo || null,
      ip_no: trimmedNewIp,
      age: updatedPatient.age || '',
      sex: updatedPatient.sex || updatedPatient.gender || 'Male',
      doa: updatedPatient.doa && updatedPatient.doa.trim() !== '' ? updatedPatient.doa : null,
      ward: updatedPatient.ward || '',
      bed_no: updatedPatient.bedNo || '',
      registration_data: updatedPatient
    };
    fetch(`http://localhost:5000/api/patients/${encodeURIComponent(oldIpNo || trimmedNewIp)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.warn('PostgreSQL patient update sync warning:', e));
  } catch (err) {
    console.warn('PostgreSQL patient update sync error:', err);
  }

  return patients;
};

export const updatePatientWardTransfer = (ipOrUhid, transfersList, newWardDetails = null) => {
  if (!ipOrUhid) return;
  const patients = getRegisteredPatients();
  const rawSearch = ipOrUhid.trim().toUpperCase();
  const cleanSearch = rawSearch.replace(/[^A-Z0-9]/g, '');

  let patientIndex = -1;
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    const pIp = (p.ipNo || '').trim().toUpperCase();
    const pCleanIp = pIp.replace(/[^A-Z0-9]/g, '');
    const pUhid = (p.uhidNo || p.patientId || '').trim().toUpperCase();
    const pCleanUhid = pUhid.replace(/[^A-Z0-9]/g, '');
    if (pIp === rawSearch || pUhid === rawSearch || (cleanSearch && (pCleanIp === cleanSearch || pCleanUhid === cleanSearch))) {
      patientIndex = i;
      break;
    }
  }

  if (patientIndex === -1) return;

  const currentPatient = patients[patientIndex];
  const oldWard = currentPatient.ward;
  const oldRoom = currentPatient.room || currentPatient.roomNo;
  const oldBed = currentPatient.bedNo || currentPatient.bed;

  // Save transfer list to localStorage cache
  const cleanIp = (currentPatient.ipNo || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
  const cleanUhid = (currentPatient.uhidNo || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
  if (Array.isArray(transfersList) && transfersList.length > 0) {
    if (cleanIp) {
      try { localStorage.setItem('patient_ward_transfers_' + cleanIp, JSON.stringify(transfersList)); } catch (e) {}
    }
    if (cleanUhid) {
      try { localStorage.setItem('patient_ward_transfers_' + cleanUhid, JSON.stringify(transfersList)); } catch (e) {}
    }
  }

  // Determine latest ward, room, and bed
  let targetWard = newWardDetails?.ward || newWardDetails?.toWard || newWardDetails?.to;
  let targetRoom = newWardDetails?.roomNo || newWardDetails?.room;
  let targetBed = newWardDetails?.bedNo || newWardDetails?.bed;

  if (!targetWard && Array.isArray(transfersList)) {
    for (let i = transfersList.length - 1; i >= 0; i--) {
      const row = transfersList[i];
      const rowWard = row.to || row.ward || row.toWard;
      if (rowWard && rowWard.trim() !== '') {
        targetWard = rowWard.trim();
        targetRoom = row.roomNo || row.room || '';
        targetBed = row.bedNo || row.bed || '';
        break;
      }
    }
  }

  if (targetWard) {
    const updatedPatient = {
      ...currentPatient,
      ward: targetWard,
      wardType: targetWard,
      room: targetRoom || currentPatient.room || currentPatient.roomNo || '',
      roomNo: targetRoom || currentPatient.roomNo || currentPatient.room || '',
      bedNo: targetBed || currentPatient.bedNo || currentPatient.bed || '',
      bed: targetBed || currentPatient.bed || currentPatient.bedNo || ''
    };

    patients[patientIndex] = updatedPatient;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));

    // Bed status management
    if (oldBed !== updatedPatient.bedNo || oldRoom !== updatedPatient.room) {
      if (oldBed) updateBedStatus(oldWard, oldRoom, oldBed, 'Available');
      if (updatedPatient.bedNo) updateBedStatus(updatedPatient.ward, updatedPatient.room, updatedPatient.bedNo, 'Occupied');
    }

    // Update records in saved database
    updatePatientInRecords(currentPatient.ipNo, updatedPatient.ipNo, updatedPatient);

    // Sync to PostgreSQL backend
    try {
      const payload = {
        name: updatedPatient.patientName || updatedPatient.name || '',
        uhid_no: updatedPatient.uhidNo || null,
        ip_no: updatedPatient.ipNo,
        age: updatedPatient.age || '',
        sex: updatedPatient.sex || updatedPatient.gender || 'Male',
        doa: updatedPatient.doa || null,
        ward: updatedPatient.ward || '',
        bed_no: updatedPatient.bedNo || '',
        registration_data: updatedPatient
      };
      fetch(`http://localhost:5000/api/patients/${encodeURIComponent(updatedPatient.ipNo)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.warn('Ward transfer sync warning:', e));
    } catch (e) {}

    // Dispatch global event so any active forms on the page can update immediately if needed
    try {
      window.dispatchEvent(new CustomEvent('patient-ward-transferred', {
        detail: {
          ipNo: updatedPatient.ipNo,
          uhidNo: updatedPatient.uhidNo,
          ward: targetWard,
          roomNo: targetRoom,
          bedNo: targetBed
        }
      }));
    } catch (e) {}
  }
};

export const findPatientByIpNo = (ipNo) => {
  if (!ipNo || !ipNo.trim()) return null;
  const patients = getRegisteredPatients();
  const rawSearch = ipNo.trim().toUpperCase();
  const cleanSearch = rawSearch.replace(/[^A-Z0-9]/g, '');

  let found = patients.find((p) => {
    const rawPtIp = (p.ipNo || '').trim().toUpperCase();
    const cleanPtIp = rawPtIp.replace(/[^A-Z0-9]/g, '');

    const rawPtUhid = (p.uhidNo || p.patientId || '').trim().toUpperCase();
    const cleanPtUhid = rawPtUhid.replace(/[^A-Z0-9]/g, '');

    let regId = '';
    if (p.registration_data) {
      const reg = typeof p.registration_data === 'string' ? JSON.parse(p.registration_data) : p.registration_data;
      regId = (reg.patientId || reg.uhidNo || '').trim().toUpperCase();
    }
    const cleanRegId = regId.replace(/[^A-Z0-9]/g, '');

    // 1. Exact raw match (e.g. 'IP-01' or 'GSH01OP')
    if (rawPtIp === rawSearch || rawPtUhid === rawSearch || regId === rawSearch) return true;
    
    // 2. Exact alphanumeric match (e.g. 'IP01' or 'GSH01OP')
    if (cleanSearch && (cleanPtIp === cleanSearch || cleanPtUhid === cleanSearch || cleanRegId === cleanSearch)) return true;

    // 3. Strict numeric search only if user input consists purely of digits
    if (/^\d+$/.test(rawSearch)) {
      const numPtIp = rawPtIp.replace(/[^0-9]/g, '');
      const numPtUhid = rawPtUhid.replace(/[^0-9]/g, '');
      if (numPtIp === rawSearch || numPtUhid === rawSearch) return true;
    }

    return false;
  }) || null;

  if (found) {
    const cleanPtIp = (found.ipNo || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
    const cleanPtUhid = (found.uhidNo || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Check if there are saved ward transfers that have a newer ward/bed
    let transfers = [];
    try {
      const stored = (cleanPtIp && localStorage.getItem('patient_ward_transfers_' + cleanPtIp)) ||
                     (cleanPtUhid && localStorage.getItem('patient_ward_transfers_' + cleanPtUhid));
      if (stored) {
        transfers = JSON.parse(stored);
      }
    } catch (e) {}

    let latestWard = '';
    let latestRoom = '';
    let latestBed = '';

    if (Array.isArray(transfers) && transfers.length > 0) {
      for (let i = transfers.length - 1; i >= 0; i--) {
        const t = transfers[i];
        const w = t.to || t.ward || t.toWard;
        if (w && w.trim() !== '') {
          latestWard = w.trim();
          latestRoom = t.roomNo || t.room || '';
          latestBed = t.bedNo || t.bed || '';
          break;
        }
      }
    }

    const isIns = found.paymentDetails === 'Insurance' || String(found.hasInsurance).toLowerCase() === 'yes';
    const insVal = found.insuranceProvider || found.tpaCompanyName || (isIns ? 'Insurance' : (found.paymentDetails || 'Self')) || found.medicalInsurance || (isIns ? 'Yes' : 'No');

    let regData = {};
    if (found.registration_data) {
      if (typeof found.registration_data === 'string') {
        try { regData = JSON.parse(found.registration_data); } catch (e) {}
      } else {
        regData = found.registration_data;
      }
    }

    const rawMlc = found.isMlc || found.mlc || regData.isMlc || regData.mlc;
    const isMlcYes = rawMlc === true || String(rawMlc).trim().toLowerCase() === 'yes';

    const cleanDoa = parseDateToISO(found.doa || found.dateOfAdmission || regData.doa);
    const cleanDod = parseDateToISO(found.dod || found.dateOfDischarge || regData.dod);
    const cleanDob = parseDateToISO(found.dob || regData.dob);

    return {
      ...found,
      doa: cleanDoa || found.doa || '',
      dateOfAdmission: cleanDoa || found.dateOfAdmission || found.doa || '',
      dod: cleanDod || found.dod || '',
      dateOfDischarge: cleanDod || found.dateOfDischarge || found.dod || '',
      dob: cleanDob || found.dob || '',
      ward: getWardName(latestWard || found.ward || found.wardType || ''),
      wardType: getWardName(latestWard || found.wardType || found.ward || ''),
      room: latestRoom || found.room || found.roomNo || '',
      roomNo: latestRoom || found.roomNo || found.room || '',
      bedNo: latestBed || found.bedNo || found.bed || '',
      bed: latestBed || found.bed || found.bedNo || '',
      medicalInsurance: insVal,
      hasInsurance: isIns ? 'yes' : 'no',
      isMlc: isMlcYes ? 'yes' : 'no',
      mlc: isMlcYes ? 'Yes' : 'No',
      mlcType: isMlcYes ? 'MLC' : 'NMLC'
    };
  }

  return null;
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

export const fetchRegisteredPatientsFromBackend = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/patients');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const local = getRegisteredPatients();
      const combinedMap = new Map();

      // Seed with local patients
      local.forEach(p => {
        const key = (p.ipNo || p.uhidNo || '').trim().toUpperCase();
        if (key) combinedMap.set(key, p);
      });

      // Merge backend PostgreSQL patients
      json.data.forEach(p => {
        const key = (p.ip_no || p.uhid_no || '').trim().toUpperCase();
        if (!key) return;
        let regData = {};
        if (typeof p.registration_data === 'string') {
          try { regData = JSON.parse(p.registration_data); } catch (e) {}
        } else if (p.registration_data) {
          regData = p.registration_data;
        }

        const isMlcVal = regData.isMlc || regData.mlc || (combinedMap.get(key)?.isMlc) || 'No';
        const payVal = regData.paymentDetails || (combinedMap.get(key)?.paymentDetails) || 'Self';
        const insName = regData.insuranceProvider || regData.tpaCompanyName || (combinedMap.get(key)?.insuranceProvider) || '';
        const isIns = payVal === 'Insurance' || String(regData.hasInsurance).toLowerCase() === 'yes' || String(regData.medicalInsurance).toLowerCase() === 'yes';

        const doaClean = parseDateToISO(p.doa || regData.doa || (combinedMap.get(key)?.doa) || '');
        const dodClean = parseDateToISO(p.dod || regData.dod || (combinedMap.get(key)?.dod) || '');
        const dobClean = parseDateToISO(p.dob || regData.dob || (combinedMap.get(key)?.dob) || '');

        const merged = {
          ...(combinedMap.get(key) || {}),
          ...regData,
          ipNo: p.ip_no || regData.ipNo || (combinedMap.get(key)?.ipNo) || '',
          uhidNo: p.uhid_no || regData.uhidNo || regData.patientId || (combinedMap.get(key)?.uhidNo) || '',
          patientName: p.name || regData.patientName || regData.firstName || 'Patient',
          age: p.age || regData.age || '',
          sex: p.sex || regData.gender || 'Male',
          ward: p.ward || regData.ward || (combinedMap.get(key)?.ward) || '',
          room: p.room || regData.room || (combinedMap.get(key)?.room) || '',
          bedNo: p.bed_no || regData.bedNo || (combinedMap.get(key)?.bedNo) || '',
          doa: doaClean,
          dod: dodClean,
          dob: dobClean,
          doaTime: regData.doaTime || (combinedMap.get(key)?.doaTime) || '',
          consultant: regData.consultant || regData.consultantDr || (combinedMap.get(key)?.consultant) || '',
          referral: regData.referral || regData.referredByDoctor || (combinedMap.get(key)?.referral) || '',
          isMlc: isMlcVal,
          mlc: isMlcVal,
          paymentDetails: payVal,
          insuranceProvider: isIns ? insName : '',
          hasInsurance: isIns ? 'yes' : 'no',
          tpaCompanyName: isIns ? insName : '',
          attenderName: regData.attenderName || regData.relationName || (combinedMap.get(key)?.attenderName) || (combinedMap.get(key)?.relationName) || '',
          relationName: regData.attenderName || regData.relationName || (combinedMap.get(key)?.relationName) || '',
          relationType: regData.relationType || regData.attenderRelationType || (combinedMap.get(key)?.relationType) || '',
          attenderMobileNo: regData.attenderMobileNo || regData.alternateContact || (combinedMap.get(key)?.attenderMobileNo) || '',
          attenderEmail: regData.attenderEmail || (combinedMap.get(key)?.attenderEmail) || '',
          attenderAddress: regData.attenderAddress || (combinedMap.get(key)?.attenderAddress) || '',
          attenderIdType: regData.attenderIdType || (combinedMap.get(key)?.attenderIdType) || '',
          attenderIdNumber: regData.attenderIdNumber || (combinedMap.get(key)?.attenderIdNumber) || '',
          attenders: regData.attenders || (combinedMap.get(key)?.attenders) || []
        };
        combinedMap.set(key, merged);
        if (p.ip_no) combinedMap.set(p.ip_no.trim().toUpperCase(), merged);
        if (p.uhid_no) combinedMap.set(p.uhid_no.trim().toUpperCase(), merged);
      });

      const updated = Array.from(new Set(combinedMap.values()));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch (err) {
    console.warn('Backend patient fetch warning:', err);
  }
  return getRegisteredPatients();
};

