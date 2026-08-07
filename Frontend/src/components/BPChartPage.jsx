import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  Printer,
  Save,
  CheckCircle2,
  FolderCheck,
  FileEdit,
  XCircle
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'bp_chart';

const getCurrentDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// All 24 hourly time options mapping (6 AM to 5 AM) with explicit chronological timeRank
const allTimeOptions = [
  { key: '6_AM', label: '6:00 AM', period: 'Day', hour: '6 AM', timeRank: 0, sIdx: 0 },
  { key: '7_AM', label: '7:00 AM', period: 'Day', hour: '7 AM', timeRank: 1, sIdx: 0 },
  { key: '8_AM', label: '8:00 AM', period: 'Day', hour: '8 AM', timeRank: 2, sIdx: 0 },
  { key: '9_AM', label: '9:00 AM', period: 'Day', hour: '9 AM', timeRank: 3, sIdx: 0 },
  { key: '10_AM', label: '10:00 AM', period: 'Day', hour: '10 AM', timeRank: 4, sIdx: 0 },
  { key: '11_AM', label: '11:00 AM', period: 'Day', hour: '11 AM', timeRank: 5, sIdx: 1 },
  { key: '12_PM', label: '12:00 PM', period: 'Day', hour: '12 PM', timeRank: 6, sIdx: 1 },
  { key: '1_PM', label: '1:00 PM', period: 'Day', hour: '1 PM', timeRank: 7, sIdx: 1 },
  { key: '2_PM', label: '2:00 PM', period: 'Day', hour: '2 PM', timeRank: 8, sIdx: 1 },
  { key: '3_PM', label: '3:00 PM', period: 'Day', hour: '3 PM', timeRank: 9, sIdx: 2 },
  { key: '4_PM', label: '4:00 PM', period: 'Day', hour: '4 PM', timeRank: 10, sIdx: 2 },
  { key: '5_PM', label: '5:00 PM', period: 'Day', hour: '5 PM', timeRank: 11, sIdx: 2 },
  { key: '6_PM', label: '6:00 PM', period: 'Day', hour: '6 PM', timeRank: 12, sIdx: 2 },
  { key: '7_PM', label: '7:00 PM', period: 'Night', hour: '7 PM', timeRank: 13, sIdx: 3 },
  { key: '8_PM', label: '8:00 PM', period: 'Night', hour: '8 PM', timeRank: 14, sIdx: 3 },
  { key: '9_PM', label: '9:00 PM', period: 'Night', hour: '9 PM', timeRank: 15, sIdx: 3 },
  { key: '10_PM', label: '10:00 PM', period: 'Night', hour: '10 PM', timeRank: 16, sIdx: 3 },
  { key: '11_PM', label: '11:00 PM', period: 'Night', hour: '11 PM', timeRank: 17, sIdx: 4 },
  { key: '12_AM', label: '12:00 AM', period: 'Night', hour: '12 AM', timeRank: 18, sIdx: 4 },
  { key: '1_AM', label: '1:00 AM', period: 'Night', hour: '1 AM', timeRank: 19, sIdx: 4 },
  { key: '2_AM', label: '2:00 AM', period: 'Night', hour: '2 AM', timeRank: 20, sIdx: 4 },
  { key: '3_AM', label: '3:00 AM', period: 'Night', hour: '3 AM', timeRank: 21, sIdx: 5 },
  { key: '4_AM', label: '4:00 AM', period: 'Night', hour: '4 AM', timeRank: 22, sIdx: 5 },
  { key: '5_AM', label: '5:00 AM', period: 'Night', hour: '5 AM', timeRank: 23, sIdx: 5 },

  // Backward compatibility for legacy keys
  { key: 'Day_10', label: '10:00 AM', period: 'Day', hour: '10 AM', timeRank: 4, sIdx: 0 },
  { key: 'Day_2', label: '2:00 PM', period: 'Day', hour: '2 PM', timeRank: 8, sIdx: 1 },
  { key: 'Day_6', label: '6:00 PM', period: 'Day', hour: '6 PM', timeRank: 12, sIdx: 2 },
  { key: 'Night_10', label: '10:00 PM', period: 'Night', hour: '10 PM', timeRank: 16, sIdx: 3 },
  { key: 'Night_2', label: '2:00 AM', period: 'Night', hour: '2 AM', timeRank: 20, sIdx: 4 },
  { key: 'Night_6', label: '6:00 AM', period: 'Night', hour: '6 AM', timeRank: 0, sIdx: 5 },
];



