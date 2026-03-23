import React, { useState, useEffect } from 'react';
import { Store } from '../lib/store';

export default function AdminPanel({ user }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showManageMembers, setShowManageMembers] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'user' });

  const load = () => {
    setUsers(Store.getUsers());
    setGroups(Store.getGroups());
  };

  useEffect(() => { load(); }, []);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (editUser) {
      Store.updateUser(editUser.id, { ...form });
    } else {
      Store.addUser({ ...form });
    }
    setForm({ name: '', username: '', password: '', role: 'user' });
    setShowAddUser(false);
    setEditUser(null);
    load();
  };

  const handleEditUser = (u) => {
    setEditUser(u);
    setForm({ name: u.name, username: u.username, password: u.password, role: u.role });
    setShowAddUser(true);
  };

  const handleDeleteUser = (id) => {
    if (id === user.id) return alert("Can't delete yourself!");
    if (window.confirm('Delete this user?')) { Store.deleteUser(id); load(); }
  };

  const toggleMember = (groupId, userId) => {
    const g = groups.find(g => g.id === groupId);
    const members = g.members || [];
    const updated = members.includes(userId)
      ? members.filter(m => m !== userId)
      : [...members, userId];
    Store.updateGroup(groupId, { members: updated });
    load();
    setShowManageMembers({ ...showManageMembers, members: updated });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>⚙️ Admin Panel</h2>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          👥 Users ({users.length})
        </button>
        <button className={`tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>
          📁 Groups ({groups.length})
        </button>
      </div>

      {tab === 'users' && (
        <div>
          <div className="section-header">
            <h3>All Users</h3>
            <button className="btn-primary" onClick={() => { setShowAddUser(true); setEditUser(null); setForm({ name: '', username: '', password: '', role: 'user' }); }}>
              + Add User
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Username</th><th>Role</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="user-row">
                        <span className="avatar sm">{u.avatar}</span>
                        {u.name}
                      </div>
                    </td>
                    <td><code>{u.username}</code></td>
                    <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="act-edit" onClick={() => handleEditUser(u)}>✏️</button>
                        {u.id !== user.id && (
                          <button className="act-del" onClick={() => handleDeleteUser(u.id)}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'groups' && (
        <div>
          <div className="section-header">
            <h3>All Groups</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th><th>Title</th><th>Members</th><th>Entries</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, i) => {
                  const memberObjs = users.filter(u => g.members?.includes(u.id));
                  const entries = Store.getGroupEntries(g.id);
                  return (
                    <tr key={g.id}>
                      <td>{i + 1}</td>
                      <td><strong>{g.title}</strong><br /><small>{g.description}</small></td>
                      <td>
                        <div className="members-row">
                          {memberObjs.map(m => (
                            <span key={m.id} className="member-avatar" title={m.name}>{m.avatar}</span>
                          ))}
                          <span className="member-count">{memberObjs.length}</span>
                        </div>
                      </td>
                      <td>{entries.length}</td>
                      <td>
                        <button className="btn-ghost sm"
                          onClick={() => setShowManageMembers({ ...g, membersList: users })}>
                          Manage Members
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showAddUser && (
        <div className="modal-overlay" onClick={() => { setShowAddUser(false); setEditUser(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleAddUser}>
              <div className="field">
                <label>Full Name *</label>
                <input type="text" placeholder="e.g. Kannan Kumar"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Username *</label>
                  <input type="text" placeholder="login name"
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Password *</label>
                  <input type="text" placeholder="password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
              </div>
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => { setShowAddUser(false); setEditUser(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editUser ? 'Update' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showManageMembers && (
        <div className="modal-overlay" onClick={() => setShowManageMembers(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Members — {showManageMembers.title}</h3>
            <p className="modal-sub">Toggle members for this group</p>
            <div className="members-list">
              {users.map(u => {
                const g = groups.find(g => g.id === showManageMembers.id);
                const isMember = g?.members?.includes(u.id);
                return (
                  <div key={u.id} className={`member-item ${isMember ? 'active' : ''}`}
                    onClick={() => toggleMember(showManageMembers.id, u.id)}>
                    <span className="avatar">{u.avatar}</span>
                    <div>
                      <div className="mname">{u.name}</div>
                      <div className="mrole">{u.role}</div>
                    </div>
                    <span className="check">{isMember ? '✅' : '⬜'}</span>
                  </div>
                );
              })}
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowManageMembers(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
