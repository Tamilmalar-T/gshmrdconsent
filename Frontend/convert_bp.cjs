const fs = require('fs');

let content = fs.readFileSync('src/components/BPChartPage.jsx', 'utf-8');

// Rename component and key
content = content.replace(/VitalsChartPage/g, 'BPChartPage');
content = content.replace("PERSIST_KEY = 'vitals_chart'", "PERSIST_KEY = 'bp_chart'");
content = content.replace(/'Vitals Chart'/g, "'BP Chart'");
content = content.replace("Vitals Chart updated", "BP Chart updated");
content = content.replace("Vitals Chart saved", "BP Chart saved");
content = content.replace("VITALS CHART", "B P CHART");
content = content.replace("Vitals plotted", "BP plotted");

// Change dates array from 3 to 4
content = content.replace(/\['', '', ''\]/g, "['', '', '', '']");
content = content.replace("while (d.length < 3)", "while (d.length < 4)");
content = content.replace("Array(3).fill(null)", "Array(4).fill(null)");

// Entry state
const old_entry = `pulse: '',\n    temp: '',\n    resp: '',\n    bp: ''`;
const new_entry = `sys: '',\n    dia: '',\n    ivf: '',\n    ngOral: '',\n    urine: '',\n    bowel: '',\n    drain: ''`;
content = content.replace(old_entry, new_entry);
content = content.replace("pulse: '', temp: '', resp: '', bp: ''", "sys: '', dia: ''");

// Y Axis Rows
const old_yaxis = `  const yAxisRows = (() => {
    const rows = [];
    for (let p = 210; p >= 40; p -= 2) {
      // Temperature: 106°F at pulse 210, drops 1°F per 10 pulse units
      const tempVal = 106 - (210 - p) / 10;
      const showTemp = Number.isInteger(tempVal) && p <= 210 && p >= 100;

      // Respiration: visible where pulse 40–90 (Resp = pulse - 30)
      const respVal = p - 30;
      const showResp = p >= 40 && p <= 90;

      rows.push({
        pulse: p,
        showPulseLabel: p % 10 === 0,   // major tick every 10
        temp: showTemp ? tempVal.toString() : '',
        resp: showResp ? respVal.toString() : '',
        respLabel: p === 90
      });
    }
    return rows;
  })();`;
const new_yaxis = `  const yAxisRows = (() => {
    const rows = [];
    for (let p = 200; p >= 40; p -= 2) {
      rows.push({
        val: p,
        showLabel: p % 10 === 0
      });
    }
    return rows;
  })();`;
content = content.replace(old_yaxis, new_yaxis);

// Row index helpers
const old_helpers = `  const getTempRowIndex = (val) => {
    const t = parseFloat(val);
    if (isNaN(t)) return -1;
    // row offset from pulse=210: pulse 210 is row 0, temp=106 is also row 0
    const rIdx = Math.round((106 - t) * 5);
    return (rIdx >= 0 && rIdx <= 55) ? rIdx : -1;
  };

  // Map Pulse value (40–210 bpm) → row index (step-2 grid, 0=top=210)
  const getPulseRowIndex = (val) => {
    const p = parseFloat(val);
    if (isNaN(p)) return -1;
    const rIdx = Math.round((210 - p) / 2);
    return (rIdx >= 0 && rIdx <= 85) ? rIdx : -1;
  };

  // Map Resp Rate (10–60 cpm) → row index (Resp = pulse - 30, pulse 40–90)
  // pulse = resp + 30  →  rIdx = (210 - (resp+30)) / 2 = (180 - resp) / 2
  const getRespRowIndex = (val) => {
    const r = parseFloat(val);
    if (isNaN(r)) return -1;
    const rIdx = Math.round((180 - r) / 2);
    return (rIdx >= 60 && rIdx <= 85) ? rIdx : -1;
  };

  // Map BP (systolic, 40–210) same scale as Pulse
  const getBpRowIndex = (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return -1;
    const rIdx = Math.round((210 - v) / 2);
    return (rIdx >= 0 && rIdx <= 85) ? rIdx : -1;
  };`;
const new_helpers = `  const getBpRowIndex = (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return -1;
    const rIdx = Math.round((200 - v) / 2);
    return (rIdx >= 0 && rIdx <= 80) ? rIdx : -1;
  };`;
content = content.replace(old_helpers, new_helpers);

