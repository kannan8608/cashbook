// supabase-store.js
// Drop-in replacement for lib/store.js when you connect Supabase
// 
// SETUP STEPS:
// 1. Create a project at https://supabase.com
// 2. Run supabase-schema.sql in your SQL editor
// 3. Copy your project URL and anon key below
// 4. Run: npm install @supabase/supabase-js
// 5. Replace import in components from './lib/store' to './lib/supabase-store'

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';   // ← replace
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';                  // ← replace

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const Store = {
  // AUTH
  async login(username, password) {
    // Fetch profile by username to get email
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (!profile) return null;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@cashbook.app`,
      password,
    });
    if (error) return null;
    return { ...profile, supabaseUser: data.user };
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  // USERS
  async getUsers() {
    const { data } = await supabase.from('profiles').select('*').order('name');
    return data || [];
  },

  async addUser({ name, username, password, role }) {
    // Create auth user
    const { data: auth } = await supabase.auth.admin.createUser({
      email: `${username}@cashbook.app`,
      password,
      email_confirm: true,
    });
    if (!auth?.user) throw new Error('Failed to create auth user');

    const { data } = await supabase.from('profiles').insert({
      id: auth.user.id,
      name, username, role,
      avatar: name[0].toUpperCase(),
    }).select().single();
    return data;
  },

  async updateUser(id, data) {
    await supabase.from('profiles').update(data).eq('id', id);
  },

  async deleteUser(id) {
    await supabase.from('profiles').delete().eq('id', id);
  },

  // GROUPS
  async getGroups() {
    const { data } = await supabase
      .from('groups')
      .select('*, group_members(user_id)')
      .order('created_at', { ascending: false });
    return (data || []).map(g => ({
      ...g,
      members: g.group_members.map(m => m.user_id),
    }));
  },

  async getUserGroups(userId, role) {
    if (role === 'admin') return this.getGroups();
    const { data } = await supabase
      .from('groups')
      .select('*, group_members!inner(user_id)')
      .eq('group_members.user_id', userId);
    return (data || []).map(g => ({
      ...g,
      members: g.group_members.map(m => m.user_id),
    }));
  },

  async addGroup({ title, description, createdBy, members }) {
    const { data: group } = await supabase
      .from('groups')
      .insert({ title, description, created_by: createdBy })
      .select().single();

    if (members?.length) {
      await supabase.from('group_members').insert(
        members.map(uid => ({ group_id: group.id, user_id: uid }))
      );
    }
    return group;
  },

  async updateGroup(id, { members, ...rest }) {
    if (Object.keys(rest).length) {
      await supabase.from('groups').update(rest).eq('id', id);
    }
    if (members) {
      await supabase.from('group_members').delete().eq('group_id', id);
      if (members.length) {
        await supabase.from('group_members').insert(
          members.map(uid => ({ group_id: id, user_id: uid }))
        );
      }
    }
  },

  async deleteGroup(id) {
    await supabase.from('groups').delete().eq('id', id);
  },

  // ENTRIES
  async getGroupEntries(groupId) {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    return (data || []).map(e => ({
      ...e,
      groupId: e.group_id,
      enteredBy: e.entered_by,
      enteredByName: e.entered_by_name,
      paymentMode: e.payment_mode,
      date: e.created_at,
    }));
  },

  async addEntry({ groupId, title, type, amount, paymentMode, note, enteredBy, enteredByName }) {
    const { data } = await supabase.from('entries').insert({
      group_id: groupId, title, type, amount,
      payment_mode: paymentMode, note,
      entered_by: enteredBy,
      entered_by_name: enteredByName,
    }).select().single();
    return data;
  },

  async updateEntry(id, { title, type, amount, paymentMode, note }) {
    await supabase.from('entries').update({
      title, type, amount, payment_mode: paymentMode, note,
    }).eq('id', id);
  },

  async deleteEntry(id) {
    await supabase.from('entries').delete().eq('id', id);
  },
};
