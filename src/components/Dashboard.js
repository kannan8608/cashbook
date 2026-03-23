import React, { useState, useEffect } from 'react';
import { Store } from '../lib/store';
import GroupList from './GroupList';
import GroupDashboard from './GroupDashboard';
import AdminPanel from './AdminPanel';

export default function Dashboard({ user, onLogout }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [view, setView] = useState('groups'); // groups | dashboard | admin

  const loadGroups = () => {
    const g = Store.getUserGroups(user.id, user.role);
    setGroups(g);
  };

  useEffect(() => { loadGroups(); }, []);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setView('dashboard');
  };

  const handleBack = () => {
    setSelectedGroup(null);
    setView('groups');
    loadGroups();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          {view !== 'groups' && (
            <button className="back-btn" onClick={handleBack}>← Back</button>
          )}
          <span className="topbar-logo">💰 CashBook</span>
          {selectedGroup && <span className="topbar-group">{selectedGroup.title}</span>}
        </div>
        <div className="topbar-right">
          {user.role === 'admin' && (
            <button
              className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
              onClick={() => { setView('admin'); setSelectedGroup(null); }}
            >
              ⚙️ Admin
            </button>
          )}
          <div className="user-chip">
            <span className="avatar">{user.avatar}</span>
            <span className="uname">{user.name}</span>
            {user.role === 'admin' && <span className="role-badge">Admin</span>}
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="main-content">
        {view === 'groups' && (
          <GroupList
            user={user}
            groups={groups}
            onSelect={handleSelectGroup}
            onRefresh={loadGroups}
          />
        )}
        {view === 'dashboard' && selectedGroup && (
          <GroupDashboard
            user={user}
            group={selectedGroup}
            onBack={handleBack}
          />
        )}
        {view === 'admin' && user.role === 'admin' && (
          <AdminPanel user={user} />
        )}
      </main>
    </div>
  );
}
