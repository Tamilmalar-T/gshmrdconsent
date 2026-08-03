import React, { useRef, useState } from 'react';
import { Printer, FolderCheck } from 'lucide-react';

const AutoExpandingTextarea = (props) => {
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    if (props.onChange) {
      props.onChange(e);
    }
    if (props.onInput) {
      props.onInput(e);
    }
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      onInput={handleInput}
      style={{
        ...props.style,
        resize: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    />
  );
};



const TickBox = ({ className }) => {
  const [tick, setTick] = useState('');
  const handleTick = () => {
    if (tick === '') setTick('✓');
    else if (tick === '✓') setTick('✗');
    else setTick('');
  };
  return (
    <div
      className={className}
      onClick={handleTick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        color: tick === '✓' ? '#16a34a' : tick === '✗' ? '#dc2626' : 'inherit',
        fontWeight: 'bold',
        fontSize: '14px'
      }}
    >
      {tick}
    </div>
  );
};

const renderInput = (type) => {
  if (type === 'date') return <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ fontFamily: 'inherit' }} />;
  if (type === 'time') return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      <input type="time" className="arb-value-input no-icon-time" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} onClick={e => {try{e.target.showPicker()}catch(err){}}} style={{ fontFamily: 'inherit' }} />
      <span className="clear-time-btn no-print" onClick={(e) => {
        const input = e.currentTarget.previousElementSibling;
        if (input) {
          input.value = '';
          input.classList.remove('has-value');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }}>×</span>
    </div>
  );
  return <AutoExpandingTextarea className="arb-value-input" />;
};

