import { useState, useEffect } from 'react';
import { getFormHeaderSettings } from './FormHeaderMasterPage';
import { findPatientByIpNo } from '../utils/patientRegistry';

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

export default function HospitalPaperHeader({ isMlc, mlc, patient }) {
  const [header, setHeader] = useState(() => getFormHeaderSettings());
  const [detectedMlc, setDetectedMlc] = useState(false);

  useEffect(() => {
    const checkMlc = () => {
      try {
        const ipInput = document.querySelector('input[name="ipNo"], input[name="ipOpNo"], input[name="mrNo"], input[name="patientIpNo"], input[name="uhidNo"]');
        const val = ipInput?.value;
        if (val && val.trim()) {
          const found = findPatientByIpNo(val.trim());
          if (found && (found.isMlc === 'yes' || found.mlc === 'Yes' || found.mlcType === 'MLC')) {
            setDetectedMlc(true);
            return;
          }
        }
        setDetectedMlc(false);
      } catch (e) {}
    };

    checkMlc();
    const handleInput = () => checkMlc();
    window.addEventListener('input', handleInput);
    window.addEventListener('change', handleInput);
    return () => {
      window.removeEventListener('input', handleInput);
      window.removeEventListener('change', handleInput);
    };
  }, []);

  const isMlcCase = (
    isMlc === true || isMlc === 'yes' || isMlc === 'Yes' ||
    mlc === true || mlc === 'yes' || mlc === 'Yes' || mlc === 'MLC' ||
    patient?.isMlc === 'yes' || patient?.isMlc === 'Yes' || patient?.isMlc === true ||
    patient?.mlc === 'Yes' || patient?.mlc === 'yes' || patient?.mlcType === 'MLC' ||
    detectedMlc
  );

  const loadHeader = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/form-header-master');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data && typeof result.data === 'object') {
          const d = result.data;
          const apiHeader = {
            hospitalCode:    d.hospital_code    || d.hospitalCode    || '',
            hospitalName:    d.hospital_name    || d.hospitalName    || 'GURUSHREE',
            branchCode:      d.branch_code      || d.branchCode      || '',
            branchName:      d.branch_name      || d.branchName      || '',
            branchAddress:   d.branch_address   || d.branchAddress   || '',
            areaName:        d.area_name        || d.areaName        || '',
            subTitle:        d.sub_title        || d.subTitle        || 'HI-TECH MULTI SPECIALITY HOSPITAL',
            tagline:         d.tagline          || 'A touch can instill faith',
            regNo:           d.reg_no           || d.regNo           || '',
            logoText:        d.logo_text        || d.logoText        || 'GS',
            logoUrl:         d.logo_url         || d.logoUrl         || '',
            phone:           d.phone            || '',
            whatsapp:        d.whatsapp         || '',
            whatsappEnabled: d.whatsapp_enabled !== undefined ? d.whatsapp_enabled : (d.whatsappEnabled !== undefined ? d.whatsappEnabled : true),
            email:           d.email            || '',
            website:         d.website          || '',
            addressLine1:    d.address_line1    || d.addressLine1    || '',
            addressLine2:    d.address_line2    || d.addressLine2    || '',
            headerStyle:     d.header_style     || d.headerStyle     || 'Center',
            status:          d.status           || 'Active',
            fieldFonts:      { ...FIELD_FONT_DEFAULTS, ...(d.field_fonts || d.fieldFonts || {}) },
          };
          setHeader(apiHeader);
          try { localStorage.setItem('form_header_master_settings', JSON.stringify(apiHeader)); } catch (e) {}
          return;
        }
      }
    } catch (e) {}
    setHeader(getFormHeaderSettings());
  };

  useEffect(() => {
    loadHeader();
    const handleUpdate = () => { setHeader(getFormHeaderSettings()); };
    window.addEventListener('form_header_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('form_header_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (header.status === 'Inactive') return null;

  const style    = header.headerStyle || 'Center';  // 'Center' | 'Left' | 'Bordered'
  const isLeft   = style === 'Left';
  const isBordered = style === 'Bordered';
  const isCentered = style === 'Center';

  const align   = isLeft ? 'left'       : 'center';
  const justify = isLeft ? 'flex-start' : 'center';

  const ff = { ...FIELD_FONT_DEFAULTS, ...(header.fieldFonts || {}) };
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

  const separator = <span style={{ color:'#94a3b8', margin:'0 4px' }}>|</span>;

  const hasContact = header.addressLine1 || header.phone || header.email
    || header.regNo || (header.whatsapp && header.whatsappEnabled) || header.website;

  return (
    <div
      className="care-plan-hospital-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'center',
        textAlign: align,
        marginBottom: '12px',
        borderBottom: isBordered ? '2px solid #000' : 'none',
        paddingBottom: isBordered ? '8px' : '0',
        position: 'relative'
      }}
    >
      {/* ── Prominent MLC Badge / Indicator ── */}
      {isMlcCase && (
        <div 
          className="header-mlc-badge"
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            backgroundColor: '#fee2e2',
            border: '2px solid #dc2626',
            color: '#dc2626',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: '900',
            fontSize: '12px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10,
            boxShadow: '0 1px 4px rgba(220, 38, 38, 0.2)'
          }}
        >
          <span>MLC</span>
        </div>
      )}
      {/* ── Logo + Hospital Name Row ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', justifyContent: justify, width:'100%' }}>
        {header.logoUrl ? (
          <img
            src={header.logoUrl}
            alt="Hospital Logo"
            style={{ height:'48px', width:'auto', objectFit:'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="gs-square-logo">
            <span className="gs-text">{header.logoText || 'GS'}</span>
          </div>
        )}

        <div className="hospital-titles" style={{ textAlign: align }}>
          <h1 className="eng-title-large" style={fs('hospitalName')}>
            {header.title || header.hospitalName || 'GURUSHREE'}
          </h1>
          {header.subTitle && (
            <h2 className="eng-title-medium" style={fs('subTitle')}>{header.subTitle}</h2>
          )}
          {header.tagline && (
            <p className="eng-tagline" style={fs('tagline')}>{header.tagline}</p>
          )}
        </div>
      </div>

      {/* ── Branch + Area ── */}
      {(header.branchName || header.areaName) && (
        <div style={{ marginTop:'4px', textAlign: align, ...fs('branchName') }}>
          {[header.branchName, header.areaName].filter(Boolean).join(' — ')}
        </div>
      )}

      {/* ── Branch Address ── */}
      {header.branchAddress && (
        <div style={{ marginTop:'2px', textAlign: align, ...fs('branchAddress') }}>
          {header.branchAddress}
        </div>
      )}

      {/* ── Contact Block ── */}
      {hasContact && (
        isCentered ? (
          /* Centered Brand — everything on ONE compact horizontal line */
          <div style={{ marginTop:'6px', textAlign:'center', width:'100%' }}>
            <div style={{ display:'inline-flex', flexWrap:'wrap', justifyContent:'center', alignItems:'center', gap:'0 2px', ...fs('addressLine1') }}>
              {header.addressLine1 && (
                <span>{[header.addressLine1, header.addressLine2].filter(Boolean).join(', ')}</span>
              )}
              {header.addressLine1 && (header.phone || header.email || header.website || (header.whatsapp && header.whatsappEnabled)) && separator}
              {header.phone && <span style={fs('phone')}>Ph: {header.phone}</span>}
              {header.phone && (header.email || header.website || (header.whatsapp && header.whatsappEnabled)) && separator}
              {header.whatsapp && header.whatsappEnabled && <span style={fs('whatsapp')}>WA: {header.whatsapp}</span>}
              {header.whatsapp && header.whatsappEnabled && (header.email || header.website) && separator}
              {header.email && <span style={fs('email')}>Email: {header.email}</span>}
              {header.email && header.website && separator}
              {header.website && <span style={fs('website')}>Web: {header.website}</span>}
            </div>
            {header.regNo && (
              <div style={{ marginTop:'1px', textAlign:'center', ...fs('regNo') }}>{header.regNo}</div>
            )}
          </div>
        ) : (
          /* Left Aligned Brand / Boxed Border Style — stacked rows, aligned per style */
          <div style={{ marginTop:'6px', lineHeight:'1.5', width:'100%', textAlign: align }}>
            {(header.addressLine1 || header.addressLine2) && (
              <div style={fs('addressLine1')}>
                {[header.addressLine1, header.addressLine2].filter(Boolean).join(', ')}
              </div>
            )}
            {(header.phone || header.email || header.website || (header.whatsapp && header.whatsappEnabled)) && (
              <div style={{ display:'flex', flexWrap:'wrap', justifyContent: justify, gap:'0 2px' }}>
                {header.phone && <span style={fs('phone')}>Ph: {header.phone}</span>}
                {header.phone && (header.email || header.website || (header.whatsapp && header.whatsappEnabled)) && separator}
                {header.whatsapp && header.whatsappEnabled && <span style={fs('whatsapp')}>WA: {header.whatsapp}</span>}
                {header.whatsapp && header.whatsappEnabled && (header.email || header.website) && separator}
                {header.email && <span style={fs('email')}>Email: {header.email}</span>}
                {header.email && header.website && separator}
                {header.website && <span style={fs('website')}>Web: {header.website}</span>}
              </div>
            )}
            {header.regNo && (
              <div style={{ marginTop:'1px', ...fs('regNo') }}>{header.regNo}</div>
            )}
          </div>
        )
      )}
    </div>
  );
}
