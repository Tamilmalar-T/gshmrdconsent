import { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Eye,
  EyeOff,
  Camera,
  PenTool,
  X,
  Upload,
  UserCheck,
  Shield,
  Briefcase,
  Building,
  GraduationCap,
  Layers,
  Palette,
  Compass,
  Phone,
  Lock,
  User as UserIcon,
  Check
} from 'lucide-react';

const STORAGE_KEY = 'masters_users';

// Password hashing helper (SHA-256 with prefix)
async function hashPassword(plainText) {
  if (!plainText) return '';
  if (plainText.startsWith('$sha256$')) return plainText; // Already hashed
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `$sha256$${hashHex}`;
  } catch (err) {
    console.error('Password hashing failed, fallback used:', err);
    return `$sha256$${btoa(plainText)}`;
  }
}

const INITIAL_USERS = [
  { 
    userId: 'mrd', 
    userName: 'MRD Admin', 
    empName: 'System Administrator',
    empCode: 'EMP001',
    department: 'Administration',
    designation: 'Chief Administrator',
    qualification: 'MBA, MHA',
    mobileNumber: '9876543210',
    branch: 'Main Branch - Central',
    role: 'Admin', 
    landingPage: 'User Master',
    status: 'Active', 
    photo: '',
    signature: '',
    themeType: 'Default Light Blue',
    userRoleGroup: 'Super Admin Group',
    password: '123' 
  },
  { 
    userId: 'ramesh02', 
    userName: 'Dr. Ramesh', 
    empName: 'Ramesh Kumar',
    empCode: 'EMP002',
    department: 'Cardiology',
    designation: 'Senior Consultant Doctor',
    qualification: 'MBBS, MD (Cardiology)',
    mobileNumber: '9876543211',
    branch: 'Main Branch - Central',
    role: 'Doctor', 
    landingPage: 'Consent Form',
    status: 'Active', 
    photo: '',
    signature: '',
    themeType: 'Corporate Navy',
    userRoleGroup: 'Clinical Doctors Group',
    password: 'password' 
  },
  { 
    userId: 'suresh03', 
    userName: 'Dr. Suresh', 
    empName: 'Suresh Babu',
    empCode: 'EMP003',
    department: 'Neurology',
    designation: 'Consultant Neurosurgeon',
    qualification: 'MBBS, MS, M.Ch',
    mobileNumber: '9876543212',
    branch: 'Main Branch - Central',
    role: 'Doctor', 
    landingPage: 'Resident Doctor Progress',
    status: 'Active', 
    photo: '',
    signature: '',
    themeType: 'Emerald Green',
    userRoleGroup: 'Clinical Doctors Group',
    password: 'password' 
  },
  { 
    userId: 'kavitha04', 
    userName: 'Dr. Kavitha', 
    empName: 'Kavitha Devi',
    empCode: 'EMP004',
    department: 'Gynecology',
    designation: 'Consultant Gynecologist',
    qualification: 'MBBS, DGO, MD',
    mobileNumber: '9876543213',
    branch: 'City Branch - North',
    role: 'Doctor', 
    landingPage: 'Consent Form',
    status: 'Active', 
    photo: '',
    signature: '',
    themeType: 'Purple Velvet',
    userRoleGroup: 'Clinical Doctors Group',
    password: 'password' 
  }
];

const DEFAULT_DEPARTMENTS = [
  'Administration', 'Cardiology', 'Neurology', 'Gynecology', 'Pediatrics',
  'Orthopedics', 'General Surgery', 'General Medicine', 'Laboratory', 'Radiology',
  'Pharmacy', 'Emergency & Casualty', 'ICU / Critical Care'
];

const DEFAULT_DESIGNATIONS = [
  'Chief Administrator', 'Senior Consultant Doctor', 'Consultant Doctor',
  'Resident Doctor (RMO)', 'Head Nurse', 'Staff Nurse', 'Medical Records Officer (MRD)',
  'Front Desk / Receptionist', 'Billing Executive', 'Chief Pharmacist', 'Lab Technician'
];

const DEFAULT_QUALIFICATIONS = [
  'MBBS', 'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'B.Sc Nursing', 'GNM',
  'M.Sc Nursing', 'B.Pharm', 'M.Pharm', 'D.Pharm', 'DMLT', 'MBA (Hospital Admin)', 'B.Com'
];

const DEFAULT_BRANCHES = [
  'Main Branch - Central',
  'NANDHU MEDICAL CENTRE',
  'City Branch - North',
  'Gurushree Specialty Annex'
];

