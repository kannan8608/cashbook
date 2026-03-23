import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Store } from './lib/store';
import { getInviteByToken, markInviteUsed } from './lib/invite';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvite, setPendingInvite] = useState(null);

  useEffect(() => {
    // Check for invite token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      const invite = getInviteByToken(token);
      if (invite && !invite.used) {
        setPendingInvite({ token, ...invite });
      }
    }
    const stored = localStorage.getItem('cashbook_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('cashbook_user', JSON.stringify(userData));

    // Process pending invite
    if (pendingInvite) {
      const groups = Store.getGroups();
      const group = groups.find(g => g.id === pendingInvite.groupId);
      if (group && !group.members?.includes(userData.id)) {
        Store.updateGroup(group.id, { members: [...(group.members || []), userData.id] });
        markInviteUsed(pendingInvite.token);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        alert(`✅ You've been added to "${group.title}"!`);
      }
      setPendingInvite(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cashbook_user');
  };

  if (loading) return (
    <div className="splash">
      <div className="splash-icon">💰</div>
      <div className="splash-title">CashBook</div>
    </div>
  );

  if (!user) return (
    <Login
      onLogin={handleLogin}
      pendingInvite={pendingInvite}
    />
  );

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;
