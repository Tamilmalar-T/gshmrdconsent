import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VitalsChartPage from './components/VitalsChartPage';
import ConsentGeneralAdmissionPage from './components/ConsentGeneralAdmissionPage';
import NursesCarePlanPage from './components/NursesCarePlanPage';
import NursingInitialAssessmentPage from './components/NursingInitialAssessmentPage';
import ProgressSheetPage from './components/ProgressSheetPage';
import LabRequisitionPage from './components/LabRequisitionPage';
import DiabeticChartPage from './components/DiabeticChartPage';
import IntakeOutputRecordPage from './components/IntakeOutputRecordPage';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('intake-output'); // Intake Output active!

  const renderContent = () => {
    switch (activeTab) {
      case 'nurse-care-plan':
        return <NursesCarePlanPage />;
      case 'nursing-initial-assessment':
        return <NursingInitialAssessmentPage />;
      case 'progress-sheet':
        return <ProgressSheetPage />;
      case 'general-admission-consent':
        return <ConsentGeneralAdmissionPage />;
      case 'vitals-chart':
        return <VitalsChartPage />;
      case 'intake-output':
        return <IntakeOutputRecordPage />;
      case 'lab-requisition':
        return <LabRequisitionPage />;
      case 'mrd-checklist':
        return (
          <div className="placeholder-page">
            <h2>Medical Record Checklist</h2>
            <p>Verification checklist for medical record documentation.</p>
          </div>
        );
      case 'diabetic-chart':
        return <DiabeticChartPage />;
      default:
        return <NursesCarePlanPage />;
    }
  };

  return (
    <div className="app-container">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="app-body">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
        <main className={`app-main-content ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
