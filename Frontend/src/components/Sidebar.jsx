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
  LayoutGrid,
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
        { id: 'all-masters', label: 'All Masters', icon: LayoutGrid },
        { id: 'user-master', label: 'User Control', icon: UserCog },
        { id: 'Emp-master', label: 'Emp Master', icon: UserCog },
        { id: 'type-master', label: 'Emp Type', icon: Layers },
        { id: 'case-sheet-master', label: 'Case Sheet Master', icon: Settings },
        { id: 'nurse-master', label: 'Nurse Master', icon: Users },
        { id: 'ward-master', label: 'Ward Master', icon: Layers },

        { id: 'form-header-master', label: 'Form Header Master', icon: Building2 },
        { id: 'general-master', label: 'General Master', icon: FileText },
        { id: 'patient-register-master', label: 'Patient Register Master', icon: FileText },
        { id: 'consultant-master', label: 'Consultant Master', icon: UserCheck },
        { id: 'control-master', label: 'Control Master', icon: Settings },
        { id: 'antenatal-op-master', label: 'Antenatal OP Master', icon: FileEdit },
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
        { id: 'new-patient-registration', label: 'OP Register', icon: UserPlus },
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
         { id: 'admission-record', label: '1.Admission Record', icon: FileText },
                 { id: 'room-tariff', label: '2.Room Tariff', icon: ClipboardCheck },
        { id: 'consent-hospitalization-conditions-of-service', label: '3.Hospitalization & Conditions of Service', icon: ClipboardCheck },
         { id: 'general-admission-consent', label: '4.General Admission', icon: ClipboardCheck },
         { id: 'initial-assessment-form', label: '5.Initial Assessment', icon: FileEdit },
        { id: 'emergency-doctor-initial-assessment', label: '6.EDIA', icon: FileEdit },
         { id: 'antenatal-case-record', label: '7.Antenatal Case ', icon: FileText },
        { id: 'neonatal-inpatient-medical-record', label: '8.Neonatal Medical Record', icon: FileText },
        { id: 'nursing-initial-assessment-obstetrics', label: '9.Nursing IA - Obstetrics', icon: FileText },
         { id: 'lab-requisition', label: '10.Lab', icon: FlaskConical },
{ id: 'nursing-initial-assessment', label: '11.Nursing IA', icon: FileText },
   { id: 'progress-sheet', label: '12.Progress Sheet - Consultant', icon: SquareCheck },
     { id: 'resident-doctor-progress', label: '13.Reassessment-R Dr', icon: FileText },
 { id: 'nurses-daily-assessment', label: '14.N.Daily Assessment ', icon: ClipboardList },
  { id: 'nurse-care-plan', label: '15.Nurses Care Plan', icon: Info },
          { id: 'regular-drug-prescription', label: '16.Regular Drug Prescriptions', icon: FileText },
        { id: 'investigation-chart', label: '17.Investigation Chart', icon: FileSpreadsheet },
{ id: 'diabetic-chart', label: '18.Diabetic Chart', icon: FileSpreadsheet },
        { id: 'vitals-chart', label: '19.Vitals Chart', icon: Activity },
        { id: 'bp-chart', label: '20.BP Chart', icon: Activity },
    { id: 'intake-output', label: '21.Intake & Output ', icon: Droplet },
            { id: 'pre-operative-checklist', label: '22.Pre-Op Checklist', icon: CheckSquare },
      { id: 'operation-notes', label: '23.Operation Notes', icon: FileText },
        { id: 'operation-notes-caesarean-section', label: '24.Operation Notes for Caesarean Section', icon: FileText },
        { id: 'post-operative-checklist', label: '25.Post Operative Check List', icon: CheckSquare },
        { id: 'surgical-safety-checklist', label: '26.Surgical Safety Check List', icon: CheckSquare },

                { id: 'initial-assessment-by-doctor', label: '27.OP -IA', icon: FileEdit },

        
       { id: 'antenatal-case-record-op', label: '28.Antenatal Case Record (OP)', icon: FileText },
             { id: 'internal-transfer-form', label: '29.Internal Transfer', icon: FileText },
        { id: 'external-transfer-form', label: '30.Transfer Form - External', icon: FileText },
{ id: 'partograph', label: '31.Partograph', icon: Activity },
 { id: 'labour-record', label: '32.Labour Record', icon: FileText },
           { id: 'consent-hiv-antibodies-test', label: '33.Informed Consent for HIV Antibodies Test', icon: ClipboardCheck },
        { id: 'incident-report', label: '34.Incident Report', icon: FileEdit },
        { id: 'adverse-drug-reaction-report', label: '35.Adverse Drug Reaction Report ', icon: FileEdit },
        { id: 'physiotherapy-assessment', label: '36.Physiotherapy Assessment & Reassessment', icon: FileEdit },
        { id: 'activity-record-billing', label: '37.Billing', icon: FileSpreadsheet },

       
        { id: 'culture-chart', label: '38.Culture Chart', icon: FlaskConical },
        { id: 'mrd-checklist', label: '39.MR Checklist', icon: CheckSquare },
        { id: 'general-medicine-opd-case-sheet', label: '40.General Medicine OPD Case Sheet', icon: FileText },
        { id: 'paediatric-opd-assessment', label: '41.Paediatrics OPD Assessment', icon: FileText },
        { id: 'consent-haemodialysis', label: '42.Consent for Haemodialysis', icon: ClipboardCheck },
        { id: 'haemodialysis-record', label: '43.Haemodialysis Record', icon: FileText },
        { id: 'dialysis-summary', label: '44.Dialysis Summary', icon: FileText }
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


