export default function BPChartPage({ onNavigate, editData, editRecordId }) {
  // Patient Details State
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    doa: '',
    ward: '',
    bedNo: ''
  });

  // Entry Form State
  const [entry, setEntry] = useState({
    date: getCurrentDate(),
    timeSlot: '6_AM',
    bp: '',
    ivf: '',
    ngOral: '',
    totalIntake: '',
    urine: '',
    bowel: '',
    drain: '',
    totalOuttake: ''
  });

  const [errors, setErrors] = useState({});

  // Date Columns State — starts empty, populated when user adds readings
  const [dates, setDates] = useState(['', '', '', '']);

  // Plotted Readings List — starts empty (blank slate)
  const [readings, setReadings] = useState([]);

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const tableRef = useRef(null);
  const [svgLines, setSvgLines] = useState([]);
  const [svgDots, setSvgDots] = useState([]);
  const [slotHours, setSlotHours] = useState({});

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = data[key] ?? '';
    }
    return sanitized;
  };

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(p => ({ ...p, ...sanitizeFormData(editData.patient) }));
      if (editData.entry) setEntry(e => ({ ...e, ...sanitizeFormData(editData.entry) }));
      if (editData.dates) {
        const d = [...editData.dates];
        while (d.length < 4) d.push('');
        setDates(d);
      }
      if (editData.readings) setReadings(editData.readings);
      if (editData.slotHours) setSlotHours(editData.slotHours);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.entry) setEntry(e => ({ ...e, ...sanitizeFormData(saved.entry), date: getCurrentDate() }));
        if (saved.dates) {
          const d = [...saved.dates];
          while (d.length < 3) d.push('');
          setDates(d);
        }
        if (saved.readings) setReadings(saved.readings);
        if (saved.slotHours) setSlotHours(saved.slotHours);
      }
    }
  }, [editData, editRecordId]);

  // Auto-sync dropdown time selection to graph header slot
  useEffect(() => {
    if (entry.timeSlot && entry.date) {
      const formattedDate = formatDateString(entry.date);
      let dIdx = dates.indexOf(formattedDate);
      if (dIdx === -1) {
        dIdx = dates.findIndex(d => d === '');
        if (dIdx === -1) dIdx = dates.length;

        setDates((prevDates) => {
          const nextDates = [...prevDates];
          if (!nextDates.includes(formattedDate)) {
            const emptyIdx = nextDates.findIndex(d => d === '');
            if (emptyIdx !== -1) {
              nextDates[emptyIdx] = formattedDate;
            } else {
              nextDates.push(formattedDate);
            }
          }
          return nextDates;
        });
      }
      const slotObj = allTimeOptions.find((s) => s.key === entry.timeSlot);
      if (slotObj) {
        setSlotHours((prev) => ({
          ...prev,
          [`${dIdx}_${slotObj.sIdx}`]: slotObj.hour || slotObj.label
        }));
      }
    }
  }, [entry.timeSlot, entry.date]);

  // Auto-save to localStorage on every change (draft recovery)
  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, entry, dates, readings, slotHours });
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || readings.length > 2;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'BP Chart', patient, { patient, entry, dates, readings, slotHours }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, entry, dates, readings, slotHours, recordId]);



  // Dynamic slots logic is handled via useMemo below
  // Temp (°F): one degree per 5 rows (every 10 pulse units, anchored at pulse=210 → 106°F)
  // Resp:      linear with pulse for pulse 40–90 (Resp = pulse - 30)
  const yAxisRows = (() => {
    const rows = [];
    for (let p = 200; p >= 40; p -= 2) {
      rows.push({
        val: p,
        showLabel: p % 10 === 0
      });
    }
    return rows;
  })();

  // Total rows count (100)
  const TOTAL_ROWS = yAxisRows.length;
  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setPatient(prev => ({
        ...prev,
        name: found.patientName || prev.name,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bedNo || prev.bed || '',
        doa: found.doa || prev.doa
      }));
      setToastMsg('Patient details auto-filled');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => {
    triggerAutofill(e.target.value);
  };

  // Core engine: Sorts all time entries for a given date chronologically
  // and reassigns boxes (sIdx 0-2 for Day, 3-5 for Night) in order.
  // Returns { sortedReadings, newSlotHours } — never mutates values, only positions.
  const applyChronologicalSort = (allReadings, targetDIdx, newSlotHours) => {
    // Collect all unique timeKeys on this date
    const uniqueTimes = new Map();
    (allReadings || []).forEach((r) => {
      if (r.dIdx === targetDIdx && r.timeKey) {
        if (!uniqueTimes.has(r.timeKey)) {
          const opt = allTimeOptions.find(o => o.key === r.timeKey);
          if (opt) uniqueTimes.set(r.timeKey, opt);
        }
      }
    });

    // Split into Day / Night and sort chronologically by timeRank
    const dayTimes = Array.from(uniqueTimes.values())
      .filter(o => o.period === 'Day')
      .sort((a, b) => a.timeRank - b.timeRank);

    const nightTimes = Array.from(uniqueTimes.values())
      .filter(o => o.period === 'Night')
      .sort((a, b) => a.timeRank - b.timeRank);

    const numDaySlots = Math.max(3, dayTimes.length);
    const numNightSlots = Math.max(3, nightTimes.length);

    // Build the new timeKey → sIdx mapping
    const timeKeyToSIdx = {};
    dayTimes.forEach((opt, i) => { timeKeyToSIdx[opt.key] = i; });
    nightTimes.forEach((opt, i) => { timeKeyToSIdx[opt.key] = numDaySlots + i; });

    // Update slotHours headers in-place
    // First clear all existing slot keys for this date
    Object.keys(newSlotHours).forEach(k => {
      if (k.startsWith(`${targetDIdx}_`)) delete newSlotHours[k];
    });

    dayTimes.forEach((opt, i) => {
      newSlotHours[`${targetDIdx}_${i}`] = opt.hour || opt.label;
    });
    nightTimes.forEach((opt, i) => {
      newSlotHours[`${targetDIdx}_${numDaySlots + i}`] = opt.hour || opt.label;
    });

    // Reassign sIdx on readings for this date only
    const sortedReadings = (allReadings || []).map((r) => {
      if (r.dIdx === targetDIdx && r.timeKey && timeKeyToSIdx[r.timeKey] !== undefined) {
        return { ...r, sIdx: timeKeyToSIdx[r.timeKey] };
      }
      return r;
    });

    return { sortedReadings, newSlotHours };
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setEntry((prev) => ({ ...prev, [name]: value }));

    let errorMsg = '';
    if (name === 'bp' && value.trim() !== '') {
      const parts = value.split('/');
      if (parts.length === 2) {
        const sysVal = parseFloat(parts[0]);
        const diaVal = parseFloat(parts[1]);
        if (!isNaN(sysVal) && (sysVal < 40 || sysVal > 210)) {
          errorMsg = 'Sys BP must be 40–210';
        } else if (!isNaN(diaVal) && (diaVal < 40 || diaVal > 210)) {
          errorMsg = 'Dia BP must be 40–210';
        }
      } else if (parts.length > 2) {
        errorMsg = 'Format: Sys/Dia (e.g. 120/80)';
      } else {
        const val = parseFloat(value);
        if (!isNaN(val) && (val < 40 || val > 210)) {
          errorMsg = 'BP must be 40–210';
        }
      }
    }
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  // Map Temp value (95–106 °F) → row index (step-2 grid, anchored at pulse=210)
  // Temp 106 = row 0 (pulse 210), each 1°F = 5 rows
  const getBpRowIndex = (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return -1;
    const rIdx = Math.round((200 - v) / 2);
    return (rIdx >= 0 && rIdx <= 80) ? rIdx : -1;
  };

  // Convert Form Date 'YYYY-MM-DD' -> 'DD/MM/YY'
  const formatDateString = (rawDate) => {
    if (!rawDate) return '';
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      const yy = parts[0].slice(2);
      return `${parts[2]}/${parts[1]}/${yy}`;
    }
    return rawDate;
  };

  // Handle Form Submit: Plot / Add Reading
  const handleAddReading = (e) => {
    e.preventDefault();

    if (Object.values(errors).some(msg => msg !== '')) {
      setToastMsg('⚠ Please fix the validation errors before adding.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const formattedDate = formatDateString(entry.date);

    let updatedDates = [...dates];
    if (!updatedDates.includes(formattedDate)) {
      const emptyIdx = updatedDates.findIndex(d => d === '');
      if (emptyIdx !== -1) {
        updatedDates[emptyIdx] = formattedDate;
      } else {
        updatedDates.push(formattedDate);
      }
    }

    const getTimestamp = (dStr) => {
      if (!dStr) return Infinity;
      const [dd, mm, yy] = dStr.split('/');
      if (dd && mm && yy) {
        return new Date(2000 + parseInt(yy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10)).getTime();
      }
      return Infinity;
    };

    const sortedDates = [...updatedDates].sort((a, b) => getTimestamp(a) - getTimestamp(b));

    const oldToNewIdx = {};
    updatedDates.forEach((d, oldIdx) => {
      if (d) oldToNewIdx[oldIdx] = sortedDates.indexOf(d);
    });
    
    let emptyCounter = sortedDates.findIndex(d => !d);
    if (emptyCounter !== -1) {
      updatedDates.forEach((d, oldIdx) => {
        if (!d) oldToNewIdx[oldIdx] = emptyCounter++;
      });
    }

    const targetDIdx = sortedDates.indexOf(formattedDate);

    let currentReadings = readings.map(r => ({
      ...r,
      dIdx: oldToNewIdx[r.dIdx] !== undefined ? oldToNewIdx[r.dIdx] : r.dIdx
    }));

    let currentSlotHours = {};
    Object.keys(slotHours).forEach(key => {
      const [oldDIdxStr, sIdxStr] = key.split('_');
      const oldDIdx = parseInt(oldDIdxStr, 10);
      const newDIdx = oldToNewIdx[oldDIdx];
      if (newDIdx !== undefined) {
        currentSlotHours[`${newDIdx}_${sIdxStr}`] = slotHours[key];
      }
    });

    const slotObj = allTimeOptions.find(s => s.key === entry.timeSlot) || allTimeOptions[0];
    const newEntries = [];
    const placeholderSIdx = 0;

    const parsedBp = entry.bp ? entry.bp.trim() : '';
    let parsedSys = '';
    let parsedDia = '';
    if (parsedBp && parsedBp.includes('/')) {
      const parts = parsedBp.split('/');
      parsedSys = parts[0].trim();
      parsedDia = parts[1].trim();
    } else if (parsedBp) {
      parsedSys = parsedBp.trim();
    }

    const baseEntry = { date: formattedDate, dIdx: targetDIdx, sIdx: placeholderSIdx, timeKey: slotObj.key, timeLabel: slotObj.hour, timeRank: slotObj.timeRank };

    if (parsedSys || parsedDia) {
      const rIdxSys = parsedSys ? getBpRowIndex(parsedSys) : -1;
      const rIdxDia = parsedDia ? getBpRowIndex(parsedDia) : -1;
      if (rIdxSys !== -1 || rIdxDia !== -1) {
        newEntries.push({ ...baseEntry, id: Date.now(), type: 'bp', sys: parsedSys ? parseFloat(parsedSys) : null, dia: parsedDia ? parseFloat(parsedDia) : null, rIdxSys: rIdxSys !== -1 ? rIdxSys : null, rIdxDia: rIdxDia !== -1 ? rIdxDia : null });
      }
    }

    if (entry.ivf) newEntries.push({ ...baseEntry, id: Date.now() + 1, type: 'ivf', val: entry.ivf });
    if (entry.ngOral) newEntries.push({ ...baseEntry, id: Date.now() + 2, type: 'ngOral', val: entry.ngOral });
    if (entry.totalIntake) newEntries.push({ ...baseEntry, id: Date.now() + 3, type: 'totalIntake', val: entry.totalIntake });
    if (entry.urine) newEntries.push({ ...baseEntry, id: Date.now() + 4, type: 'urine', val: entry.urine });
    if (entry.bowel) newEntries.push({ ...baseEntry, id: Date.now() + 5, type: 'bowel', val: entry.bowel });
    if (entry.drain) newEntries.push({ ...baseEntry, id: Date.now() + 6, type: 'drain', val: entry.drain });
    if (entry.totalOuttake) newEntries.push({ ...baseEntry, id: Date.now() + 7, type: 'totalOuttake', val: entry.totalOuttake });

    if (newEntries.length > 0) {
      const newTypes = newEntries.map(e => e.type);
      const merged = [
        ...currentReadings.filter(r => !(r.dIdx === targetDIdx && r.timeKey === slotObj.key && newTypes.includes(r.type))),
        ...newEntries
      ];

      const { sortedReadings, newSlotHours } = applyChronologicalSort(merged, targetDIdx, currentSlotHours);

      setDates(sortedDates);
      setReadings(sortedReadings);
      setSlotHours(newSlotHours);
      setEntry(prev => ({ ...prev, bp: '', ivf: '', ngOral: '', totalIntake: '', urine: '', bowel: '', drain: '', totalOuttake: '' }));
      setErrors({});
      setToastMsg(`✔ Chart updated for ${formattedDate} (${slotObj.period} ${slotObj.hour})`);
      setTimeout(() => setToastMsg(''), 3000);
    } else {
      setToastMsg('⚠ Enter a valid BP value (e.g. 120/80).');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const hasValidIp = patient.ipNo && patient.ipNo.trim() !== '';
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const isDraftSave = !hasValidIp;
    
    const saved = upsertFormRecord(recordId, 'BP Chart', ip, { patient, entry, dates, readings }, null, isDraftSave);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    
    if (isDraftSave) {
      setToastMsg(recordId ? 'BP Chart draft updated successfully!' : 'BP Chart saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'BP Chart updated successfully!' : 'BP Chart saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 800);
  };

  const handleClearForm = () => {
    setPatient({ name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', doa: '', ward: '', bedNo: '' });
    setEntry({ date: getCurrentDate(), timeSlot: '6_AM', bp: '', ivf: '', ngOral: '', totalIntake: '', urine: '', bowel: '', drain: '', totalOuttake: '' });
    setDates(['', '', '', '']);
    setReadings([]);
    setSlotHours({});
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Form cleared.');
    setTimeout(() => setToastMsg(''), 2000);
  };


  // Update SVG connecting lines and dots using continuous interpolated positioning
  const updateOverlayCoordinates = () => {
    if (!tableRef.current) return;
    const containerEl = tableRef.current;
    const containerRect = containerEl.getBoundingClientRect();

    // ── Build a lookup of the y-center for every row using column 0, date 0, slot 0 ──
    const rowYCenters = [];
    for (let i = 0; i < 81; i++) {
      const refCell = containerEl.querySelector(`[data-cell="${i}_0_0"]`);
      if (refCell) {
        const r = refCell.getBoundingClientRect();
        // Anchor the points exactly to the top of the cell (the actual grid line) rather than the cell center.
        rowYCenters.push(r.top - containerRect.top);
      } else {
        rowYCenters.push(null);
      }
    }

    // ── Helper: get the x-center of a given date+slot column ──
    const getX = (dIdx, sIdx) => {
      const refCell = containerEl.querySelector(`[data-cell="0_${dIdx}_${sIdx}"]`);
      if (!refCell) return null;
      const r = refCell.getBoundingClientRect();
      return r.left + r.width / 2 - containerRect.left;
    };

    // ── Helper: interpolate y for a continuous row index ──
    // rowF = floating-point row (0=top, 85=bottom, step-2 grid)
    const interpY = (rowF) => {
      if (rowF == null) return null;
      const lo = Math.floor(rowF);
      const hi = Math.min(lo + 1, 80);
      const frac = rowF - lo;
      const y0 = rowYCenters[lo];
      const y1 = rowYCenters[hi];
      if (y0 == null || y1 == null) return null;
      return y0 + frac * (y1 - y0);
    };

    // ── Value → continuous row index (step-2 grid, 86 rows) ──
    // Pulse:  row = (210 - val) / 2        (rows 0–85)
    // Temp:   row = (106 - val) * 5        (rows 0–55, 5 rows per °F)
    // Resp:   row = (180 - val) / 2        (rows 60–85)
    // BP:     same as Pulse
    const toRowF = (type, val) => {
      const v = parseFloat(val);
      if (isNaN(v)) return null;
      switch (type) {
        case 'pulse': { const r = (210 - v) / 2; return (r >= 0 && r <= 85) ? r : null; }
        case 'temp': { const r = (106 - v) * 5; return (r >= 0 && r <= 55) ? r : null; }
        case 'resp': { const r = (180 - v) / 2; return (r >= 60 && r <= 85) ? r : null; }
        case 'bp': { const r = (210 - v) / 2; return (r >= 0 && r <= 85) ? r : null; }
        default: return null;
      }
    };

    const typeColors = {
      pulse: '#ec4899',
      temp: '#f59e0b',
      resp: '#3b82f6',
      bp: '#22c55e',
    };

    const dots = [];
    const lines = [];

    readings.forEach((r) => {
      const cx = getX(r.dIdx, r.sIdx);
      if (cx !== null && r.type === 'bp') {
        const ySys = r.rIdxSys !== null ? interpY(r.rIdxSys) : null;
        const yDia = r.rIdxDia !== null ? interpY(r.rIdxDia) : null;
        
        if (ySys !== null) {
          dots.push({ id: r.id + '_sys', cx, cy: ySys, val: r.sys, type: 'bp' });
        }
        if (yDia !== null) {
          dots.push({ id: r.id + '_dia', cx, cy: yDia, val: r.dia, type: 'bp' });
        }
        if (ySys !== null && yDia !== null) {
          lines.push({
            id: r.id + '_line',
            x1: cx, y1: ySys,
            x2: cx, y2: yDia,
            stroke: '#16a34a',
            strokeWidth: 2,
            type: 'bp'
          });
        }
      }
    });

    setSvgDots(dots);
    setSvgLines(lines);
  };

  useLayoutEffect(() => {
    updateOverlayCoordinates();
    window.addEventListener('resize', updateOverlayCoordinates);
    return () => window.removeEventListener('resize', updateOverlayCoordinates);
  }, [readings, dates]);

  const dateSlotsConfig = useMemo(() => {
    return dates.map((_, dIdx) => {
      const uniqueTimes = new Map();
      (readings || []).forEach((r) => {
        if (r.dIdx === dIdx && r.timeKey) {
          const opt = allTimeOptions.find(o => o.key === r.timeKey);
          if (opt) uniqueTimes.set(r.timeKey, opt);
        }
      });
      let dayCount = 0;
      let nightCount = 0;
      uniqueTimes.forEach(opt => {
        if (opt.period === 'Day') dayCount++;
        else nightCount++;
      });

      const numDaySlots = Math.max(3, dayCount);
      const numNightSlots = Math.max(3, nightCount);

      const slots = [];
      for (let i = 0; i < numDaySlots; i++) {
        slots.push({ key: `slot_${i}`, period: 'Day', slotIdx: i });
      }
      for (let i = 0; i < numNightSlots; i++) {
        slots.push({ key: `slot_${numDaySlots + i}`, period: 'Night', slotIdx: numDaySlots + i });
      }
      return { slots, numDaySlots, numNightSlots };
    });
  }, [dates, readings]);

  const timelineGroups = useMemo(() => {
    const groups = {};
    readings.forEach(r => {
      const key = `${r.date}_${r.timeKey}`;
      if (!groups[key]) {
        groups[key] = {
          date: r.date,
          timeLabel: r.timeLabel,
          timeKey: r.timeKey,
          timeRank: r.timeRank,
          bp: '', ivf: '', ngOral: '', totalIntake: '', urine: '', bowel: '', drain: '', totalOuttake: ''
        };
      }
      if (r.type === 'bp') {
        if (r.sys !== null && r.dia !== null) {
          groups[key].bp = `${r.sys}/${r.dia}`;
        } else if (r.sys !== null) {
          groups[key].bp = `${r.sys}`;
        } else if (r.dia !== null) {
          groups[key].bp = `${r.dia}`;
        }
      } else {
        groups[key][r.type] = r.rawVal !== undefined ? r.rawVal : r.val;
      }
    });
    return Object.values(groups).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timeRank - b.timeRank;
    });
  }, [readings]);

  const handleRemoveReadingGroup = (targetDate, targetTimeKey, targetTimeLabel) => {
    if (window.confirm(`Remove all readings at ${targetDate} ${targetTimeLabel}?`)) {
      setReadings(prev => prev.filter(r => !(r.date === targetDate && r.timeKey === targetTimeKey)));
    }
  };

  const handleRemoveDateColumn = (targetDIdx) => {
    if (window.confirm(`Delete all entries for ${dates[targetDIdx] || 'this column'}?`)) {
      let updatedReadings = readings.filter(r => r.dIdx !== targetDIdx);
      
      updatedReadings = updatedReadings.map(r => {
        if (r.dIdx > targetDIdx) {
          return { ...r, dIdx: r.dIdx - 1 };
        }
        return r;
      });

      const newDates = [...dates];
      newDates.splice(targetDIdx, 1);
      
      if (newDates.length < 4) {
        newDates.push('');
      }
      
      setDates(newDates);

      setSlotHours(prev => {
        const updated = {};
        Object.keys(prev).forEach(key => {
          const [dIdxStr, sIdxStr] = key.split('_');
          const dIdx = parseInt(dIdxStr, 10);
          if (dIdx < targetDIdx) {
            updated[key] = prev[key];
          } else if (dIdx > targetDIdx) {
            updated[`${dIdx - 1}_${sIdxStr}`] = prev[key];
          }
        });
        return updated;
      });
    }
  };

  return (
    <div className="vitals-chart-page-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Row */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Vitals Chart & Graphic Recording</h2>
        <div className="action-btns-group">
       
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
         
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Vitals Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Vitals Sheet Container */}
      <div className="vitals-card-container">
        <div className="inner-vitals-form-box">

          {/* Top Kannada Header */}
          <div className="form-top-kannada">ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಆಸ್ಪತ್ರೆ</div>

          {/* Hospital Header Block */}
          <div className="vitals-hospital-header">


            <div className="center-hospital-brand">
              <div className="hospital-logo-row">
                <div className="gs-square-logo">
                  <span className="gs-text">GS</span>
                </div>
                <div className="hospital-titles">
                  <h1 className="eng-title-large">GURUSHREE</h1>
                  <h2 className="eng-title-medium">HI-TECH MULTI SPECIALITY HOSPITAL</h2>
                  <p className="eng-tagline">A touch can instill faith</p>
                </div>
              </div>
            </div>

            <div className="header-vitals-title">
              B P CHART
            </div>
          </div>

          {/* Subtitle Banner */}
          <div className="vitals-sub-banner">
            TEMPERATURE, PULSE & RESPIRATION RATE CHART
          </div>

          {/* Patient Details Table */}
          <table className="mint-patient-info-table" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td colSpan={2} className="cell-patient-name">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Name of the Patient :</span>
                    <input
                      type="text"
                      name="name"
                      value={patient.name}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-age">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Age :</span>
                    <input
                      type="text"
                      name="age"
                      value={patient.age}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-sex">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Sex :</span>
                    <select
                      name="sex"
                      value={patient.sex}
                      onChange={handlePatientChange}
                      className="info-select-plain"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="cell-uhid">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input
                      type="text"
                      name="uhidNo"
                      value={patient.uhidNo}
                      onChange={handlePatientChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-ipno">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">IP No. :</span>
                    <input
                      type="text"
                      name="ipNo"
                      value={patient.ipNo}
                      onChange={handlePatientChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-doa">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">DOA :</span>
                    <input
                      type="text"
                      name="doa"
                      value={patient.doa}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={2} className="cell-ward">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Ward :</span>
                    <input
                      type="text"
                      name="ward"
                      value={patient.ward}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={2} className="cell-bed">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Bed No. :</span>
                    <input
                      type="text"
                      name="bedNo"
                      value={patient.bedNo}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ENTRY CARD CONTAINER (ONLY Vitals Form Inputs) */}
          <div className="no-print vital-entry-card-box">
            <form onSubmit={handleAddReading}>
              <div className="entry-grid-row-6" style={{ gridTemplateColumns: '1.3fr 0.8fr 0.8fr 0.8fr 1fr 1fr' }}>
                <div className="entry-field-group">
                  <label className="entry-label">Date</label>
                  <input
                    type="date" max={getCurrentDate()}
                    name="date"
                    value={entry.date}
                    onChange={handleEntryChange}
                    className="entry-input"
                  />
                </div>
                <div className="entry-field-group">
                  <label className="entry-label">Time</label>
                  <select
                    name="timeSlot"
                    value={entry.timeSlot}
                    onChange={handleEntryChange}
                    className="entry-select"
                  >
                    <option value="6_AM">6:00 AM</option>
                    <option value="7_AM">7:00 AM</option>
                    <option value="8_AM">8:00 AM</option>
                    <option value="9_AM">9:00 AM</option>
                    <option value="10_AM">10:00 AM</option>
                    <option value="11_AM">11:00 AM</option>
                    <option value="12_PM">12:00 PM</option>
                    <option value="1_PM">1:00 PM</option>
                    <option value="2_PM">2:00 PM</option>
                    <option value="3_PM">3:00 PM</option>
                    <option value="4_PM">4:00 PM</option>
                    <option value="5_PM">5:00 PM</option>
                    <option value="6_PM">6:00 PM</option>
                    <option value="7_PM">7:00 PM</option>
                    <option value="8_PM">8:00 PM</option>
                    <option value="9_PM">9:00 PM</option>
                    <option value="10_PM">10:00 PM</option>
                    <option value="11_PM">11:00 PM</option>
                    <option value="12_AM">12:00 AM</option>
                    <option value="1_AM">1:00 AM</option>
                    <option value="2_AM">2:00 AM</option>
                    <option value="3_AM">3:00 AM</option>
                    <option value="4_AM">4:00 AM</option>
                    <option value="5_AM">5:00 AM</option>
                  </select>
                </div>
                <div className="entry-field-group">
                  <label className="entry-label" style={{ color: '#22c55e', fontWeight: 700 }}>BP (mmHg)</label>
                  <input type="text" name="bp" value={entry.bp || ''} onChange={handleEntryChange} placeholder="120/80" className="entry-input" />
                  {errors.bp && <span style={{ color: '#ef4444', fontSize: '10.5px', marginTop: '2px', fontWeight: 600 }}>{errors.bp}</span>}
                </div>
                <div className="entry-field-group">
                  <label className="entry-label">IVF</label>
                  <input type="text" name="ivf" value={entry.ivf || ''} onChange={handleEntryChange} className="entry-input" />
                </div>
                <div className="entry-field-group">
                  <label className="entry-label">NG/Oral</label>
                  <input type="text" name="ngOral" value={entry.ngOral || ''} onChange={handleEntryChange} className="entry-input" />
                </div>
                <div className="entry-field-group">
                  <label className="entry-label" style={{ fontWeight: 700 }}>Total Intake</label>
                  <input type="text" name="totalIntake" value={entry.totalIntake || ''} onChange={handleEntryChange} className="entry-input" style={{ backgroundColor: '#f1f5f9' }} />
                </div>
                  <div className="entry-field-group">
                  <label className="entry-label" style={{ fontWeight: 700 }}>Total Output</label>
                  <input type="text" name="totalOuttake" value={entry.totalOuttake || ''} onChange={handleEntryChange} className="entry-input" style={{ backgroundColor: '#f1f5f9' }} />
                </div>
                <div className="entry-field-group">
                  <label className="entry-label">Urine</label>
                  <input type="text" name="urine" value={entry.urine || ''} onChange={handleEntryChange} className="entry-input" />
                </div>
                <div className="entry-field-group">
                  <label className="entry-label">Bowel</label>
                  <input type="text" name="bowel" value={entry.bowel || ''} onChange={handleEntryChange} className="entry-input" />
                </div>
                <div className="entry-field-group">
                  <label className="entry-label">Drain</label>
                  <input type="text" name="drain" value={entry.drain || ''} onChange={handleEntryChange} className="entry-input" />
                </div>

                <div className="entry-field-group" style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 2' }}>
                  <button type="submit" className="btn-plot-reading" style={{ width: '100%', height: '34px', margin: 0, marginTop: '22px' }}>
                     Add Reading
                  </button>
                </div>
              </div>
            </form>
          </div>


          {/* Vitals Graph Grid Table Container with SVG Overlay */}
          <div className="vitals-grid-table-container" ref={tableRef}>

            {/* SVG Connecting Lines & Plotted Dots Overlay */}
            <svg className="vitals-svg-canvas">
              {svgLines.map((line) => (
                <line
                  key={line.id}
                  x1={line.x1} y1={line.y1}
                  x2={line.x2} y2={line.y2}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                />
              ))}
              {svgDots.map((dot) => (
                <g key={dot.id}>
                  <circle
                    cx={dot.cx} cy={dot.cy} r={4.5}
                    fill={
                      dot.type === 'pulse' ? '#ec4899' :
                        dot.type === 'temp' ? '#f59e0b' :
                          dot.type === 'resp' ? '#3b82f6' :
                            dot.type === 'bp' ? '#22c55e' : '#94a3b8'
                    }
                    stroke="#fff" strokeWidth={1.5}
                  />
                  <text
                    x={dot.cx}
                    y={dot.cy + 12}
                    fontSize="9.5px"
                    fontWeight="900"
                    fill={
                      dot.type === 'pulse' ? '#dc2626' :
                        dot.type === 'temp' ? '#0369a1' :
                          dot.type === 'resp' ? '#2563eb' :
                            dot.type === 'bp' ? '#16a34a' : '#334155'
                    }
                    textAnchor="middle"
                    style={{
                      pointerEvents: 'none',
                      textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
                    }}
                  >
                    {dot.val}
                  </text>
                </g>
              ))}
            </svg>

            <table className="vitals-sheet-table">
              <thead>
                {/* DATE Row */}
                <tr>
                  <th style={{ width: '100px', minWidth: '100px', maxWidth: '100px', fontWeight: 900, textTransform: 'uppercase', fontSize: 13, backgroundColor: '#e2e8f0', color: '#0f172a', letterSpacing: '1px', borderBottom: '1.5px solid #0f172a', borderRight: '1.5px solid #0f172a' }}>
                    DATE
                  </th>
                  {/* Dates */}
                  {dates.map((d, dIdx) => {
                    const { slots } = dateSlotsConfig[dIdx] || { slots: [] };
                    return (
                      <th key={dIdx} colSpan={slots.length || 6} className="th-date-val" style={{ borderBottom: '1.5px solid #0f172a', position: 'relative' }}>
                        <input
                          type="text"
                          value={d}
                          onChange={(e) => {
                            const updated = [...dates];
                            updated[dIdx] = e.target.value;
                            setDates(updated);
                          }}
                          className="date-grid-input"
                          style={{ fontSize: 12, fontWeight: 900 }}
                        />
                        {d && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDateColumn(dIdx)}
                            style={{
                              position: 'absolute',
                              right: '4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Clear Column"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>

                {/* Day / Night Row */}
                <tr>
                  <th style={{ width: '100px', minWidth: '100px', maxWidth: '100px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, backgroundColor: '#f1f5f9', color: '#0f172a', letterSpacing: '1px', borderBottom: '1.5px solid #0f172a', borderRight: '1.5px solid #0f172a' }}>
                    TIME
                  </th>
                  {dates.map((_, dIdx) => {
                    const { numDaySlots, numNightSlots } = dateSlotsConfig[dIdx] || { numDaySlots: 3, numNightSlots: 3 };
                    return (
                      <React.Fragment key={dIdx}>
                        <th colSpan={numDaySlots} className={`th-day-night day-col vdivider-day-night`} style={{ borderBottom: '1.5px solid #0f172a' }}>Day</th>
                        <th colSpan={numNightSlots} className={`th-day-night night-col${dIdx < dates.length - 1 ? ' vdivider-date' : ''}`} style={{ borderBottom: '1.5px solid #0f172a' }}>Night</th>
                      </React.Fragment>
                    );
                  })}
                </tr>

                {/* Hour Sub-columns dynamically populated from dropdown entries */}
                <tr>
                  <th style={{ width: '100px', minWidth: '100px', maxWidth: '100px', fontSize: 11, fontWeight: 800, color: '#0f172a', verticalAlign: 'middle', borderBottom: '2px solid #0f172a', borderRight: '1.5px solid #0f172a', backgroundColor: '#e2e8f0', letterSpacing: '0.5px' }}>BP (mmHg)</th>
                  {dates.map((_, dIdx) => {
                    const { slots, numDaySlots } = dateSlotsConfig[dIdx] || { slots: [], numDaySlots: 3 };
                    return (
                      <React.Fragment key={dIdx}>
                        {slots.map((slot, i) => {
                          const displayHour = slotHours[`${dIdx}_${slot.slotIdx}`] || '';
                          const isLastDay = slot.period === 'Day' && i === numDaySlots - 1;
                          const isLastNight = slot.period === 'Night' && i === slots.length - 1;
                          return (
                            <th
                              key={slot.key + dIdx}
                              className={[
                                'th-hour-slot',
                                isLastDay ? 'vdivider-day-night' : '',
                                isLastNight && dIdx < dates.length - 1 ? 'vdivider-date' : ''
                              ].join(' ').trim()}
                              style={{ borderBottom: '2px solid #0f172a' }}
                            >
                              <input
                                type="text"
                                value={displayHour}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSlotHours(prev => ({
                                    ...prev,
                                    [`${dIdx}_${slot.slotIdx}`]: val
                                  }));
                                }}
                                placeholder=""
                                className="hour-slot-input"
                                style={{
                                  width: '100%',
                                  border: 'none',
                                  background: 'transparent',
                                  textAlign: 'center',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  color: '#0f172a',
                                  outline: 'none',
                                  padding: 0
                                }}
                              />
                            </th>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {yAxisRows.map((yRow, yIdx) => {
                  const isMajor = yRow.showLabel; // multiples of 10
                  return (
                    <tr key={yIdx} className={isMajor ? 'vitals-major-row' : 'vitals-minor-row'}>
                      {/* BP axis */}
                      <td style={{ width: '100px', minWidth: '100px', maxWidth: '100px', borderRight: '1.5px solid #0f172a', textAlign: 'center', backgroundColor: isMajor ? '#f1f5f9' : 'transparent', borderBottom: isMajor ? '1px solid #cbd5e1' : '1px solid #e2e8f0' }}>
                        {isMajor && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: '7.5px' }}>
                            {yRow.val}
                          </span>
                        )}
                      </td>

                      {/* Grid cells */}
                      {dates.map((_, dIdx) => {
                        const { slots, numDaySlots } = dateSlotsConfig[dIdx] || { slots: [], numDaySlots: 3 };
                        return (
                          <React.Fragment key={dIdx}>
                            {slots.map((slot, i) => {
                              const isLastDay = slot.period === 'Day' && i === numDaySlots - 1;
                              const isLastNight = slot.period === 'Night' && i === slots.length - 1;
                              return (
                                <td
                                  key={slot.key + dIdx}
                                  data-cell={`${yIdx}_${dIdx}_${slot.slotIdx}`}
                                  className={[
                                    'vitals-cell-slot',
                                    isLastDay ? 'vdivider-day-night' : '',
                                    isLastNight && dIdx < dates.length - 1 ? 'vdivider-date' : ''
                                  ].join(' ').trim()}
                                  title={`Pulse ${yRow.pulse}`}
                                />
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

          {/* Legend Guide */}
          <div className="vitals-legend-guide">
            <span className="legend-item"><span style={{ color: '#0f172a', fontSize: 16 }}>●</span> Blood Pressure (mmHg)</span>
          </div>

          {/* Entered Readings Timeline */}
          {readings.length > 0 && (
            <div className="readings-timeline-container" style={{ marginTop: '40px', borderTop: '2px solid #0f172a', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileEdit size={16} color="#0f172a" />
                <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ENTERED READINGS TIMELINE</span>
              </div>
              <table className="vitals-sheet-table" style={{ width: '100%', border: '1.5px solid #0f172a' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '8px', fontWeight: 800, width: '11%' }}>Date</th>
                    <th style={{ padding: '8px', fontWeight: 800, width: '8%' }}>Time</th>
                    <th style={{ padding: '8px', fontWeight: 800, color: '#16a34a' }}>BP (mmHg)</th>
                    <th style={{ padding: '8px', fontWeight: 800 }}>IVF</th>
                    <th style={{ padding: '8px', fontWeight: 800 }}>NG/Oral</th>
                    <th style={{ padding: '8px', fontWeight: 800 }}>Total Intake</th>
                    <th style={{ padding: '8px', fontWeight: 800 }}>Total Output</th>
                    <th style={{ padding: '8px', fontWeight: 800 }}>Urine</th>
                    <th style={{ padding: '8px', fontWeight: 800 }}>Bowel</th>
                    <th style={{ padding: '8px', fontWeight: 800 }}>Drain</th>
                    
                    <th style={{ padding: '8px', fontWeight: 800 }} className="no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineGroups.map((group, gIdx) => (
                    <tr key={gIdx}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{group.date}</td>
                      <td style={{ padding: '8px', fontWeight: 800 }}>{group.timeLabel}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{group.bp || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{group.ivf || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{group.ngOral || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 800 }}>{group.totalIntake || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 800 }}>{group.totalOuttake || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{group.urine || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{group.bowel || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{group.drain || '—'}</td>
                      <td style={{ padding: '8px' }} className="no-print">
                        <button
                          type="button"
                          onClick={() => handleRemoveReadingGroup(group.date, group.timeKey, group.timeLabel)}
                          style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
        
        {/* Action Row */}
        <div className="mint-action-controls no-print" style={{ marginTop: '20px' }}>
          <div className="bottom-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-form-clear-action" onClick={handleClearForm} style={{ padding: '9px 16px', background: '#cbd5e1', border: '1px solid #94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600', color: '#1e293b' }}>
              <span>Clear Form</span>
            </button>
            <button type="button" className="btn-mint-clear" onClick={handleSave}>
              <Save size={14} />
              <span>Save Chart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
