import React, { useState, useEffect, useMemo } from 'react';
import { Store } from '../lib/store';
import { exportToExcel, exportToPDF } from '../lib/export';
import { generateInviteToken, getInviteLink, getGroupInvites, revokeInvite } from '../lib/invite';

const PAYMENT_MODES = ['Cash', 'Online', 'UPI', 'Card', 'Cheque', 'Other'];

export default function GroupDashboard({ user, group, onBack }) {
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invites, setInvites] = useState([]);
  const [copiedToken, setCopiedToken] = useState('');
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', type: 'all', member: 'all', paymentMode: 'all', sortBy: 'date_desc',
  });
  const [form, setForm] = useState({ title: '', type: 'in', amount: '', paymentMode: 'Cash', note: '' });

  const loadData = () => {
    setEntries(Store.getGroupEntries(group.id));
    setMembers(Store.getUsers().filter(u => group.members?.includes(u.id)));
    setInvites(getGroupInvites(group.id));
  };

  useEffect(() => { loadData(); }, [group.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const entryData = {
      groupId: group.id, title: form.title, type: form.type,
      amount: parseFloat(form.amount), paymentMode: form.paymentMode,
      note: form.note, enteredBy: user.id, enteredByName: user.name,
    };
    if (editEntry) Store.updateEntry(editEntry.id, entryData);
    else Store.addEntry(entryData);
    resetForm(); loadData();
  };

  const resetForm = () => {
    setForm({ title: '', type: 'in', amount: '', paymentMode: 'Cash', note: '' });
    setShowAdd(false); setEditEntry(null);
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setForm({ title: entry.title, type: entry.type, amount: entry.amount, paymentMode: entry.paymentMode, note: entry.note || '' });
    setShowAdd(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this entry?')) { Store.deleteEntry(id); loadData(); }
  };

  const canEdit = (entry) => user.role === 'admin' || entry.enteredBy === user.id;

  const filtered = useMemo(() => {
    let list = [...entries];
    if (filters.type !== 'all') list = list.filter(e => e.type === filters.type);
    if (filters.member !== 'all') list = list.filter(e => e.enteredBy === filters.member);
    if (filters.paymentMode !== 'all') list = list.filter(e => e.paymentMode === filters.paymentMode);
    if (filters.dateFrom) list = list.filter(e => new Date(e.date) >= new Date(filters.dateFrom));
    if (filters.dateTo) list = list.filter(e => new Date(e.date) <= new Date(filters.dateTo + 'T23:59:59'));
    switch (filters.sortBy) {
      case 'date_asc': list.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
      case 'date_desc': list.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
      case 'amount_asc': list.sort((a, b) => a.amount - b.amount); break;
      case 'amount_desc': list.sort((a, b) => b.amount - a.amount); break;
      case 'member_asc': list.sort((a, b) => a.enteredByName.localeCompare(b.enteredByName)); break;
      default: break;
    }
    return list;
  }, [entries, filters]);

  const totalIn = filtered.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const totalOut = filtered.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const balance = totalIn - totalOut;

  const fmtDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const resetFilters = () => setFilters({ dateFrom: '', dateTo: '', type: 'all', member: 'all', paymentMode: 'all', sortBy: 'date_desc' });

  const handleGenerateInvite = () => {
    generateInviteToken(group.id, user.id);
    setInvites(getGroupInvites(group.id));
  };

  const handleCopyLink = (token) => {
    navigator.clipboard.writeText(getInviteLink(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const handleRevokeInvite = (token) => {
    revokeInvite(token);
    setInvites(getGroupInvites(group.id));
  };

  return (
    <div className="page">
      {/* Summary Cards */}
      <div className="summary-row">
        <div className="summary-card balance">
          <div className="summary-label">Net Balance</div>
          <div className={`summary-amount ${balance >= 0 ? 'pos' : 'neg'}`}>₹{Math.abs(balance).toLocaleString()}</div>
          <div className="summary-sub">{balance >= 0 ? 'Surplus' : 'Deficit'}</div>
        </div>
        <div className="summary-card in">
          <div className="summary-label">Total Cash In</div>
          <div className="summary-amount pos">₹{totalIn.toLocaleString()}</div>
          <div className="summary-sub">{filtered.filter(e => e.type === 'in').length} transactions</div>
        </div>
        <div className="summary-card out">
          <div className="summary-label">Total Cash Out</div>
          <div className="summary-amount neg">₹{totalOut.toLocaleString()}</div>
          <div className="summary-sub">{filtered.filter(e => e.type === 'out').length} transactions</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-row">
        <div className="export-btns">
          <button className="btn-ghost sm" onClick={() => exportToExcel(filtered, group.title)}>📊 Export Excel</button>
          <button className="btn-ghost sm" onClick={() => exportToPDF(filtered, group.title)}>📄 Export PDF</button>
          {user.role === 'admin' && (
            <button className="btn-ghost sm" onClick={() => setShowInvite(true)}>🔗 Invite Link</button>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Entry</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-row">
          <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
            <option value="all">All Types</option>
            <option value="in">Cash In</option>
            <option value="out">Cash Out</option>
          </select>
          <select value={filters.member} onChange={e => setFilters({ ...filters, member: e.target.value })}>
            <option value="all">All Members</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filters.paymentMode} onChange={e => setFilters({ ...filters, paymentMode: e.target.value })}>
            <option value="all">All Payment</option>
            {PAYMENT_MODES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.sortBy} onChange={e => setFilters({ ...filters, sortBy: e.target.value })}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="amount_desc">Amount ↓</option>
            <option value="amount_asc">Amount ↑</option>
            <option value="member_asc">Member A-Z</option>
          </select>
        </div>
        <div className="filter-row">
          <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
          <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
          <button className="btn-ghost sm" onClick={resetFilters}>Reset Filters</button>
        </div>
      </div>

      {/* Entries Table */}
      <div className="table-wrap">
        <table className="entries-table">
          <thead>
            <tr>
              <th>#</th><th>Description</th><th>Entered By</th>
              <th>Date / Time</th><th>Payment</th><th>Amount</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="no-data">No entries found. Click "+ Add Entry" to start.</td></tr>
            ) : filtered.map((e, i) => (
              <tr key={e.id} className={e.type}>
                <td className="si">{i + 1}</td>
                <td>
                  <div className="entry-title">{e.title}</div>
                  {e.note && <div className="entry-note">{e.note}</div>}
                </td>
                <td>
                  <div className="entered-by">
                    <span className="mini-avatar">{e.enteredByName?.[0]}</span>
                    {e.enteredByName}
                  </div>
                </td>
                <td className="date-cell">{fmtDate(e.date)}</td>
                <td><span className="payment-badge">{e.paymentMode}</span></td>
                <td className={`amount-cell ${e.type}`}>
                  <span className="type-indicator">{e.type === 'in' ? '▲' : '▼'}</span>
                  ₹{e.amount.toLocaleString()}
                </td>
                <td>
                  {canEdit(e) && (
                    <div className="action-btns">
                      <button className="act-edit" onClick={() => handleEdit(e)}>✏️</button>
                      <button className="act-del" onClick={() => handleDelete(e.id)}>🗑</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Entry Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editEntry ? 'Edit Entry' : 'Add New Entry'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="type-toggle">
                <button type="button" className={`type-btn in ${form.type === 'in' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, type: 'in' })}>▲ Cash In</button>
                <button type="button" className={`type-btn out ${form.type === 'out' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, type: 'out' })}>▼ Cash Out</button>
              </div>
              <div className="field">
                <label>Description *</label>
                <input type="text" placeholder="What is this for?"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Amount (₹) *</label>
                  <input type="number" placeholder="0.00" min="0" step="0.01"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Payment Mode</label>
                  <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                    {PAYMENT_MODES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Note (optional)</label>
                <input type="text" placeholder="Additional details"
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
                <button type="submit" className={`btn-primary ${form.type === 'out' ? 'danger' : ''}`}>
                  {editEntry ? 'Update Entry' : form.type === 'in' ? '+ Cash In' : '- Cash Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Links Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <h3>🔗 Invite Members — {group.title}</h3>
            <p className="modal-sub">Share these links so members can join this group. Each link can be used once.</p>
            <button className="btn-primary" style={{ marginBottom: 16 }} onClick={handleGenerateInvite}>
              + Generate New Invite Link
            </button>
            {invites.length === 0 ? (
              <div className="empty-mini">No invite links yet.</div>
            ) : (
              <div className="invite-list">
                {invites.map(inv => (
                  <div key={inv.token} className={`invite-item ${inv.used ? 'used' : ''}`}>
                    <div className="invite-info">
                      <div className="invite-link-text">{getInviteLink(inv.token)}</div>
                      <div className="invite-meta">
                        Created: {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                        {inv.used && <span className="used-badge"> · Used</span>}
                      </div>
                    </div>
                    <div className="invite-actions">
                      {!inv.used && (
                        <button className="btn-ghost sm"
                          onClick={() => handleCopyLink(inv.token)}>
                          {copiedToken === inv.token ? '✅ Copied!' : '📋 Copy'}
                        </button>
                      )}
                      <button className="btn-ghost sm danger" onClick={() => handleRevokeInvite(inv.token)}>Revoke</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowInvite(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
