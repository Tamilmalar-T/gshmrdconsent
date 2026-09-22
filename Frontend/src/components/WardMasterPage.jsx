import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Layers,
  Eye,
  ArrowLeft,
  Edit2,
  Snowflake,
  Tv,
  Plug,
  Sofa,
  Fan,
  X
} from 'lucide-react';
import { getRegisteredPatients, deleteRegisteredPatient } from '../utils/patientRegistry';

const CATEGORIES = ['Ward', 'Room', 'Bed', 'Facility'];

export default function WardMasterPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [wards, setWards] = useState(() => {
    try { return JSON.parse(localStorage.getItem('masters_wards')) || []; } catch { return []; }
  });
  const [rooms, setRooms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('masters_rooms')) || []; } catch { return []; }
  });
  const [beds, setBeds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('masters_beds')) || []; } catch { return []; }
  });
  const [availableFacilities, setAvailableFacilities] = useState(() => {
    try { 
      const stored = JSON.parse(localStorage.getItem('masters_facilities'));
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored.map(s => typeof s === 'string' ? { id: s, facilityName: s, icon: null, isActive: 'Yes' } : s);
      }
      return [
        { id: 'AC', facilityName: 'AC', icon: null, isActive: 'Yes' },
        { id: 'TV', facilityName: 'TV', icon: null, isActive: 'Yes' },
        { id: 'ChargingPort', facilityName: 'Charging Port', icon: null, isActive: 'Yes' },
        { id: 'Sofa', facilityName: 'Sofa', icon: null, isActive: 'Yes' },
        { id: 'NonAC', facilityName: 'Non-AC', icon: null, isActive: 'Yes' }
      ]; 
    } catch { return []; }
  });
  
  const [form, setForm] = useState(getInitialFormState('Ward'));
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewRecord, setViewRecord] = useState(null);

  // Save to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem('masters_wards', JSON.stringify(wards));
    localStorage.setItem('masters_rooms', JSON.stringify(rooms));
    localStorage.setItem('masters_beds', JSON.stringify(beds));
    localStorage.setItem('masters_facilities', JSON.stringify(availableFacilities));
  }, [wards, rooms, beds, availableFacilities]);

  // When category changes, reset form & scroll to top
  useEffect(() => {
    handleClear();
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) mainContent.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [activeCategory]);

  function getInitialFormState(category) {
    const loggedInUser = localStorage.getItem('logged_in_user');
    let username = 'Admin';
    if (loggedInUser) {
      try {
        const userObj = JSON.parse(loggedInUser);
        username = userObj.username || 'Admin';
      } catch(e) {}
    }

    if (category === 'Facility') {
      return { id: null, facilityName: '', icon: null, isActive: 'Yes', createdBy: username };
    }

    if (category === 'Ward') {
      return { 
        id: null, 
        wardCode: '', 
        wardName: '', 
        dayCharge: '', 
        halfDayCharge: '', 
        isActive: 'Yes', 
        tax: '', 
        createdBy: username
      };
    } else if (category === 'Room') {
      return { 
        id: null, 
        roomId: '', 
        wardId: '', 
        roomNo: '', 
        isActive: 'Yes', 
        createdBy: username,
        facilities: {
          AC: { enabled: false, working: true },
          TV: { enabled: false, working: true },
          ChargingPort: { enabled: false, working: true },
          Sofa: { enabled: false, working: true },
          NonAC: { enabled: false, working: true }
        }
      };
    } else {
      return { id: null, roomId: '', wardId: '', bedNo: '', status: 'Available', isActive: 'Yes', createdBy: username };
    }
  }

  const handleClear = () => {
    setForm(getInitialFormState(activeCategory));
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (activeCategory === 'Bed' && name === 'roomId') {
      // Auto populate ward based on room
      const selectedRoom = rooms.find(r => r.roomId === value);
      setForm(prev => ({ ...prev, [name]: value, wardId: selectedRoom ? selectedRoom.wardId : '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, icon: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFacilityToggle = (facilityId) => {
    setForm(prev => {
      const current = prev.facilities?.[facilityId] || { enabled: false, working: true };
      let nextEnabled = false;
      let nextWorking = true;
      
      if (!current.enabled) {
        // Grey -> Green (Enabled / Available)
        nextEnabled = true;
        nextWorking = true;
      } else if (current.enabled && current.working) {
        // Green -> Red (Currently Not Available)
        nextEnabled = true;
        nextWorking = false;
      } else if (current.enabled && !current.working) {
        // Red -> Grey (Disabled)
        nextEnabled = false;
        nextWorking = true;
      }

      return {
        ...prev,
        facilities: {
          ...(prev.facilities || {}),
          [facilityId]: {
            enabled: nextEnabled,
            working: nextWorking
          }
        }
      };
    });
  };

  const handleFacilityChange = (facility, field, value) => {
    setForm(prev => ({
      ...prev,
      facilities: {
        ...(prev.facilities || {}),
        [facility]: {
          ...(prev.facilities?.[facility] || { enabled: false, working: true }),
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation & Uniqueness
    if (activeCategory === 'Ward') {
      if (!form.wardCode || !form.wardName) {
        setErrorMsg('Ward Code and Ward Name are required.'); return;
      }
      const duplicate = wards.find(w => w.wardCode.toLowerCase() === form.wardCode.toLowerCase() && w.id !== form.id);
      if (duplicate) { setErrorMsg('Ward Code must be unique.'); return; }
    } else if (activeCategory === 'Room') {
      if (!form.roomId || !form.wardId || !form.roomNo) {
        setErrorMsg('Room ID, Ward, and Room No are required.'); return;
      }
      const duplicateRoomId = rooms.find(r => r.roomId.toLowerCase() === form.roomId.toLowerCase() && r.id !== form.id);
      if (duplicateRoomId) { setErrorMsg('Room ID must be unique.'); return; }
      
      const duplicateRoomNo = rooms.find(r => r.wardId === form.wardId && r.roomNo.toLowerCase() === form.roomNo.toLowerCase() && r.id !== form.id);
      if (duplicateRoomNo) { setErrorMsg('Room No must be unique within this Ward.'); return; }
    } else if (activeCategory === 'Bed') {
      if (!form.roomId || !form.bedNo) {
        setErrorMsg('Room and Bed No are required.'); return;
      }
      const duplicateBed = beds.find(b => b.roomId === form.roomId && b.bedNo.toLowerCase() === form.bedNo.toLowerCase() && b.id !== form.id);
      if (duplicateBed) { setErrorMsg('Bed No must be unique within this Room.'); return; }
    } else if (activeCategory === 'Facility') {
      if (!form.facilityName) {
        setErrorMsg('Facility Name is required.'); return;
      }
      const duplicateFac = availableFacilities.find(f => f.facilityName.toLowerCase() === form.facilityName.toLowerCase() && f.id !== form.id);
      if (duplicateFac) { setErrorMsg('Facility Name must be unique.'); return; }
    }

    const payload = { ...form, createdOn: form.createdOn || new Date().toISOString() };

    if (isEditing) {
      if (activeCategory === 'Ward') {
        setWards(wards.map(w => w.id === form.id ? payload : w));
      } else if (activeCategory === 'Room') {
        setRooms(rooms.map(r => r.id === form.id ? payload : r));
      } else if (activeCategory === 'Bed') {
        setBeds(beds.map(b => b.id === form.id ? payload : b));
      } else if (activeCategory === 'Facility') {
        setAvailableFacilities(availableFacilities.map(f => f.id === form.id ? payload : f));
      }
      setSuccessMsg(`${activeCategory} updated successfully!`);
    } else {
      payload.id = Date.now().toString();
      if (activeCategory === 'Ward') {
        setWards([...wards, payload]);
      } else if (activeCategory === 'Room') {
        setRooms([...rooms, payload]);
      } else if (activeCategory === 'Bed') {
        setBeds([...beds, payload]);
      } else if (activeCategory === 'Facility') {
        setAvailableFacilities([...availableFacilities, payload]);
      }
      setSuccessMsg(`${activeCategory} created successfully!`);
    }

    handleClear();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEdit = (record) => {
    setForm(record);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeCategory}?`)) return;
    
    if (activeCategory === 'Ward') {
      const ward = wards.find(w => w.id === id);
      if (ward) {
        const dependentRooms = rooms.filter(r => r.wardId === ward.wardCode);
        const roomIds = dependentRooms.map(r => r.roomId);
        if (roomIds.length > 0) {
          setBeds(beds.filter(b => !roomIds.includes(b.roomId)));
        }
        setRooms(rooms.filter(r => r.wardId !== ward.wardCode));
        setWards(wards.filter(w => w.id !== id));
      }
    } else if (activeCategory === 'Room') {
      const room = rooms.find(r => r.id === id);
      if (room) {
        setBeds(beds.filter(b => b.roomId !== room.roomId));
        setRooms(rooms.filter(r => r.id !== id));
      }
    } else if (activeCategory === 'Bed') {
      setBeds(beds.filter(b => b.id !== id));
    } else if (activeCategory === 'Facility') {
      setAvailableFacilities(availableFacilities.filter(f => f.id !== id));
    }
  };

  const getFilteredList = () => {
    let list = [];
    if (activeCategory === 'Ward') list = wards;
    if (activeCategory === 'Room') list = rooms;
    if (activeCategory === 'Bed') list = beds;
    if (activeCategory === 'Facility') list = availableFacilities;

    if (!searchQuery) return list;
    return list.filter(item => {
      const vals = Object.values(item).join(' ').toLowerCase();
      return vals.includes(searchQuery.toLowerCase());
    });
  };

  const renderFormFields = () => {
    if (activeCategory === 'Ward') {
      return (
        <>
          <div className="pr-field">
            <label className="pr-label">Ward Code <span className="req-star">*</span></label>
            <input type="text" name="wardCode" value={form.wardCode || ''} onChange={handleChange} className="pr-input" placeholder="e.g. W01" />
          </div>
          <div className="pr-field">
            <label className="pr-label">Ward Name <span className="req-star">*</span></label>
            <input type="text" name="wardName" value={form.wardName || ''} onChange={handleChange} className="pr-input" placeholder="e.g. General Ward" />
          </div>
          <div className="pr-field">
            <label className="pr-label">Day Charge</label>
            <input type="number" name="dayCharge" value={form.dayCharge || ''} onChange={handleChange} className="pr-input" placeholder="0.00" />
          </div>
          <div className="pr-field">
            <label className="pr-label">Half-Day Charge</label>
            <input type="number" name="halfDayCharge" value={form.halfDayCharge || ''} onChange={handleChange} className="pr-input" placeholder="0.00" />
          </div>
          <div className="pr-field">
            <label className="pr-label">Tax (%)</label>
            <input type="number" name="tax" value={form.tax || ''} onChange={handleChange} className="pr-input" placeholder="0" />
          </div>
          <div className="pr-field">
            <label className="pr-label">Active</label>
            <select name="isActive" value={form.isActive || 'Yes'} onChange={handleChange} className="pr-select">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </>
      );
    }

    if (activeCategory === 'Facility') {
      return (
        <>
          <div className="pr-field">
            <label className="pr-label">Facility Name <span className="req-star">*</span></label>
            <input type="text" name="facilityName" value={form.facilityName || ''} onChange={handleChange} className="pr-input" placeholder="e.g. AC" />
          </div>
          <div className="pr-field">
            <label className="pr-label">Icon (Upload)</label>
            <input type="file" accept="image/*" onChange={handleIconUpload} className="pr-input" style={{ padding: '6px' }} />
            {form.icon && <img src={form.icon} alt="icon preview" style={{ width: '32px', height: '32px', marginTop: '8px', objectFit: 'contain' }} />}
          </div>
          <div className="pr-field">
            <label className="pr-label">Active</label>
            <select name="isActive" value={form.isActive || 'Yes'} onChange={handleChange} className="pr-select">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </>
      );
    }

    if (activeCategory === 'Room') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', width: '100%', gridColumn: '1 / -1' }}>
          {/* Left Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="pr-field">
              <label className="pr-label">Room ID <span className="req-star">*</span></label>
              <input type="text" name="roomId" value={form.roomId || ''} onChange={handleChange} className="pr-input" placeholder="e.g. R101" />
            </div>
            <div className="pr-field">
              <label className="pr-label">Ward <span className="req-star">*</span></label>
              <select name="wardId" value={form.wardId || ''} onChange={handleChange} className="pr-select">
                <option value="">Select Ward</option>
                {wards.filter(w => w.isActive === 'Yes').map(w => (
                  <option key={w.id} value={w.wardCode}>{w.wardName} ({w.wardCode})</option>
                ))}
              </select>
            </div>
            <div className="pr-field">
              <label className="pr-label">Room No <span className="req-star">*</span></label>
              <input type="text" name="roomNo" value={form.roomNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. 101" />
            </div>
            <div className="pr-field">
              <label className="pr-label">Active</label>
              <select name="isActive" value={form.isActive || 'Yes'} onChange={handleChange} className="pr-select">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {/* Right Side - Facilities Toggles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignContent: 'flex-start', padding: '16px', borderLeft: '1px solid #e2e8f0' }}>
            {availableFacilities.filter(f => f.isActive === 'Yes').map(facility => {
              const facData = form.facilities?.[facility.id] || { enabled: false, working: true };
              
              let statusColor = '#cbd5e1'; // Grey (Disabled)
              let title = facility.facilityName + ' (Disabled)';
              
              if (facData.enabled && facData.working) {
                statusColor = '#10b981'; // Green (Enabled)
                title = facility.facilityName + ' (Enabled)';
              } else if (facData.enabled && !facData.working) {
                statusColor = '#ef4444'; // Red (Not Working)
                title = facility.facilityName + ' (Not Available)';
              }
              
              const isNotWorking = facData.enabled && !facData.working;

              let FallbackIcon = CheckCircle2;
              if (facility.id === 'AC') FallbackIcon = Snowflake;
              if (facility.id === 'TV') FallbackIcon = Tv;
              if (facility.id === 'ChargingPort') FallbackIcon = Plug;
              if (facility.id === 'Sofa') FallbackIcon = Sofa;
              if (facility.id === 'NonAC') FallbackIcon = Fan;

              return (
                <button 
                  type="button" 
                  key={facility.id}
                  onClick={() => handleFacilityToggle(facility.id)}
                  title={title}
                  style={{
                    position: 'relative',
                    width: '56px', height: '56px',
                    borderRadius: '12px',
                    border: `2px solid ${statusColor}`,
                    background: facData.enabled ? (isNotWorking ? '#fef2f2' : '#ecfdf5') : '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '0',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {facility.icon ? (
                    <img src={facility.icon} alt={facility.facilityName} style={{ width: '28px', height: '28px', objectFit: 'contain', filter: isNotWorking ? 'grayscale(100%) opacity(0.5)' : (!facData.enabled ? 'grayscale(100%) opacity(0.3)' : 'none') }} />
                  ) : (
                    <FallbackIcon size={28} color={statusColor} />
                  )}
                  {isNotWorking && (
                    <X size={18} color="#ef4444" style={{ position: 'absolute', bottom: -6, right: -6, background: '#fff', borderRadius: '50%' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeCategory === 'Bed') {
      return (
        <>
          <div className="pr-field">
            <label className="pr-label">Room <span className="req-star">*</span></label>
            <select name="roomId" value={form.roomId || ''} onChange={handleChange} className="pr-select">
              <option value="">Select Room</option>
              {rooms.filter(r => r.isActive === 'Yes').map(r => {
                const ward = wards.find(w => w.wardCode === r.wardId);
                return (
                  <option key={r.id} value={r.roomId}>
                    {r.roomNo} ({ward ? ward.wardName : r.wardId})
                  </option>
                );
              })}
            </select>
          </div>
      
          <div className="pr-field">
            <label className="pr-label">Bed No <span className="req-star">*</span></label>
            <input type="text" name="bedNo" value={form.bedNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. B1" />
          </div>
          <div className="pr-field">
            <label className="pr-label">Status</label>
            <select name="status" value={form.status || 'Available'} onChange={handleChange} className="pr-select">
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>
          <div className="pr-field">
            <label className="pr-label">Active</label>
            <select name="isActive" value={form.isActive || 'Yes'} onChange={handleChange} className="pr-select">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </>
      );
    }
  };

  const renderTableHeaders = () => {
    if (activeCategory === 'Ward') {
      return (
        <tr>
          <th>WARD CODE</th>
          <th>WARD NAME</th>
          <th>DAY CHARGE</th>
          <th>STATUS</th>
          <th className="text-center">ACTIONS</th>
        </tr>
      );
    } else if (activeCategory === 'Facility') {
      return (
        <tr>
          <th>ICON</th>
          <th>FACILITY NAME</th>
          <th>STATUS</th>
          <th className="text-center">ACTIONS</th>
        </tr>
      );
    } else if (activeCategory === 'Room') {
      return (
        <tr>
          <th>ROOM ID</th>
          <th>ROOM NO</th>
          <th>WARD</th>
          <th>FACILITIES</th>
          <th>STATUS</th>
          <th className="text-center">ACTIONS</th>
        </tr>
      );
    } else if (activeCategory === 'Bed') {
      return (
        <tr>
          <th>BED NO</th>
          <th>ROOM ID</th>
          <th>WARD</th>
          <th>OCCUPANCY</th>
          <th>STATUS</th>
          <th className="text-center">ACTIONS</th>
        </tr>
      );
    }
  };

  const renderTableRows = () => {
    const list = getFilteredList();
    if (list.length === 0) {
      return <tr><td colSpan={6} className="text-center" style={{ padding: '24px', color: '#64748b' }}>No {activeCategory.toLowerCase()}s found.</td></tr>;
    }

    const renderFacilityIcon = (facilityId, facData) => {
      if (!facData?.enabled) return null;
      const facMaster = availableFacilities.find(f => f.id === facilityId);
      let IconComponent = CheckCircle2; // Fallback
      if (facilityId === 'AC') IconComponent = Snowflake;
      if (facilityId === 'TV') IconComponent = Tv;
      if (facilityId === 'ChargingPort') IconComponent = Plug;
      if (facilityId === 'Sofa') IconComponent = Sofa;
      if (facilityId === 'NonAC') IconComponent = Fan;
      
      return (
        <div key={facilityId} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#f1f5f9', borderRadius: '6px' }} title={facMaster ? facMaster.facilityName : facilityId}>
          {facMaster && facMaster.icon ? (
             <img src={facMaster.icon} alt={facMaster.facilityName} style={{ width: '16px', height: '16px', objectFit: 'contain', filter: facData.working !== false ? 'none' : 'grayscale(100%) opacity(0.5)' }} />
          ) : (
            <IconComponent size={16} color={facData.working !== false ? "#0284c7" : "#94a3b8"} />
          )}
          {facData.working === false && (
            <X size={14} color="#ef4444" style={{ position: 'absolute', bottom: -4, right: -4, background: '#fff', borderRadius: '50%' }} />
          )}
        </div>
      );
    };

    return list.map(item => {
      if (activeCategory === 'Ward') {
        return (
          <tr key={item.id}>
            <td className="font-semibold-name">{item.wardCode}</td>
            <td>{item.wardName}</td>
            <td>{item.dayCharge || '-'}</td>
            <td>
              <span className={`badge-ins-sm ${item.isActive === 'Yes' ? 'ins-yes' : 'ins-no'}`}>
                {item.isActive}
              </span>
            </td>
            <td className="text-center">
              <div className="tbl-action-btns">
                <button type="button" className="btn-tbl-action-view" onClick={() => setViewRecord(item)}><Eye size={13} /></button>
                <button type="button" className="btn-tbl-action-edit" onClick={() => handleEdit(item)} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '6px' }}><Pencil size={13} /></button>
                <button type="button" className="btn-tbl-action-delete" onClick={() => handleDelete(item.id)} style={{ marginLeft: '6px' }}><Trash2 size={13} /></button>
              </div>
            </td>
          </tr>
        );
      } else if (activeCategory === 'Facility') {
        return (
          <tr key={item.id}>
            <td>
              {item.icon ? <img src={item.icon} alt={item.facilityName} style={{ width: '24px', height: '24px', objectFit: 'contain' }} /> : <span style={{ color: '#94a3b8' }}>-</span>}
            </td>
            <td className="font-semibold-name">{item.facilityName}</td>
            <td>
              <span className={`badge-ins-sm ${item.isActive === 'Yes' ? 'ins-yes' : 'ins-no'}`}>
                {item.isActive}
              </span>
            </td>
            <td className="text-center">
              <div className="tbl-action-btns">
                <button type="button" className="btn-tbl-action-view" onClick={() => setViewRecord(item)}><Eye size={13} /></button>
                <button type="button" className="btn-tbl-action-edit" onClick={() => handleEdit(item)} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '6px' }}><Pencil size={13} /></button>
                <button type="button" className="btn-tbl-action-delete" onClick={() => handleDelete(item.id)} style={{ marginLeft: '6px' }}><Trash2 size={13} /></button>
              </div>
            </td>
          </tr>
        );
      } else if (activeCategory === 'Room') {
        const ward = wards.find(w => w.wardCode === item.wardId);
        return (
          <tr key={item.id}>
            <td className="font-semibold-name">{item.roomId}</td>
            <td>{item.roomNo}</td>
            <td>{ward ? ward.wardName : item.wardId}</td>
            <td>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {item.facilities && Object.entries(item.facilities).map(([fac, data]) => renderFacilityIcon(fac, data))}
                {(!item.facilities || !Object.values(item.facilities).some(f => f.enabled)) && <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>}
              </div>
            </td>
            <td>
              <span className={`badge-ins-sm ${item.isActive === 'Yes' ? 'ins-yes' : 'ins-no'}`}>
                {item.isActive}
              </span>
            </td>
            <td className="text-center">
              <div className="tbl-action-btns">
                <button type="button" className="btn-tbl-action-view" onClick={() => setViewRecord(item)}><Eye size={13} /></button>
                <button type="button" className="btn-tbl-action-edit" onClick={() => handleEdit(item)} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '6px' }}><Pencil size={13} /></button>
                <button type="button" className="btn-tbl-action-delete" onClick={() => handleDelete(item.id)} style={{ marginLeft: '6px' }}><Trash2 size={13} /></button>
              </div>
            </td>
          </tr>
        );
      } else if (activeCategory === 'Bed') {
        const room = rooms.find(r => r.roomId === item.roomId);
        const ward = wards.find(w => w.wardCode === item.wardId);
        return (
          <tr key={item.id}>
            <td className="font-semibold-name">{item.bedNo}</td>
            <td>{room ? room.roomNo : item.roomId}</td>
            <td>{ward ? ward.wardName : item.wardId}</td>
            <td>{item.status}</td>
            <td>
              <span className={`badge-ins-sm ${item.isActive === 'Yes' ? 'ins-yes' : 'ins-no'}`}>
                {item.isActive}
              </span>
            </td>
            <td className="text-center">
              <div className="tbl-action-btns">
                <button type="button" className="btn-tbl-action-view" onClick={() => setViewRecord(item)}><Eye size={13} /></button>
                <button type="button" className="btn-tbl-action-edit" onClick={() => handleEdit(item)} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '6px' }}><Pencil size={13} /></button>
                <button type="button" className="btn-tbl-action-delete" onClick={() => handleDelete(item.id)} style={{ marginLeft: '6px' }}><Trash2 size={13} /></button>
              </div>
            </td>
          </tr>
        );
      }
    });
  };

  return (
    <div className="patient-register-container" style={{ padding: '24px' }}>
      
      {/* Toast */}
      {successMsg && (
        <div className="alert-success-toast no-print">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">Ward Master</h1>
          <p className="pr-sub-title">Configure wards, rooms, and bed availability.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Sidebar categories */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#0284c7" /> Setup Categories
            </h3>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {CATEGORIES.map(cat => (
              <li 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{ 
                  padding: '14px 16px', 
                  borderBottom: '1px solid #f1f5f9', 
                  cursor: 'pointer',
                  background: activeCategory === cat ? '#e0f2fe' : 'transparent',
                  color: activeCategory === cat ? '#0284c7' : '#475569',
                  fontWeight: activeCategory === cat ? '600' : '500',
                  borderLeft: activeCategory === cat ? '3px solid #0284c7' : '3px solid transparent'
                }}
              >
                {cat}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Form */}
          <div className="pr-card-box">
            <div className="pr-card-header-strip">
              <Plus size={16} />
              <span>{isEditing ? `Edit ${activeCategory}` : `Add New ${activeCategory}`}</span>
            </div>
            
            <div className="pr-card-body">
              {errorMsg && (
                <div className="alert-error-banner">
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="pr-form-4col-grid">
                  {renderFormFields()}
                </div>
                
                <div className="pr-form-footer-actions">
                  <button type="button" className="btn-pr-clear" onClick={handleClear}>Clear Form</button>
                  <button type="submit" className="btn-pr-register" style={{ backgroundColor: isEditing ? '#eab308' : '#0070bb', color: '#fff' }}>
                    {isEditing ? 'Update ' : 'Save '}{activeCategory}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Table */}
          <div className="pr-card-box pr-table-card">
            <div className="pr-card-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} />
                <span>Manage {activeCategory}s</span>
              </div>
              <div className="pr-search-bar" style={{ margin: 0 }}>
                <Search size={16} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeCategory.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="pr-table-responsive">
              <table className="pr-data-table">
                <thead>{renderTableHeaders()}</thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* View Modal */}
      {viewRecord && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '12px', width: '500px', maxWidth: '95%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="#0ea5e9" /> {activeCategory} Details
              </h3>
              <button onClick={() => setViewRecord(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(viewRecord).map(([key, val]) => {
                if (key === 'id') return null;
                if (key === 'facilities') {
                  const enabledFacs = Object.entries(val || {}).filter(([_, f]) => f.enabled);
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                        Facilities
                      </span>
                      <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                        {enabledFacs.length > 0 ? enabledFacs.map(([f, d]) => {
                          const facMaster = availableFacilities.find(fac => fac.id === f);
                          const name = facMaster ? facMaster.facilityName : f;
                          return `${name}${!d.working ? ' (Not Working)' : ''}`;
                        }).join(', ') : '-'}
                      </span>
                    </div>
                  );
                }
                if (key === 'icon') {
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                        Icon
                      </span>
                      {val ? <img src={val} alt="icon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /> : '-'}
                    </div>
                  );
                }
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{val || '-'}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button onClick={() => setViewRecord(null)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  if (!hours || !minutes) return time24;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export function IPListPage({ onNavigate, onEditRecord }) {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewPatient, setViewPatient] = useState(null);

  useEffect(() => {
    setPatients(getRegisteredPatients());
  }, []);

  const handleDelete = async (ipNo) => {
    if (window.confirm(`Are you sure you want to permanently delete patient record (${ipNo})?`)) {
      const updated = await deleteRegisteredPatient(ipNo);
      setPatients(updated);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      (p.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ipNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.uhidNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ward || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bedNo || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="patient-register-container" style={{ padding: '24px' }}>
      <div className="pr-page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => onNavigate('patient-registration')}
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600' }}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1 className="pr-main-title">IP Patient List</h1>
            <p className="pr-sub-title">List of all registered inpatients.</p>
          </div>
        </div>
        <div className="pr-search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', marginLeft: '8px', fontSize: '14px', width: '200px' }}
          />
          <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', color: '#475569', fontWeight: '600' }}>
            {patients.length} records
          </span>
        </div>
      </div>

      <div className="pr-card-box pr-table-card">
        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>UHID NO.</th>
                <th>IP NO.</th>
                <th>PATIENT NAME</th>
                <th>MOBILE NO.</th>
                <th>REG DATE</th>
                <th>CONSULTANT</th>
                <th>WARD/BED</th>
                <th>PAYMENT DETAILS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="pr-empty-cell">No registered patients found.</td>
                </tr>
              ) : (
                filteredPatients.map((pt) => (
                  <tr key={pt.ipNo}>
                    <td>{pt.uhidNo}</td>
                    <td>{pt.ipNo}</td>
                    <td className="font-semibold-name">{pt.patientName}</td>
                    <td>{pt.mobileNo || '-'}</td>
                    <td>{pt.regDate}</td>
                    <td>{pt.consultant}</td>
                    <td>{pt.ward || '-'} / {pt.bedNo || '-'}</td>
                    <td>
                      <span className={`badge-ins-sm ${pt.paymentDetails === 'Insurance' ? 'ins-yes' : 'ins-no'}`}>
                        {pt.paymentDetails || 'Self'}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns">
                        <button 
                          type="button" 
                          className="btn-tbl-action-view"
                          onClick={() => setViewPatient(pt)}
                          title="View Details"
                        >
                          <Eye size={13} /> 
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-edit"
                          style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '6px' }}
                          onClick={() => onEditRecord('patient-registration', pt, pt.ipNo)}
                          title="Edit Patient"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-delete"
                          style={{ marginLeft: '6px' }}
                          onClick={() => handleDelete(pt.ipNo)}
                          title="Delete Patient"
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

      {/* Patient Details Modal Popup */}
      {viewPatient && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '12px', width: '600px', maxWidth: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <Eye size={20} color="#0070bb" />
                Patient Details Overview
              </h3>
              <button 
                onClick={() => setViewPatient(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'y: 16px, x: 24px', rowGap: '16px', columnGap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PATIENT NAME</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>{viewPatient.patientName}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>UHID NO.</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{viewPatient.uhidNo}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>MOBILE NO.</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{viewPatient.mobileNo || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>IP NO.</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{viewPatient.ipNo}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PATIENT & ADMISSION TYPE</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{viewPatient.patientType || 'Normal'} / {viewPatient.admissionType || 'Emergency'}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ADMISSION</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.doa || '-'} {viewPatient.doaTime ? `at ${formatTime12h(viewPatient.doaTime)}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>REG DATE</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{viewPatient.regDate}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>CONSULTANT & REFERRAL</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.consultant || '-'} / {viewPatient.referral || '-'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PAYMENT DETAILS</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    <span className={`badge-ins-sm ${viewPatient.paymentDetails === 'Insurance' ? 'ins-yes' : 'ins-no'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                      {viewPatient.paymentDetails || 'Self'}
                    </span>
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ADDRESS</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.address || '-'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PINCODE</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.pincode || '-'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ALT CONTACT</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.altContact || '-'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>EMAIL</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.email || '-'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>AGE</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.age || '-'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ATTENDER</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    {viewPatient.attender || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
               <button 
                onClick={() => setViewPatient(null)} 
                style={{ padding: '9px 18px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
