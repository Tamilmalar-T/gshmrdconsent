import { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Eye,
  Filter,
  Camera,
  Upload,
  User as UserIcon,
  X,
  Layers,
  PenTool
} from 'lucide-react';

const STORAGE_KEY = 'masters_nurses';

const DEFAULT_DEPARTMENTS = [
  'Nursing Administration',
  'ICU / Critical Care',
  'Emergency & Casualty',
  'General Ward',
  'Operation Theatre (OT)',
  'Labor & Delivery',
  'Pediatrics Ward',
  'Cardiology',
  'General Medicine',
  'General Surgery',
  'Orthopedics',
  'Gynecology'
];

const DEFAULT_DESIGNATIONS = [
  'Head Nurse',
  'Nursing Supervisor',
  'Charge Nurse',
  'Senior Staff Nurse',
  'Staff Nurse',
  'ICU Nurse',
  'OT Nurse',
  'Junior Nurse',
  'ANM Nurse'
];

const DEFAULT_QUALIFICATIONS = [
  'B.Sc Nursing',
  'GNM',
  'Post Basic B.Sc Nursing',
  'M.Sc Nursing',
  'ANM',
  'Diploma in Nursing Administration',
  'Critical Care Nursing Certificate'
];

const DEFAULT_BRANCHES = [
  'Main Branch - Central',
  'NANDHU MEDICAL CENTRE',
  'City Branch - North',
  'Gurushree Specialty Annex'
];

const DEFAULT_FLOORS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  '5th Floor',
  'ICU Floor',
  'Basement'
];

const DEFAULT_TITLES = ['Ms.', 'Mrs.', 'Mr.', 'Miss', 'Sister', 'Brother'];
const DEFAULT_GENDERS = ['Female', 'Male', 'Other'];

const INITIAL_NURSES = [
  { 
    nurseId: 'NUR001', 
    title: 'Ms.',
    nurseName: 'Alice Smith', 
    gender: 'Female',
    mobileNumber: '9876543221', 
    contact: '9876543221', 
    department: 'Nursing Administration', 
    designation: 'Head Nurse', 
    qualification: 'M.Sc Nursing', 
    hospitalBranch: 'Main Branch - Central', 
    floor: '1st Floor',
    status: 'Active', 
    photo: '',
    signatureImage: '' 
  },
  { 
    nurseId: 'NUR002', 
    title: 'Mr.',
    nurseName: 'Bob Johnson', 
    gender: 'Male',
    mobileNumber: '9876543222', 
    contact: '9876543222', 
    department: 'ICU / Critical Care', 
    designation: 'Staff Nurse', 
    qualification: 'B.Sc Nursing', 
    hospitalBranch: 'Main Branch - Central', 
    floor: '2nd Floor',
    status: 'Active', 
    photo: '',
    signatureImage: '' 
  },
];

