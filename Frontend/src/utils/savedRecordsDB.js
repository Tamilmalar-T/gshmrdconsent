// Saved Form Records Database for storing and retrieving filled patient forms and drafts

const SAVED_RECORDS_KEY = 'saved_form_records_db';
const API_BASE_URL = 'http://localhost:5000/api';

const mapFormTypeToEndpoint = (formType) => {
  if (!formType) return null;
  // Convert camelCase, snake_case, or space-separated to kebab-case
  return formType
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

const syncToPostgres = async (record) => {
  // Do not sync drafts to PostgreSQL database, keep them in local storage only
  if (record.isDraft) return;

  try {
    const endpoint = mapFormTypeToEndpoint(record.formType);
    if (!endpoint) return; 

    // Helper to format dates to YYYY-MM-DD
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return dateStr;
    };

    const patientPayload = {
      name: record.patientName || 'Unknown Patient',
      uhid_no: record.data?.patient?.uhidNo || record.data?.uhidNo || `UHID-${Date.now()}`,
      ip_no: record.data?.patient?.ipNo || record.data?.ipNo || record.data?.ipOpNo || record.patientIpNo || `IP-${Date.now()}`,
      age: record.data?.patient?.age || record.data?.age || '',
      sex: record.data?.patient?.sex || record.data?.sex || 'Male',
      doa: formatDate(record.data?.patient?.doa || record.data?.doa) || '',
      ward: record.data?.patient?.ward || record.data?.ward || '',
      bed_no: record.data?.patient?.bedNo || record.data?.bedNo || ''
    };

    let patientId = null;
    let patRes = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientPayload)
    });
    let patData = await patRes.json();
    
    if (patData.success && patData.data) {
       patientId = patData.data.id;
    }

    if (!patientId) {
      console.warn("Sync warning: Could not find or create patient in Postgres.");
      return;
    }

    // 2. Post Form Data to PG
    const formPayload = {
      patientId: patientId,
      formData: record.data
    };

    let formRes = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formPayload)
    });
    
    if (!formRes.ok) console.warn("Failed to sync form to Postgres");

  } catch (err) {
    console.error("Postgres Sync Error:", err);
  }
};

export const getSavedRecords = () => {
  try {
    const data = localStorage.getItem(SAVED_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

/**
 * Upsert a form record.
 * - If existingId is provided, finds that record and updates it in-place.
 *   If the IP has changed from draft to real, it is promoted to a completed record.
 * - If existingId is null/undefined, creates a brand-new record.
 * Returns the saved record (with its id).
 */
export const upsertFormRecord = (existingId, formType, rawIpNo, formData, createdBy, forceDraft) => {
  const records = getSavedRecords();
  const cleanIp = (rawIpNo || '').trim().toUpperCase();
  const isDraft = forceDraft !== undefined ? forceDraft : (!cleanIp || cleanIp === 'UNASSIGNED' || cleanIp === 'DRAFT' || cleanIp === 'NO IP');

  const patientName =
    formData?.patientName ||
    formData?.name ||
    formData?.patName ||
    formData?.patient?.name ||
    formData?.patient?.patientName ||
    '';

  if (existingId) {
    // Update existing record
    const idx = records.findIndex(r => r.id === existingId);
    if (idx !== -1) {
      const updated = {
        ...records[idx],
        patientIpNo: isDraft ? 'Draft (No IP)' : cleanIp,
        rawIpNo: isDraft ? '' : cleanIp,
        patientName,
        isDraft,
        savedAt: new Date().toLocaleString(),
        data: formData
      };
      
      if (!isDraft) {
        // If it's no longer a draft (has an IP), delete it from Local Storage
        records.splice(idx, 1);
        localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(records));
        syncToPostgres(updated); // Save to Postgres
      } else {
        // Still a draft, keep it in Local Storage
        records[idx] = updated;
        localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(records));
      }
      return updated;
    }
  }

  // No existing record — create new
  const newRecord = {
    id: Date.now(),
    formType,
    patientIpNo: isDraft ? 'Draft (No IP)' : cleanIp,
    rawIpNo: isDraft ? '' : cleanIp,
    patientName,
    createdBy: createdBy || 'Sadhana Admin',
    isDraft,
    savedAt: new Date().toLocaleString(),
    data: formData
  };

  if (!isDraft) {
    // If it's created with an IP immediately, don't store in Local Storage
    syncToPostgres(newRecord); // Save to Postgres
  } else {
    // Prepend new draft to Local Storage
    records.unshift(newRecord);
    localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(records));
  }
  return newRecord;
};

// Legacy alias (kept for backward compat)
export const saveFormRecord = (formType, rawIpNo, formData, createdBy) =>
  upsertFormRecord(null, formType, rawIpNo, formData, createdBy);

// Returns all completed records that have an IP No.
export const getCompletedRecords = () => {
  const records = getSavedRecords();
  return records.filter((r) => !r.isDraft && r.patientIpNo && r.patientIpNo !== 'Draft (No IP)');
};

// Returns all draft records saved without an IP No.
export const getDraftRecords = () => {
  const records = getSavedRecords();
  return records.filter((r) => r.isDraft || !r.patientIpNo || r.patientIpNo === 'Draft (No IP)');
};

export const getRecordsByPatientIp = (patientIpNo) => {
  if (!patientIpNo) return [];
  const records = getSavedRecords();
  const searchIp = patientIpNo.trim().toUpperCase();
  return records.filter((r) => r.patientIpNo === searchIp || r.patientIpNo.includes(searchIp));
};

export const deleteSavedRecord = (id) => {
  const records = getSavedRecords();
  const updated = records.filter((r) => r.id !== id);
  localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(updated));
  return updated;
};

// Deletes all draft records (those without an IP No.)
export const deleteAllDrafts = () => {
  const records = getSavedRecords();
  const updated = records.filter((r) => !r.isDraft && r.patientIpNo && r.patientIpNo !== 'Draft (No IP)');
  localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(updated));
  return updated;
};

export const autoSaveFormDraft = (recordId, formType, patient, formData, setRecordId) => {
  if (window.isPrintViewMode) return null;
  const ip = patient?.ipNo || patient?.uhidNo || 'UNASSIGNED';
  
  const records = getSavedRecords();
  const existing = recordId ? records.find(r => r.id === recordId) : null;
  
  // CRITICAL FIX: If we have a recordId but the record is no longer in local storage,
  // it means it was successfully formalized and sent to PostgreSQL.
  // We MUST STOP auto-saving it as a draft, otherwise it creates duplicates!
  if (recordId && !existing) {
    return null; 
  }

  const forceDraft = existing ? existing.isDraft : true;
  const saved = upsertFormRecord(recordId, formType, ip, formData, 'Sadhana Admin', forceDraft);
  
  if (saved && saved.id !== recordId) {
    setRecordId(saved.id);
  }
  return saved;
};

