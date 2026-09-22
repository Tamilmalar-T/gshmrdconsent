import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import IPRegister from './components/IPRegister';
import { IPListPage } from './components/WardMasterPage';
import NewPatientRegistrationPage from './components/NewPatientRegistrationPage';
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
import GeneralMasterPage from './components/GeneralMasterPage';
import PatientRegisterMasterPage from './components/PatientRegisterMasterPage';
import WardMasterPage from './components/WardMasterPage';
import InvestigationChartPage from './components/InvestigationChartPage';
import InternalTransferFormPage from './components/InternalTransferFormPage';
import ExternalTransferFormPage from './components/ExternalTransferFormPage';
import RegularDrugPrescriptionPage from './components/RegularDrugPrescriptionPage';
import ActivityRecordBilling from './components/ActivityRecordBilling';
import LoginDetailsPage from './components/LoginDetailsPage';
import CultureChartPage from './components/CultureChartPage';
import ConsolidatedAssessmentPage from './components/ConsolidatedAssessmentPage';
import InitialAssessmentFormPage from './components/InitialAssessmentFormPage';
import InitialAssessmentByDoctorPage from './components/InitialAssessmentByDoctorPage';
import EmergencyDoctorInitialAssessmentPage from './components/EmergencyDoctorInitialAssessmentPage';
import AntenatalCaseRecordPage from './components/AntenatalCaseRecordPage';
import LabourRecordPage from './components/LabourRecordPage';
import PartographPage from './components/PartographPage';
import OperationNotesCaesareanSectionPage from './components/OperationNotesCaesareanSectionPage';
import OperationNotesPage from './components/OperationNotesPage';
import MedicoLegalRegisterPage from './components/MedicoLegalRegisterPage';
import IncidentReportPage from './components/IncidentReportPage';
import AdverseDrugReactionReportPage from './components/AdverseDrugReactionReportPage';
import PhysiotherapyAssessmentPage from './components/PhysiotherapyAssessmentPage';
import NursingInitialAssessmentObstetricsPage from './components/NursingInitialAssessmentObstetricsPage';
import ConsentHospitalizationConditionsOfServicePage from './components/ConsentHospitalizationConditionsOfServicePage';
import AdmissionRecordPage from './components/AdmissionRecordPage';
import RoomTariffPage from './components/RoomTariffPage';
import ConsentHospitalizationConductProceduresPage from './components/ConsentHospitalizationConductProceduresPage';
import ConsentHivAntibodiesTestPage from './components/ConsentHivAntibodiesTestPage';
import PreOperativeChecklistPage from './components/PreOperativeChecklistPage';
import PostOperativeChecklistPage from './components/PostOperativeChecklistPage';
import SurgicalSafetyChecklistPage from './components/SurgicalSafetyChecklistPage';
import ProductMasterPage from './components/ProductMasterPage';
import DepartmentMasterPage from './components/DepartmentMasterPage';
import SubDepartmentMasterPage from './components/SubDepartmentMasterPage';
import ConsultantMasterPage from './components/ConsultantMasterPage';
import ControlMasterPage from './components/ControlMasterPage';
import PackageMappingPage from './components/PackageMappingPage';
import HospitalBranchMasterPage from './components/HospitalBranchMasterPage';
import { Undo2 } from 'lucide-react';
import { hasUndoHistory, performGlobalUndo } from './utils/formPersist';
import { initKeyboardNavigation } from './utils/keyboardNavigation';
import Breadcrumb from './components/Breadcrumb';
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
  const [canUndo, setCanUndo] = useState(false);
  const [formKeyCounter, setFormKeyCounter] = useState(0);
  const scrollPosRef = useRef(0);

  // Initialize Global Keyboard Navigation for all forms
  useEffect(() => {
    const cleanup = initKeyboardNavigation();
    return cleanup;
  }, []);

  useEffect(() => {
    localStorage.setItem('active_tab', activeTab);
    scrollPosRef.current = 0;
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Global Undo checker
  useEffect(() => {
    setCanUndo(hasUndoHistory());
    const interval = setInterval(() => {
      setCanUndo(hasUndoHistory());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut and Event Listener for Undo
  useEffect(() => {
    const handleUndoEvent = () => {
      const mainContent = document.querySelector('.app-main-content');
      if (mainContent) scrollPosRef.current = mainContent.scrollTop;
      setFormKeyCounter(prev => prev + 1);
    };
    
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea') {
          return;
        }

        if (hasUndoHistory()) {
          e.preventDefault();
          performGlobalUndo();
        }
      }
    };

    window.addEventListener('form_restored_event', handleUndoEvent);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('form_restored_event', handleUndoEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('last_form_tab', lastFormTab);
  }, [lastFormTab]);
  const [selectedIpNoForView, setSelectedIpNoForView] = useState('');
  const [editRecord, setEditRecord] = useState(null);

  // --- Auth Handlers ---
  const handleLoginSuccess = (user) => {
    const loginTimestamp = Date.now();
    const newSession = {
      id: loginTimestamp,
      userId: user.userId,
      userName: user.userName,
      loginDate: new Date(loginTimestamp).toLocaleDateString(),
      loginTime: new Date(loginTimestamp).toLocaleTimeString(),
      logoutTime: null,
      totalWorkingTime: null
    };

    const history = JSON.parse(localStorage.getItem('login_history') || '[]');
    history.push(newSession);
    localStorage.setItem('login_history', JSON.stringify(history));
    localStorage.setItem('current_session_id', loginTimestamp);

    localStorage.setItem('logged_in_user', JSON.stringify(user));
    setLoggedInUser(user);

    if (user.landingPage) {
      const pageTabMap = {
        'Patient Registration': 'patient-registration',
        'New Patient Registration': 'new-patient-registration',
        'Ward Master': 'ward-master',
        'Consent Form': 'general-admission-consent',
        'Nurses Care Plan': 'nurse-care-plan',
        'Nurses Daily Assessment': 'nurses-daily-assessment',
        'Resident Doctor Progress': 'resident-doctor-progress',
        'Vitals Chart': 'vitals-chart',
        'Lab Requisition': 'lab-requisition',
        'User Master': 'user-master',
        'Department Master': 'department-master',
        'Consultant Master': 'consultant-master',
        'Hospital Branch Master': 'hospital-branch-master',
        'Control Master': 'control-master',
        'Activity Record Billing': 'activity-record-billing'
      };
      if (pageTabMap[user.landingPage]) {
        setActiveTab(pageTabMap[user.landingPage]);
      }
    }
  };

  const handleLogout = () => {
    const currentSessionId = localStorage.getItem('current_session_id');
    if (currentSessionId) {
      const history = JSON.parse(localStorage.getItem('login_history') || '[]');
      const sessionIndex = history.findIndex(s => s.id == currentSessionId);
      if (sessionIndex !== -1) {
        const logoutTimestamp = Date.now();
        history[sessionIndex].logoutTime = new Date(logoutTimestamp).toLocaleTimeString();
        
        const diffMs = logoutTimestamp - history[sessionIndex].id;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        history[sessionIndex].totalWorkingTime = `${diffHrs}h ${diffMins}m ${diffSecs}s`;
        
        localStorage.setItem('login_history', JSON.stringify(history));
      }
      localStorage.removeItem('current_session_id');
    }

    localStorage.removeItem('logged_in_user');
    localStorage.removeItem('active_tab');
    localStorage.removeItem('last_form_tab');
    setLoggedInUser(null);
    setActiveTab('patient-registration');
    setEditRecord(null);
  };

  const handleNavigate = (targetTab) => {
    window.isPrintViewMode = false;
    if (activeTab !== 'view-records' && activeTab !== 'view-drafts') {
      setLastFormTab(activeTab);
    }
    scrollPosRef.current = 0;
    setActiveTab(targetTab);
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) mainContent.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const handleSidebarNavigate = (targetTab) => {
    window.isPrintViewMode = false;
    setEditRecord(null);
    scrollPosRef.current = 0;
    setFormKeyCounter(prev => prev + 1);
    handleNavigate(targetTab);
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) mainContent.scrollTop = 0;
    window.scrollTo(0, 0);
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
      document.querySelectorAll('textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    };

    const handleInput = (e) => {
      if (e.target.tagName.toLowerCase() === 'textarea') {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
    };
    document.addEventListener('input', handleInput);

    const timer1 = setTimeout(resizeTextareas, 10);
    const timer2 = setTimeout(resizeTextareas, 100);

    return () => {
      document.removeEventListener('input', handleInput);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeTab, editRecord, selectedIpNoForView]);

  // --- Restore Scroll Position After Undo ---
  useEffect(() => {
    if (formKeyCounter > 0) {
      const restoreScroll = () => {
        const mainContent = document.querySelector('.app-main-content');
        if (mainContent) {
          mainContent.scrollTop = scrollPosRef.current;
        }
      };
      // Wait for DOM and Textareas to resize
      setTimeout(restoreScroll, 15);
      setTimeout(restoreScroll, 110);
      setTimeout(restoreScroll, 350);
    }
  }, [formKeyCounter]);

  // --- Render Content ---
  const renderContent = () => {
    const editData = editRecord && editRecord.tabId === activeTab ? editRecord.data : null;
    const editRecordId = editRecord && editRecord.tabId === activeTab ? editRecord.recId : null;
    switch (activeTab) {
      case 'patient-registration':
        return <IPRegister onViewDetails={handleViewPatientDetails} onNavigate={handleNavigate} editData={editData} />;
      case 'ip-list':
        return <IPListPage onNavigate={handleNavigate} onEditRecord={handleEditRecord} />;
      case 'new-patient-registration':
        return <NewPatientRegistrationPage setSidebarOpen={setSidebarOpen} />;
      case 'ward-master':
        return <WardMasterPage />;
      case 'consolidated-assessment':
        return <ConsolidatedAssessmentPage onEdit={handleEditRecord} />;
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
      case 'consent-hospitalization-conditions-of-service':
        return <ConsentHospitalizationConditionsOfServicePage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'consent-hospitalization-conduct-procedures':
        return <ConsentHospitalizationConductProceduresPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'consent-hiv-antibodies-test':
        return <ConsentHivAntibodiesTestPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'admission-record':
        return <AdmissionRecordPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'room-tariff':
        return <RoomTariffPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'pre-operative-checklist':
        return <PreOperativeChecklistPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'post-operative-checklist':
        return <PostOperativeChecklistPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'surgical-safety-checklist':
        return <SurgicalSafetyChecklistPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
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
      case 'general-master':
        return <GeneralMasterPage />;
      case 'patient-register-master':
        return <PatientRegisterMasterPage />;
      case 'consultant-master':
        return <ConsultantMasterPage setSidebarOpen={setSidebarOpen} />;
      case 'control-master':
        return <ControlMasterPage />;
      case 'package-mapping':
        return <PackageMappingPage />;
      case 'product-master':
        return <ProductMasterPage />;
      case 'hospital-branch-master':
        return <HospitalBranchMasterPage />;
      case 'department-master':
        return <DepartmentMasterPage />;
      case 'sub-department-master':
        return <SubDepartmentMasterPage />;
      case 'investigation-chart':
        return <InvestigationChartPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'culture-chart':
        return <CultureChartPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'internal-transfer-form':
        return <InternalTransferFormPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'external-transfer-form':
        return <ExternalTransferFormPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'regular-drug-prescription':
        return <RegularDrugPrescriptionPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'activity-record-billing':
        return <ActivityRecordBilling onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'login-details':
        return <LoginDetailsPage />;
      case 'initial-assessment-form':
        return <InitialAssessmentFormPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'initial-assessment-by-doctor':
        return <InitialAssessmentByDoctorPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'emergency-doctor-initial-assessment':
        return <EmergencyDoctorInitialAssessmentPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'antenatal-case-record':
        return <AntenatalCaseRecordPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'labour-record':
        return <LabourRecordPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'partograph':
        return <PartographPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'operation-notes-caesarean-section':
        return <OperationNotesCaesareanSectionPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'operation-notes':
        return <OperationNotesPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'medico-legal-register':
        return <MedicoLegalRegisterPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'incident-report':
        return <IncidentReportPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'adverse-drug-reaction-report':
        return <AdverseDrugReactionReportPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'physiotherapy-assessment':
        return <PhysiotherapyAssessmentPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
      case 'nursing-initial-assessment-obstetrics':
        return <NursingInitialAssessmentObstetricsPage onNavigate={handleNavigate} editData={editData} editRecordId={editRecordId} />;
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
        onNavigate={handleNavigate}
      />
      <div className="app-body">
        <Sidebar
          sidebarOpen={sidebarOpen}
          activeTab={activeTab}
          setActiveTab={handleSidebarNavigate}
        />
        <main key={formKeyCounter} className={`app-main-content ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          <div className="global-breadcrumb-wrapper no-print">
            <Breadcrumb activeTab={activeTab} />
          </div>
          {renderContent()}
        </main>
      </div>

      {canUndo && (
        <button
          className="no-print"
          onClick={performGlobalUndo}
          title="Undo Last Action"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            zIndex: 9999,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Undo2 size={24} />
        </button>
      )}
    </div>
  );
}

export default App;