// handleAddReading logic
const old_add_readings = `    if (entry.temp) {
      const rIdx = getTempRowIndex(entry.temp);
      if (rIdx !== -1) newEntries.push({ id: Date.now() + 1, date: formattedDate, dIdx, sIdx: placeholderSIdx, timeKey: slotObj.key, timeLabel: slotObj.hour, timeRank: slotObj.timeRank, type: 'temp', val: parseFloat(entry.temp), rawVal: entry.temp, rIdx });
    }
    if (entry.pulse) {
      const rIdx = getPulseRowIndex(entry.pulse);
      if (rIdx !== -1) newEntries.push({ id: Date.now() + 2, date: formattedDate, dIdx, sIdx: placeholderSIdx, timeKey: slotObj.key, timeLabel: slotObj.hour, timeRank: slotObj.timeRank, type: 'pulse', val: parseFloat(entry.pulse), rawVal: entry.pulse, rIdx });
    }
    if (entry.resp) {
      const rIdx = getRespRowIndex(entry.resp);
      if (rIdx !== -1) newEntries.push({ id: Date.now() + 3, date: formattedDate, dIdx, sIdx: placeholderSIdx, timeKey: slotObj.key, timeLabel: slotObj.hour, timeRank: slotObj.timeRank, type: 'resp', val: parseFloat(entry.resp), rawVal: entry.resp, rIdx });
    }
    if (entry.bp) {
      const rIdx = getBpRowIndex(entry.bp);
      if (rIdx !== -1) newEntries.push({ id: Date.now() + 4, date: formattedDate, dIdx, sIdx: placeholderSIdx, timeKey: slotObj.key, timeLabel: slotObj.hour, timeRank: slotObj.timeRank, type: 'bp', val: parseFloat(entry.bp), rawVal: entry.bp, rIdx });
    }`;
const new_add_readings = `    if (entry.sys && entry.dia) {
      const rIdxSys = getBpRowIndex(entry.sys);
      const rIdxDia = getBpRowIndex(entry.dia);
      if (rIdxSys !== -1 && rIdxDia !== -1) {
        newEntries.push({ id: Date.now(), date: formattedDate, dIdx, sIdx: placeholderSIdx, timeKey: slotObj.key, timeLabel: slotObj.hour, timeRank: slotObj.timeRank, type: 'bp', sys: parseFloat(entry.sys), dia: parseFloat(entry.dia), rIdxSys, rIdxDia });
      }
    }`;
content = content.replace(old_add_readings, new_add_readings);

// Overlay Coordinates
const overlay_start_idx = content.indexOf('const dots = [];');
const old_overlay_end = 'setSvgLines(lines);\n  };';
const overlay_end_idx = content.indexOf(old_overlay_end) + old_overlay_end.length;

const new_overlay = `const dots = [];
    const lines = [];

    readings.forEach((r) => {
      const cx = getX(r.dIdx, r.sIdx);
      if (cx !== null && r.type === 'bp') {
        const ySys = interpY(r.rIdxSys);
        const yDia = interpY(r.rIdxDia);
        if (ySys !== null && yDia !== null) {
          dots.push({ id: r.id + '_sys', cx, cy: ySys, val: r.sys });
          dots.push({ id: r.id + '_dia', cx, cy: yDia, val: r.dia });
          lines.push({
            id: r.id + '_line',
            x1: cx, y1: ySys,
            x2: cx, y2: yDia,
            stroke: '#0f172a',
            strokeWidth: 2
          });
        }
      }
    });

    setSvgDots(dots);
    setSvgLines(lines);
  };`;

content = content.slice(0, overlay_start_idx) + new_overlay + content.slice(overlay_end_idx);

content = content.replace("for (let i = 0; i < 86; i++) {", "for (let i = 0; i < 81; i++) {");
content = content.replace("Pulse 40–210, Temp 95–106, Resp 10–60, BP 40–210", "Sys/Dia 40-200");

