const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');

const filesToUpdate = {
  'ProgressSheetPage.jsx': [
    {
      find: "if (saved.rows) setRows(saved.rows);",
      replace: "if (saved.rows) setRows(saved.rows.map(r => ({ ...r, date: getCurrentDate(), time: getCurrentTime() })));"
    }
  ],
  'NursesDailyAssessmentPage.jsx': [
    {
      find: "if (saved.dateLeft) setDateLeft(saved.dateLeft);",
      replace: "if (saved.dateLeft) setDateLeft(getCurrentDate());"
    },
    {
      find: "if (saved.dateRight) setDateRight(saved.dateRight);",
      replace: "if (saved.dateRight) setDateRight(getCurrentDate());"
    },
    {
      find: "if (saved.rows) setRows(saved.rows);",
      replace: "if (saved.rows) setRows(saved.rows.map(r => ({ ...r, date: getCurrentDate(), time: getCurrentTime(), actionTime: getCurrentTime(), reevalTime: getCurrentTime() })));"
    }
  ],
  'NursesCarePlanPage.jsx': [
    {
      find: "if (saved.rows) setRows(saved.rows);",
      replace: "if (saved.rows) setRows(saved.rows.map(r => ({ ...r, date: getCurrentDate(), time: getCurrentTime() })));"
    }
  ],
  'LabRequisitionPage.jsx': [
    {
      find: "if (saved.labData) setLabData(l => ({ ...l, ...saved.labData }));",
      replace: "if (saved.labData) setLabData(l => ({ ...l, ...saved.labData, date: getCurrentDate(), time: getCurrentTime() }));"
    }
  ],
  'DiabeticChartPage.jsx': [
    {
      find: "if (saved.rows) setRows(saved.rows);",
      replace: "if (saved.rows) setRows(saved.rows.map(r => ({ ...r, date: getCurrentDate(), time: getCurrentTime() })));"
    }
  ],
  'IntakeOutputRecordPage.jsx': [
    {
      find: "if (saved.summary) setSummary(s => ({ ...s, ...saved.summary }));",
      replace: "if (saved.summary) setSummary(s => ({ ...s, ...saved.summary, date: getCurrentDate() }));"
    },
    {
      find: "if (saved.ivFluids) setIvFluids(saved.ivFluids);",
      replace: "if (saved.ivFluids) setIvFluids(saved.ivFluids.map(r => ({ ...r, time: getCurrentTime() })));"
    },
    {
      find: "if (saved.oralFluids) setOralFluids(saved.oralFluids);",
      replace: "if (saved.oralFluids) setOralFluids(saved.oralFluids.map(r => ({ ...r, time: getCurrentTime() })));"
    },
    {
      find: "if (saved.output) setOutput(saved.output);",
      replace: "if (saved.output) setOutput(saved.output.map(r => ({ ...r, time: getCurrentTime() })));"
    }
  ],
  'ConsentGeneralAdmissionPage.jsx': [
    {
      find: "if (saved.consent) setConsent(c => ({ ...c, ...saved.consent }));",
      replace: "if (saved.consent) setConsent(c => ({ ...c, ...saved.consent, patientSignDate: getCurrentDate(), witnessSignDate: getCurrentDate(), patientSignTime: getCurrentTime(), witnessSignTime: getCurrentTime() }));"
    },
    {
      find: "if (saved.office) setOffice(o => ({ ...o, ...saved.office }));",
      replace: "if (saved.office) setOffice(o => ({ ...o, ...saved.office, dateOfAdmission: getCurrentDate(), timeOfAdmission: getCurrentTime() }));"
    }
  ]
};

for (const [filename, replacements] of Object.entries(filesToUpdate)) {
  const filePath = path.join(dir, filename);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(r => {
      content = content.replace(r.find, r.replace);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filename}`);
  }
}

// Special case for ResidentDoctorProgressRecordPage
const residentDocPath = path.join(dir, 'ResidentDoctorProgressRecordPage.jsx');
if (fs.existsSync(residentDocPath)) {
  let content = fs.readFileSync(residentDocPath, 'utf8');
  
  if (!content.includes('getCurrentDate')) {
    const helperCode = `
const getCurrentDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return \`\${y}-\${m}-\${d}\`;
};

const getCurrentTime = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return \`\${h}:\${min}\`;
};

export default function `;
    content = content.replace("export default function ", helperCode);
    
    // update initial state
    content = content.replace("docDate: '2026-07-23',", "docDate: getCurrentDate(),");
    content = content.replace("docTime: '11:16'", "docTime: getCurrentTime()");
    
    // update restore state
    content = content.replace(
      "if (saved.soap) setSoap(s => ({ ...s, ...saved.soap }));",
      "if (saved.soap) setSoap(s => ({ ...s, ...saved.soap, docDate: getCurrentDate(), docTime: getCurrentTime() }));"
    );
    
    fs.writeFileSync(residentDocPath, content, 'utf8');
    console.log('Updated ResidentDoctorProgressRecordPage.jsx');
  }
}
