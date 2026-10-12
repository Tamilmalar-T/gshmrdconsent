import { useState, useEffect } from 'react';
import {
  UserCog,
  Users,
  Layers,
  Settings,
  Building2,
  FileText,
  UserCheck,
  FileEdit,
  FileSpreadsheet,
  Star,
  Search,
  LayoutGrid,
  ArrowRight,
  ShieldCheck,
  Package,
  Activity,
  Sparkles
} from 'lucide-react';

const MASTERS_LIST = [
  {
    id: 'user-master',
    title: 'User Control',
    category: 'System & Security',
    description: 'Manage system user accounts, credentials, and access roles.',
    icon: UserCog,
    color: '#3b82f6',
    bgColor: '#eff6ff'
  },
  {
    id: 'Emp-master',
    title: 'Emp Master',
    category: 'Human Resources',
    description: 'Register and manage hospital staff and employee directory.',
    icon: Users,
    color: '#0d9488',
    bgColor: '#ccfbf1'
  },
  {
    id: 'type-master',
    title: 'Emp Type',
    category: 'Human Resources',
    description: 'Configure employee designations, types, and role classifications.',
    icon: Layers,
    color: '#8b5cf6',
    bgColor: '#f3e8ff'
  },
  {
    id: 'case-sheet-master',
    title: 'Case Sheet Master',
    category: 'Clinical Settings',
    description: 'Configure case sheet types, templates, and clinical layouts.',
    icon: Settings,
    color: '#ec4899',
    bgColor: '#fce7f3'
  },
  {
    id: 'nurse-master',
    title: 'Nurse Master',
    category: 'Nursing Staff',
    description: 'Nursing staff database, duty shifts, and ward assignments.',
    icon: ShieldCheck,
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  {
    id: 'ward-master',
    title: 'Ward Master',
    category: 'Hospital Infrastructure',
    description: 'Manage ward categories, room numbers, and bed allocations.',
    icon: Building2,
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  {
    id: 'form-header-master',
    title: 'Form Header Master',
    category: 'Branding & Templates',
    description: 'Configure paper header logos, contact details, and hospital headers.',
    icon: Building2,
    color: '#6366f1',
    bgColor: '#e0e7ff'
  },
  {
    id: 'general-master',
    title: 'General Master',
    category: 'System Settings',
    description: 'General system dropdowns, constants, and standard suggestions.',
    icon: FileText,
    color: '#64748b',
    bgColor: '#f1f5f9'
  },
  {
    id: 'patient-register-master',
    title: 'Patient Register Master',
    category: 'Registration',
    description: 'Configure patient registration options, categories, and sources.',
    icon: FileText,
    color: '#0284c7',
    bgColor: '#e0f2fe'
  },
  {
    id: 'consultant-master',
    title: 'Consultant Master',
    category: 'Medical Staff',
    description: 'Doctor & consultant registry, specializations, and OPD timings.',
    icon: UserCheck,
    color: '#14b8a6',
    bgColor: '#f0fdf4'
  },
  {
    id: 'control-master',
    title: 'Control Master',
    category: 'System Settings',
    description: 'System-wide flags, module controls, and operational parameters.',
    icon: Settings,
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  {
    id: 'antenatal-op-master',
    title: 'Antenatal OP Master',
    category: 'Obstetrics & Gynecology',
    description: 'Antenatal outpatient investigation lists and clinical parameters.',
    icon: FileEdit,
    color: '#d946ef',
    bgColor: '#fae8ff'
  },
  {
    id: 'package-mapping',
    title: 'Package Mapping',
    category: 'Billing & Packages',
    description: 'Map medical services, tests, and procedures to health packages.',
    icon: FileSpreadsheet,
    color: '#f97316',
    bgColor: '#ffedd5'
  },
  {
    id: 'product-master',
    title: 'Service Master',
    category: 'Billing & Tariff',
    description: 'Master catalog of hospital services, tariffs, and procedure rates.',
    icon: Package,
    color: '#84cc16',
    bgColor: '#ecfccb'
  },
  {
    id: 'hospital-branch-master',
    title: 'Hospital Branch',
    category: 'Hospital Infrastructure',
    description: 'Hospital branches, units, and campus locations registry.',
    icon: Building2,
    color: '#06b6d4',
    bgColor: '#cffafe'
  },
  {
    id: 'department-master',
    title: 'Department Master',
    category: 'Hospital Infrastructure',
    description: 'Manage clinical and administrative hospital departments.',
    icon: Building2,
    color: '#3b82f6',
    bgColor: '#eff6ff'
  },
  {
    id: 'sub-department-master',
    title: 'Sub Department Master',
    category: 'Hospital Infrastructure',
    description: 'Sub-departments, specialized units, and division mappings.',
    icon: Layers,
    color: '#a855f7',
    bgColor: '#f3e8ff'
  }
];

const getCurrentUserId = (userObj) => {
  if (userObj && (userObj.userId || userObj.userName || userObj.id)) {
    return (userObj.userId || userObj.userName || userObj.id).toString().toLowerCase().trim();
  }
  try {
    const raw = localStorage.getItem('logged_in_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && (u.userId || u.userName || u.id)) {
        return (u.userId || u.userName || u.id).toString().toLowerCase().trim();
      }
    }
  } catch (e) {}
  return 'default';
};

const getUserFavoritesKey = (userObj) => {
  const uid = getCurrentUserId(userObj);
  return `favorite_masters_${uid}`;
};

export default function AllMastersPage({ onNavigate, loggedInUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try {
      const key = getUserFavoritesKey(loggedInUser);
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return ['user-master', 'consultant-master', 'ward-master', 'product-master'];
  });

  useEffect(() => {
    try {
      const key = getUserFavoritesKey(loggedInUser);
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        setFavorites(JSON.parse(saved));
      } else {
        setFavorites(['user-master', 'consultant-master', 'ward-master', 'product-master']);
      }
    } catch (e) {
      setFavorites(['user-master', 'consultant-master', 'ward-master', 'product-master']);
    }
  }, [loggedInUser]);

  useEffect(() => {
    try {
      const key = getUserFavoritesKey(loggedInUser);
      localStorage.setItem(key, JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites, loggedInUser]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleTileClick = (id) => {
    if (onNavigate) {
      onNavigate(id);
    }
  };

  const filteredMasters = MASTERS_LIST.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  const favoriteMastersList = MASTERS_LIST.filter(m => favorites.includes(m.id));

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px 28px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
          }}>
            <LayoutGrid size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
              All Masters & Favorites
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Quick access dashboard for system configurations, registries, and master settings.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search master modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              outline: 'none',
              fontSize: '13px',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0d9488'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>
      </div>

      {/* SECTION 1: FAVORITES SECTION */}
      {!searchQuery && (
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Star size={18} fill="#f59e0b" color="#f59e0b" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Favorite Masters ({favoriteMastersList.length})
            </h2>
          </div>

          {favoriteMastersList.length === 0 ? (
            <div style={{
              backgroundColor: '#fefce8',
              border: '1.5px dashed #fde047',
              borderRadius: '10px',
              padding: '24px',
              textAlign: 'center',
              color: '#854d0e'
            }}>
              <Sparkles size={24} style={{ marginBottom: '8px', opacity: 0.8 }} />
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>No Favorite Masters Added Yet</div>
              <div style={{ fontSize: '12.5px' }}>
                Click the star icon (★) on any master tile below to pin your frequently used masters here for fast navigation.
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '16px'
            }}>
              {favoriteMastersList.map(master => {
                const IconComp = master.icon;
                return (
                  <div
                    key={`fav-${master.id}`}
                    onClick={() => handleTileClick(master.id)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      minHeight: '160px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = master.color;
                      e.currentTarget.style.boxShadow = `0 8px 20px ${master.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: master.bgColor,
                        color: master.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComp size={22} />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, master.id)}
                        title="Remove from Favorites"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Star size={18} fill="#f59e0b" color="#f59e0b" />
                      </button>
                    </div>

                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: master.color, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                        {master.category}
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', marginBottom: '6px', lineHeight: '1.3' }}>
                        {master.title}
                      </div>
                      <div style={{
                        fontSize: '11.5px',
                        color: '#64748b',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {master.description}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '700', color: master.color, marginTop: '12px' }}>
                      <span>Open Master</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ALL MASTERS GRID */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutGrid size={18} color="#0d9488" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              All System Masters ({filteredMasters.length})
            </h2>
          </div>
        </div>

        {filteredMasters.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
            border: '1px solid #e2e8f0'
          }}>
            <Search size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>No Master Found</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              No master module matching "{searchQuery}" was found.
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '18px'
          }}>
            {filteredMasters.map(master => {
              const IconComp = master.icon;
              const isFav = favorites.includes(master.id);

              return (
                <div
                  key={master.id}
                  onClick={() => handleTileClick(master.id)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '18px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    minHeight: '170px',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = master.color;
                    e.currentTarget.style.boxShadow = `0 8px 20px ${master.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: master.bgColor,
                      color: master.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComp size={22} />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, master.id)}
                      title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Star
                        size={18}
                        fill={isFav ? '#f59e0b' : 'none'}
                        color={isFav ? '#f59e0b' : '#94a3b8'}
                      />
                    </button>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: master.color, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      {master.category}
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', marginBottom: '6px', lineHeight: '1.3' }}>
                      {master.title}
                    </div>
                    <div style={{
                      fontSize: '11.5px',
                      color: '#64748b',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {master.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '700', color: master.color, marginTop: '14px' }}>
                    <span>Open Master</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
