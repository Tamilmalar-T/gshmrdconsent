import { useState, useEffect } from 'react';
import { 
  Search,
  FileText,
  ClipboardList,
  FlaskConical,
  UserPlus,
  ArrowDownCircle,
  Activity,
  AlertCircle
} from 'lucide-react';
import { findPatientByIpNo } from '../utils/patientRegistry';

const ConsolidatedAssessmentPage = ({ onEdit }) => {
  const [ipNoSearch, setIpNoSearch] = useState(() => localStorage.getItem('ca_ipNoSearch') || '');
  const [patientData, setPatientData] = useState(null);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState(() => localStorage.getItem('ca_filterType') || 'All Logs');
  const [searchText, setSearchText] = useState(() => localStorage.getItem('ca_searchText') || '');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('ca_sortOrder') || 'Oldest First');

  useEffect(() => {
    localStorage.setItem('ca_ipNoSearch', ipNoSearch);
  }, [ipNoSearch]);

  useEffect(() => {
    localStorage.setItem('ca_filterType', filterType);
  }, [filterType]);

  useEffect(() => {
    localStorage.setItem('ca_searchText', searchText);
  }, [searchText]);

  useEffect(() => {
    localStorage.setItem('ca_sortOrder', sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    if (ipNoSearch) {
      handleSearch();
    }
     
  // Run only on initial mount to restore search state
  }, []); 

  async function handleSearch() {
    if (!ipNoSearch.trim()) return;
    
    setLoading(true);
    setError(null);
    setPatientData(null);
    setTimelineEntries([]);

    try {
      // Find patient details from registry
      const patient = findPatientByIpNo(ipNoSearch);
      
      // Fetch all records to filter for this IP
      const res = await fetch('http://localhost:5000/api/records/all');
      const json = await res.json();
      
      let allRecords = [];
      if (json.success) {
        allRecords = json.data.filter(r => {
          const rIp = r.patientIpNo || '';
          const pIp = patient ? patient.ipNo || patient.uhidNo : ipNoSearch;
          // Basic match logic
          return rIp.replace(/[^A-Z0-9]/gi, '').toLowerCase() === pIp.replace(/[^A-Z0-9]/gi, '').toLowerCase();
        });
      }

      if (!patient && allRecords.length === 0) {
        setError('No patient or records found for this IP Number.');
        setLoading(false);
        return;
      }

      // We might have records but no patient in local registry (e.g., from DB). 
      // If we have a patient, use it. Otherwise, construct from first record.
      let finalPatient = patient;
      if (!finalPatient && allRecords.length > 0) {
        const first = allRecords[0].data || {};
        finalPatient = {
          patientName: first.patientName || first.name || allRecords[0].patientName || 'Unknown Patient',
          age: first.age || '--',
          sex: first.sex || '--',
          ipNo: allRecords[0].patientIpNo,
          uhidNo: first.uhidNo || '--',
          doa: first.doa || '--',
          dod: first.dod || '--',
          ward: first.ward || '--',
          bedNo: first.bedNo || '--',
          medicalInsurance: first.medicalInsurance || 'No',
          consultantName: first.consultantName || '--',
          mobile: first.mobile || '--'
        };
      }

      setPatientData(finalPatient);

      // Process records into timeline entries
      const entries = allRecords.map(r => {
        let type = 'Unknown';
        let category = 'All Logs';
        let icon = FileText;
        let color = '#94a3b8';
        let summary = '';
        
        const ft = r.formType || '';
        if (ft.includes('Nurse') || ft.includes('Nursing')) {
          category = 'Nurses Notes';
          type = ft;
          icon = ClipboardList;
          color = '#eab308'; // yellow
          summary = 'Nursing assessment and care plan documented.';
        } else if (ft.includes('Progress') || ft.includes('Prescription') || ft.includes('Transfer')) {
          category = 'Doctor Notes';
          type = ft;
          icon = FileText;
          color = '#3b82f6'; // blue
          summary = 'Clinical progress or orders updated by physician.';
        } else if (ft.includes('Lab') || ft.includes('Investigation') || ft.includes('Culture')) {
          category = 'Lab Orders';
          type = ft;
          icon = FlaskConical;
          color = '#a855f7'; // purple
          const tests = r.data?.investigationsRequested || r.data?.tests || [];
          if (Array.isArray(tests) && tests.length > 0) {
            summary = `Laboratory Tests Ordered: [${tests.map(t => t.testName || t.name || t).join(', ')}] | Priority: ${r.data?.priority || 'Routine'}`;
          } else {
            summary = 'Laboratory Tests Ordered | Priority: Routine';
          }
        } else if (ft.includes('Admission')) {
          category = 'Admission Event';
          type = ft;
          icon = UserPlus;
          color = '#f97316'; // orange
          summary = `Admitted to ward: ${finalPatient?.ward || '--'} (Bed: ${finalPatient?.bedNo || '--'}) | Insurance: ${finalPatient?.medicalInsurance || 'No'}`;
        } else {
          type = ft;
          icon = Activity;
          color = '#14b8a6'; // teal
          summary = 'Record documented.';
        }

        return {
          id: r.id,
          type,
          category,
          date: new Date(r.savedAt),
          dateStr: r.savedAt,
          user: r.createdBy || 'Unknown User',
          icon,
          color,
          summary,
          raw: r
        };
      });

      setTimelineEntries(entries);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch records. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEntries = () => {
    let filtered = timelineEntries;
    
    if (filterType !== 'All Logs') {
      filtered = filtered.filter(e => e.type === filterType);
    }
    
    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(e => 
        e.type.toLowerCase().includes(q) || 
        e.summary.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q)
      );
    }
    
    filtered.sort((a, b) => {
      if (sortOrder === 'Oldest First') {
        return a.date - b.date;
      } else {
        return b.date - a.date;
      }
    });
    
    return filtered;
  };

  const filteredEntries = getFilteredEntries();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCardDoubleClick = (entry) => {
    if (onEdit) {
      const formTypeMap = {
        'Consent for General Admission': 'general-admission-consent',
        'Initial Assessment Form': 'initial-assessment-form',
        'Emergency Doctor Initial Assessment': 'emergency-doctor-initial-assessment',
        'Nursing Initial Assessment': 'nursing-initial-assessment',
        'Antenatal Case Record': 'antenatal-case-record',
        'Progress Sheet - Consultant': 'progress-sheet',
        'Progress Sheet': 'progress-sheet',
        'Progress and Reassessment Record - Resident Doctor': 'resident-doctor-progress',
        'Progress & Reassessment Record - Resident Doctor': 'resident-doctor-progress',
        'Nurses Care Plan': 'nurse-care-plan',
        'Nurses Daily Assessment Care Plan': 'nurses-daily-assessment',
        'Regular Drug Prescriptions': 'regular-drug-prescription',
        'Regular Drug Prescription': 'regular-drug-prescription',
        'Investigation Chart': 'investigation-chart',
        'Vitals Chart': 'vitals-chart',
        'BP Chart': 'bp-chart',
        'Diabetic Chart': 'diabetic-chart',
        'Intake & Output Record': 'intake-output',
        'Intake Output Record': 'intake-output',
        'Culture Chart': 'culture-chart',
        'Activity Record Billing': 'activity-record-billing',
        'Initial Assessment By Doctor - OP': 'initial-assessment-by-doctor',
        'Internal Transfer Form': 'internal-transfer-form',
        'Laboratory Requisition': 'lab-requisition',
        'Medical Record Checklist': 'mrd-checklist',
        'Partograph': 'partograph',
        'Labour Record': 'labour-record',
        'Surgical Safety Check List': 'surgical-safety-checklist',
        'Post Operative Check List': 'post-operative-checklist',
        'Room Tariff': 'room-tariff',
        'PRE-OPERATIVE CHECKLIST': 'pre-operative-checklist',
        'Pre-Operative Checklist': 'pre-operative-checklist',
        'ADMISSION RECORD': 'admission-record',
        'Admission Record': 'admission-record',
        'Consent for Hospitalization & Conditions of Service': 'consent-hospitalization-conditions-of-service',
        'Operation Notes': 'operation-notes',
        'Operation Notes for Caesarean Section': 'operation-notes-caesarean-section',
        'Transfer Form - External': 'external-transfer-form',
        'External Transfer Form': 'external-transfer-form',
        'INFORMED CONSENT FOR HIV ANTIBODIES TEST': 'consent-hiv-antibodies-test',
        'Informed Consent for HIV Antibodies Test': 'consent-hiv-antibodies-test',
        'Incident Report': 'incident-report',
        'Adverse Drug Reaction Report Form': 'adverse-drug-reaction-report',
        'Physiotherapy Assessment & Reassessment Form': 'physiotherapy-assessment',
      };
      
      const rawFormType = entry.raw?.formType || entry.type;
      const tabId = formTypeMap[rawFormType] || 'general-admission-consent';
      
      onEdit(tabId, entry.raw?.data || {}, entry.id);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Enter Patient IP Number to search..."
            value={ipNoSearch}
            onChange={(e) => setIpNoSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '10px 10px 10px 38px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        <button 
          onClick={handleSearch}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Search
        </button>
      </div>

      {loading && <p>Loading patient details...</p>}
      {error && <div style={{ color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18}/> {error}</div>}

      {patientData && (
        <>
          {/* Clinical Profile Banner */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '20px 24px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>
              Clinical Profile
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>{patientData.patientName}</h2>
                  <span style={{ color: '#94a3b8', fontSize: '16px' }}>{patientData.age} / {patientData.sex}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '24px', color: '#cbd5e1', fontSize: '13px', flexWrap: 'wrap' }}>
                  <span><strong style={{color:'#64748b', fontWeight:'600'}}>IP:</strong> <span style={{color:'#38bdf8', fontWeight:'700'}}>{patientData.ipNo}</span></span>
                  <span><strong style={{color:'#64748b', fontWeight:'600'}}>UHID:</strong> {patientData.uhidNo}</span>
                  <span><strong style={{color:'#64748b', fontWeight:'600'}}>DOA:</strong> {patientData.doa}</span>
                  <span><strong style={{color:'#64748b', fontWeight:'600'}}>DOD:</strong> {patientData.dod || '—'}</span>
                  <span><strong style={{color:'#64748b', fontWeight:'600'}}>Mobile:</strong> {patientData.mobile || '--'}</span>
                  <span><strong style={{color:'#64748b', fontWeight:'600'}}>Insurance:</strong> <span style={{color: patientData.medicalInsurance === 'Yes' ? '#4ade80' : '#f87171'}}>{patientData.medicalInsurance || 'No'}</span></span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '10px 16px', borderRadius: '8px', minWidth: '120px' }}>
                  <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Ward / Bed</div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{patientData.ward} / {patientData.bedNo}</div>
                </div>
                <div style={{ backgroundColor: '#0f172a', padding: '10px 16px', borderRadius: '8px', minWidth: '120px' }}>
                  <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Doctor</div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{patientData.consultantName || '--'}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Left Sidebar Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '260px', flexShrink: 0, position: 'sticky', top: '20px' }}>
              {['All Logs', ...Array.from(new Set(timelineEntries.map(e => e.type)))].map(type => {
                const getEmojiForFormType = (t) => {
                  if (t === 'All Logs') return '📋';
                  if (t.includes('Nurse') || t.includes('Nursing')) return '👩‍⚕️';
                  if (t.includes('Progress') || t.includes('Prescription') || t.includes('Transfer') || t.includes('Doctor')) return '🩺';
                  if (t.includes('Lab') || t.includes('Investigation') || t.includes('Culture')) return '🧪';
                  if (t.includes('Admission') || t.includes('Consent')) return '🚪';
                  if (t.includes('Chart')) return '📊';
                  if (t.includes('Record')) return '📁';
                  return '📄';
                };
                return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: filterType === type ? '#f1f5f9' : 'white',
                    border: `1px solid ${filterType === type ? '#cbd5e1' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: filterType === type ? '600' : '500',
                    color: filterType === type ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '6px',
                    boxShadow: filterType === type ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                >
                  {getEmojiForFormType(type) && <span style={{fontSize:'12px', flexShrink: 0}}>{getEmojiForFormType(type)}</span>}
                  <span style={{
                    flex: 1, 
                    textAlign: 'left', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis'
                  }} title={type}>{type}</span>
                  {type !== 'All Logs' && (
                    <span style={{fontSize: '11px', backgroundColor: filterType === type ? '#cbd5e1' : '#f1f5f9', padding: '2px 6px', borderRadius: '10px', color: '#475569', flexShrink: 0}}>
                      {timelineEntries.filter(e => e.type === type).length}
                    </span>
                  )}
                </button>
              )})}
            </div>
            
            {/* Right Main Content */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'Oldest First' ? 'Newest First' : 'Oldest First')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#3b82f6',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowDownCircle size={14} style={{transform: sortOrder === 'Oldest First' ? 'rotate(180deg)' : 'none'}}/>
                  {sortOrder}
                </button>
                
                <input
                  type="text"
                  placeholder="Filter timeline text..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    width: '200px'
                  }}
                />
              </div>
            
              {/* Note Banner */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#64748b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{color: '#eab308'}}>💡</span>
                Double-click / double-tap any timeline card below to open its corresponding form with this patient's details automatically loaded.
              </div>

              {/* Timeline */}
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '11px', width: '2px', backgroundColor: '#e2e8f0' }}></div>
                
                {filteredEntries.length === 0 ? (
                  <p style={{ color: '#64748b', fontStyle: 'italic' }}>No timeline entries found for this category.</p>
                ) : (
                  filteredEntries.map(entry => {
                    const IconComp = entry.icon;
                    return (
                      <div 
                        key={entry.id} 
                        style={{ position: 'relative', marginBottom: '24px', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onDoubleClick={() => handleCardDoubleClick(entry)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
                      >
                        <div style={{ 
                          position: 'absolute', 
                          left: '-24px', 
                          top: '16px', 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          backgroundColor: 'white',
                          border: `2px solid ${entry.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'translateX(-50%)',
                          zIndex: 1
                        }}>
                          <IconComp size={12} color={entry.color} />
                        </div>
                        
                        <div style={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderLeft: `4px solid ${entry.color}`,
                          borderRadius: '8px',
                          padding: '16px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', color: entry.color, fontSize: '15px' }}>{entry.type}</span>
                              <span style={{ color: '#cbd5e1' }}>—</span>
                              <span style={{ color: '#64748b', fontSize: '13px' }}>{entry.dateStr}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Documented by: <span style={{ fontWeight: '600', color: '#334155' }}>{entry.user}</span>
                            </div>
                          </div>
                          
                          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '14px', color: '#334155' }}>
                            {entry.summary}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsolidatedAssessmentPage;
