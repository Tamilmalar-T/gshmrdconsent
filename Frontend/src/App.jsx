import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import PatientRegistrationPage from './components/PatientRegistrationPage';
import PatientDetailsPage from './components/PatientDetailsPage';
import VitalsChartPage from './components/VitalsChartPage';
import ConsentGeneralAdmissionPage from './components/ConsentGeneralAdmissionPage';
import NursesCarePlanPage from './components/NursesCarePlanPage';
import NursesDailyAssessmentPage from './components/NursesDailyAssessmentPage';
import ResidentDoctorProgressRecordPage from './components/ResidentDoctorProgressRecordPage';
import NursingInitialAssessmentPage from './components/NursingInitialAssessmentPage';
import ProgressSheetPage from './components/ProgressSheetPage';
import LabRequisitionPage from './components/LabRequisitionPage';
import DiabeticChartPage from './components/DiabeticChartPage';
import IntakeOutputRecordPage from './components/IntakeOutputRecordPage';
import UserMasterPage from './components/UserMasterPage';
import TypeMasterPage from './components/TypeMasterPage';
import CaseSheetMasterPage from './components/CaseSheetMasterPage';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('patient-registration');
  const [lastFormTab, setLastFormTab] = useState('general-admission-consent');
  const [selectedIpNoForView, setSelectedIpNoForView] = useState('');
  const [editRecord, setEditRecord] = useState(null);

  // --- Auth Handlers ---
  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setActiveTab('patient-registration');
    setEditRecord(null);
  };

  // --- Navigation Handlers ---
  const handleNavigate = (targetTab) => {
    if (activeTab !== 'view-records' && activeTab !== 'view-drafts' && activeTab !== 'patient-details') {
      setLastFormTab(activeTab);
    }
    setActiveTab(targetTab);
  };

  const handleBackToForm = () => {
    setActiveTab(lastFormTab || 'general-admission-consent');
  };

  const handleViewPatientDetails = (ipNo) => {
    setSelectedIpNoForView(ipNo);
    handleNavigate('patient-details');
  };

  const handleEditRecord = (tabId, data, recId) => {
    setEditRecord({ tabId, data, recId });
    setActiveTab(tabId);
  };

  // --- Render Content ---
  const renderContent = () => {
    const editData = editRecord && editRecord.tabId === activeTab ? editRecord.data : null;
    const editRecordId = editRecord && editRecord.tabId === activeTab ? editRecord.recId : null;
    switch (activeTab) {
      case 'patient-registration':
        return <PatientRegistrationPage onViewDetails={handleViewPatientDetails} />;
      case 'patient-details':
        return <PatientDetailsPage selectedIpNo={selectedIpNoForView} initialMode="all" onBack={handleBackToForm} onEdit={handleEditRecord} />;
      case 'view-records':
        return <PatientDetailsPage initialMode="records" onBack={handleBackToForm} onEdit={handleEditRecord} filterTabId={lastFormTab} />;
      case 'view-drafts':
        return <PatientDetailsPage initialMode="drafts" onBack={handleBackToForm} onEdit={handleEditRecord} filterTabId={lastFormTab} />;
      case 'nurse-care-plan':
        return <NursesCarePlanPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'nurses-daily-assessment':
        return <NursesDailyAssessmentPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'resident-doctor-progress':
        return <ResidentDoctorProgressRecordPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'nursing-initial-assessment':
        return <NursingInitialAssessmentPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'progress-sheet':
        return <ProgressSheetPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'general-admission-consent':
        return <ConsentGeneralAdmissionPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'vitals-chart':
        return <VitalsChartPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'intake-output':
        return <IntakeOutputRecordPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'lab-requisition':
        return <LabRequisitionPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'mrd-checklist':
        return (
          <div className="placeholder-page">
            <h2>Medical Record Checklist</h2>
            <p>Verification checklist for medical record documentation.</p>
          </div>
        );
      case 'diabetic-chart':
        return <DiabeticChartPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'user-master':
        return <UserMasterPage />;
      case 'type-master':
        return <TypeMasterPage />;
      case 'case-sheet-master':
        return <CaseSheetMasterPage />;
      default:
        return <NursesCarePlanPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
    }
  };

  // --- Show Login Screen if not authenticated ---
  if (!loggedInUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
      />
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