// Add input boxes to JSX
const old_form_inputs = `          <div className="vitals-input-row">
            <div className="vitals-input-group">
              <label>Pulse</label>
              <input type="number" name="pulse" value={entry.pulse} onChange={handleEntryChange} placeholder="40-210" />
            </div>
            <div className="vitals-input-group">
              <label>Temp (°F)</label>
              <input type="number" name="temp" value={entry.temp} onChange={handleEntryChange} placeholder="95-106" />
            </div>
            <div className="vitals-input-group">
              <label>Resp</label>
              <input type="number" name="resp" value={entry.resp} onChange={handleEntryChange} placeholder="10-60" />
            </div>
            <div className="vitals-input-group">
              <label>BP (Sys)</label>
              <input type="number" name="bp" value={entry.bp} onChange={handleEntryChange} placeholder="40-210" />
            </div>
            <button type="submit" className="btn-plot-vital">Plot Vital</button>
          </div>`;
const new_form_inputs = `          <div className="vitals-input-row">
            <div className="vitals-input-group">
              <label>Sys BP</label>
              <input type="number" name="sys" value={entry.sys} onChange={handleEntryChange} placeholder="Sys" />
            </div>
            <div className="vitals-input-group">
              <label>Dia BP</label>
              <input type="number" name="dia" value={entry.dia} onChange={handleEntryChange} placeholder="Dia" />
            </div>
            <button type="submit" className="btn-plot-vital">Plot BP</button>
          </div>`;
content = content.replace(old_form_inputs, new_form_inputs);

// Change the Y Axis rendering in JSX
const old_y_axis_jsx = `                        <td className="y-axis-cell" style={{ width: '35px', textAlign: 'center', fontSize: '11px', color: '#dc2626' }}>
                          {row.temp}
                        </td>
                        <td className="y-axis-cell" style={{ width: '30px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                          {row.showPulseLabel ? row.pulse : ''}
                        </td>
                        <td className="y-axis-cell" style={{ width: '30px', textAlign: 'center', fontSize: '11px', color: '#16a34a', position: 'relative' }}>
                          {row.resp}
                          {row.respLabel && <span style={{ position: 'absolute', right: '-12px', top: '-10px', fontSize: '10px', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Resp</span>}
                        </td>`;
const new_y_axis_jsx = `                        <td className="y-axis-cell" style={{ width: '50px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                          {row.showLabel ? row.val : ''}
                        </td>`;
content = content.replace(old_y_axis_jsx, new_y_axis_jsx);

// Change "PULSE" and "TEMP" headers to just BP
content = content.replace(/<div className="y-axis-label pulse-lbl">PULSE<\/div>\s*<div className="y-axis-label temp-lbl">TEMP<\/div>/g, '<div className="y-axis-label pulse-lbl">BP</div>');

// Adjust table headers (Colspan from 3 to 1)
content = content.replace(/<th rowSpan=\{2\} colSpan=\{3\} className="axis-header"><\/th>/g, '<th rowSpan={2} colSpan={1} className="axis-header"></th>');

// Replace the bottom tabular rows (I/O, Stools, Weight) with BP chart bottom rows
const old_bottom_rows = `                {/* Fixed Bottom Rows: Weight, Stool, I/O */}
                <tbody>
                  {['Weight', 'Stool', 'Total Intake', 'Total Output', 'Urine'].map((rowLabel, rIndex) => (
                    <tr key={\`bottom-\${rIndex}\`} className="bottom-vital-row">
                      <td colSpan={3} className="bottom-row-label">{rowLabel}</td>
                      {dates.map((d, dIdx) => (
                        <React.Fragment key={\`br-\${dIdx}\`}>
                          <td colSpan={3} className="bottom-cell-day"></td>
                          <td colSpan={3} className="bottom-cell-night"></td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>`;
const new_bottom_rows = `                {/* Fixed Bottom Rows: IVF, NG/Oral, Urine, Total Intake, Total Output, Bowel, Drain, User */}
                <tbody>
                  {['IVF', 'NG / Oral', 'Urine', 'Total Intake', 'Total Output', 'Bowel', 'Drain', 'User'].map((rowLabel, rIndex) => (
                    <tr key={\`bottom-\${rIndex}\`} className="bottom-vital-row">
                      <td colSpan={1} className="bottom-row-label">{rowLabel}</td>
                      {dates.map((d, dIdx) => (
                        <React.Fragment key={\`br-\${dIdx}\`}>
                          <td colSpan={3} className="bottom-cell-day"></td>
                          <td colSpan={3} className="bottom-cell-night"></td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>`;
content = content.replace(old_bottom_rows, new_bottom_rows);

fs.writeFileSync('src/components/BPChartPage.jsx', content, 'utf-8');
console.log('Conversion completed.');
