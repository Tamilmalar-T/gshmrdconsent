import { useState, useEffect } from 'react';
import { History, User, Clock, CalendarDays, LogOut, Timer } from 'lucide-react';

export default function LoginDetailsPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('login_history');
    if (saved) {
      setHistory(JSON.parse(saved).reverse()); // Reverse to show latest first
    }
  }, []);

  return (
    <div className="login-details-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="pr-page-header" style={{ marginBottom: '20px' }}>
        <div className="pr-header-titles">
          <h1 className="pr-main-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={24} color="#0070bb" />
            Login Details
          </h1>
          <p className="pr-sub-title">
            View history of user logins, logouts, and total working time.
          </p>
        </div>
      </div>

      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip">
          <h3 className="pr-table-title">Session Logs</h3>
          <span className="pr-page-count">{history.length} records found</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>LOGGED-IN USER</th>
                <th>LOGIN DATE</th>
                <th>LOGIN TIME</th>
                <th>LOGOUT TIME</th>
                <th>TOTAL WORKING TIME</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pr-empty-cell">
                    No login history found.
                  </td>
                </tr>
              ) : (
                history.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="#64748b" />
                        <span className="font-semibold-name">{session.userName}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>({session.userId})</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarDays size={14} color="#64748b" />
                        {session.loginDate}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} color="#16a34a" />
                        {session.loginTime}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {session.logoutTime ? (
                          <>
                            <LogOut size={14} color="#dc2626" />
                            {session.logoutTime}
                          </>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 'bold' }}>Active Session</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Timer size={14} color="#0070bb" />
                        {session.totalWorkingTime || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
