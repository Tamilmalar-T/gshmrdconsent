import { useState, useEffect } from 'react';
import {
  Building2, Save, CheckCircle2, AlertCircle, RotateCcw, Eye, Sparkles,
  Upload, Trash2, ChevronDown, ChevronUp, Type, MessageCircle, Phone as PhoneIcon
} from 'lucide-react';

/* ─── Font options ──────────────────────────────────────────────── */
const FONT_FAMILIES = [
  'inherit','Arial','Georgia','Times New Roman','Verdana',
  'Trebuchet MS','Tahoma','Courier New','Palatino','Garamond',
];
const FONT_SIZES = [
  '8px','9px','10px','11px','12px','13px','14px','15px','16px',
  '18px','20px','22px','24px','26px','28px','32px','36px','40px','48px',
];
const FONT_STYLES_OPTIONS = ['normal','italic','oblique'];
const FONT_WEIGHTS = [
  { label:'Regular', value:'400' },{ label:'Medium', value:'500' },
  { label:'Semi-Bold', value:'600' },{ label:'Bold', value:'700' },
  { label:'Extra-Bold', value:'800' },
];

/* ─── Per-field font defaults ───────────────────────────────────── */
const FIELD_FONT_DEFAULTS = {
  hospitalName:  { color:'#0f172a', size:'22px', style:'normal', weight:'800', family:'inherit' },
  subTitle:      { color:'#334155', size:'13px', style:'normal', weight:'700', family:'inherit' },
  tagline:       { color:'#64748b', size:'12px', style:'italic', weight:'400', family:'inherit' },
  regNo:         { color:'#0f766e', size:'11px', style:'normal', weight:'600', family:'inherit' },
  branchName:    { color:'#1e40af', size:'12px', style:'normal', weight:'600', family:'inherit' },
  branchAddress: { color:'#475569', size:'11px', style:'normal', weight:'400', family:'inherit' },
  areaName:      { color:'#475569', size:'11px', style:'normal', weight:'400', family:'inherit' },
  addressLine1:  { color:'#475569', size:'11px', style:'normal', weight:'400', family:'inherit' },
  addressLine2:  { color:'#475569', size:'11px', style:'normal', weight:'400', family:'inherit' },
  phone:         { color:'#475569', size:'11px', style:'normal', weight:'400', family:'inherit' },
  whatsapp:      { color:'#16a34a', size:'11px', style:'normal', weight:'400', family:'inherit' },
  email:         { color:'#475569', size:'11px', style:'normal', weight:'400', family:'inherit' },
  website:       { color:'#475569', size:'11px', style:'normal', weight:'400', family:'inherit' },
};

export const DEFAULT_HEADER_SETTINGS = {
  /* Identity */
  hospitalCode: '',
  hospitalName: 'GURUSHREE',
  branchCode:   '',
  branchName:   '',
  branchAddress:'',
  areaName:     '',
  /* Branding */
  subTitle:     'HI-TECH MULTI SPECIALITY HOSPITAL',
  tagline:      'A touch can instill faith',
  regNo:        'NABH Accredited | REG-2026-GS',
  /* Logo */
  logoText: 'GS',
  logoUrl:  '',
  /* Contact */
  phone:           '080-2315 2222 / 2315 3333',
  whatsapp:        '',
  whatsappEnabled: true,
  email:           'info@gurushreehospital.com',
  website:         'www.gurushreehospital.com',
  /* Legacy address fields */
  addressLine1: '#155/A, 3rd Stage, 4th Block, West of Chord Road',
  addressLine2: 'Rajajinagar, Bengaluru - 560010',
  /* Layout */
  headerStyle: 'Center',
  status:      'Active',
  fieldFonts:  FIELD_FONT_DEFAULTS,
};

export function getFormHeaderSettings() {
  try {
    const saved = localStorage.getItem('form_header_master_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        /* Deep-merge fieldFonts: each field's object is also merged with its default
           so individual missing/undefined keys fall back gracefully.           */
        const mergedFonts = Object.keys(FIELD_FONT_DEFAULTS).reduce((acc, key) => {
          const saved_f = parsed.fieldFonts && parsed.fieldFonts[key];
          acc[key] = { ...FIELD_FONT_DEFAULTS[key], ...(saved_f || {}) };
          return acc;
        }, {});
        return { ...DEFAULT_HEADER_SETTINGS, ...parsed, fieldFonts: mergedFonts };
      }
    }
  } catch (e) { console.error('Failed to parse form header settings:', e); }
  return DEFAULT_HEADER_SETTINGS;
}

/* ─── FontStyleBar ────────────────────────────────────────────── */

/** Returns true only for complete 6- or 8-digit hex colours (#rrggbb / #rrggbbaa) */
const isValidHex = (c) => typeof c === 'string' && /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(c);

/** Ensure every key in a font object has a defined, non-empty value */
const sanitizeFont = (f, defaults) => ({
  color:  (f && f.color  !== undefined) ? f.color  : (defaults.color  || '#000000'),
  size:   (f && f.size   !== undefined) ? f.size   : (defaults.size   || '12px'),
  style:  (f && f.style  !== undefined) ? f.style  : (defaults.style  || 'normal'),
  weight: (f && f.weight !== undefined) ? f.weight : (defaults.weight || '400'),
  family: (f && f.family !== undefined) ? f.family : (defaults.family || 'inherit'),
});

