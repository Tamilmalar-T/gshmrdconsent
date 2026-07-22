import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';

export default function NursesCarePlanPage() {
  // Patient Metadata State
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    doa: '',
    ward: '',
    bed: ''
  });

  // Notes Rows State
  const [rows, setRows] = useState([
    {
      id: 1,
      date: '2026-07-21',
      time: '06:00',
      notes: '',
      sign: 'Sadhana',
      signImg: 'Sadhana'
    },
    {
      id: 2,
      date: '',
      time: '',
      notes: '',
      sign: 'Sadhana',
      signImg: 'Sadhana'
    },
    {
      id: 3,
      date: '',
      time: '',
      notes: '',
      sign: 'Sadhana',
      signImg: 'Sadhana'
    }
  ]);

  const [toastMsg, setToastMsg] = useState('');

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowChange = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      date: '',
      time: '',
      notes: '',
      sign: 'Sadhana',
      signImg: 'Sadhana'
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (id) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const handleClearForm = () => {
    setPatient({
      name: '',
      age: '',
      sex: 'Male',
      uhidNo: '',
      ipNo: '',
      doa: '',
      ward: '',
      bed: ''
    });
    setRows([
      { id: 1, date: '', time: '', notes: '', sign: 'Sadhana', signImg: 'Sadhana' },
      { id: 2, date: '', time: '', notes: '', sign: 'Sadhana', signImg: 'Sadhana' },
      { id: 3, date: '', time: '', notes: '', sign: 'Sadhana', signImg: 'Sadhana' }
    ]);
  };

  const handleSavePlan = () => {
    setToastMsg('Nurse Care Plan saved successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="nurse-care-plan-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Mint Green Card Container */}
      <div className="mint-card-container">
        
        {/* Inner White Form Box */}
        <div className="inner-white-form-box">
          
          {/* Patient Info Table */}
          <table className="mint-patient-info-table">
            <tbody>
              <tr>
                <td colSpan="2" className="cell-patient-name">
                  <div className="info-field-group">
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
                  <div className="info-field-group col-vertical">
                    <span className="info-lbl-bold">Age</span>
                    <div className="field-sub-row">
                      <span className="colon-span">:</span>
                      <input 
                        type="text" 
                        name="age" 
                        value={patient.age} 
                        onChange={handlePatientChange} 
                        className="info-input-plain"
                      />
                    </div>
                  </div>
                </td>
                <td className="cell-sex">
                  <div className="info-field-group col-vertical">
                    <span className="info-lbl-bold">Sex</span>
                    <div className="field-sub-row">
                      <span className="colon-span">:</span>
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
                  </div>
                </td>
              </tr>

              <tr>
                <td className="cell-uhid">
                  <div className="info-field-group">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input 
                      type="text" 
                      name="uhidNo" 
                      value={patient.uhidNo} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-ipno">
                  <div className="info-field-group">
                    <span className="info-lbl-blue">IP No. :</span>
                    <input 
                      type="text" 
                      name="ipNo" 
                      value={patient.ipNo} 
                      onChange={handlePatientChange} 
                      placeholder="Type IP No. and press Enter..." 
                      className="info-input-plain ip-placeholder-blue"
                    />
                  </div>
                </td>
                <td className="cell-doa">
                  <div className="info-field-group col-vertical">
                    <span className="info-lbl-bold">DOA</span>
                    <div className="field-sub-row">
                      <span className="colon-span">:</span>
                      <input 
                        type="text" 
                        name="doa" 
                        value={patient.doa} 
                        onChange={handlePatientChange} 
                        placeholder="dd/mm/yyyy" 
                        className="info-input-plain"
                      />
                    </div>
                  </div>
                </td>
                <td className="cell-ward-bed">
                  <div className="ward-bed-flex">
                    <div className="sub-wb-item">
                      <span className="info-lbl-bold">Ward:</span>
                      <input 
                        type="text" 
                        name="ward" 
                        value={patient.ward} 
                        onChange={handlePatientChange} 
                        className="info-input-plain wb-input"
                      />
                    </div>
                    <div className="sub-wb-item">
                      <span className="info-lbl-bold">Bed:</span>
                      <input 
                        type="text" 
                        name="bed" 
                        value={patient.bed} 
                        onChange={handlePatientChange} 
                        className="info-input-plain wb-input"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Notes Grid Table */}
          <table className="mint-notes-table">
            <thead>
              <tr>
                <th className="th-mint-date">DATE</th>
                <th className="th-mint-time">TIME</th>
                <th className="th-mint-notes">NOTES</th>
                <th className="th-mint-sign">SIGN</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* DATE Cell */}
                  <td className="td-mint-date">
                    <div className="date-input-wrapper">
                      <input 
                        type="date" 
                        value={row.date} 
                        onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} 
                        className="mint-date-picker"
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-pill-delete"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </td>

                  {/* TIME Cell */}
                  <td className="td-mint-time">
                    <div className="time-input-wrapper">
                      <input 
                        type="time" 
                        value={row.time} 
                        onChange={(e) => handleRowChange(row.id, 'time', e.target.value)} 
                        className="mint-time-picker"
                      />
                    </div>
                  </td>

                  {/* NOTES Cell */}
                  <td className="td-mint-notes">
                    <textarea 
                      value={row.notes} 
                      onChange={(e) => handleRowChange(row.id, 'notes', e.target.value)} 
                      placeholder="notes" 
                      rows={3} 
                      className="mint-notes-textarea"
                    />
                  </td>

                  {/* SIGN Cell */}
                  <td className="td-mint-sign">
                    <div className="sign-select-group">
                      <select 
                        value={row.sign} 
                        onChange={(e) => handleRowChange(row.id, 'sign', e.target.value)} 
                        className="sign-select-dropdown"
                      >
                        <option value="Sadhana">Sadhana</option>
                        <option value="Priya">Priya</option>
                        <option value="Anitha">Anitha</option>
                      </select>

                      {/* Signature Stamp Badge */}
                      <div className="signature-stamp-box">
                        <div className="stamp-paper-effect">
                          <span className="stamp-sig-text">Sadhana</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Action Buttons Below Table */}
          <div className="mint-action-controls">
            <button 
              type="button" 
              className="btn-add-notes-row"
              onClick={handleAddRow}
            >
              <Plus size={16} />
              <span>Add Notes Row</span>
            </button>

            <div className="bottom-btn-row">
              <button 
                type="button" 
                className="btn-mint-clear"
                onClick={handleClearForm}
              >
                Clear Form
              </button>

              <button 
                type="button" 
                className="btn-mint-save"
                onClick={handleSavePlan}
              >
                <Save size={16} />
                <span>Save Plan</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
