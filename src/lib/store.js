// Initial seed data
const defaultUsers = [
  { id: 'u1', name: 'Admin User', username: 'admin', password: 'admin123', role: 'admin', avatar: 'A' },
  { id: 'u2', name: 'Kannan', username: 'kannan', password: 'user123', role: 'user', avatar: 'K' },
  { id: 'u3', name: 'Priya', username: 'priya', password: 'user123', role: 'user', avatar: 'P' },
  { id: 'u4', name: 'Ravi', username: 'ravi', password: 'user123', role: 'user', avatar: 'R' },
];

const defaultGroups = [
  { id: 'g1', title: 'Office Fund', description: 'Monthly office expenses', createdBy: 'u1', createdAt: new Date().toISOString(), members: ['u1', 'u2', 'u3'] },
  { id: 'g2', title: 'Team Outing', description: 'Team outing budget 2024', createdBy: 'u1', createdAt: new Date().toISOString(), members: ['u1', 'u2', 'u3', 'u4'] },
];

const defaultEntries = [
  { id: 'e1', groupId: 'g1', title: 'Stationery purchase', type: 'out', amount: 500, paymentMode: 'cash', enteredBy: 'u2', enteredByName: 'Kannan', date: '2024-03-10T09:30:00', note: 'Pens, notebooks' },
  { id: 'e2', groupId: 'g1', title: 'Monthly collection', type: 'in', amount: 5000, paymentMode: 'online', enteredBy: 'u1', enteredByName: 'Admin User', date: '2024-03-01T10:00:00', note: '' },
  { id: 'e3', groupId: 'g1', title: 'Snacks for meeting', type: 'out', amount: 800, paymentMode: 'cash', enteredBy: 'u3', enteredByName: 'Priya', date: '2024-03-12T14:00:00', note: '' },
  { id: 'e4', groupId: 'g2', title: 'Advance collection', type: 'in', amount: 10000, paymentMode: 'online', enteredBy: 'u1', enteredByName: 'Admin User', date: '2024-03-05T11:00:00', note: '' },
  { id: 'e5', groupId: 'g2', title: 'Hotel booking', type: 'out', amount: 4500, paymentMode: 'online', enteredBy: 'u2', enteredByName: 'Kannan', date: '2024-03-08T16:00:00', note: 'Booked 3 rooms' },
];

function load(key, def) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : def;
  } catch { return def; }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const Store = {
  getUsers: () => load('cb_users', defaultUsers),
  saveUsers: (u) => save('cb_users', u),
  getGroups: () => load('cb_groups', defaultGroups),
  saveGroups: (g) => save('cb_groups', g),
  getEntries: () => load('cb_entries', defaultEntries),
  saveEntries: (e) => save('cb_entries', e),

  login(username, password) {
    const users = this.getUsers();
    return users.find(u => u.username === username && u.password === password) || null;
  },

  addUser(data) {
    const users = this.getUsers();
    const newUser = { ...data, id: 'u' + Date.now(), avatar: data.name[0].toUpperCase() };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(id, data) {
    const users = this.getUsers().map(u => u.id === id ? { ...u, ...data } : u);
    this.saveUsers(users);
  },

  deleteUser(id) {
    this.saveUsers(this.getUsers().filter(u => u.id !== id));
  },

  addGroup(data) {
    const groups = this.getGroups();
    const newGroup = { ...data, id: 'g' + Date.now(), createdAt: new Date().toISOString() };
    groups.push(newGroup);
    this.saveGroups(groups);
    return newGroup;
  },

  updateGroup(id, data) {
    const groups = this.getGroups().map(g => g.id === id ? { ...g, ...data } : g);
    this.saveGroups(groups);
  },

  deleteGroup(id) {
    this.saveGroups(this.getGroups().filter(g => g.id !== id));
    this.saveEntries(this.getEntries().filter(e => e.groupId !== id));
  },

  addEntry(data) {
    const entries = this.getEntries();
    const newEntry = { ...data, id: 'e' + Date.now(), date: new Date().toISOString() };
    entries.push(newEntry);
    this.saveEntries(entries);
    return newEntry;
  },

  updateEntry(id, data) {
    const entries = this.getEntries().map(e => e.id === id ? { ...e, ...data } : e);
    this.saveEntries(entries);
  },

  deleteEntry(id) {
    this.saveEntries(this.getEntries().filter(e => e.id !== id));
  },

  getGroupEntries(groupId) {
    return this.getEntries().filter(e => e.groupId === groupId);
  },

  getUserGroups(userId, role) {
    const groups = this.getGroups();
    if (role === 'admin') return groups;
    return groups.filter(g => g.members.includes(userId));
  },
};