// import { useState, useEffect } from 'react';
// import {
//   FlaskConical,
//   CheckSquare,
//   Activity,
//   Droplet,
//   FileSpreadsheet,
//   FileText,
//   FileEdit,
//   Info,
//   SquareCheck,
//   ClipboardCheck,
//   ClipboardList,
//   UserPlus,
//   UserCog,
//   Users,
//   UserCheck,
//   Layers,
//   Building2,
//   Settings,
//   LayoutDashboard,
//   Search,
//   ChevronDown,
//   ChevronRight
// } from 'lucide-react';

// export default function Sidebar({ sidebarOpen, activeTab, setActiveTab }) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [openSubmenus, setOpenSubmenus] = useState({});

//   const menuSections = [
//     {
//       title: 'MASTERS',
//       items: [
//         {
//           id: 'cat-user-staff-masters',
//           label: 'User & Staff Setup',
//           icon: UserCog,
//           children: [
//             { id: 'user-master', label: 'User Control', icon: UserCog },
//             { id: 'Emp-master', label: 'Emp Master', icon: UserCog },
//             { id: 'type-master', label: 'Emp Type', icon: Layers },
//             { id: 'nurse-master', label: 'Nurse Master', icon: Users },
//             { id: 'consultant-master', label: 'Consultant Master', icon: UserCheck }
//           ]
//         },
//         {
//           id: 'cat-hospital-setup-masters',
//           label: 'Hospital Setup Masters',
//           icon: Building2,
//           children: [
//             { id: 'hospital-branch-master', label: 'Hospital Branch', icon: Building2 },
//             { id: 'department-master', label: 'Department Master', icon: Building2 },
//             { id: 'sub-department-master', label: 'Sub Department Master', icon: Layers },
//             { id: 'ward-master', label: 'Ward Master', icon: Layers },
//             { id: 'case-sheet-master', label: 'Case Sheet Master', icon: Settings },
//             { id: 'form-header-master', label: 'Form Header Master', icon: Building2 },
//             { id: 'control-master', label: 'Control Master', icon: Settings }
//           ]
//         },
//         {
//           id: 'cat-services-general-masters',
//           label: 'Services & General Masters',
//           icon: FileText,
//           children: [
//             { id: 'general-master', label: 'General Master', icon: FileText },
//             { id: 'patient-register-master', label: 'Patient Register Master', icon: FileText },
//             { id: 'antenatal-op-master', label: 'Antenatal OP Master', icon: FileEdit },
//             { id: 'package-mapping', label: 'Package Mapping', icon: FileSpreadsheet },
//             { id: 'product-master', label: 'Service Master', icon: Layers }
//           ]
//         }
//       ]
//     },
//     {
//       title: 'PATIENT REGISTER',
//       items: [
//         { id: 'new-patient-registration', label: 'OP Register', icon: UserPlus },
//         { id: 'patient-registration', label: 'IP Register', icon: UserPlus },
//         { id: 'medico-legal-register', label: 'Medico Legal Register', icon: ClipboardList }
//       ]
//     },
//     {
//       title: 'CLINICAL DASHBOARD',
//       items: [
//         { id: 'consolidated-assessment', label: 'Consolidated Assessment', icon: LayoutDashboard }
//       ]
//     },
//     {
//       title: 'PATIENT FORMS & RECORDS',
//       items: [
//         {
//           id: 'cat-admission-consents',
//           label: 'Admission & Consents',
//           icon: ClipboardCheck,
//           children: [
//             { id: 'admission-record', label: '1.Admission Record', icon: FileText },
//             { id: 'room-tariff', label: '2.Room Tariff', icon: ClipboardCheck },
//             { id: 'consent-hospitalization-conditions-of-service', label: '3.Hospitalization & Conditions of Service', icon: ClipboardCheck },
//             { id: 'general-admission-consent', label: '4.General Admission', icon: ClipboardCheck },
//             { id: 'consent-hiv-antibodies-test', label: '33.Informed Consent for HIV Antibodies Test', icon: ClipboardCheck }
//           ]
//         },
//         {
//           id: 'cat-assessment-progress',
//           label: 'Assessment & Progress',
//           icon: FileEdit,
//           children: [
//             { id: 'initial-assessment-form', label: '5.Initial Assessment', icon: FileEdit },
//             { id: 'emergency-doctor-initial-assessment', label: '6.EDIA', icon: FileEdit },
//             { id: 'nursing-initial-assessment', label: '11.Nursing IA', icon: FileText },
//             { id: 'progress-sheet', label: '12.Progress Sheet - Consultant', icon: SquareCheck },
//             { id: 'resident-doctor-progress', label: '13.Reassessment-R Dr', icon: FileText },
//             { id: 'nurses-daily-assessment', label: '14.N.Daily Assessment', icon: ClipboardList },
//             { id: 'nurse-care-plan', label: '15.Nurses Care Plan', icon: Info },
//             { id: 'initial-assessment-by-doctor', label: '27.OP -IA', icon: FileEdit },
//             { id: 'physiotherapy-assessment', label: '36.Physiotherapy Assessment & Reassessment', icon: FileEdit },
//             { id: 'mrd-checklist', label: '39.MR Checklist', icon: CheckSquare }
//           ]
//         },
//         {
//           id: 'cat-maternity-obstetrics',
//           label: 'Maternity & Obstetrics',
//           icon: FileText,
//           children: [
//             { id: 'antenatal-case-record', label: '7.Antenatal Case', icon: FileText },
//             { id: 'neonatal-inpatient-medical-record', label: '8.Neonatal Medical Record', icon: FileText },
//             { id: 'nursing-initial-assessment-obstetrics', label: '9.Nursing IA - Obstetrics', icon: FileText },
//             { id: 'antenatal-case-record-op', label: '28.Antenatal Case Record (OP)', icon: FileText },
//             { id: 'partograph', label: '31.Partograph', icon: Activity },
//             { id: 'labour-record', label: '32.Labour Record', icon: FileText }
//           ]
//         },
//         {
//           id: 'cat-surgical-ot',
//           label: 'Surgical & OT Records',
//           icon: CheckSquare,
//           children: [
//             { id: 'pre-operative-checklist', label: '22.Pre-Op Checklist', icon: CheckSquare },
//             { id: 'operation-notes', label: '23.Operation Notes', icon: FileText },
//             { id: 'operation-notes-caesarean-section', label: '24.Operation Notes for Caesarean Section', icon: FileText },
//             { id: 'post-operative-checklist', label: '25.Post Operative Check List', icon: CheckSquare },
//             { id: 'surgical-safety-checklist', label: '26.Surgical Safety Check List', icon: CheckSquare }
//           ]
//         },
//         {
//           id: 'cat-vitals-charts-rx',
//           label: 'Vitals, Charts & Rx',
//           icon: Activity,
//           children: [
//             { id: 'lab-requisition', label: '10.Lab', icon: FlaskConical },
//             { id: 'regular-drug-prescription', label: '16.Regular Drug Prescriptions', icon: FileText },
//             { id: 'investigation-chart', label: '17.Investigation Chart', icon: FileSpreadsheet },
//             { id: 'diabetic-chart', label: '18.Diabetic Chart', icon: FileSpreadsheet },
//             { id: 'vitals-chart', label: '19.Vitals Chart', icon: Activity },
//             { id: 'bp-chart', label: '20.BP Chart', icon: Activity },
//             { id: 'intake-output', label: '21.Intake & Output', icon: Droplet },
//             { id: 'culture-chart', label: '38.Culture Chart', icon: FlaskConical }
//           ]
//         },
//         {
//           id: 'cat-transfers-reports-billing',
//           label: 'Transfers, Reports & Billing',
//           icon: FileSpreadsheet,
//           children: [
//             { id: 'internal-transfer-form', label: '29.Internal Transfer', icon: FileText },
//             { id: 'external-transfer-form', label: '30.Transfer Form - External', icon: FileText },
//             { id: 'incident-report', label: '34.Incident Report', icon: FileEdit },
//             { id: 'adverse-drug-reaction-report', label: '35.Adverse Drug Reaction Report', icon: FileEdit },
//             { id: 'activity-record-billing', label: '37.Billing', icon: FileSpreadsheet }
//           ]
//         }
//       ]
//     }
//   ];

