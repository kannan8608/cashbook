import React, { useState } from 'react';
import { Store } from '../lib/store';

export default function Login({ onLogin, pendingInvite }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    setTimeout(() => {
      const user = Store.login(username.trim(), password);
      if (user) onLogin(user);
      else setError('Invalid username or password');
      setLoading(false);
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-icon">💰</span>
          <h1>CashBook</h1>
          <p>Group Cash Management</p>
        </div>

        {pendingInvite && (
          <div className="invite-notice">
            🔗 You have a group invite! Sign in to join the group.
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Username</label>
            <input type="text" placeholder="Enter username"
              value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Enter password"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-demo">
          <p>Demo accounts:</p>
          <div className="demo-accounts">
            <span onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
              👑 admin / admin123
            </span>
            <span onClick={() => { setUsername('kannan'); setPassword('user123'); }}>
              👤 kannan / user123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
