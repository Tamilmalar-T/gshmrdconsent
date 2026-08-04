import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import PatientRegistrationPage from './components/PatientRegistrationPage';
import PatientDetailsPage from './components/PatientDetailsPage';
import VitalsChartPage from './components/VitalsChartPage';
import ConsentGeneralAdmissionPage from './components/ConsentGeneralAdmissionPage';
import NursesCarePlanPage from './components/NursesCarePlanPage';
import NursesDailyAssessmentPage from './components/NursesDailyAssessmentPage';
import BPChartPage from './components/BPChartPage';
import ResidentDoctorProgressRecordPage from './components/ResidentDoctorProgressRecordPage';
import NursingInitialAssessmentPage from './components/NursingInitialAssessmentPage';
import ProgressSheetPage from './components/ProgressSheetPage';
import LabRequisitionPage from './components/LabRequisitionPage';
import DiabeticChartPage from './components/DiabeticChartPage';
import IntakeOutputRecordPage from './components/IntakeOutputRecordPage';
import UserMasterPage from './components/UserMasterPage';
import TypeMasterPage from './components/TypeMasterPage';
import CaseSheetMasterPage from './components/CaseSheetMasterPage';
import NurseMasterPage from './components/NurseMasterPage';
import AssessmentMasterPage from './components/AssessmentMasterPage';
import InvestigationChartPage from './components/InvestigationChartPage';
import InternalTransferFormPage from './components/InternalTransferFormPage';
import RegularDrugPrescriptionPage from './components/RegularDrugPrescriptionPage';
import ActivityRecordBilling from './components/ActivityRecordBilling';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem('logged_in_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('active_tab') || 'patient-registration';
  });
  const [lastFormTab, setLastFormTab] = useState(() => {
    return localStorage.getItem('last_form_tab') || 'general-admission-consent';
  });

  useEffect(() => {
    localStorage.setItem('active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('last_form_tab', lastFormTab);
  }, [lastFormTab]);
  const [selectedIpNoForView, setSelectedIpNoForView] = useState('');
  const [editRecord, setEditRecord] = useState(null);

  // --- Auth Handlers ---
  const handleLoginSuccess = (user) => {
    localStorage.setItem('logged_in_user', JSON.stringify(user));
    setLoggedInUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('logged_in_user');
    localStorage.removeItem('active_tab');
    localStorage.removeItem('last_form_tab');
    setLoggedInUser(null);
    setActiveTab('patient-registration');
    setEditRecord(null);
  };

  // --- Navigation Handlers ---
  const handleNavigate = (targetTab) => {
    if (activeTab !== 'view-records' && activeTab !== 'view-drafts') {
      setLastFormTab(activeTab);
    }
    setActiveTab(targetTab);
  };

  const handleBackToForm = () => {
    setActiveTab(lastFormTab || 'general-admission-consent');
  };

  const handleViewPatientDetails = (ipNo) => {
    setSelectedIpNoForView(ipNo);
    handleNavigate('view-records');
  };

  const handleEditRecord = (tabId, data, recId) => {
    setEditRecord({ tabId, data, recId });
    setActiveTab(tabId);
  };

  // --- Auto-Resize Textareas Globally ---
  useEffect(() => {
    const resizeTextareas = () => {
      const mainContent = document.querySelector('.app-main-content');
      const scrollPos = mainContent ? mainContent.scrollTop : window.scrollY;
      
      document.querySelectorAll('textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });

      if (mainContent) {
        mainContent.scrollTop = scrollPos;
      } else {
        window.scrollTo(0, scrollPos);
      }
    };

    // 1) Global event listener for manual typing
    const handleInput = (e) => {
      if (e.target.tagName.toLowerCase() === 'textarea') {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
    };
    document.addEventListener('input', handleInput);

    // 2) Run resize after tab switches and state restoration
    const timer1 = setTimeout(resizeTextareas, 10);
    const timer2 = setTimeout(resizeTextareas, 100);
    const timer3 = setTimeout(resizeTextareas, 300);

    return () => {
      document.removeEventListener('input', handleInput);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [activeTab, editRecord, selectedIpNoForView]);

  // --- Render Content ---
  const renderContent = () => {
    const editData = editRecord && editRecord.tabId === activeTab ? editRecord.data : null;
    const editRecordId = editRecord && editRecord.tabId === activeTab ? editRecord.recId : null;
    switch (activeTab) {
      case 'patient-registration':
        return <PatientRegistrationPage onViewDetails={handleViewPatientDetails} />;
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
      case 'bp-chart':
        return <BPChartPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
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
      case 'nurse-master':
        return <NurseMasterPage />;
      case 'assessment-master':
        return <AssessmentMasterPage />;
      case 'investigation-chart':
        return <InvestigationChartPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'internal-transfer-form':
        return <InternalTransferFormPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'regular-drug-prescription':
        return <RegularDrugPrescriptionPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'activity-record-billing':
        return <ActivityRecordBilling onNavigate={handleNavigate} />;
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
