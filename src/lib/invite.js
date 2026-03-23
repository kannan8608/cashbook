// Invite link system - generates sharable tokens stored in localStorage

export function generateInviteToken(groupId, createdBy) {
  const token = btoa(`${groupId}:${Date.now()}:${Math.random().toString(36).slice(2)}`);
  const invites = getInvites();
  invites[token] = { groupId, createdBy, createdAt: new Date().toISOString(), used: false };
  localStorage.setItem('cb_invites', JSON.stringify(invites));
  return token;
}

export function getInvites() {
  try {
    return JSON.parse(localStorage.getItem('cb_invites') || '{}');
  } catch { return {}; }
}

export function getInviteLink(token) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?invite=${token}`;
}

export function getInviteByToken(token) {
  const invites = getInvites();
  return invites[token] || null;
}

export function markInviteUsed(token) {
  const invites = getInvites();
  if (invites[token]) {
    invites[token].used = true;
    invites[token].usedAt = new Date().toISOString();
    localStorage.setItem('cb_invites', JSON.stringify(invites));
  }
}

export function revokeInvite(token) {
  const invites = getInvites();
  delete invites[token];
  localStorage.setItem('cb_invites', JSON.stringify(invites));
}

export function getGroupInvites(groupId) {
  const invites = getInvites();
  return Object.entries(invites)
    .filter(([, v]) => v.groupId === groupId)
    .map(([token, v]) => ({ token, ...v }));
}
