// Saved Form Records Database for storing and retrieving filled patient forms and drafts

const SAVED_RECORDS_KEY = 'saved_form_records_db';

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
export const upsertFormRecord = (existingId, formType, rawIpNo, formData, createdBy) => {
  const records = getSavedRecords();
  const cleanIp = (rawIpNo || '').trim().toUpperCase();
  const isDraft = !cleanIp || cleanIp === 'UNASSIGNED' || cleanIp === 'DRAFT' || cleanIp === 'NO IP';

  const patientName =
    formData?.patientName ||
    formData?.name ||
    formData?.patName ||
    '';

  if (existingId) {
    // Update existing record in-place
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
      records[idx] = updated;
      localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(records));
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

  // Prepend new record (most recent first)
  records.unshift(newRecord);
  localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(records));
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
