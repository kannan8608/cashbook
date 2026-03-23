import React, { useState } from 'react';
import { Store } from '../lib/store';

export default function GroupList({ user, groups, onSelect, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    Store.addGroup({
      title: form.title,
      description: form.description,
      createdBy: user.id,
      members: [user.id],
    });
    setForm({ title: '', description: '' });
    setShowAdd(false);
    onRefresh();
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this group and all its entries?')) {
      Store.deleteGroup(id);
      onRefresh();
    }
  };

  const getStats = (groupId) => {
    const entries = Store.getGroupEntries(groupId);
    const totalIn = entries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
    const totalOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
    return { totalIn, totalOut, balance: totalIn - totalOut, count: entries.length };
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>My Groups</h2>
          <p className="subtitle">Select a group to view its cashbook</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ New Group</button>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Group</h3>
            <form onSubmit={handleAdd}>
              <div className="field">
                <label>Group Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Office Fund, Team Outing"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Brief description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>No groups yet. Ask your admin to add you to a group.</p>
        </div>
      ) : (
        <div className="group-grid">
          {groups.map(g => {
            const stats = getStats(g.id);
            const members = Store.getUsers().filter(u => g.members?.includes(u.id));
            return (
              <div key={g.id} className="group-card" onClick={() => onSelect(g)}>
                <div className="group-card-header">
                  <div className="group-icon">💼</div>
                  <div className="group-info">
                    <h3>{g.title}</h3>
                    {g.description && <p>{g.description}</p>}
                  </div>
                  {user.role === 'admin' && (
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDelete(g.id, e)}
                      title="Delete group"
                    >🗑</button>
                  )}
                </div>
                <div className="group-stats">
                  <div className="stat in">
                    <span className="stat-label">Cash In</span>
                    <span className="stat-value">₹{stats.totalIn.toLocaleString()}</span>
                  </div>
                  <div className="stat out">
                    <span className="stat-label">Cash Out</span>
                    <span className="stat-value">₹{stats.totalOut.toLocaleString()}</span>
                  </div>
                  <div className={`stat balance ${stats.balance >= 0 ? 'pos' : 'neg'}`}>
                    <span className="stat-label">Balance</span>
                    <span className="stat-value">₹{stats.balance.toLocaleString()}</span>
                  </div>
                </div>
                <div className="group-footer">
                  <div className="members-row">
                    {members.slice(0, 4).map(m => (
                      <span key={m.id} className="member-avatar" title={m.name}>{m.avatar}</span>
                    ))}
                    {members.length > 4 && <span className="member-more">+{members.length - 4}</span>}
                  </div>
                  <span className="entry-count">{stats.count} entries</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