export default function NurseMasterPage() {
  const [form, setForm] = useState({
    nurseId: '',
    title: 'Ms.',
    nurseName: '',
    gender: 'Female',
    mobileNumber: '',
    department: 'General Ward',
    designation: 'Staff Nurse',
    qualification: 'B.Sc Nursing',
    hospitalBranch: 'Main Branch - Central',
    floor: 'Ground Floor',
    status: 'Active',
    photo: '',
    signatureImage: ''
  });

  const [nurses, setNurses] = useState([]);
  const [titles, setTitles] = useState(DEFAULT_TITLES);
  const [genders, setGenders] = useState(DEFAULT_GENDERS);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [designations, setDesignations] = useState(DEFAULT_DESIGNATIONS);
  const [qualifications, setQualifications] = useState(DEFAULT_QUALIFICATIONS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [floors, setFloors] = useState(DEFAULT_FLOORS);

  const [editingNurseId, setEditingNurseId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [viewRecord, setViewRecord] = useState(null);

  // Webcam Modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Signature Draw Modal
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Load masters from localStorage & backend fallback
  useEffect(() => {
    // 1. Departments
    const savedDepts = localStorage.getItem('masters_departments');
    if (savedDepts) {
      try {
        const parsed = JSON.parse(savedDepts);
        const activeNames = parsed.filter(d => d.status === 'Active').map(d => d.deptName);
        if (activeNames.length > 0) setDepartments(Array.from(new Set([...activeNames, ...DEFAULT_DEPARTMENTS])));
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Branches
    const savedBranches = localStorage.getItem('masters_hospital_branch_records');
    if (savedBranches) {
      try {
        const parsed = JSON.parse(savedBranches);
        const bNames = parsed.map(b => b.branchName || b.hospitalName).filter(Boolean);
        if (bNames.length > 0) setBranches(Array.from(new Set([...bNames, ...DEFAULT_BRANCHES])));
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Floors
    const savedFloors = localStorage.getItem('masters_floors');
    if (savedFloors) {
      try {
        const parsed = JSON.parse(savedFloors);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fNames = parsed.filter(f => f.isActive !== 'No').map(f => f.floorName || f.floorCode);
          if (fNames.length > 0) setFloors(Array.from(new Set([...fNames, ...DEFAULT_FLOORS])));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 4. Register Master options (Title, Designation, Qualification, Department, Gender)
    fetch('http://localhost:5000/api/patient-register-master')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const activeMaster = data.data.filter(opt => opt.status === 'Active');
          const masterTitles = activeMaster.filter(o => o.category?.toLowerCase() === 'title').map(o => o.label);
          const masterGenders = activeMaster.filter(o => o.category?.toLowerCase() === 'gender').map(o => o.label);
          const masterDesigs = activeMaster.filter(o => o.category?.toLowerCase() === 'designation').map(o => o.label);
          const masterQuals = activeMaster.filter(o => o.category?.toLowerCase() === 'qualification').map(o => o.label);
          const masterDepts = activeMaster.filter(o => o.category?.toLowerCase() === 'department').map(o => o.label);

          if (masterTitles.length > 0) setTitles(Array.from(new Set([...masterTitles, ...DEFAULT_TITLES])));
          if (masterGenders.length > 0) setGenders(Array.from(new Set([...masterGenders, ...DEFAULT_GENDERS])));
          if (masterDesigs.length > 0) setDesignations(Array.from(new Set([...masterDesigs, ...DEFAULT_DESIGNATIONS])));
          if (masterQuals.length > 0) setQualifications(Array.from(new Set([...masterQuals, ...DEFAULT_QUALIFICATIONS])));
          if (masterDepts.length > 0) setDepartments(Array.from(new Set([...masterDepts, ...DEFAULT_DEPARTMENTS])));
        }
      })
      .catch(() => {});
  }, []);

  // Load from localStorage or seed initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map(item => ({
          ...item,
          title: item.title || (item.gender === 'Male' ? 'Mr.' : 'Ms.'),
          gender: item.gender || 'Female',
          mobileNumber: item.mobileNumber || item.contact || '',
          department: item.department || DEFAULT_DEPARTMENTS[0],
          designation: item.designation || DEFAULT_DESIGNATIONS[0],
          qualification: item.qualification || DEFAULT_QUALIFICATIONS[0],
          hospitalBranch: item.hospitalBranch || item.branch || DEFAULT_BRANCHES[0],
          floor: item.floor || DEFAULT_FLOORS[0],
          photo: item.photo || ''
        }));
        setNurses(migrated);
      } catch (e) {
        setNurses(INITIAL_NURSES);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NURSES));
      setNurses(INITIAL_NURSES);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setNurses(updatedList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalVal = value;
    if (name === 'nurseName' && typeof value === 'string') {
      finalVal = value.toUpperCase();
    }

    if (name === 'title') {
      const normalizedTitle = value.replace(/\./g, '').trim().toLowerCase();
      let autoGender = '';
      if (normalizedTitle === 'mr' || normalizedTitle === 'brother') {
        autoGender = 'Male';
      } else if (['ms', 'mrs', 'miss', 'sister'].includes(normalizedTitle)) {
        autoGender = 'Female';
      }

      setForm(prev => ({
        ...prev,
        title: value,
        ...(autoGender ? { gender: autoGender } : {})
      }));
      setErrorMsg('');
      return;
    }

    setForm((prev) => ({ ...prev, [name]: finalVal }));
    setErrorMsg('');
  };

  const handleSignatureFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, signatureImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Photo size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Camera Capture Modal Logic ---
  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Unable to access webcam. Please ensure camera permissions are allowed or upload an image file.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setForm(prev => ({ ...prev, photo: dataUrl }));
      stopCamera();
    }
  };

  // --- Signature Drawing Canvas Modal Logic ---
  const openSignatureCanvas = () => {
    setShowSignatureModal(true);
    setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 100);
  };

  const startDrawing = (e) => {
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignatureCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSignatureCanvas = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setForm(prev => ({ ...prev, signatureImage: dataUrl }));
      setShowSignatureModal(false);
    }
  };

  const handleClear = () => {
    setForm({
      nurseId: '',
      title: titles[0] || 'Ms.',
      nurseName: '',
      gender: 'Female',
      mobileNumber: '',
      department: departments[0] || 'General Ward',
      designation: designations[0] || 'Staff Nurse',
      qualification: qualifications[0] || 'B.Sc Nursing',
      hospitalBranch: branches[0] || 'Main Branch - Central',
      floor: floors[0] || 'Ground Floor',
      status: 'Active',
      photo: '',
      signatureImage: ''
    });
    setEditingNurseId(null);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!form.nurseId.trim()) {
      setErrorMsg('Nurse ID is required.');
      return;
    }
    if (!form.nurseName.trim()) {
      setErrorMsg('Nurse Full Name is required.');
      return;
    }

    const payload = {
      ...form,
      contact: form.mobileNumber || form.contact || ''
    };

    if (editingNurseId) {
      // Edit mode
      const updated = nurses.map((n) => n.nurseId === editingNurseId ? payload : n);
      saveToStorage(updated);
      setSuccessMsg(`Nurse "${form.nurseName}" updated successfully!`);
      handleClear();
    } else {
      // Add mode
      if (nurses.some((n) => n.nurseId.toLowerCase() === form.nurseId.toLowerCase())) {
        setErrorMsg(`Nurse ID "${form.nurseId}" already exists.`);
        return;
      }
      const updated = [...nurses, payload];
      saveToStorage(updated);
      setSuccessMsg(`Nurse "${form.nurseName}" added successfully!`);
      handleClear();
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (nurse) => {
    setForm({ 
      ...nurse,
      title: nurse.title || (nurse.gender === 'Male' ? 'Mr.' : 'Ms.'),
      gender: nurse.gender || 'Female',
      mobileNumber: nurse.mobileNumber || nurse.contact || '',
      department: nurse.department || departments[0] || 'General Ward',
      designation: nurse.designation || designations[0] || 'Staff Nurse',
      qualification: nurse.qualification || qualifications[0] || 'B.Sc Nursing',
      hospitalBranch: nurse.hospitalBranch || nurse.branch || branches[0] || 'Main Branch - Central',
      floor: nurse.floor || floors[0] || 'Ground Floor',
      photo: nurse.photo || ''
    });
    setEditingNurseId(nurse.nurseId);
    setErrorMsg('');
  };

  const handleDelete = (nurseId) => {
    if (window.confirm('Are you sure you want to delete this nurse?')) {
      const updated = nurses.filter((n) => n.nurseId !== nurseId);
      saveToStorage(updated);
      setSuccessMsg('Nurse deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingNurseId === nurseId) {
        handleClear();
      }
    }
  };

  const filteredNurses = nurses.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      (n.nurseName || '').toLowerCase().includes(q) ||
      (n.title || '').toLowerCase().includes(q) ||
      (n.gender || '').toLowerCase().includes(q) ||
      (n.nurseId || '').toLowerCase().includes(q) ||
      (n.designation || '').toLowerCase().includes(q) ||
      (n.department || '').toLowerCase().includes(q) ||
      (n.qualification || '').toLowerCase().includes(q) ||
      (n.hospitalBranch || '').toLowerCase().includes(q) ||
      (n.floor || '').toLowerCase().includes(q) ||
      (n.mobileNumber || n.contact || '').toLowerCase().includes(q);

    if (selectedDeptFilter !== 'All') {
      return matchesQuery && (n.department || '').toLowerCase() === selectedDeptFilter.toLowerCase();
    }
    return matchesQuery;
  });

  const renderForm = (isEditMode) => (
    <>
      {errorMsg && (
        <div className="alert-error-banner">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="pr-form-4col-grid">
          {/* Row 1 */}
          <div className="pr-field">
            <label className="pr-label">NURSE ID <span className="req-star">*</span></label>
            <input 
              type="text" 
              name="nurseId" 
              value={form.nurseId} 
              onChange={handleChange} 
              disabled={!!editingNurseId} 
              placeholder="e.g. NUR001" 
              className="pr-input" 
            />
          </div>

          <div className="pr-field" style={{ gridColumn: 'span 2' }}>
            <label className="pr-label">FULL NAME <span className="req-star">*</span></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                className="pr-select" 
                style={{ width: '90px', flexShrink: 0, fontWeight: '600' }}
                title="Title / Prefix"
              >
                {titles.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input 
                type="text" 
                name="nurseName" 
                value={form.nurseName} 
                onChange={handleChange} 
                placeholder="Nurse Full Name" 
                className="pr-input" 
                style={{ textTransform: 'uppercase' }} 
              />
            </div>
          </div>

          <div className="pr-field">
            <label className="pr-label">GENDER <span className="req-star">*</span></label>
            <select name="gender" value={form.gender} onChange={handleChange} className="pr-select">
              {genders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Row 2 */}
          <div className="pr-field">
            <label className="pr-label">MOBILE NUMBER</label>
            <input 
              type="text" 
              name="mobileNumber" 
              value={form.mobileNumber} 
              onChange={handleChange} 
              placeholder="10-digit phone number" 
              className="pr-input" 
            />
          </div>

          {/* Row 2 */}
          <div className="pr-field">
            <label className="pr-label">DEPARTMENT (Master)</label>
            <select name="department" value={form.department} onChange={handleChange} className="pr-select">
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="pr-field">
            <label className="pr-label">DESIGNATION (Master) <span className="req-star">*</span></label>
            <select name="designation" value={form.designation} onChange={handleChange} className="pr-select">
              {designations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="pr-field">
            <label className="pr-label">QUALIFICATION (Master)</label>
            <select name="qualification" value={form.qualification} onChange={handleChange} className="pr-select">
              {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div className="pr-field">
            <label className="pr-label">HOSPITAL BRANCH <span className="req-star">*</span></label>
            <select name="hospitalBranch" value={form.hospitalBranch} onChange={handleChange} className="pr-select">
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Row 3 */}
          <div className="pr-field">
            <label className="pr-label">FLOOR (Master)</label>
            <select name="floor" value={form.floor} onChange={handleChange} className="pr-select">
              {floors.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="pr-field">
            <label className="pr-label">STATUS <span className="req-star">*</span></label>
            <select name="status" value={form.status} onChange={handleChange} className="pr-select">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Row 4: Photo & Signature side-by-side */}
          {/* Photo Field */}
          <div className="pr-field" style={{ gridColumn: 'span 2' }}>
            <label className="pr-label">NURSE PHOTO</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#e0f2fe', color: '#0284c7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                <Upload size={14} /> Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </label>
              <button 
                type="button" 
                onClick={startCamera} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                <Camera size={14} /> Capture via Webcam
              </button>
              {form.photo && (
                <button type="button" onClick={() => setForm(p => ({ ...p, photo: '' }))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Clear</button>
              )}
            </div>
            {form.photo && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={form.photo} alt="Nurse Photo Preview" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }} />
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✓ Photo Ready</span>
              </div>
            )}
          </div>

          {/* Digital Signature - Placed right nearby Photo */}
          <div className="pr-field" style={{ gridColumn: 'span 2' }}>
            <label className="pr-label">DIGITAL SIGNATURE</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#fef3c7', color: '#d97706', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                <Upload size={14} /> Upload Image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSignatureFileChange} />
              </label>
              <button 
                type="button" 
                onClick={openSignatureCanvas} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                <PenTool size={14} /> Draw Signature
              </button>
              {form.signatureImage && (
                <button type="button" onClick={() => setForm(prev => ({ ...prev, signatureImage: '' }))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Clear</button>
              )}
            </div>
            {form.signatureImage && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={form.signatureImage} alt="Signature Preview" style={{ height: '32px', maxWidth: '120px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', backgroundColor: '#ffffff' }} />
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✓ Signature Attached</span>
              </div>
            )}
          </div>
        </div>

        <div className="pr-form-footer-actions">
          <button type="button" className="btn-pr-clear" onClick={handleClear}>Cancel / Clear</button>
          <button type="submit" className="btn-pr-register" style={{ backgroundColor: isEditMode ? '#6366f1' : '#0284c7' }}>
            {isEditMode ? 'Update Nurse Details' : '+ Save Nurse Record'}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="patient-register-container">
      
      {/* Toast Notifications */}
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">Nurse Master</h1>
          <p className="pr-sub-title">
            Configure and manage nursing staff profiles, designations, qualifications, departments, assigned floors, and photos.
          </p>
        </div>

        <div className="pr-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <Filter size={13} style={{ color: '#0284c7' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Dept:</span>
            <select 
              value={selectedDeptFilter} 
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '600', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            >
              <option value="All">All Departments ({nurses.length})</option>
              {departments.map(d => {
                const count = nurses.filter(n => (n.department || '').toLowerCase() === d.toLowerCase()).length;
                return <option key={d} value={d}>{d} ({count})</option>;
              })}
            </select>
          </div>

          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, ID, floor, qualification..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{filteredNurses.length} nurses</span>
          </div>
        </div>
      </div>

      {/* Add Form Card (Only shown if NOT editing) */}
      {!editingNurseId && (
        <div className="pr-card-box">
          <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7' }}>
            <UserPlus size={16} />
            <span>Add New Nurse</span>
          </div>
          <div className="pr-card-body">
            {renderForm(false)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingNurseId && (
        <div className="modal-overlay no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="pr-card-box" style={{ 
            width: '920px', maxWidth: '95vw', margin: 0, 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transform: 'translateY(-20px)'
          }}>
            <div className="pr-card-header-strip" style={{ backgroundColor: '#6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} />
                <span>Edit Nurse Details: {editingNurseId}</span>
              </div>
              <button 
                onClick={handleClear} 
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="pr-card-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {renderForm(true)}
            </div>
          </div>
        </div>
      )}

      {/* Registry Table Card */}
      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="pr-table-title" style={{ margin: 0 }}>Nurse Staff Registry</h3>
            <span className="pr-page-count">Showing {filteredNurses.length} of {nurses.length} Records</span>
          </div>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>PHOTO</th>
                <th>NURSE ID</th>
                <th>FULL NAME</th>
                <th>GENDER</th>
                <th>DESIGNATION</th>
                <th>DEPARTMENT</th>
                <th>FLOOR</th>
                <th>QUALIFICATION</th>
                <th>HOSPITAL BRANCH</th>
                <th>MOBILE NUMBER</th>
                <th>SIGNATURE</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredNurses.length === 0 ? (
                <tr>
                  <td colSpan={13} className="pr-empty-cell" style={{ textAlign: 'center', padding: '30px 10px' }}>
                    No nurses found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredNurses.map((nurse) => (
                  <tr key={nurse.nurseId}>
                    <td>
                      {nurse.photo ? (
                        <img src={nurse.photo} alt="Nurse Photo" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #0284c7' }} />
                      ) : (
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {(nurse.nurseName || 'N').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="font-bold-ip">{nurse.nurseId}</td>
                    <td className="font-semibold-name">{nurse.title ? `${nurse.title} ` : ''}{nurse.nurseName}</td>
                    <td>
                      <span style={{ fontWeight: '500', color: '#475569' }}>{nurse.gender || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{nurse.designation || '—'}</span>
                    </td>
                    <td>
                      <span style={{ color: '#0284c7', fontWeight: '600' }}>{nurse.department || '—'}</span>
                    </td>
                    <td>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                        {nurse.floor || '—'}
                      </span>
                    </td>
                    <td>{nurse.qualification || '—'}</td>
                    <td>{nurse.hospitalBranch || nurse.branch || '—'}</td>
                    <td>{nurse.mobileNumber || nurse.contact || '—'}</td>
                    <td>
                      {nurse.signatureImage ? (
                        <img 
                          src={nurse.signatureImage} 
                          alt="signature" 
                          style={{ height: '24px', maxWidth: '80px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '1px', backgroundColor: '#ffffff' }} 
                        />
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '10px' }}>No image</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-ins-sm ${nurse.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: nurse.status === 'Active' ? '#dcfce7' : '#fee2e2', color: nurse.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {nurse.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          title="View"
                          style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => setViewRecord(nurse)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          type="button" 
                          title="Edit"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleEditClick(nurse)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          type="button" 
                          title="Delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(nurse.nurseId)}
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
      </div>

      {/* VIEW RECORD MODAL */}
      {viewRecord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewRecord(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '600px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {viewRecord.photo ? (
                  <img src={viewRecord.photo} alt="Nurse Photo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                    {(viewRecord.nurseName || 'N').charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.title ? `${viewRecord.title} ` : ''}{viewRecord.nurseName}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>{viewRecord.designation} • {viewRecord.nurseId}</div>
                </div>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Nurse ID', value: viewRecord.nurseId },
                  { label: 'Title / Prefix', value: viewRecord.title },
                  { label: 'Full Name', value: viewRecord.nurseName },
                  { label: 'Gender', value: viewRecord.gender },
                  { label: 'Department', value: viewRecord.department },
                  { label: 'Designation', value: viewRecord.designation },
                  { label: 'Assigned Floor', value: viewRecord.floor },
                  { label: 'Qualification', value: viewRecord.qualification },
                  { label: 'Hospital Branch', value: viewRecord.hospitalBranch || viewRecord.branch },
                  { label: 'Mobile Number', value: viewRecord.mobileNumber || viewRecord.contact },
                  { label: 'Status', value: viewRecord.status, badge: true },
                ].map(({ label, value, badge }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
                    {badge ? (
                      <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: value === 'Active' ? '#dcfce7' : '#fee2e2', color: value === 'Active' ? '#15803d' : '#b91c1c' }}>{value}</span>
                    ) : (
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{value || '—'}</div>
                    )}
                  </div>
                ))}
              </div>
              {viewRecord.signatureImage && (
                <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Digital Signature</div>
                  <img src={viewRecord.signatureImage} alt="Signature" style={{ maxWidth: '100%', height: '50px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', padding: '2px' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WEBCAM CAMERA MODAL */}
      {showCameraModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '480px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Capture Nurse Photo</h3>
            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', height: '280px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={stopCamera} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button type="button" onClick={capturePhoto} style={{ padding: '8px 20px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} /> Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNATURE DRAWING CANVAS MODAL */}
      {showSignatureModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '520px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PenTool size={18} color="#d97706" /> Draw Digital Signature
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: 0, marginBottom: '12px' }}>Use mouse or touch screen to draw the nurse signature in the box below.</p>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', marginBottom: '16px' }}>
              <canvas 
                ref={canvasRef} 
                width={476} 
                height={180} 
                onMouseDown={startDrawing} 
                onMouseUp={stopDrawing} 
                onMouseLeave={stopDrawing} 
                onMouseMove={draw} 
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                style={{ cursor: 'crosshair', width: '100%', display: 'block' }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={clearSignatureCanvas} style={{ padding: '6px 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Clear Canvas</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowSignatureModal(false)} style={{ padding: '6px 14px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Cancel</button>
                <button type="button" onClick={saveSignatureCanvas} style={{ padding: '6px 18px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Apply Signature</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