const DEFAULT_ROLES = [
  'Admin', 'Doctor', 'Nurse', 'Resident Doctor', 'Consultant', 'Receptionist', 'Billing Clerk', 'Pharmacist'
];

const LANDING_PAGES = [
  'Patient Registration',
  'New Patient Registration',
  'Ward Master',
  'Consent Form',
  'Nurses Care Plan',
  'Nurses Daily Assessment',
  'Resident Doctor Progress',
  'Vitals Chart',
  'Lab Requisition',
  'User Master',
  'Department Master',
  'Consultant Master',
  'Hospital Branch Master',
  'Control Master',
  'Activity Record Billing'
];

const THEMES = [
  'Default Light Blue',
  'Dark Slate',
  'Emerald Green',
  'Corporate Navy',
  'Purple Velvet',
  'Minimal Gray'
];

const ROLE_GROUPS = [
  'Super Admin Group',
  'Clinical Doctors Group',
  'Nursing Staff Group',
  'Front Desk & Reception Group',
  'Billing & Accounts Group',
  'Pharmacy & Stores Group',
  'Laboratory & Diagnostics Group'
];

export default function UserMasterPage() {
  const [form, setForm] = useState({
    userId: '',
    userName: '',
    password: '',
    empName: '',
    empCode: '',
    department: 'Administration',
    designation: 'Senior Consultant Doctor',
    qualification: 'MBBS',
    mobileNumber: '',
    branch: 'Main Branch - Central',
    role: 'Admin',
    landingPage: 'User Master',
    status: 'Active',
    photo: '',
    signature: '',
    themeType: 'Default Light Blue',
    userRoleGroup: 'Super Admin Group'
  });

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [designations, setDesignations] = useState(DEFAULT_DESIGNATIONS);
  const [qualifications, setQualifications] = useState(DEFAULT_QUALIFICATIONS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [roles, setRoles] = useState(DEFAULT_ROLES);

  const [editingUserId, setEditingUserId] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  // Modals for Camera & Signature Capture
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
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

    // 3. Roles
    const savedTypes = localStorage.getItem('masters_types');
    if (savedTypes) {
      try {
        const parsed = JSON.parse(savedTypes);
        const tNames = parsed.filter(t => t.status === 'Active').map(t => t.typeName);
        if (tNames.length > 0) setRoles(Array.from(new Set([...tNames, ...DEFAULT_ROLES])));
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch General Master categories (Designation & Qualification) if available
    fetch('http://localhost:5000/api/general-master/categories')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          // Additional suggestions can be fetched if category exists
        }
      })
      .catch(() => {});
  }, []);

  // Load user records from localStorage or seed initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUsers(JSON.parse(saved));
      } catch (e) {
        setUsers(INITIAL_USERS);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      setUsers(INITIAL_USERS);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setUsers(updatedList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [fieldName]: 'File size should be less than 2MB.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, [fieldName]: reader.result }));
        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setForm({
      userId: '',
      userName: '',
      password: '',
      empName: '',
      empCode: '',
      department: departments[0] || 'Administration',
      designation: designations[0] || 'Senior Consultant Doctor',
      qualification: qualifications[0] || 'MBBS',
      mobileNumber: '',
      branch: branches[0] || 'Main Branch - Central',
      role: roles[0] || 'Admin',
      landingPage: 'User Master',
      status: 'Active',
      photo: '',
      signature: '',
      themeType: 'Default Light Blue',
      userRoleGroup: 'Super Admin Group'
    });
    setEditingUserId(null);
    setErrors({});
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
      setForm(prev => ({ ...prev, signature: dataUrl }));
      setShowSignatureModal(false);
    }
  };

  // --- Form Validation & Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');

    let newErrors = {};

    // Mandatory Field Checks
    if (!(form.userId || '').trim()) newErrors.userId = 'User ID is required.';
    if (!(form.userName || '').trim()) newErrors.userName = 'User Name is required.';
    if (!editingUserId && !(form.password || '').trim()) newErrors.password = 'Password is required.';
    if (!(form.empName || '').trim()) newErrors.empName = 'Employee Name is required.';
    if (!(form.empCode || '').trim()) newErrors.empCode = 'Employee Code is required.';
    if (!(form.branch || '').trim()) newErrors.branch = 'Branch is required.';
    if (!(form.role || '').trim()) newErrors.role = 'Role is required.';

    // Duplicate User ID Check (Case Insensitive)
    const existingUserId = users.find(u => 
      u.userId.toLowerCase() === (form.userId || '').trim().toLowerCase() &&
      u.userId.toLowerCase() !== (editingUserId || '').toLowerCase()
    );
    if (existingUserId) {
      newErrors.userId = `User ID "${form.userId}" is already taken by another user.`;
    }

    // Duplicate User Name Check (Case Insensitive)
    const existingUserName = users.find(u => 
      u.userName.toLowerCase() === (form.userName || '').trim().toLowerCase() &&
      u.userId.toLowerCase() !== (editingUserId || '').toLowerCase()
    );
    if (existingUserName) {
      newErrors.userName = `User Name "${form.userName}" is already registered.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Hash Password securely
    let hashedPassword = form.password;
    if (form.password && !form.password.startsWith('$sha256$')) {
      hashedPassword = await hashPassword(form.password);
    }

    const userDataToSave = {
      ...form,
      password: hashedPassword
    };

    if (editingUserId) {
      // Update existing user
      const updated = users.map((u) => u.userId === editingUserId ? userDataToSave : u);
      saveToStorage(updated);
      setSuccessMsg(`User "${form.userName}" updated successfully!`);
      handleClear();
    } else {
      // Add new user
      const updated = [...users, userDataToSave];
      saveToStorage(updated);
      setSuccessMsg(`User "${form.userName}" created successfully with secure hashed password!`);
      handleClear();
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (user) => {
    setForm({ 
      ...user,
      empName: user.empName || user.userName || '',
      empCode: user.empCode || `EMP00${users.indexOf(user) + 1}`,
      department: user.department || departments[0] || '',
      designation: user.designation || designations[0] || '',
      qualification: user.qualification || qualifications[0] || '',
      mobileNumber: user.mobileNumber || user.contact || '',
      branch: user.branch || branches[0] || '',
      role: user.role || user.userType || roles[0] || '',
      landingPage: user.landingPage || 'User Master',
      photo: user.photo || '',
      signature: user.signature || user.signatureImage || '',
      themeType: user.themeType || 'Default Light Blue',
      userRoleGroup: user.userRoleGroup || 'Super Admin Group'
    });
    setEditingUserId(user.userId);
    setErrors({});
  };

  const handleDelete = (userId) => {
    if (userId.toLowerCase() === 'mrd') {
      alert('The default system admin account (mrd) cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${userId}"?`)) {
      const updated = users.filter((u) => u.userId !== userId);
      saveToStorage(updated);
      setSuccessMsg('User account deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingUserId === userId) handleClear();
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.userName || '').toLowerCase().includes(q) ||
      (u.userId || '').toLowerCase().includes(q) ||
      (u.empCode || '').toLowerCase().includes(q) ||
      (u.empName || '').toLowerCase().includes(q) ||
      (u.role || u.userType || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q) ||
      (u.branch || '').toLowerCase().includes(q)
    );
  });

  const renderFormFields = (isEditMode) => (
    <form onSubmit={handleSubmit}>
      <div className="pr-form-4col-grid">
        {/* Row 1 */}
        <div className="pr-field">
          <label className="pr-label">USER ID <span className="req-star">*</span></label>
          <input 
            type="text" 
            name="userId" 
            value={form.userId} 
            onChange={handleChange} 
            disabled={isEditMode}
            placeholder="e.g. john_doe" 
            className="pr-input" 
            style={{ borderColor: errors.userId ? '#ef4444' : undefined }} 
          />
          {errors.userId && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.userId}</div>}
        </div>

        <div className="pr-field">
          <label className="pr-label">USER NAME <span className="req-star">*</span></label>
          <input 
            type="text" 
            name="userName" 
            value={form.userName} 
            onChange={handleChange} 
            placeholder="e.g. John Doe (Unique)" 
            className="pr-input" 
            style={{ borderColor: errors.userName ? '#ef4444' : undefined }} 
          />
          {errors.userName && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.userName}</div>}
        </div>

        <div className="pr-field">
          <label className="pr-label">PASSWORD {isEditMode ? '(Optional)' : <span className="req-star">*</span>}</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder={isEditMode ? "Leave empty to keep existing password" : "Secure login password"} 
              className="pr-input" 
              style={{ paddingRight: '36px', borderColor: errors.password ? '#ef4444' : undefined }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.password}</div>}
        </div>

        <div className="pr-field">
          <label className="pr-label">STATUS <span className="req-star">*</span></label>
          <select name="status" value={form.status} onChange={handleChange} className="pr-select">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Row 2 */}
        <div className="pr-field">
          <label className="pr-label">EMPLOYEE NAME <span className="req-star">*</span></label>
          <input 
            type="text" 
            name="empName" 
            value={form.empName} 
            onChange={handleChange} 
            placeholder="Full official employee name" 
            className="pr-input" 
            style={{ borderColor: errors.empName ? '#ef4444' : undefined }} 
          />
          {errors.empName && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.empName}</div>}
        </div>

        <div className="pr-field">
          <label className="pr-label">EMPLOYEE CODE <span className="req-star">*</span></label>
          <input 
            type="text" 
            name="empCode" 
            value={form.empCode} 
            onChange={handleChange} 
            placeholder="e.g. EMP102" 
            className="pr-input" 
            style={{ borderColor: errors.empCode ? '#ef4444' : undefined }} 
          />
          {errors.empCode && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.empCode}</div>}
        </div>

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

        <div className="pr-field">
          <label className="pr-label">DEPARTMENT (Master)</label>
          <select name="department" value={form.department} onChange={handleChange} className="pr-select">
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Row 3 */}
        <div className="pr-field">
          <label className="pr-label">DESIGNATION (Master)</label>
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
          <select name="branch" value={form.branch} onChange={handleChange} className="pr-select" style={{ borderColor: errors.branch ? '#ef4444' : undefined }}>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.branch && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.branch}</div>}
        </div>

        <div className="pr-field">
          <label className="pr-label">USER ROLE <span className="req-star">*</span></label>
          <select name="role" value={form.role} onChange={handleChange} className="pr-select" style={{ borderColor: errors.role ? '#ef4444' : undefined }}>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.role && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.role}</div>}
        </div>

        {/* Row 4 */}
        <div className="pr-field">
          <label className="pr-label">USER ROLE GROUP</label>
          <select name="userRoleGroup" value={form.userRoleGroup} onChange={handleChange} className="pr-select">
            {ROLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="pr-field">
          <label className="pr-label">LANDING PAGE (Post Login)</label>
          <select name="landingPage" value={form.landingPage} onChange={handleChange} className="pr-select">
            {LANDING_PAGES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="pr-field" style={{ gridColumn: 'span 2' }}>
          <label className="pr-label">UI THEME TYPE</label>
          <select name="themeType" value={form.themeType} onChange={handleChange} className="pr-select">
            {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Row 5: Photo & Signature */}
        <div className="pr-field" style={{ gridColumn: 'span 2' }}>
          <label className="pr-label">USER PHOTO</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#e0f2fe', color: '#0284c7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              <Upload size={14} /> Upload Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'photo')} />
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
              <img src={form.photo} alt="User Photo Preview" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }} />
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✓ Photo Ready</span>
            </div>
          )}
        </div>

        <div className="pr-field" style={{ gridColumn: 'span 2' }}>
          <label className="pr-label">DIGITAL SIGNATURE</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#fef3c7', color: '#d97706', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              <Upload size={14} /> Upload Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'signature')} />
            </label>
            <button 
              type="button" 
              onClick={openSignatureCanvas} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              <PenTool size={14} /> Draw Signature
            </button>
            {form.signature && (
              <button type="button" onClick={() => setForm(p => ({ ...p, signature: '' }))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Clear</button>
            )}
          </div>
          {form.signature && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={form.signature} alt="Signature Preview" style={{ height: '32px', maxWidth: '120px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', background: '#ffffff' }} />
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✓ Signature Attached</span>
            </div>
          )}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="pr-form-footer-actions">
        <button type="button" className="btn-pr-clear" onClick={handleClear}>Cancel / Clear</button>
        <button type="submit" className="btn-pr-register" style={{ backgroundColor: isEditMode ? '#6366f1' : '#0284c7' }}>
          {isEditMode ? 'Update User Details' : '+ Save User Account'}
        </button>
      </div>

    </form>
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
          <h1 className="pr-main-title">User Master</h1>
          <p className="pr-sub-title">
            Comprehensive system user management: assign roles, employee details, security passwords, signatures, and themes.
          </p>
        </div>

        <div className="pr-header-actions">
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, ID, code, role..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{users.length} users</span>
          </div>
        </div>
      </div>

      {/* Add User Form Card (Only shown if NOT editing) */}
      {!editingUserId && (
        <div className="pr-card-box">
          <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7' }}>
            <UserPlus size={16} />
            <span>Add New System User</span>
          </div>
          <div className="pr-card-body">
            {renderFormFields(false)}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUserId && (
        <div className="modal-overlay no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="pr-card-box" style={{ 
            width: '1000px', maxWidth: '96vw', margin: 0, 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="pr-card-header-strip" style={{ backgroundColor: '#6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={16} />
                <span>Edit User Details: {editingUserId}</span>
              </div>
              <button 
                onClick={handleClear} 
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="pr-card-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {renderFormFields(true)}
            </div>
          </div>
        </div>
      )}

      {/* User Accounts Registry Table */}
      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip">
          <h3 className="pr-table-title">User Accounts Registry</h3>
          <span className="pr-page-count">Showing {filteredUsers.length} of {users.length} Records</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>PHOTO</th>
                <th>USER ID</th>
                <th>USER NAME</th>
                <th>EMP CODE / NAME</th>
                <th>ROLE & GROUP</th>
                <th>DEPARTMENT</th>
                <th>BRANCH</th>
                <th>SIGNATURE</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="pr-empty-cell">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      {user.photo ? (
                        <img src={user.photo} alt="Photo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #0284c7' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {(user.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="font-bold-ip">{user.userId}</td>
                    <td className="font-semibold-name">{user.userName}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{user.empName || user.userName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{user.empCode || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{user.role || user.userType || '—'}</div>
                      <div style={{ fontSize: '10px', color: '#0284c7' }}>{user.userRoleGroup || 'Default Group'}</div>
                    </td>
                    <td>{user.department || '—'}</td>
                    <td>{user.branch || '—'}</td>
                    <td>
                      {user.signature || user.signatureImage ? (
                        <img 
                          src={user.signature || user.signatureImage} 
                          alt="signature" 
                          style={{ height: '24px', maxWidth: '80px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '1px', backgroundColor: '#ffffff' }} 
                        />
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '10px' }}>No signature</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-ins-sm ${user.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: user.status === 'Active' ? '#dcfce7' : '#fee2e2', color: user.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {user.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => setViewRecord(user)}
                          title="View Full Profile"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          type="button" 
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleEditClick(user)}
                          title="Edit User"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          type="button" 
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(user.userId)}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
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

      {/* VIEW RECORD DETAILS MODAL */}
      {viewRecord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewRecord(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '680px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {viewRecord.photo ? (
                  <img src={viewRecord.photo} alt="User" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                    {(viewRecord.userName || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.userName}</div>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>{viewRecord.designation || viewRecord.role} • {viewRecord.empCode}</div>
                </div>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'User ID', value: viewRecord.userId },
                  { label: 'User Name', value: viewRecord.userName },
                  { label: 'Employee Name', value: viewRecord.empName || viewRecord.userName },
                  { label: 'Employee Code', value: viewRecord.empCode },
                  { label: 'Department', value: viewRecord.department },
                  { label: 'Designation', value: viewRecord.designation },
                  { label: 'Qualification', value: viewRecord.qualification },
                  { label: 'Mobile Number', value: viewRecord.mobileNumber || viewRecord.contact },
                  { label: 'Hospital Branch', value: viewRecord.branch },
                  { label: 'Role', value: viewRecord.role || viewRecord.userType },
                  { label: 'Role Group', value: viewRecord.userRoleGroup },
                  { label: 'Landing Page', value: viewRecord.landingPage },
                  { label: 'Theme Type', value: viewRecord.themeType },
                  { label: 'Password Security', value: viewRecord.password && viewRecord.password.startsWith('$sha256$') ? '🔒 Hashed SHA-256' : '🔑 Legacy Password' },
                  { label: 'Status', value: viewRecord.status, badge: true }
                ].map(({ label, value, badge }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
                    {badge ? (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: value === 'Active' ? '#dcfce7' : '#fee2e2', color: value === 'Active' ? '#15803d' : '#b91c1c' }}>{value}</span>
                    ) : (
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{value || '—'}</div>
                    )}
                  </div>
                ))}
              </div>

              {(viewRecord.signature || viewRecord.signatureImage) && (
                <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Digital Signature</div>
                  <img src={viewRecord.signature || viewRecord.signatureImage} alt="Signature" style={{ maxHeight: '50px', objectFit: 'contain' }} />
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
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Capture User Photo</h3>
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
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: 0, marginBottom: '12px' }}>Use mouse or touch screen to draw your signature in the box below.</p>
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