const EmptyRows = ({ count, ids, cols, colTypes, colSpans, tableKey, onRemove }) => {
  const rows = ids || Array.from({ length: count || 0 });
  return rows.map((idOrItem, rowIndex) => {
    const id = ids ? idOrItem : rowIndex;
    return (
      <tr key={id}>
        {Array.from({ length: cols }).map((_, colIndex) => {
          const isLast = colIndex === cols - 1;
          return (
            <td key={colIndex} className="arb-value-cell" style={{ position: 'relative' }} colSpan={colSpans ? colSpans[colIndex] : undefined}>
              {renderInput(colTypes ? colTypes[colIndex] : 'text')}
              {isLast && ids && onRemove && (
                <button
                  type="button"
                  className="no-print"
                  onClick={() => onRemove(tableKey, id)}
                  style={{ position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', opacity: 0.3, zIndex: 10 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                  title="Delete Row"
                >✕</button>
              )}
            </td>
          );
        })}
      </tr>
    );
  });
};

const AddRowBtn = ({ onClick }) => (
  <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', marginBottom: '10px' }}>
    <button type="button" onClick={onClick} style={{ padding: '4px 12px', fontSize: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
      + Add Row
    </button>
  </div>
);

export default function ActivityRecordBilling({ onNavigate }) {
  const handlePrint = () => window.print();

  const generateIds = (count) => Array.from({ length: count }, () => Math.random().toString(36).substr(2, 9));
  const [rowIds, setRowIds] = useState({
    visits1_1: generateIds(4),
    visits1_2: generateIds(4),
    visits2_1: generateIds(4),
    visits2_2: generateIds(4),
    wardTransfers: generateIds(4),
    nebulization: generateIds(4),
    grbs: generateIds(4),
    abg: generateIds(4),
    support: generateIds(4),
    ventilator: generateIds(4),
    nurses: generateIds(4),
    ecg: generateIds(4),
    blood: generateIds(4),
    oxygen: generateIds(4),
    lab: generateIds(4),
    radiology: generateIds(4),
    misc: generateIds(4),
    alpha: generateIds(4),
    water: generateIds(4),
    advance: generateIds(4)
  });

  const addRow = (key) => setRowIds(p => ({ ...p, [key]: [...(p[key] || []), Math.random().toString(36).substr(2, 9)] }));
  const removeRow = (key, id) => setRowIds(p => ({ ...p, [key]: (p[key] || []).filter(rId => rId !== id) }));

  const handleVentilatorInput = (e) => {
    const tbody = e.target.closest('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    let lastConnecting = null;

    rows.forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      const textareas = tr.querySelectorAll('textarea');
      if (inputs.length < 3 || textareas.length < 1) return;
      
      const dateVal = inputs[0].value;
      const connVal = inputs[1].value;
      const discVal = inputs[2].value;
      const totalInput = textareas[0];

      let calculated = false;

      if (connVal) {
        lastConnecting = { date: dateVal, time: connVal };
      }

      if (discVal) {
        if (connVal) {
          let d1 = new Date(`${dateVal || '1970-01-01'}T${connVal}`);
          let d2 = new Date(`${dateVal || '1970-01-01'}T${discVal}`);
          if (isNaN(d1) || isNaN(d2)) {
             const [h1, m1] = connVal.split(':').map(Number);
             const [h2, m2] = discVal.split(':').map(Number);
             d1 = new Date(); d1.setHours(h1, m1, 0, 0);
             d2 = new Date(); d2.setHours(h2, m2, 0, 0);
             if (d2 < d1) d2.setDate(d2.getDate() + 1);
          } else if (d2 < d1 && dateVal) {
             d2.setDate(d2.getDate() + 1);
          } else if (d2 < d1 && !dateVal) {
             d2.setDate(d2.getDate() + 1);
          }
          
          const diffMs = d2 - d1;
          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.floor((diffMs % 3600000) / 60000);
          const newValue = `${diffHrs}h ${diffMins}m`;
          
          if (totalInput.value !== newValue) {
            totalInput.value = newValue;
            totalInput.style.height = 'auto';
            totalInput.style.height = totalInput.scrollHeight + 'px';
          }
          calculated = true;
          lastConnecting = null;
        } else if (lastConnecting) {
          let d1 = new Date(`${lastConnecting.date || '1970-01-01'}T${lastConnecting.time}`);
          let d2 = new Date(`${dateVal || '1970-01-01'}T${discVal}`);
          
          if (!isNaN(d1) && !isNaN(d2)) {
            if (d2 < d1 && (!lastConnecting.date || !dateVal || lastConnecting.date === dateVal)) {
              d2.setDate(d2.getDate() + 1);
            }
            const diffMs = d2 - d1;
            const diffHrs = Math.floor(diffMs / 3600000);
            const diffMins = Math.floor((diffMs % 3600000) / 60000);
            const newValue = `${diffHrs}h ${diffMins}m`;
            
            if (totalInput.value !== newValue) {
              totalInput.value = newValue;
              totalInput.style.height = 'auto';
              totalInput.style.height = totalInput.scrollHeight + 'px';
            }
            calculated = true;
            lastConnecting = null;
          }
        }
      }

      if (!calculated) {
        if (totalInput.value.match(/^\d+h \d+m$/)) {
          totalInput.value = '';
          totalInput.style.height = 'auto';
        }
      }
    });
  };


  return (
    <div className="arb-page-wrapper">
      {/* Top Action Row */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Activity Record Billing</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      <div className="arb-card-container">

        {/* PAGE 01 */}
        <div className="arb-print-page">
          <div className="arb-page-number">01</div>

          <table className="arb-table" style={{ borderBottom: 'none' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>Discharge Information No.</td>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>Bill No.</td>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>Date :</td>
                        <td style={{ border: 'none', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>Total Amount</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <div style={{ border: '2px solid #1e3a8a', padding: '5px', borderRadius: '5px' }}>
                      <strong style={{ color: '#1e3a8a', fontSize: '20px' }}>GS</strong>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '24px', letterSpacing: '1px' }}>GURUSHREE</h2>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>HI-TECH MULTI SPECIALITY HOSPITAL</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px' }}>
                    <h3 style={{ margin: 0, flex: 1, textAlign: 'center' }}>ACTIVITY RECORD BILLING</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>CREDIT</span>
                      <div style={{ width: '40px', height: '20px', border: '1px solid #000' }}></div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ width: '50%', padding: '4px' }}>No.</td>
                <td colSpan={2} style={{ width: '50%', padding: '4px' }}>Hospital No.</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ padding: '4px' }}>Name :</td>
                <td colSpan={2} rowSpan={2} style={{ padding: 0 }}>
                  <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '50%', padding: '4px' }}>I.P. No. :</td>
                        <td style={{ border: 'none', borderBottom: '1px solid #000', width: '50%', padding: '4px' }}>Dept. :</td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ border: 'none', padding: '4px' }}>Ref. By :</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ height: '40px', padding: '4px', verticalAlign: 'top' }}>Address & Contact No. :</td>
              </tr>
              <tr>
                <td style={{ width: '25%', padding: '4px' }}>Date of Admission :</td>
                <td style={{ width: '25%', padding: '4px' }}>Time :</td>
                <td style={{ width: '25%', padding: '4px' }}>Room/Bed No. :</td>
                <td style={{ width: '25%', padding: '4px' }}>Ward</td>
              </tr>
              <tr>
                <td style={{ padding: '4px' }}>Date of Discharge :</td>
                <td style={{ padding: '4px' }}>Time :</td>
                <td style={{ padding: '4px' }}>Room/Bed No. :</td>
                <td style={{ padding: '4px' }}>Ward</td>
              </tr>
            </tbody>
          </table>

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '25%' }} />
              {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '6%' }} />)}
            </colgroup>
            <thead>
              <tr>
                <th colSpan={14} className="arb-section-title">NO. OF VISITS</th>
              </tr>
              <tr>
                <th rowSpan={2} style={{ width: '1%' }}></th>
                <th className="arb-col-header" style={{ width: '51%' }}>DATES</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} colSpan={2} className="arb-value-cell" style={{ backgroundColor: '#f8fafc' }}>
                    <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ fontFamily: 'inherit' }} />
                  </th>
                ))}
              </tr>
              <tr>
                <th className="arb-col-header">CONSULTANTS</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header" style={{ width: '4%' }}>A.M.</th>
                    <th className="arb-col-header" style={{ width: '4%' }}>P.M.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowIds.visits1_1.map((id, i) => (
                <tr key={id}>
                  <td className="arb-value-cell" style={{ textAlign: 'center' }}>{i + 1}</td>
                  {Array.from({ length: 13 }).map((_, j) => (
                    <td key={j} className="arb-value-cell" style={{ position: 'relative' }}>
                      {j === 0 ? (
                        <AutoExpandingTextarea className="arb-value-input" />
                      ) : (
                        <TickBox className="arb-value-input" style={{ width: '100%', height: '100%' }} />
                      )}
                      {j === 12 && (
                        <button
                          type="button"
                          className="no-print"
                          onClick={() => removeRow('visits1_1', id)}
                          style={{ position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', opacity: 0.3, zIndex: 10 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                          title="Delete Row"
                        >✕</button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('visits1_1')} />


          <table className="arb-table">
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '25%' }} />
              {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '6%' }} />)}
            </colgroup>
            <thead>
              <tr>
                <th colSpan={14} className="arb-section-title">NO. OF VISITS</th>
              </tr>
              <tr>
                <th rowSpan={2} style={{ width: '1%' }}></th>
                <th className="arb-col-header" style={{ width: '51%' }}>DATES</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} colSpan={2} className="arb-value-cell" style={{ backgroundColor: '#f8fafc' }}>
                    <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ fontFamily: 'inherit' }} />
                  </th>
                ))}
              </tr>
              <tr>
                <th className="arb-col-header">CONSULTANTS</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header" style={{ width: '4%' }}>A.M.</th>
                    <th className="arb-col-header" style={{ width: '4%' }}>P.M.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowIds.visits1_2.map((id, i) => (
                <tr key={id}>
                  <td className="arb-value-cell" style={{ textAlign: 'center' }}>{i + 1}</td>
                  {Array.from({ length: 13 }).map((_, j) => (
                    <td key={j} className="arb-value-cell" style={{ position: 'relative' }}>
                      {j === 0 ? (
                        <AutoExpandingTextarea className="arb-value-input" />
                      ) : (
                        <TickBox className="arb-value-input" style={{ width: '100%', height: '100%' }} />
                      )}
                      {j === 12 && (
                        <button
                          type="button"
                          className="no-print"
                          onClick={() => removeRow('visits1_2', id)}
                          style={{ position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', opacity: 0.3, zIndex: 10 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                          title="Delete Row"
                        >✕</button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('visits1_2')} />

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '25%' }} />
              {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '6%' }} />)}
            </colgroup>
            <thead>
              <tr>
                <th colSpan={14} className="arb-section-title">NO. OF VISITS</th>
              </tr>
              <tr>
                <th rowSpan={2} style={{ width: '1%' }}></th>
                <th className="arb-col-header" style={{ width: '51%' }}>DATES</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} colSpan={2} className="arb-value-cell" style={{ backgroundColor: '#f8fafc' }}>
                    <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ fontFamily: 'inherit' }} />
                  </th>
                ))}
              </tr>
              <tr>
                <th className="arb-col-header">CONSULTANTS</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header" style={{ width: '4%' }}>A.M.</th>
                    <th className="arb-col-header" style={{ width: '4%' }}>P.M.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowIds.visits2_1.map((id, i) => (
                <tr key={id}>
                  <td className="arb-value-cell" style={{ textAlign: 'center' }}>{i + 1}</td>
                  {Array.from({ length: 13 }).map((_, j) => (
                    <td key={j} className="arb-value-cell" style={{ position: 'relative' }}>
                      {j === 0 ? (
                        <AutoExpandingTextarea className="arb-value-input" />
                      ) : (
                        <TickBox className="arb-value-input" style={{ width: '100%', height: '100%' }} />
                      )}
                      {j === 12 && (
                        <button
                          type="button"
                          className="no-print"
                          onClick={() => removeRow('visits2_1', id)}
                          style={{ position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', opacity: 0.3, zIndex: 10 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                          title="Delete Row"
                        >✕</button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('visits2_1')} />

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '25%' }} />
              {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '6%' }} />)}
            </colgroup>
            <thead>
              <tr>
                <th colSpan={14} className="arb-section-title">NO. OF VISITS</th>
              </tr>
              <tr>
                <th rowSpan={2} style={{ width: '1%' }}></th>
                <th className="arb-col-header" style={{ width: '51%' }}>DATES</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} colSpan={2} className="arb-value-cell" style={{ backgroundColor: '#f8fafc' }}>
                    <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ fontFamily: 'inherit' }} />
                  </th>
                ))}
              </tr>
              <tr>
                <th className="arb-col-header">CONSULTANTS</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header" style={{ width: '4%' }}>A.M.</th>
                    <th className="arb-col-header" style={{ width: '4%' }}>P.M.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowIds.visits2_2.map((id, i) => (
                <tr key={id}>
                  <td className="arb-value-cell" style={{ textAlign: 'center' }}>{i + 1}</td>
                  {Array.from({ length: 13 }).map((_, j) => (
                    <td key={j} className="arb-value-cell" style={{ position: 'relative' }}>
                      {j === 0 ? (
                        <AutoExpandingTextarea className="arb-value-input" />
                      ) : (
                        <TickBox className="arb-value-input" style={{ width: '100%', height: '100%' }} />
                      )}
                      {j === 12 && (
                        <button
                          type="button"
                          className="no-print"
                          onClick={() => removeRow('visits2_2', id)}
                          style={{ position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', opacity: 0.3, zIndex: 10 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                          title="Delete Row"
                        >✕</button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('visits2_2')} />
        </div>

        {/* PAGE 02 */}
        <div >




          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={5} className="arb-section-title">WARD TRANSFERS</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">TIME</th>
                <th className="arb-col-header">FROM</th>
                <th className="arb-col-header">TO</th>
                <th className="arb-col-header">SIGNATURE OF NURSE</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.wardTransfers} tableKey="wardTransfers" onRemove={removeRow} cols={5} colTypes={['date', 'time', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('wardTransfers')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={2} className="arb-section-title">OPERATION / PROCEDURE CHART</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} style={{ padding: '8px 16px' }}>
                  <strong>1. SURGERY DETAILS : OPERATION :</strong> <AutoExpandingTextarea className="arb-value-input" style={{ width: '300px', display: 'inline-block', borderBottom: '1px dashed #000' }} /><br /><br />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date : <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ width: '110px', display: 'inline-block', borderBottom: '1px dashed #000', fontFamily: 'inherit' }} /></span>
                    <span>Duration : <AutoExpandingTextarea className="arb-value-input" style={{ width: '100px', display: 'inline-block', borderBottom: '1px dashed #000' }} /></span>
                    <span>ICD : <AutoExpandingTextarea className="arb-value-input" style={{ width: '100px', display: 'inline-block', borderBottom: '1px dashed #000' }} /></span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 16px', width: '40%' }}>a. SURGEON<br />PROFESSIONAL CHARGES</td>
                <td style={{ padding: '0' }}><AutoExpandingTextarea className="arb-value-input" /></td>
              </tr>
              <tr>
                <td style={{ padding: '8px 16px' }}>b. ASSISTANT<br />PROFESSIONAL CHARGES</td>
                <td style={{ padding: '0' }}><AutoExpandingTextarea className="arb-value-input" /></td>
              </tr>
              <tr>
                <td style={{ padding: '8px 16px' }}>c. ANAESTHETIST<br />PROFESSIONAL CHARGES</td>
                <td style={{ padding: '0' }}><AutoExpandingTextarea className="arb-value-input" /></td>
              </tr>
              <tr>
                <td colSpan={2} style={{ padding: '8px 16px', height: '60px', verticalAlign: 'top' }}>
                  ANY OTHER INFORMATION :
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAGE 03 */}
        <div className="arb-print-page">
          <div className="arb-page-number">03</div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title">NEBULIZATION</th>
              </tr>
              <tr>
                <th className="arb-col-header" colSpan={2}>Date</th>
                <th className="arb-col-header" colSpan={8}>Time</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.nebulization} tableKey="nebulization" onRemove={removeRow} cols={9} colSpans={[2, 1, 1, 1, 1, 1, 1, 1, 1]} colTypes={['date', 'time', 'time', 'time', 'time', 'time', 'time', 'time', 'time']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('nebulization')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title">GRBS CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header" colSpan={2}>Date</th>
                <th className="arb-col-header" colSpan={8}>Time</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.grbs} tableKey="grbs" onRemove={removeRow} cols={9} colSpans={[2, 1, 1, 1, 1, 1, 1, 1, 1]} colTypes={['date', 'time', 'time', 'time', 'time', 'time', 'time', 'time', 'time']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('grbs')} />

          <div className="arb-spacer"></div>

          <table className="arb-table" style={{ borderBottom: 'none' }}>
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title">ABG CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header" colSpan={2}>Date</th>
                <th className="arb-col-header" colSpan={8}>Time</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.abg} tableKey="abg" onRemove={removeRow} cols={9} colSpans={[2, 1, 1, 1, 1, 1, 1, 1, 1]} colTypes={['date', 'time', 'time', 'time', 'time', 'time', 'time', 'time', 'time']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('abg')} />
        </div>

        {/* PAGE 04 */}
        <div className="arb-print-page">
          <div className="arb-page-number">04</div>

          <table className="arb-table">
            <thead>
              <tr> 
                <th colSpan={6} className="arb-section-title">VISITS : SUPPORT SERVICES</th>
              </tr>
              <tr>
                <th colSpan={3} className="arb-sub-header">PHYSIOTHERAPY</th>
                <th colSpan={3} className="arb-sub-header">DIETICIAN</th>
              </tr>
              <tr>
                {/* Physio */}
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">TREATMENT</th>
                <th className="arb-col-header">SIGN.</th>
                {/* Dietician */}
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">DIET</th>
                <th className="arb-col-header">SIGN.</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.support} tableKey="support" onRemove={removeRow} cols={6} colTypes={['date', 'text', 'text', 'date', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('support')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={6} className="arb-section-title">VENTILATOR CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">CONNECTING<br />TIME</th>
                <th className="arb-col-header">DISCONNECTING<br />TIME</th>
                <th className="arb-col-header">TOTAL CONSUMPTION</th>
                <th className="arb-col-header">CHARGES</th>
                <th className="arb-col-header">SIGNATURE</th>
              </tr>
            </thead>
            <tbody onInput={handleVentilatorInput}>
              <EmptyRows ids={rowIds.ventilator} tableKey="ventilator" onRemove={removeRow} cols={6} colTypes={['date', 'time', 'time', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('ventilator')} />
        </div>

        {/* PAGE 2 (05) */}
        <div className="arb-print-page">
          <div className="arb-page-number">05</div>

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={6} className="arb-section-title">NURSES CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header" style={{ width: '10%' }}>DATE</th>
                <th className="arb-col-header" style={{ width: '8%' }}>TIME</th>
                <th className="arb-col-header" style={{ width: '50%' }}>PROCEDURE</th>
                <th className="arb-col-header" style={{ width: '14%' }}>NAME OF STAFF</th>
                <th className="arb-col-header" style={{ width: '8%' }}>CHARGES</th>
                <th className="arb-col-header" style={{ width: '10%' }}>SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.nurses} tableKey="nurses" onRemove={removeRow} cols={6} colTypes={['date', 'time', 'text', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('nurses')} />
        </div>

        {/* PAGE 3 (06) */}
        <div className="arb-print-page">
          <div className="arb-page-number">06</div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={4} className="arb-section-title">ECG CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">NO.</th>
                <th className="arb-col-header">SIGN</th>
                <th className="arb-col-header">CHARGES</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.ecg} tableKey="ecg" onRemove={removeRow} cols={4} colTypes={['date', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('ecg')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={4} className="arb-section-title">BLOOD TRANSFUSION CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">NO.</th>
                <th className="arb-col-header">SIGN</th>
                <th className="arb-col-header">CHARGES</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.blood} tableKey="blood" onRemove={removeRow} cols={4} colTypes={['date', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('blood')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={7} className="arb-section-title">OXYGEN CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">CONNECTNG<br />TIME</th>
                <th className="arb-col-header">DISCONNECTING<br />TIME</th>
                <th className="arb-col-header">FLOW<br />RATE</th>
                <th className="arb-col-header">HOURS</th>
                <th className="arb-col-header">CHARGES</th>
                <th className="arb-col-header">SIGNATURE</th>
              </tr>
            </thead>
            <tbody onInput={(e) => handleTimeCalculation(e, 1)}>
              <EmptyRows ids={rowIds.oxygen} tableKey="oxygen" onRemove={removeRow} cols={7} colTypes={['date', 'time', 'time', 'text', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('oxygen')} />
        </div>

        {/* PAGE 4 (07) */}
        <div className="arb-print-page">
          <div className="arb-page-number">07</div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={5} className="arb-section-title">LAB INVESTIGATION CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header" style={{ width: '15%' }}>DATE</th>
                <th className="arb-col-header" style={{ width: '10%' }}>TIME</th>
                <th className="arb-col-header" style={{ width: '45%' }}>PARTICULARS</th>
                <th className="arb-col-header" style={{ width: '15%' }}>CHARGES</th>
                <th className="arb-col-header" style={{ width: '15%' }}>SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.lab} tableKey="lab" onRemove={removeRow} cols={5} colTypes={['date', 'time', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('lab')} />
        </div>

        {/* PAGE 5 (08) */}
        <div className="arb-print-page">
          <div className="arb-page-number">08</div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={5} className="arb-section-title">RADIOLOGY / ULTRA SOUND / ECHO / DOPPLER</th>
              </tr>
              <tr>
                <th className="arb-col-header" style={{ width: '15%' }}>DATE</th>
                <th className="arb-col-header" style={{ width: '10%' }}>TIME</th>
                <th className="arb-col-header" style={{ width: '45%' }}>PARTICULARS</th>
                <th className="arb-col-header" style={{ width: '15%' }}>SIGNATURE</th>
                <th className="arb-col-header" style={{ width: '15%' }}>CHARGES</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.radiology} tableKey="radiology" onRemove={removeRow} cols={5} colTypes={['date', 'time', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('radiology')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={8} className="arb-section-title" style={{ textAlign: 'left', paddingLeft: '10px' }}>MISCELLANEOUS PROCEDURE :</th>
              </tr>
              <tr>
                {Array.from({ length: 2 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header">Date</th>
                    <th className="arb-col-header">Procedure</th>
                    <th className="arb-col-header">Charges</th>
                    <th className="arb-col-header">Signature</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.misc} tableKey="misc" onRemove={removeRow} cols={8} colTypes={['date', 'text', 'text', 'text', 'date', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('misc')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title" style={{ textAlign: 'left', paddingLeft: '10px' }}>ALPHA BED CHARGES :</th>
              </tr>
              <tr>
                {Array.from({ length: 2 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header">Date</th>
                    <th className="arb-col-header">Connecting<br />Time</th>
                    <th className="arb-col-header">Disconnecting<br />Time</th>
                    <th className="arb-col-header">Charges</th>
                    <th className="arb-col-header">Signature</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.alpha} tableKey="alpha" onRemove={removeRow} cols={10} colTypes={['date', 'time', 'time', 'text', 'text', 'date', 'time', 'time', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('alpha')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title" style={{ textAlign: 'left', paddingLeft: '10px' }}>WATER BED CHARGES :</th>
              </tr>
              <tr>
                {Array.from({ length: 2 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header">Date</th>
                    <th className="arb-col-header">Connecting<br />Time</th>
                    <th className="arb-col-header">Disconnecting<br />Time</th>
                    <th className="arb-col-header">Charges</th>
                    <th className="arb-col-header">Signature</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.water} tableKey="water" onRemove={removeRow} cols={10} colTypes={['date', 'time', 'time', 'text', 'text', 'date', 'time', 'time', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('water')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={12} className="arb-section-title">ADVANCE</th>
              </tr>
              <tr>
                {Array.from({ length: 3 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="arb-col-header">DATE</th>
                    <th className="arb-col-header">RT. No.</th>
                    <th className="arb-col-header">Rs.</th>
                    <th className="arb-col-header">P.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.advance} tableKey="advance" onRemove={removeRow} cols={12} colTypes={['date', 'text', 'text', 'text', 'date', 'text', 'text', 'text', 'date', 'text', 'text', 'text']} />
            </tbody>
          </table>
          <AddRowBtn onClick={() => addRow('advance')} />

          <div className="arb-footer-section">
            <div className="arb-footer-row">
              <div className="arb-footer-col">
                <span className="arb-label">DATE :</span>
                <span className="arb-line"></span>
              </div>
              <div className="arb-footer-col" style={{ textAlign: 'right' }}>
                <span className="arb-label">STAFF NURSE</span>
              </div>
            </div>
            <div className="arb-footer-row">
              <div className="arb-footer-col">
                <span className="arb-label">TIME :</span>
                <span className="arb-line"></span>
              </div>
              <div className="arb-footer-col"></div>
            </div>
            <div className="arb-footer-row" style={{ marginTop: '15px' }}>
              <div className="arb-footer-col">
                <span className="arb-label">PREPARED BY :</span>
                <span className="arb-line" style={{ width: '200px' }}></span>
              </div>
              <div className="arb-footer-col" style={{ textAlign: 'right' }}>
                <span className="arb-label">ADMINISTRATOR</span>
              </div>
            </div>
            <div className="arb-footer-note">
              Note : To ward Staff : Before discharging the patient, please get clearance from I.P. Billing
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .arb-page-wrapper {
          padding: 20px;
          background-color: #f5f7fa;
          min-height: 100vh;
        }
        .arb-card-container {
          width: 100%;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .arb-print-page {
          padding: 40px;
          position: relative;
        }
        .arb-print-page + .arb-print-page {
          border-top: 2px dashed #ccc;
        }
        .arb-page-number {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 10px;
          color: #555;
        }
        .arb-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 13px;
          table-layout: fixed;
        }
        .arb-table th,
        .arb-table td {
          border: 1px solid #000;
        }
        .arb-section-title {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          padding: 6px;
          color: #1a365d;
          background-color: #f8fafc;
          text-transform: uppercase;
        }
        .arb-sub-header {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          padding: 4px;
          background-color: #f1f5f9;
        }
        .arb-col-header {
          text-align: center;
          font-weight: normal;
          font-size: 11px;
          padding: 4px;
          color: #333;
          text-transform: uppercase;
        }
        .arb-value-cell {
          padding: 0;
          min-height: 24px;
          vertical-align: top;
        }
        .arb-value-input {
          width: 100%;
          min-height: 24px;
          border: none;
          outline: none;
          text-align: center;
          background: transparent;
          font-size: 13px;
          font-family: inherit;
          padding: 2px;
        }
        .arb-value-input:focus {
          background-color: #f0f8ff;
        }
        input[type="date"].arb-value-input:not(.has-value):not(:focus)::-webkit-datetime-edit,
        input[type="time"].arb-value-input:not(.has-value):not(:focus)::-webkit-datetime-edit {
          color: transparent;
        }
        .arb-spacer {
          height: 20px;
        }
        
        /* Footer */
        .arb-footer-section {
          margin-top: 40px;
          font-size: 14px;
          font-weight: 500;
        }
        .arb-footer-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .arb-footer-col {
          flex: 1;
        }
        .arb-label {
          margin-right: 10px;
          color: #333;
        }
        .arb-line {
          display: inline-block;
          border-bottom: 1px dashed #000;
          width: 150px;
        }
        .arb-footer-note {
          margin-top: 30px;
          text-align: center;
          font-style: italic;
          font-size: 13px;
          color: #444;
        }
        .no-icon-time::-webkit-calendar-picker-indicator {
          display: none;
        }
        .clear-time-btn {
          display: none;
          position: absolute;
          right: 2px;
          cursor: pointer;
          color: #ef4444;
          font-weight: 900;
          font-size: 14px;
          background: #fff;
          padding: 0 4px;
          border-radius: 2px;
          z-index: 5;
        }
        .clear-time-btn:hover {
          background: #fee2e2;
        }
        .arb-value-input.has-value + .clear-time-btn {
          display: block;
        }

        @media print {
          .arb-page-wrapper {
            padding: 0;
            background: none;
          }
          .arb-card-container {
            box-shadow: none;
            max-width: none;
            border-radius: 0;
          }
          .arb-print-page {
            padding: 20px;
            page-break-after: always;
            border-top: none !important;
          }
          .arb-print-page:last-child {
            page-break-after: auto;
          }
          .arb-table {
            font-size: 11px;
          }
          .arb-value-input {
            font-size: 11px;
          }
          .arb-value-cell {
            height: 22px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