//   // Auto-expand the parent submenu containing activeTab
//   useEffect(() => {
//     if (!activeTab) return;
//     for (const section of menuSections) {
//       for (const item of section.items) {
//         if (item.children) {
//           const isMatch = item.children.some(c => c.id === activeTab);
//           if (isMatch) {
//             setOpenSubmenus(prev => ({ ...prev, [item.id]: true }));
//           }
//         }
//       }
//     }
//   }, [activeTab]);

//   const toggleSubmenu = (itemId) => {
//     setOpenSubmenus(prev => ({
//       ...prev,
//       [itemId]: !prev[itemId]
//     }));
//   };

//   return (
//     <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      
//       {/* Search Input Box */}
//       <div className="sidebar-search-container">
//         <div className="sidebar-search-box">
//           <Search size={14} className="sidebar-search-icon" />
//           <input
//             type="text"
//             placeholder="Search menu..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="sidebar-search-input"
//           />
//         </div>
//       </div>

//       <div className="sidebar-scroll-content">
//         {menuSections.map((section, idx) => {
//           const query = searchQuery.trim().toLowerCase();
          
//           const filteredItems = section.items.filter(item => {
//             if (!query) return true;
//             const itemMatch = item.label.toLowerCase().includes(query);
//             const childMatch = item.children && item.children.some(child => child.label.toLowerCase().includes(query));
//             return itemMatch || childMatch;
//           });