function FontStyleBar({ fieldKey, fonts, onChange }) {
  const [open, setOpen] = useState(false);
  const raw = (fonts || {})[fieldKey];
  const f   = sanitizeFont(raw, FIELD_FONT_DEFAULTS[fieldKey] || {});
  const update = (prop, val) => onChange(fieldKey, { ...f, [prop]: val });

  /* Safe value for <input type="color"> — must be exactly #rrggbb */
  const pickerColor = isValidHex(f.color) ? f.color.slice(0, 7) : '#000000';

  return (
    <div style={{ marginTop: '4px' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display:'inline-flex', alignItems:'center', gap:'4px',
        fontSize:'11px', color:'#6366f1', background:'none', border:'none',
        cursor:'pointer', padding:'2px 0', fontWeight:'600',
      }}>
        <Type size={12} /> Font Style {open ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
      </button>

      {open && (
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px',
          marginTop:'6px', padding:'10px 12px',
          backgroundColor:'#f8fafc', border:'1px solid #e2e8f0',
          borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {/* Font Family */}
          <div>
            <label style={{ fontSize:'10px', fontWeight:'600', color:'#64748b', display:'block', marginBottom:'3px' }}>Font Family</label>
            <select value={f.family} onChange={e=>update('family',e.target.value)}
              style={{ width:'100%', fontSize:'11px', padding:'4px 6px', border:'1px solid #cbd5e1', borderRadius:'5px', backgroundColor:'#fff', cursor:'pointer' }}>
              {FONT_FAMILIES.map((ff, idx)=><option key={ff || `font-fam-${idx}`} value={ff} style={{fontFamily:ff}}>{ff==='inherit'?'Default':ff}</option>)}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label style={{ fontSize:'10px', fontWeight:'600', color:'#64748b', display:'block', marginBottom:'3px' }}>Font Size</label>
            <select value={f.size} onChange={e=>update('size',e.target.value)}
              style={{ width:'100%', fontSize:'11px', padding:'4px 6px', border:'1px solid #cbd5e1', borderRadius:'5px', backgroundColor:'#fff', cursor:'pointer' }}>
              {FONT_SIZES.map((s, idx)=><option key={s || `font-sz-${idx}`} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Font Style */}
          <div>
            <label style={{ fontSize:'10px', fontWeight:'600', color:'#64748b', display:'block', marginBottom:'3px' }}>Font Style</label>
            <div style={{ display:'flex', gap:'4px' }}>
              {FONT_STYLES_OPTIONS.map((s, idx)=>(
                <button key={s || `font-st-${idx}`} type="button" onClick={()=>update('style',s)} style={{
                  flex:1, fontSize:'10px', padding:'4px 2px',
                  border:`1px solid ${f.style===s?'#6366f1':'#cbd5e1'}`,
                  borderRadius:'4px',
                  backgroundColor:f.style===s?'#6366f1':'#fff',
                  color:f.style===s?'#fff':'#334155',
                  cursor:'pointer', fontStyle:s, fontWeight:'600', transition:'all 0.15s',
                }}>
                  {s==='normal'?'N':s==='italic'?'I':'O'}
                </button>
              ))}
            </div>
          </div>

          {/* Font Weight */}
          <div>
            <label style={{ fontSize:'10px', fontWeight:'600', color:'#64748b', display:'block', marginBottom:'3px' }}>Font Weight</label>
            <select value={f.weight} onChange={e=>update('weight',e.target.value)}
              style={{ width:'100%', fontSize:'11px', padding:'4px 6px', border:'1px solid #cbd5e1', borderRadius:'5px', backgroundColor:'#fff', cursor:'pointer' }}>
              {FONT_WEIGHTS.map((w, idx)=><option key={w.value || `font-wt-${idx}`} value={w.value} style={{fontWeight:w.value}}>{w.label}</option>)}
            </select>
          </div>

          {/* Font Color */}
          <div style={{ gridColumn:'1 / -1' }}>
            <label style={{ fontSize:'10px', fontWeight:'600', color:'#64748b', display:'block', marginBottom:'3px' }}>Font Color</label>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              {/* type=color MUST receive a valid #rrggbb — use pickerColor */}
              <input type="color" value={pickerColor}
                onChange={e => update('color', e.target.value)}
                style={{ width:'38px', height:'28px', padding:'0', border:'1px solid #cbd5e1', borderRadius:'5px', cursor:'pointer', backgroundColor:'#fff' }} />
              {/* text box allows partial typing; value always defined */}
              <input type="text" value={f.color}
                onChange={e => update('color', e.target.value)}
                maxLength={9} placeholder="#000000"
                style={{ flex:1, fontSize:'11px', padding:'4px 8px', border:'1px solid #cbd5e1', borderRadius:'5px', backgroundColor:'#fff' }} />
              <span style={{
                fontSize: f.size, fontFamily: f.family === 'inherit' ? undefined : f.family,
                fontStyle: f.style, fontWeight: f.weight,
                color: isValidHex(f.color) ? f.color : '#000000',
                padding:'2px 8px', border:'1px solid #e2e8f0', borderRadius:'4px',
                backgroundColor:'#fff', whiteSpace:'nowrap',
                maxWidth:'80px', overflow:'hidden', textOverflow:'ellipsis',
              }}>Preview</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Field Row helper ─────────────────────────────────────────── */
function FieldRow({ label, name, value, onChange, placeholder, fontKey, fonts, onFontChange, maxLength, children, required }) {
  return (
    <div className="pr-field" style={{ margin: 0 }}>
      <label className="pr-label">
        {label}{required && <span className="req-star"> *</span>}
      </label>
      {children || (
        <input
          type="text" name={name} value={value} onChange={onChange}
          placeholder={placeholder} className="pr-input"
          maxLength={maxLength}
        />
      )}
      {fontKey && <FontStyleBar fieldKey={fontKey} fonts={fonts} onChange={onFontChange} />}
    </div>
  );
}

/* ─── Section divider ──────────────────────────────────────────── */
function SectionLabel({ icon: Icon, label, color = '#0284c7' }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'6px',
      fontSize:'11px', fontWeight:'700', color,
      padding:'6px 10px', backgroundColor:`${color}10`,
      borderLeft:`3px solid ${color}`, borderRadius:'0 6px 6px 0',
      marginBottom:'4px', letterSpacing:'0.05em', textTransform:'uppercase',
    }}>
      {Icon && <Icon size={13}/>} {label}
    </div>
  );
}

/* ─── Storage keys (shared with HospitalBranchMasterPage) ── */
const BRANCH_STORAGE_KEY = 'masters_hospital_branch_records';
const HOSPITAL_STORAGE_KEY = 'masters_hospital_records';

function getHospitalRecords() {
  try {
    const saved = localStorage.getItem(HOSPITAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(h => h.active !== false);
    }
  } catch (e) {}
  return [
    { id: 1, hospitalCode: 'SMSH', hospitalName: 'SNEKARAM MULTI SPECIALITY HOSPITAL', active: true },
    { id: 2, hospitalCode: 'GSH', hospitalName: 'GURUSHREE HOSPITAL', active: true },
    { id: 3, hospitalCode: 'APOLLO', hospitalName: 'APOLLO HOSPITALS', active: true },
    { id: 4, hospitalCode: 'MIOT', hospitalName: 'MIOT HOSPITALS', active: true },
    { id: 5, hospitalCode: 'KMCH', hospitalName: 'KOVAI MEDICAL CENTER AND HOSPITAL', active: true }
  ];
}

function getBranchRecords() {
  try {
    const saved = localStorage.getItem(BRANCH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(b => b.active !== false);
    }
  } catch (e) {}
  return [
    { id:101, hospitalCode:'SMSH', hospitalName:'SNEKARAM MULTI SPECIALITY HOSPITAL', branchNo:'LMHB4', branchName:'NANDHU MEDICAL CENTRE', address1:'No. 132, Thendral Street', address2:'Coimbatore - 641012', phone:'0422-2490100', whatsapp:'63692 47195', whatsappEnabled:true, email:'nandhumedical@snekaram.com', website:'', area:'Gandhipuram', active:true },
    { id:102, hospitalCode:'SMSH', hospitalName:'SNEKARAM MULTI SPECIALITY HOSPITAL', branchNo:'LMHB5', branchName:'SRI RAMA MEDICAL CARE', address1:'No. 45, Cross Cut Road', address2:'Coimbatore - 641002', phone:'0422-2490200', whatsapp:'98422 12345', whatsappEnabled:true, email:'srirama@snekaram.com', website:'', area:'RS Puram', active:true },
    { id:103, hospitalCode:'GSH', hospitalName:'GURUSHREE HOSPITAL', branchNo:'GHB1', branchName:'GURUSHREE MAIN BRANCH', address1:'12/A, Hospital Road', address2:'Peelamedu', phone:'0422-2570000', whatsapp:'94430 98765', whatsappEnabled:true, email:'info@gurushreehospital.com', website:'www.gurushreehospital.com', area:'Peelamedu', active:true },
    { id:104, hospitalCode:'GSH', hospitalName:'GURUSHREE HOSPITAL', branchNo:'GHB2', branchName:'GURUSHREE CITY CENTRE', address1:'88, Trichy Road', address2:'Singanallur', phone:'0422-2580000', whatsapp:'98940 54321', whatsappEnabled:false, email:'citycentre@gurushreehospital.com', website:'', area:'Singanallur', active:true },
  ];
}

/* ─── Main component ───────────────────────────────────────────── */
export default function FormHeaderMasterPage() {
  const [form, setForm]           = useState(DEFAULT_HEADER_SETTINGS);
  const [toastMsg, setToastMsg]   = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [branchRecords, setBranchRecords] = useState([]);
  const [hospitalRecords, setHospitalRecords] = useState([]);

  /* Refresh records from localStorage whenever focus or storage updates */
  const refreshRecords = () => {
    setBranchRecords(getBranchRecords());
    setHospitalRecords(getHospitalRecords());
  };

  useEffect(() => {
    refreshRecords();
    window.addEventListener('focus', refreshRecords);
    window.addEventListener('storage', refreshRecords);
    return () => {
      window.removeEventListener('focus', refreshRecords);
      window.removeEventListener('storage', refreshRecords);
    };
  }, []);

  /* Combine hospital records from Hospital Master and Branch Master */
  const hospitalMap = new Map();
  hospitalRecords.forEach(h => {
    if (h && h.hospitalCode) {
      hospitalMap.set(h.hospitalCode, { code: h.hospitalCode, name: h.hospitalName });
    }
  });
  branchRecords.forEach(b => {
    if (b && b.hospitalCode && !hospitalMap.has(b.hospitalCode)) {
      hospitalMap.set(b.hospitalCode, { code: b.hospitalCode, name: b.hospitalName });
    }
  });

  const uniqueHospitals = Array.from(hospitalMap.values());
  const branchesForHospital = branchRecords.filter(b => b.hospitalCode === form.hospitalCode);

  const fetchHeaderSettings = async () => {
    setLoading(true);
    let apiData = null;
    try {
      const res = await fetch('http://localhost:5000/api/form-header-master');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data && typeof result.data === 'object') {
          const d = result.data;
          apiData = {
            hospitalCode:    d.hospital_code    || d.hospitalCode    || '',
            hospitalName:    d.hospital_name    || d.hospitalName    || DEFAULT_HEADER_SETTINGS.hospitalName,
            branchCode:      d.branch_code      || d.branchCode      || '',
            branchName:      d.branch_name      || d.branchName      || '',
            branchAddress:   d.branch_address   || d.branchAddress   || '',
            areaName:        d.area_name        || d.areaName        || '',
            subTitle:        d.sub_title        || d.subTitle        || DEFAULT_HEADER_SETTINGS.subTitle,
            tagline:         d.tagline          || DEFAULT_HEADER_SETTINGS.tagline,
            regNo:           d.reg_no           || d.regNo           || DEFAULT_HEADER_SETTINGS.regNo,
            logoText:        d.logo_text        || d.logoText        || DEFAULT_HEADER_SETTINGS.logoText,
            logoUrl:         d.logo_url         || d.logoUrl         || '',
            phone:           d.phone            || DEFAULT_HEADER_SETTINGS.phone,
            whatsapp:        d.whatsapp         || '',
            whatsappEnabled: d.whatsapp_enabled !== undefined ? d.whatsapp_enabled : (d.whatsappEnabled !== undefined ? d.whatsappEnabled : true),
            email:           d.email            || DEFAULT_HEADER_SETTINGS.email,
            website:         d.website          || DEFAULT_HEADER_SETTINGS.website,
            addressLine1:    d.address_line1    || d.addressLine1    || DEFAULT_HEADER_SETTINGS.addressLine1,
            addressLine2:    d.address_line2    || d.addressLine2    || DEFAULT_HEADER_SETTINGS.addressLine2,
            headerStyle:     d.header_style     || d.headerStyle     || 'Center',
            status:          d.status           || 'Active',
            fieldFonts:      { ...FIELD_FONT_DEFAULTS, ...(d.fieldFonts || {}) },
          };
        }
      }
    } catch (err) { console.warn('API fetch form header master offline/warning:', err); }

    if (apiData) {
      setForm(apiData);
      try { localStorage.setItem('form_header_master_settings', JSON.stringify(apiData)); } catch (e) {}
    } else {
      setForm(getFormHeaderSettings());
    }
    setLoading(false);
  };

  useEffect(() => { fetchHeaderSettings(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  /* ─── Hospital Code selected → fill hospital name, clear branch ── */
  const handleHospitalCodeSelect = e => {
    const code = e.target.value;
    const hosp = uniqueHospitals.find(h => h.code === code) || branchRecords.find(b => b.hospitalCode === code);
    setForm(prev => ({
      ...prev,
      hospitalCode: code,
      hospitalName: hosp ? (hosp.name || hosp.hospitalName) : prev.hospitalName,
      /* Clear branch-level fields so user picks fresh branch */
      branchCode: '', branchName: '', branchAddress: '',
      areaName: '', phone: '', whatsapp: '',
      whatsappEnabled: true, email: '', website: '',
    }));
  };

  /* ─── Branch Code selected → auto-fill all branch fields ────── */
  const handleBranchCodeSelect = e => {
    const code = e.target.value;
    const b = branchRecords.find(br => br.branchNo === code && br.hospitalCode === form.hospitalCode);
    if (!b) { setForm(prev => ({ ...prev, branchCode: code })); return; }
    setForm(prev => ({
      ...prev,
      branchCode:      b.branchNo,
      branchName:      b.branchName       || '',
      branchAddress:   [b.address1, b.address2].filter(Boolean).join(', '),
      areaName:        b.area             || '',
      phone:           b.phone            || '',
      whatsapp:        b.whatsapp         || '',
      whatsappEnabled: b.whatsappEnabled  !== false,
      email:           b.email            || prev.email,
      website:         b.website          || prev.website,
    }));
  };

  const handleFontChange = (fieldKey, newFont) =>
    setForm(prev => ({ ...prev, fieldFonts: { ...prev.fieldFonts, [fieldKey]: newFont } }));

  const handleLogoUpload = e => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setErrorMsg('Logo image must be under 5MB.'); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setForm(prev => ({ ...prev, logoUrl: reader.result })); setErrorMsg(''); };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveLogo = () => setForm(prev => ({ ...prev, logoUrl: '' }));

  const handleSave = async e => {
    if (e) e.preventDefault();
    setErrorMsg(''); setToastMsg('');
    if (!form.hospitalName.trim()) { setErrorMsg('Hospital Name is required.'); return; }
    try { localStorage.setItem('form_header_master_settings', JSON.stringify(form)); window.dispatchEvent(new Event('form_header_updated')); } catch (e) {}
    try {
      const res = await fetch('http://localhost:5000/api/form-header-master', {
        method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) console.warn('Backend API save error:', res.status);
    } catch (err) { console.warn('Backend API save warning:', err); }
    setToastMsg('Form Header Master settings saved successfully!');
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleReset = () => {
    if (window.confirm('Reset Form Header settings to defaults?')) {
      setForm(DEFAULT_HEADER_SETTINGS);
      try { localStorage.setItem('form_header_master_settings', JSON.stringify(DEFAULT_HEADER_SETTINGS)); window.dispatchEvent(new Event('form_header_updated')); } catch (e) {}
      setToastMsg('Reset to default header settings.'); setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const ff = form.fieldFonts || FIELD_FONT_DEFAULTS;

  /* Build inline style for preview */
  const fs = (key, extra = {}) => {
    const f = ff[key] || FIELD_FONT_DEFAULTS[key] || {};
    return {
      color:      f.color,
      fontSize:   f.size,
      fontStyle:  f.style,
      fontWeight: f.weight,
      fontFamily: f.family === 'inherit' ? undefined : f.family,
      ...extra,
    };
  };

  const fProps = (fontKey) => ({
    fontKey, fonts: ff, onFontChange: handleFontChange,
  });

  return (
    <div className="patient-register-container" style={{ maxWidth:'1280px', margin:'0 auto', padding:'20px' }}>
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18}/><span>{toastMsg}</span>
        </div>
      )}

      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title" style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Building2 size={24} style={{ color:'#0284c7' }}/> Form Header Master
          </h1>
          <p className="pr-sub-title">
            Configure hospital identity, branch details, branding, and contact info printed on all clinical forms.
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:'24px', marginTop:'24px' }}>

        {/* ══ Left Column: Config Form ══════════════════════════════ */}
        <div className="pr-card-box">
          <div className="pr-card-header-strip" style={{ backgroundColor:'#0284c7', display:'flex', alignItems:'center', gap:'8px' }}>
            <Sparkles size={16}/><span>Form Header Configurations</span>
          </div>

          <div className="pr-card-body" style={{ padding:'20px' }}>
            {errorMsg && (
              <div className="alert-error-banner" style={{ marginBottom:'16px' }}>
                <AlertCircle size={18}/><span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* ── SECTION 1: Hospital Identity ── */}
              <SectionLabel icon={Building2} label="Hospital Identity" color="#0284c7"/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'14px' }}>
                {/* Hospital Code dropdown */}
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Hospital Code</label>
                  <select
                    value={form.hospitalCode}
                    onChange={handleHospitalCodeSelect}
                    className="pr-select"
                    style={{ backgroundColor: form.hospitalCode ? '#0284c7' : undefined, color: form.hospitalCode ? '#fff' : undefined }}
                  >
                    <option value="">— Select Hospital —</option>
                    {uniqueHospitals.map((h, idx) => (
                      <option key={h.code || `hosp-${idx}`} value={h.code}>{h.code} — {h.name}</option>
                    ))}
                  </select>
                </div>

                {/* Hospital Name — auto-filled, read-only */}
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Hospital Name <span className="req-star">*</span></label>
                  <div style={{ position:'relative' }}>
                    <input
                      type="text" name="hospitalName" value={form.hospitalName}
                      onChange={handleChange}
                      placeholder="Auto-filled from Hospital Code selection"
                      className="pr-input"
                      readOnly={!!form.hospitalCode}
                      style={{
                        fontWeight:'700', textTransform:'uppercase',
                        backgroundColor: form.hospitalCode ? '#f0fdf4' : undefined,
                        borderColor: form.hospitalCode ? '#86efac' : undefined,
                        cursor: form.hospitalCode ? 'default' : undefined,
                      }}
                    />
                    {form.hospitalCode && (
                      <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#16a34a', fontWeight:'700', display:'flex', alignItems:'center', gap:'3px' }}>
                        ✓ Linked
                      </span>
                    )}
                  </div>
                  <FontStyleBar fieldKey="hospitalName" fonts={ff} onChange={handleFontChange}/>
                </div>
              </div>

              {/* ── SECTION 2: Branch Details ── */}
            

              {!form.hospitalCode && (
                <div style={{ padding:'10px 14px', backgroundColor:'#fef9c3', border:'1px solid #fde047', borderRadius:'8px', fontSize:'12px', color:'#854d0e', display:'flex', alignItems:'center', gap:'8px' }}>
                  ⚠️ Please select a <strong>Hospital Code</strong> above first to load branch options.
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'14px' }}>
                {/* Branch Code dropdown */}
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Branch Code</label>
                  <select
                    value={form.branchCode}
                    onChange={handleBranchCodeSelect}
                    disabled={!form.hospitalCode}
                    className="pr-select"
                    style={{
                      backgroundColor: form.branchCode ? '#7c3aed' : (form.hospitalCode ? '#0284c7' : undefined),
                      color: (form.branchCode || form.hospitalCode) ? '#fff' : undefined,
                      opacity: !form.hospitalCode ? 0.5 : 1,
                    }}
                  >
                    <option value="">— Select Branch —</option>
                    {branchesForHospital.map((b, idx) => (
                      <option key={b.id || b.branchNo || `branch-${idx}`} value={b.branchNo}>{b.branchNo} — {b.branchName}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Name — auto-filled */}
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Branch Name</label>
                  <div style={{ position:'relative' }}>
                    <input
                      type="text" name="branchName" value={form.branchName}
                      onChange={handleChange}
                      placeholder="Auto-filled from Branch Code selection"
                      className="pr-input"
                      readOnly={!!form.branchCode}
                      style={{
                        backgroundColor: form.branchCode ? '#f5f3ff' : undefined,
                        borderColor: form.branchCode ? '#a78bfa' : undefined,
                        cursor: form.branchCode ? 'default' : undefined,
                      }}
                    />
                    {form.branchCode && (
                      <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#7c3aed', fontWeight:'700' }}>✓ Linked</span>
                    )}
                  </div>
                  <FontStyleBar fieldKey="branchName" fonts={ff} onChange={handleFontChange}/>
                </div>
              </div>

              {/* Branch Address — auto-filled */}
              <div className="pr-field" style={{ margin:0 }}>
                <label className="pr-label">Branch Address</label>
                <div style={{ position:'relative' }}>
                  <input
                    type="text" name="branchAddress" value={form.branchAddress}
                    onChange={handleChange}
                    placeholder="Auto-filled from Branch Code selection"
                    className="pr-input"
                    readOnly={!!form.branchCode}
                    style={{
                      backgroundColor: form.branchCode ? '#f5f3ff' : undefined,
                      borderColor: form.branchCode ? '#a78bfa' : undefined,
                      cursor: form.branchCode ? 'default' : undefined,
                    }}
                  />
                  {form.branchCode && (
                    <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#7c3aed', fontWeight:'700' }}>✓ Linked</span>
                  )}
                </div>
                <FontStyleBar fieldKey="branchAddress" fonts={ff} onChange={handleFontChange}/>
              </div>

              {/* Area Name — auto-filled */}
              <div className="pr-field" style={{ margin:0 }}>
                <label className="pr-label">Area Name</label>
                <div style={{ position:'relative' }}>
                  <input
                    type="text" name="areaName" value={form.areaName}
                    onChange={handleChange}
                    placeholder="Auto-filled from Branch Code selection"
                    className="pr-input"
                    readOnly={!!form.branchCode}
                    style={{
                      backgroundColor: form.branchCode ? '#f5f3ff' : undefined,
                      borderColor: form.branchCode ? '#a78bfa' : undefined,
                      cursor: form.branchCode ? 'default' : undefined,
                    }}
                  />
                  {form.branchCode && (
                    <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#7c3aed', fontWeight:'700' }}>✓ Linked</span>
                  )}
                </div>
                <FontStyleBar fieldKey="areaName" fonts={ff} onChange={handleFontChange}/>
              </div>

              {/* ── SECTION 3: Branding ── */}
              <SectionLabel icon={Sparkles} label="Branding" color="#0891b2"/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                <FieldRow label="Header Title / Hospital Title" name="title" value={form.title !== undefined ? form.title : form.hospitalName}
                  onChange={handleChange} placeholder="e.g. SSS / GURUSHREE"
                  {...fProps('hospitalName')}/>
                <FieldRow label="Subtitle / Speciality Description" name="subTitle" value={form.subTitle}
                  onChange={handleChange} placeholder="e.g. HI-TECH MULTI SPECIALITY HOSPITAL"
                  {...fProps('subTitle')}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                <FieldRow label="Registration / Accreditation Info" name="regNo" value={form.regNo}
                  onChange={handleChange} placeholder="e.g. NABH Accredited | REG-2026-GS"
                  {...fProps('regNo')}/>
                <FieldRow label="Tagline / Motto" name="tagline" value={form.tagline}
                  onChange={handleChange} placeholder="e.g. A touch can instill faith"
                  {...fProps('tagline')}/>
              </div>

              {/* Logo Settings */}
              <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:'14px' }}>
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Logo Badge Text</label>
                  <input type="text" name="logoText" value={form.logoText} onChange={handleChange}
                    placeholder="e.g. GS" maxLength={5} className="pr-input"
                    style={{ textAlign:'center', fontWeight:'800', textTransform:'uppercase' }}/>
                </div>
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Logo Image (Upload)</label>
                  <div style={{ display:'flex', gap:'10px', alignItems:'center', minHeight:'38px' }}>
                    {form.logoUrl ? (
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', flexWrap:'wrap' }}>
                        <div style={{ padding:'3px 8px', border:'1px solid #cbd5e1', borderRadius:'6px', backgroundColor:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', height:'38px', minWidth:'48px' }}>
                          <img src={form.logoUrl} alt="Logo Preview" style={{ maxHeight:'32px', maxWidth:'90px', objectFit:'contain' }} onError={e=>{e.target.style.display='none';}}/>
                        </div>
                        <label className="btn-pr-clear" style={{ cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 12px', fontSize:'12px', fontWeight:'600', margin:0 }}>
                          <Upload size={14}/> Change Logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:'none' }}/>
                        </label>
                        <button type="button" onClick={handleRemoveLogo}
                          style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'6px 10px', fontSize:'12px', color:'#ef4444', border:'1px solid #fca5a5', borderRadius:'6px', backgroundColor:'#fef2f2', cursor:'pointer', fontWeight:'600' }}>
                          <Trash2 size={14}/> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="pr-input" style={{ flex:1, cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#f8fafc', color:'#475569', fontSize:'13px', borderStyle:'dashed', padding:'8px 12px' }}>
                        <Upload size={16} style={{ color:'#0284c7' }}/>
                        <span style={{ fontWeight:'500' }}>Click to Upload Logo (PNG, JPG, SVG)</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:'none' }}/>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: Contact Information ── */}
              <SectionLabel icon={PhoneIcon} label="Contact Information" color="#059669"/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div className="pr-field" style={{ margin:0 }}>
                <label className="pr-label">Phone Number</label>
                <div style={{ position:'relative' }}>
                  <input
                    type="text" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="e.g. 080-2315 2222" className="pr-input"
                    readOnly={!!form.branchCode}
                    style={{
                      backgroundColor: form.branchCode ? '#f0fdf4' : undefined,
                      borderColor: form.branchCode ? '#86efac' : undefined,
                      cursor: form.branchCode ? 'default' : undefined,
                    }}
                  />
                  {form.branchCode && (
                    <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#16a34a', fontWeight:'700' }}>✓ Linked</span>
                  )}
                </div>
                <FontStyleBar fieldKey="phone" fonts={ff} onChange={handleFontChange}/>
              </div>

                {/* WhatsApp Number with Enable/Disable */}
                <div className="pr-field" style={{ margin:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                    <label className="pr-label" style={{ margin:0 }}>WhatsApp Number</label>
                    <label style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'11px', fontWeight:'600', color: form.whatsappEnabled ? '#16a34a' : '#94a3b8' }}>
                      <span style={{ fontSize:'11px' }}>{form.whatsappEnabled ? 'Enabled' : 'Disabled'}</span>
                      <div
                        onClick={() => setForm(prev => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }))}
                        style={{
                          width:'36px', height:'20px', borderRadius:'999px', cursor:'pointer',
                          backgroundColor: form.whatsappEnabled ? '#16a34a' : '#cbd5e1',
                          position:'relative', transition:'background-color 0.2s',
                          flexShrink:0,
                        }}
                      >
                        <span style={{
                          position:'absolute', top:'2px',
                          left: form.whatsappEnabled ? '18px' : '2px',
                          width:'16px', height:'16px', borderRadius:'50%',
                          backgroundColor:'#fff', transition:'left 0.2s',
                          boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                        }}/>
                      </div>
                    </label>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'16px' }}>
                      <MessageCircle size={16} style={{ color: form.whatsappEnabled ? '#16a34a' : '#cbd5e1', marginTop:'10px' }}/>
                    </span>
                    <div style={{ position:'relative', flex:1 }}>
                      <input
                        type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange}
                        placeholder="e.g. +91 98765 43210"
                        className="pr-input"
                        disabled={!form.whatsappEnabled}
                        readOnly={!!form.branchCode}
                        style={{
                          width:'100%',
                          opacity: form.whatsappEnabled ? 1 : 0.45,
                          backgroundColor: (form.branchCode && form.whatsappEnabled) ? '#f0fdf4' : undefined,
                          borderColor: (form.branchCode && form.whatsappEnabled) ? '#86efac' : undefined,
                          cursor: form.branchCode ? 'default' : undefined,
                        }}
                      />
                      {form.branchCode && form.whatsappEnabled && (
                        <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#16a34a', fontWeight:'700' }}>✓ Linked</span>
                      )}
                    </div>
                  </div>
                  {form.whatsappEnabled && <FontStyleBar fieldKey="whatsapp" fonts={ff} onChange={handleFontChange}/>}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                {/* Email */}
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Email Address</label>
                  <div style={{ position:'relative' }}>
                    <input type="text" name="email" value={form.email} onChange={handleChange}
                      placeholder="info@hospital.com" className="pr-input"
                      readOnly={!!form.branchCode}
                      style={{
                        backgroundColor: form.branchCode ? '#f0fdf4' : undefined,
                        borderColor: form.branchCode ? '#86efac' : undefined,
                        cursor: form.branchCode ? 'default' : undefined,
                      }}
                    />
                    {form.branchCode && (
                      <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#16a34a', fontWeight:'700' }}>✓ Linked</span>
                    )}
                  </div>
                  <FontStyleBar fieldKey="email" fonts={ff} onChange={handleFontChange}/>
                </div>
                {/* Website */}
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Website URL</label>
                  <div style={{ position:'relative' }}>
                    <input type="text" name="website" value={form.website} onChange={handleChange}
                      placeholder="www.hospital.com" className="pr-input"
                      readOnly={!!form.branchCode}
                      style={{
                        backgroundColor: form.branchCode ? '#f0fdf4' : undefined,
                        borderColor: form.branchCode ? '#86efac' : undefined,
                        cursor: form.branchCode ? 'default' : undefined,
                      }}
                    />
                    {form.branchCode && (
                      <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#16a34a', fontWeight:'700' }}>✓ Linked</span>
                    )}
                  </div>
                  <FontStyleBar fieldKey="website" fonts={ff} onChange={handleFontChange}/>
                </div>
              </div>

              {/* ── Legacy Address fields ── */}
              <FieldRow label="Address Line 1" name="addressLine1" value={form.addressLine1}
                onChange={handleChange} placeholder="#155/A, 3rd Stage, West of Chord Road"
                {...fProps('addressLine1')}/>
              <FieldRow label="Address Line 2 (City / State / Pincode)" name="addressLine2" value={form.addressLine2}
                onChange={handleChange} placeholder="Rajajinagar, Bengaluru - 560010"
                {...fProps('addressLine2')}/>

              {/* ── Layout & Status ── */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Header Style Layout</label>
                  <select name="headerStyle" value={form.headerStyle} onChange={handleChange} className="pr-select">
                    <option value="Center">Centered Brand</option>
                    <option value="Left">Left Aligned Brand</option>
                    <option value="Bordered">Boxed Border Style</option>
                  </select>
                </div>
                <div className="pr-field" style={{ margin:0 }}>
                  <label className="pr-label">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="pr-select">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'12px', paddingTop:'16px', borderTop:'1px solid #e2e8f0' }}>
                <button type="button" onClick={handleReset} className="btn-pr-clear"
                  style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <RotateCcw size={15}/> Reset Defaults
                </button>
                <button type="submit" className="btn-pr-register"
                  style={{ backgroundColor:'#10b981', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Save size={15}/> Save Header Settings
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* ══ Right Column: Live Preview ══════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div className="pr-card-box" style={{ position:'sticky', top:'16px' }}>
            <div className="pr-card-header-strip" style={{ backgroundColor:'#0f172a', display:'flex', alignItems:'center', gap:'8px' }}>
              <Eye size={16}/><span>Live Paper Form Header Preview</span>
            </div>

            <div style={{ padding:'20px', backgroundColor:'#f8fafc' }}>
              <div style={{
                backgroundColor:'#ffffff', border:'1px solid #cbd5e1',
                borderRadius:'8px', padding:'20px',
                boxShadow:'0 4px 12px rgba(0,0,0,0.06)',
              }}>
                <div className="care-plan-hospital-header" style={{
                  display:'flex', flexDirection:'column',
                  alignItems: form.headerStyle==='Left' ? 'flex-start' : 'center',
                  textAlign:  form.headerStyle==='Left' ? 'left' : 'center',
                  borderBottom: form.headerStyle==='Bordered' ? '2px solid #000' : 'none',
                  paddingBottom:'12px',
                }}>
                  <div className="hospital-logo-row" style={{ display:'flex', alignItems:'center', gap:'14px', justifyContent: form.headerStyle==='Left'?'flex-start':'center' }}>
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Hospital Logo"
                        style={{ height:'48px', width:'auto', objectFit:'contain' }}
                        onError={e=>{e.target.style.display='none';}}/>
                    ) : (
                      <div className="gs-square-logo" style={{ width:'42px', height:'42px', backgroundColor:'#10b981', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'800', fontSize:'18px', boxShadow:'0 2px 4px rgba(16,185,129,0.3)', flexShrink:0 }}>
                        <span>{form.logoText || 'GS'}</span>
                      </div>
                    )}

                    <div className="hospital-titles">
                      <h1 className="eng-title-large" style={{ margin:0, letterSpacing:'0.02em', ...fs('hospitalName') }}>
                        {form.title || form.hospitalName || 'HOSPITAL NAME'}
                      </h1>
                      {form.subTitle && (
                        <h2 className="eng-title-medium" style={{ margin:'2px 0 0', ...fs('subTitle') }}>{form.subTitle}</h2>
                      )}
                      {form.tagline && (
                        <p className="eng-tagline" style={{ margin:'2px 0 0', ...fs('tagline') }}>{form.tagline}</p>
                      )}
                    </div>
                  </div>

                  {/* Branch + Area */}
                  {(form.branchName || form.areaName) && (
                    <div style={{ marginTop:'6px', ...fs('branchName') }}>
                      {[form.branchName, form.areaName].filter(Boolean).join(' — ')}
                    </div>
                  )}

                  {/* Branch Address */}
                  {form.branchAddress && (
                    <div style={{ marginTop:'2px', ...fs('branchAddress') }}>{form.branchAddress}</div>
                  )}

                  {/* Contact Block */}
                  {(form.addressLine1 || form.phone || form.email || form.regNo || form.whatsapp) && (
                    <div style={{ marginTop:'10px', paddingTop:'8px', borderTop:'1px dashed #cbd5e1', lineHeight:'1.6', width:'100%', textAlign: form.headerStyle==='Left'?'left':'center' }}>
                      {(form.addressLine1 || form.addressLine2) && (
                        <div style={fs('addressLine1')}>
                          <strong>Addr:</strong> {[form.addressLine1, form.addressLine2].filter(Boolean).join(', ')}
                        </div>
                      )}
                      <div style={{ display:'flex', flexWrap:'wrap', justifyContent: form.headerStyle==='Left'?'flex-start':'center', gap:'4px' }}>
                        {form.phone  && <span style={fs('phone')}>📞 {form.phone}</span>}
                        {form.phone  && (form.email || form.website || (form.whatsapp && form.whatsappEnabled)) && <span style={{ color:'#94a3b8' }}>|</span>}
                        {form.whatsapp && form.whatsappEnabled && <span style={fs('whatsapp')}>💬 {form.whatsapp}</span>}
                        {form.whatsapp && form.whatsappEnabled && (form.email || form.website) && <span style={{ color:'#94a3b8' }}>|</span>}
                        {form.email  && <span style={fs('email')}>✉ {form.email}</span>}
                        {form.email  && form.website && <span style={{ color:'#94a3b8' }}>|</span>}
                        {form.website && <span style={fs('website')}>🌐 {form.website}</span>}
                      </div>
                      {form.regNo && (
                        <div style={{ marginTop:'2px', ...fs('regNo') }}>{form.regNo}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dummy Form Title */}
                <div style={{ marginTop:'20px', textAlign:'center', borderTop:'2px solid #0f172a', paddingTop:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:'#1e293b' }}>PATIENT ADMISSION &amp; CONSENT FORM</div>
                  <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'4px' }}>(Sample form view with your customized header)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
