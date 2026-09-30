import { useState, useEffect } from 'react';
import { getFormHeaderSettings } from './FormHeaderMasterPage';

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

export default function HospitalPaperHeader() {
  const [header, setHeader] = useState(() => getFormHeaderSettings());

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

  const isLeft = header.headerStyle === 'Left';
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

  const align = isLeft ? 'left' : 'center';
  const justify = isLeft ? 'flex-start' : 'center';

  return (
    <div className="care-plan-hospital-header" style={{
      display:'flex', flexDirection:'column',
      alignItems: isLeft ? 'flex-start' : 'center',
      textAlign: align,
      marginBottom:'12px',
      borderBottom: header.headerStyle === 'Bordered' ? '2px solid #000' : 'none',
      paddingBottom: header.headerStyle === 'Bordered' ? '8px' : '0',
    }}>

      <div className="center-hospital-brand" style={{ width:'100%' }}>
        <div className="hospital-logo-row" style={{ justifyContent: justify }}>

          {header.logoUrl ? (
            <img src={header.logoUrl} alt="Hospital Logo"
              style={{ height:'48px', width:'auto', objectFit:'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="gs-square-logo">
              <span className="gs-text">{header.logoText || 'GS'}</span>
            </div>
          )}

          <div className="hospital-titles">
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
      </div>

      {/* Branch + Area */}
      {(header.branchName || header.areaName) && (
        <div style={{ marginTop:'4px', ...fs('branchName') }}>
          {[header.branchName, header.areaName].filter(Boolean).join(' — ')}
        </div>
      )}

      {/* Branch Address */}
      {header.branchAddress && (
        <div style={{ marginTop:'2px', ...fs('branchAddress') }}>{header.branchAddress}</div>
      )}

      {/* Contact Block */}
      {(header.addressLine1 || header.phone || header.email || header.regNo || header.whatsapp) && (
        <div style={{ marginTop:'6px', lineHeight:'1.5', width:'100%', textAlign: align }}>
          {(header.addressLine1 || header.addressLine2) && (
            <div style={fs('addressLine1')}>
              {[header.addressLine1, header.addressLine2].filter(Boolean).join(', ')}
            </div>
          )}
          {(header.phone || header.email || header.website || (header.whatsapp && header.whatsappEnabled)) && (
            <div>
              {header.phone && <span style={fs('phone')}>Ph: {header.phone}</span>}
              {header.phone && (header.email || header.website || (header.whatsapp && header.whatsappEnabled)) && <span style={{ color:'#94a3b8', margin:'0 4px' }}>|</span>}
              {header.whatsapp && header.whatsappEnabled && <span style={fs('whatsapp')}>WA: {header.whatsapp}</span>}
              {header.whatsapp && header.whatsappEnabled && (header.email || header.website) && <span style={{ color:'#94a3b8', margin:'0 4px' }}>|</span>}
              {header.email && <span style={fs('email')}>Email: {header.email}</span>}
              {header.email && header.website && <span style={{ color:'#94a3b8', margin:'0 4px' }}>|</span>}
              {header.website && <span style={fs('website')}>Web: {header.website}</span>}
            </div>
          )}
          {header.regNo && (
            <div style={{ marginTop:'1px', ...fs('regNo') }}>{header.regNo}</div>
          )}
        </div>
      )}
    </div>
  );
}
