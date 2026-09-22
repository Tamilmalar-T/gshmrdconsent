import { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckSquare,
  Activity,
  Droplet,
  FileSpreadsheet,
  FileText,
  FileEdit,
  Info,
  SquareCheck,
  ClipboardCheck,
  ClipboardList,
  UserPlus,
  UserCog,
  Users,
  UserCheck,
  Layers,
  Building2,
  Settings,
  LayoutDashboard,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ sidebarOpen, activeTab, setActiveTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHospitalBranchOpen, setIsHospitalBranchOpen] = useState(() => {
    return ['hospital-branch-master', 'department-master', 'sub-department-master'].includes(activeTab);
  });

  useEffect(() => {
    if (['hospital-branch-master', 'department-master', 'sub-department-master'].includes(activeTab)) {
      setIsHospitalBranchOpen(true);
    }
  }, [activeTab]);

  const menuSections = [
    {
      title: 'MASTERS',
      items: [
        { id: 'user-master', label: 'User Master', icon: UserCog },
        { id: 'type-master', label: 'Type Master', icon: Layers },
        { id: 'case-sheet-master', label: 'Case Sheet Master', icon: Settings },
        { id: 'nurse-master', label: 'Nurse Master', icon: Users },
        { id: 'ward-master', label: 'Ward Master', icon: Layers },
          { id: 'room-tariff', label: 'Room Tariff', icon: ClipboardCheck },
        { id: 'general-master', label: 'General Master', icon: FileText },
        { id: 'patient-register-master', label: 'Patient Register Master', icon: FileText },
        { id: 'consultant-master', label: 'Consultant Master', icon: UserCheck },
        { id: 'control-master', label: 'Control Master', icon: Settings },
        { id: 'package-mapping', label: 'Package Mapping', icon: FileSpreadsheet },
        { id: 'product-master', label: 'Service Master', icon: Layers },
        {
          id: 'hospital-branch-master',
          label: 'Hospital Branch',
          icon: Building2,
          children: [
            { id: 'department-master', label: 'Department Master', icon: Building2 },
            { id: 'sub-department-master', label: 'Sub Department Master', icon: Layers }
          ]
        }
      ]
    },
    {
      title: 'PATIENT REGISTER',
      items: [
        { id: 'new-patient-registration', label: 'New Patient Registration (Extended)', icon: UserPlus },
        { id: 'patient-registration', label: 'IP Register', icon: UserPlus },
        { id: 'medico-legal-register', label: 'Medico Legal Register', icon: ClipboardList }
      ]
    },
    {
      title: 'CLINICAL DASHBOARD',
      items: [
        { id: 'consolidated-assessment', label: 'Consolidated Assessment', icon: LayoutDashboard }
      ]
    },
    {
      title: 'PATIENT FORMS & RECORDS',
      items: [
        { id: 'general-admission-consent', label: 'General Admission', icon: ClipboardCheck },
        { id: 'initial-assessment-form', label: 'Initial Assessment', icon: FileEdit },
        { id: 'emergency-doctor-initial-assessment', label: 'EDIA', icon: FileEdit },
        { id: 'nursing-initial-assessment', label: 'Nursing IA', icon: FileText },
        { id: 'antenatal-case-record', label: 'Antenatal Case ', icon: FileText },
        { id: 'progress-sheet', label: 'Progress Sheet - Consultant', icon: SquareCheck },
        { id: 'resident-doctor-progress', label: 'Reassessment-R Dr', icon: FileText },
        { id: 'nurse-care-plan', label: 'Nurses Care Plan', icon: Info },
        { id: 'nurses-daily-assessment', label: 'N.Daily Assessment ', icon: ClipboardList },
        { id: 'regular-drug-prescription', label: 'Regular Drug Prescriptions', icon: FileText },
        { id: 'investigation-chart', label: 'Investigation Chart', icon: FileSpreadsheet },
        { id: 'vitals-chart', label: 'Vitals Chart', icon: Activity },
        { id: 'bp-chart', label: 'BP Chart', icon: Activity },
        { id: 'diabetic-chart', label: 'Diabetic Chart', icon: FileSpreadsheet },
        { id: 'intake-output', label: 'Intake & Output ', icon: Droplet },
        { id: 'culture-chart', label: 'Culture Chart', icon: FlaskConical },
        { id: 'activity-record-billing', label: 'Billing', icon: FileSpreadsheet },
        { id: 'initial-assessment-by-doctor', label: 'OP -IA', icon: FileEdit },
        { id: 'internal-transfer-form', label: 'Internal Transfer', icon: FileText },
        { id: 'lab-requisition', label: 'Lab', icon: FlaskConical },
        { id: 'mrd-checklist', label: 'MR Checklist', icon: CheckSquare },
        { id: 'partograph', label: 'Partograph', icon: Activity },
        { id: 'labour-record', label: 'Labour Record', icon: FileText },
        { id: 'surgical-safety-checklist', label: 'Surgical Safety Check List', icon: CheckSquare },
        { id: 'post-operative-checklist', label: 'Post Operative Check List', icon: CheckSquare },
      
        { id: 'pre-operative-checklist', label: 'Pre-Op Checklist', icon: CheckSquare },
        { id: 'admission-record', label: 'Admission Record', icon: FileText },
        { id: 'consent-hospitalization-conditions-of-service', label: 'Hospitalization & Conditions of Service', icon: ClipboardCheck },
        { id: 'operation-notes', label: 'Operation Notes', icon: FileText },
        { id: 'operation-notes-caesarean-section', label: 'Operation Notes for Caesarean Section', icon: FileText },
        { id: 'external-transfer-form', label: 'Transfer Form - External', icon: FileText },
        { id: 'consent-hiv-antibodies-test', label: 'Informed Consent for HIV Antibodies Test', icon: ClipboardCheck },
        { id: 'incident-report', label: 'Incident Report', icon: FileEdit },
        { id: 'adverse-drug-reaction-report', label: 'Adverse Drug Reaction Report ', icon: FileEdit },
        { id: 'physiotherapy-assessment', label: 'Physiotherapy Assessment & Reassessment', icon: FileEdit }
      ]
    }
  ];

  return (
    <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      
      {/* Search Input Box */}
      <div className="sidebar-search-container">
        <div className="sidebar-search-box">
          <Search size={14} className="sidebar-search-icon" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
          />
        </div>
      </div>

      <div className="sidebar-scroll-content">
        {menuSections.map((section, idx) => {
          const query = searchQuery.trim().toLowerCase();
          
          const filteredItems = section.items.filter(item => {
            if (!query) return true;
            const itemMatch = item.label.toLowerCase().includes(query);
            const childMatch = item.children && item.children.some(child => child.label.toLowerCase().includes(query));
            return itemMatch || childMatch;
          });

          if (filteredItems.length === 0) return null;

          return (
            <div key={idx} className="sidebar-section">
              <h3 className="section-title">{section.title}</h3>
              <ul className="section-menu">
                {filteredItems.map((item) => {
                  const IconComponent = item.icon;
                  const hasChildren = Boolean(item.children && item.children.length > 0);
                  const isParentActive = activeTab === item.id;
                  
                  if (hasChildren) {
                    const isChildMatchingSearch = query && item.children.some(c => c.label.toLowerCase().includes(query));
                    const showSubmenu = isHospitalBranchOpen || isChildMatchingSearch;

                    return (
                      <li key={item.id} className="sidebar-parent-item">
                        <button
                          type="button"
                          className={`sidebar-nav-item ${isParentActive ? 'active' : ''}`}
                          onClick={() => {
                            setIsHospitalBranchOpen(prev => !prev);
                            setActiveTab(item.id);
                          }}
                        >
                          <IconComponent size={18} className="item-icon" />
                          <span className="item-label">{item.label}</span>
                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                            {showSubmenu ? (
                              <ChevronDown size={16} className="chevron-icon" />
                            ) : (
                              <ChevronRight size={16} className="chevron-icon" />
                            )}
                          </span>
                        </button>

                        {showSubmenu && (
                          <ul className="sidebar-submenu">
                            {item.children
                              .filter(child => !query || child.label.toLowerCase().includes(query) || item.label.toLowerCase().includes(query))
                              .map(child => {
                                const ChildIcon = child.icon;
                                const isChildActive = activeTab === child.id;
                                return (
                                  <li key={child.id}>
                                    <button
                                      type="button"
                                      className={`sidebar-nav-item sidebar-sub-item ${isChildActive ? 'active' : ''}`}
                                      onClick={() => setActiveTab(child.id)}
                                    >
                                      <ChildIcon size={16} className="item-icon" />
                                      <span className="item-label">{child.label}</span>
                                    </button>
                                  </li>
                                );
                              })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`sidebar-nav-item ${isParentActive ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <IconComponent size={18} className="item-icon" />
                        <span className="item-label">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <p className="hospital-name">Gurushree Hospital</p>
        <p className="app-version">MRD Consent</p>
      </div>
    </aside>
  );
}
