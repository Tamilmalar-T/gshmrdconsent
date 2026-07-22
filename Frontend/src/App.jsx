import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VitalsChartPage from './components/VitalsChartPage';
import ConsentGeneralAdmissionPage from './components/ConsentGeneralAdmissionPage';
import NursesCarePlanPage from './components/NursesCarePlanPage';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('nurse-care-plan'); // Nurse Care Plan active by default!

  const renderContent = () => {
    switch (activeTab) {
      case 'nurse-care-plan':
        return <NursesCarePlanPage />;
      case 'progress-sheet':
        return (
          <div className="placeholder-page">
            <h2>Progress Sheet</h2>
            <p>Daily patient recovery progress log.</p>
          </div>
        );
      case 'general-admission-consent':
        return <ConsentGeneralAdmissionPage />;
      case 'vitals-chart':
      case 'intake-output':
        return <VitalsChartPage />;
      case 'lab-requisition':
        return (
          <div className="placeholder-page">
            <h2>Laboratory Requisition</h2>
            <p>Manage and order lab tests for patients.</p>
          </div>
        );
      case 'mrd-checklist':
        return (
          <div className="placeholder-page">
            <h2>Medical Record Checklist</h2>
            <p>Verification checklist for medical record documentation.</p>
          </div>
        );
      case 'diabetic-chart':
        return (
          <div className="placeholder-page">
            <h2>Diabetic Chart</h2>
            <p>Blood glucose levels and insulin tracking log.</p>
          </div>
        );
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