//           if (filteredItems.length === 0) return null;

//           return (
//             <div key={idx} className="sidebar-section">
//               <h3 className="section-title">{section.title}</h3>
//               <ul className="section-menu">
//                 {filteredItems.map((item) => {
//                   const IconComponent = item.icon;
//                   const hasChildren = Boolean(item.children && item.children.length > 0);
                  
//                   if (hasChildren) {
//                     const isChildMatchingSearch = query && item.children.some(c => c.label.toLowerCase().includes(query));
//                     const isChildActive = item.children.some(c => c.id === activeTab);
//                     const showSubmenu = query ? (isChildMatchingSearch || item.label.toLowerCase().includes(query)) : Boolean(openSubmenus[item.id]);

//                     return (
//                       <li key={item.id} className="sidebar-parent-item">
//                         <button
//                           type="button"
//                           className={`sidebar-nav-item ${isChildActive ? 'active-parent' : ''}`}
//                           onClick={() => toggleSubmenu(item.id)}
//                         >
//                           <IconComponent size={18} className="item-icon" />
//                           <span className="item-label" style={{ fontWeight: '600' }}>{item.label}</span>
//                           <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
//                             {showSubmenu ? (
//                               <ChevronDown size={16} className="chevron-icon" />
//                             ) : (
//                               <ChevronRight size={16} className="chevron-icon" />
//                             )}
//                           </span>
//                         </button>

//                         {showSubmenu && (
//                           <ul className="sidebar-submenu">
//                             {item.children
//                               .filter(child => !query || child.label.toLowerCase().includes(query) || item.label.toLowerCase().includes(query))
//                               .map(child => {
//                                 const ChildIcon = child.icon;
//                                 const isSubActive = activeTab === child.id;
//                                 return (
//                                   <li key={child.id}>
//                                     <button
//                                       type="button"
//                                       className={`sidebar-nav-item sidebar-sub-item ${isSubActive ? 'active' : ''}`}
//                                       onClick={() => setActiveTab(child.id)}
//                                     >
//                                       <ChildIcon size={16} className="item-icon" />
//                                       <span className="item-label">{child.label}</span>
//                                     </button>
//                                   </li>
//                                 );
//                               })}
//                           </ul>
//                         )}
//                       </li>
//                     );
//                   }

//                   const isItemActive = activeTab === item.id;
//                   return (
//                     <li key={item.id}>
//                       <button
//                         type="button"
//                         className={`sidebar-nav-item ${isItemActive ? 'active' : ''}`}
//                         onClick={() => setActiveTab(item.id)}
//                       >
//                         <IconComponent size={18} className="item-icon" />
//                         <span className="item-label">{item.label}</span>
//                       </button>
//                     </li>
//                   );
//                 })}
//               </ul>
//             </div>
//           );
//         })}
//       </div>

//       <div className="sidebar-footer">
//         <p className="hospital-name">Gurushree Hospital</p>
//         <p className="app-version">MRD Consent</p>
//       </div>
//     </aside>
//   );
// }
