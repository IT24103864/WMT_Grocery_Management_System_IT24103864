import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Alert, RefreshControl, ScrollView,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api, { getImageUri } from '../../config/api';
import AppHeader from '../../components/AppHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import InputField from '../../components/InputField';
import GreenButton from '../../components/GreenButton';
import EmptyState from '../../components/EmptyState';
import { shadows } from '../../theme/styles';

const TABS     = ['Open', 'In Progress', 'Resolved'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];

const STATUS_BORDER = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#2E7D32' };
const STATUS_BADGE  = { Open: 'open', 'In Progress': 'inProgress', Resolved: 'resolved' };

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const AVATAR_COLORS = ['#1B5E20', '#1d4ed8', '#7c3aed', '#b45309', '#be123c'];
const avatarColor  = (name) => {
  if (!name) return '#94a3b8';
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
};
const initials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export default function AdminSupportScreen() {
  const [tickets, setTickets]       = useState([]);
  const [tab, setTab]               = useState('Open');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]           = useState(false);
  const [selected, setSelected]     = useState(null);
  const [response, setResponse]     = useState('');
  const [status, setStatus]         = useState('Open');
  const [saving, setSaving]         = useState(false);

  const fetchTickets = async () => {
    try { const { data } = await api.get('/support'); setTickets(data); }
    catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchTickets(); }, []));

  const visible      = tickets.filter(t => t.status === tab);
  const openCount    = tickets.filter(t => t.status === 'Open').length;
  const inProgCount  = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCnt  = tickets.filter(t => t.status === 'Resolved').length;

  const openRespond = (ticket) => {
    setSelected(ticket);
    setResponse(ticket.adminResponse || '');
    setStatus(ticket.status);
    setModal(true);
  };

  const handleSend = async () => {
    setSaving(true);
    try {
      await api.put(`/support/${selected._id}/respond`, { adminResponse: response });
      await api.put(`/support/${selected._id}/status`,  { status });
      setModal(false);
      fetchTickets();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send response');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/support/${id}`);
          fetchTickets();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete ticket');
        }
      }}
    ]);
  };

  const renderTicket = ({ item }) => {
    const name        = item.customerId?.name || 'Customer';
    const hasResponse = !!item.adminResponse;

    return (
      <View style={[S.card, shadows.small, { borderLeftColor: STATUS_BORDER[item.status] || '#94a3b8' }]}>
        {/* Unresponded dot */}
        {!hasResponse && <View style={S.unrepliedDot} />}

        {/* Customer row */}
        <View style={S.customerRow}>
          <View style={[S.avatar, { backgroundColor: avatarColor(name) }]}>
            <Text style={S.avatarText}>{initials(name)}</Text>
          </View>
          <View style={S.customerInfo}>
            <Text style={S.customerName}>{name}</Text>
            <Text style={S.ticketDate}>{fmt(item.createdAt)}</Text>
          </View>
          <StatusBadge status={STATUS_BADGE[item.status] || 'open'} />
        </View>

        {/* Title + category */}
        <View style={S.titleRow}>
          <Text style={S.ticketTitle} numberOfLines={1}>{item.title}</Text>
          <View style={S.catPill}>
            <Text style={S.catText}>{item.category}</Text>
          </View>
        </View>

        {/* Description preview */}
        <Text style={S.descPreview} numberOfLines={1}>{item.description}</Text>

        {item.issueImage ? (
          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '700', marginBottom: 4 }}>Issue Image</Text>
            <Image source={{ uri: getImageUri(item.issueImage) }} style={{ width: '100%', height: 120, borderRadius: 8 }} />
          </View>
        ) : null}

        {/* Actions */}
        <View style={S.actionRow}>
          <TouchableOpacity style={S.respondBtn} onPress={() => openRespond(item)} activeOpacity={0.8}>
            <Ionicons name="chatbubble-outline" size={14} color="#ffffff" />
            <Text style={S.respondBtnText}>{hasResponse ? 'Edit Response' : 'Respond'}</Text>
          </TouchableOpacity>
          {item.status === 'Resolved' && (
            <TouchableOpacity style={S.deleteBtn} onPress={() => handleDelete(item._id)} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
              <Text style={S.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={S.container}>
      <AppHeader isAdmin title="Customer Support" subtitle="Manage support tickets" />

      {/* Stats */}
      <View style={S.statsRow}>
        <StatCard title="Open"        value={openCount}   icon="alert-circle-outline"    color="#ef4444" />
        <StatCard title="In Progress" value={inProgCount} icon="time-outline"             color="#f59e0b" />
        <StatCard title="Resolved"    value={resolvedCnt} icon="checkmark-circle-outline" color="#2E7D32" />
      </View>

      {/* Tabs */}
      <View style={S.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={S.tab} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[S.tabText, tab === t && S.tabTextActive]}>{t}</Text>
            {tab === t && <View style={S.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={S.center}><ActivityIndicator size="large" color="#1B5E20" /></View>
      ) : visible.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No Tickets" subtitle={`No ${tab.toLowerCase()} support tickets`} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={i => i._id}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTickets(); }} colors={['#1B5E20']} />}
          renderItem={renderTicket}
        />
      )}

      {/* Respond modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={S.overlay}
        >
          <View style={S.modalCard}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Respond to Ticket</Text>
              <TouchableOpacity onPress={() => setModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Ticket read-only info */}
              {selected && (
                <View style={S.ticketInfo}>
                  <View style={S.ticketInfoHeader}>
                    <Text style={S.ticketInfoLabel}>From</Text>
                    <Text style={S.ticketInfoValue}>{selected.customerId?.name || 'Customer'}</Text>
                  </View>
                  <View style={S.ticketInfoHeader}>
                    <Text style={S.ticketInfoLabel}>Category</Text>
                    <Text style={S.ticketInfoValue}>{selected.category}</Text>
                  </View>
                  <View style={S.ticketInfoHeader}>
                    <Text style={S.ticketInfoLabel}>Date</Text>
                    <Text style={S.ticketInfoValue}>{fmt(selected.createdAt)}</Text>
                  </View>
                  <Text style={S.ticketInfoSubject}>{selected.title}</Text>
                  <Text style={S.ticketInfoDesc}>{selected.description}</Text>
                  {selected.issueImage ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Attached Image</Text>
                      <Image source={{ uri: getImageUri(selected.issueImage) }} style={{ width: '100%', height: 140, borderRadius: 8 }} />
                    </View>
                  ) : null}
                </View>
              )}

              <View style={S.dividerRow}>
                <View style={S.dividerLine} />
                <Text style={S.dividerLabel}>Your Response</Text>
                <View style={S.dividerLine} />
              </View>

              <InputField
                label="Response"
                placeholder="Write your response to the customer..."
                value={response}
                onChangeText={setResponse}
                leftIcon="chatbubble-outline"
                multiline
                numberOfLines={5}
              />

              <Text style={S.modalLabel}>Update Status</Text>
              <View style={S.statusRow}>
                {STATUSES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[S.statusBtn, status === s && S.statusBtnActive]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[S.statusBtnText, status === s && S.statusBtnTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <GreenButton title="Send Response" onPress={handleSend} loading={saving} fullWidth isAdmin />

              <TouchableOpacity style={S.closeLink} onPress={() => setModal(false)} activeOpacity={0.7}>
                <Text style={S.closeLinkText}>Close without saving</Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  list:      { paddingHorizontal: 16, paddingBottom: 100 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 12,
  },
  tab: { paddingVertical: 12, marginRight: 24, position: 'relative' },
  tabText:       { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#1B5E20' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2.5, backgroundColor: '#1B5E20', borderRadius: 999,
  },

  // ── Ticket card ─────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    position: 'relative',
  },
  unrepliedDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  ticketDate:   { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a', flex: 1, marginRight: 8 },
  catPill: {
    backgroundColor: '#ffffff', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  catText:     { fontSize: 11, color: '#64748b' },
  descPreview: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  respondBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1B5E20', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  respondBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fee2e2', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#fecaca',
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },

  // ── Modal ───────────────────────────────────────────
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },

  ticketInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ticketInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketInfoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  ticketInfoValue: { fontSize: 12, color: '#0f172a', fontWeight: '600' },
  ticketInfoSubject: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 8, marginBottom: 6 },
  ticketInfoDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  dividerLine:  { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },

  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  statusRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusBtn: {
    flex: 1, height: 40, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center',
  },
  statusBtnActive:     { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  statusBtnText:       { fontSize: 12, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  statusBtnTextActive: { color: '#ffffff' },

  closeLink:     { alignItems: 'center', marginTop: 14 },
  closeLinkText: { fontSize: 13, color: '#94a3b8' },
});
