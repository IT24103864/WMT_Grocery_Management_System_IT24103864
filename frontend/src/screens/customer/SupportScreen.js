import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import api, { getImageUri } from '../../config/api';
import AppHeader from '../../components/AppHeader';
import InputField from '../../components/InputField';
import GreenButton from '../../components/GreenButton';
import StatusBadge from '../../components/StatusBadge';
import { shadows } from '../../theme/styles';

const CATEGORIES = ['Order Issue', 'Payment Issue', 'Delivery Issue', 'Other'];

const QUICK_HELP = [
  { label: 'Order Issue',    icon: 'document-text-outline', color: '#3b82f6' },
  { label: 'Payment Issue',  icon: 'card-outline',          color: '#f59e0b' },
  { label: 'Delivery Issue', icon: 'navigate-outline',      color: '#2E7D32' },
  { label: 'Other',          icon: 'help-circle-outline',   color: '#8b5cf6' },
];

const STATUS_BORDER = { Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#2E7D32' };

const toStatusBadge = (status) => {
  const map = { Open: 'open', 'In Progress': 'inProgress', Resolved: 'resolved' };
  return map[status] || status?.toLowerCase();
};

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function SupportScreen() {
  const [title, setTitle]           = useState('');
  const [category, setCategory]     = useState('');
  const [description, setDescription] = useState('');
  const [issue, setIssue]             = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [tickets, setTickets]       = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/support/my');
      setTickets(data);
    } catch { /* silent */ }
    finally { setLoadingTickets(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchTickets(); }, []));

  const handleSubmit = async () => {
    if (!title || !category || !description) { Alert.alert('Required', 'All fields are required'); return; }
    setSubmitting(true);
    try {
      const payload = { title, category, description };
      if (issue) {
        payload.issueImageBase64 = `data:${issue.mimeType || 'image/jpeg'};base64,${issue.base64}`;
      }
      await api.post('/support', payload);
      setTitle(''); setCategory(''); setDescription(''); setIssue(null);
      setSuccess(true);
      fetchTickets();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={S.container}>
      <AppHeader title="Help & Support" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchTickets(); }}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Quick help chips */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Quick Help</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.quickRow}>
            {QUICK_HELP.map(item => (
              <TouchableOpacity
                key={item.label}
                style={[S.quickCard, shadows.small]}
                onPress={() => setCategory(item.label)}
                activeOpacity={0.8}
              >
                <View style={[S.quickIconWrap, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={S.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* New ticket form */}
        <View style={[S.card, shadows.medium]}>
          <View style={S.cardHeaderRow}>
            <Ionicons name="add-circle-outline" size={20} color="#2E7D32" />
            <Text style={S.cardTitle}>Raise a Ticket</Text>
          </View>

          {success && (
            <View style={S.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#1B5E20" />
              <Text style={S.successText}>Ticket submitted successfully!</Text>
            </View>
          )}

          <InputField
            label="Title"
            placeholder="Brief description of your issue"
            value={title}
            onChangeText={setTitle}
            leftIcon="document-text-outline"
          />

          <Text style={S.fieldLabel}>Category</Text>
          <View style={S.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[S.catChip, category === cat && S.catChipActive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[S.catChipText, category === cat && S.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            label="Description"
            placeholder="Please describe your issue in detail..."
            value={description}
            onChangeText={setDescription}
            leftIcon="chatbubble-outline"
            multiline
            numberOfLines={4}
          />

          <Text style={S.fieldLabel}>issue</Text>
          {issue?.uri ? (
            <TouchableOpacity style={S.imagePreviewWrap} onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
              });
              if (!result.canceled) setIssue(result.assets[0]);
            }} activeOpacity={0.85}>
              <Image source={{ uri: issue.uri }} style={S.imagePreview} />
              <View style={S.imageOverlay}>
                <Ionicons name="camera-outline" size={20} color="#ffffff" />
                <Text style={S.imageOverlayText}>Change Photo</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={S.imagePicker} onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
              });
              if (!result.canceled) setIssue(result.assets[0]);
            }} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={32} color="#94a3b8" />
              <Text style={S.imagePickerText}>Add Photo</Text>
              <Text style={S.imagePickerSub}>Tap to select from gallery</Text>
            </TouchableOpacity>
          )}

          <GreenButton title="Submit Ticket" onPress={handleSubmit} loading={submitting} fullWidth />
        </View>

        {/* My tickets */}
        <View style={S.section}>
          <View style={S.ticketsHeader}>
            <Text style={S.sectionTitle}>My Tickets</Text>
            {tickets.length > 0 && (
              <View style={S.countBadge}>
                <Text style={S.countBadgeText}>{tickets.length}</Text>
              </View>
            )}
          </View>

          {loadingTickets ? (
            <ActivityIndicator color="#2E7D32" style={{ marginTop: 12 }} />
          ) : tickets.length === 0 ? (
            <View style={S.emptyTickets}>
              <Ionicons name="chatbubbles-outline" size={40} color="#C8E6C9" />
              <Text style={S.emptyText}>No tickets raised yet</Text>
            </View>
          ) : (
            tickets.map(ticket => (
              <View
                key={ticket._id}
                style={[S.ticketCard, shadows.small, {
                  borderLeftColor: STATUS_BORDER[ticket.status] || '#94a3b8',
                }]}
              >
                <View style={S.ticketTop}>
                  <Text style={S.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                  <View style={S.catPill}>
                    <Text style={S.catPillText}>{ticket.category}</Text>
                  </View>
                </View>
                <View style={S.ticketMeta}>
                  <StatusBadge status={toStatusBadge(ticket.status)} />
                  <Text style={S.ticketDate}>{fmt(ticket.createdAt)}</Text>
                </View>

                {ticket.issueImage ? (
                  <View style={{ marginTop: 10 }}>
                    <Image source={{ uri: getImageUri(ticket.issueImage) }} style={{ width: '100%', height: 120, borderRadius: 8 }} />
                  </View>
                ) : null}

                {ticket.adminResponse ? (
                  <View style={S.adminReply}>
                    <View style={S.adminReplyHeader}>
                      <Ionicons name="chatbubble-outline" size={14} color="#2E7D32" />
                      <Text style={S.adminReplyLabel}>Admin replied</Text>
                    </View>
                    <Text style={S.adminReplyText}>{ticket.adminResponse}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll:    { padding: 16, paddingBottom: 100 },

  // ── Sections ────────────────────────────────────────
  section:      { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },

  // ── Quick help ──────────────────────────────────────
  quickRow:     { gap: 10, paddingBottom: 4 },
  quickCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: 90,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#0f172a', textAlign: 'center' },

  // ── New ticket card ─────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle:     { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  successText: { color: '#1B5E20', fontWeight: '600', fontSize: 13 },

  fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  catChipActive:     { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  catChipText:       { fontSize: 13, color: '#64748b' },
  catChipTextActive: { color: '#ffffff', fontWeight: '600' },

  imagePreviewWrap: { height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative', marginBottom: 16 },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  imageOverlayText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  imagePicker: { height: 120, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', gap: 6, marginBottom: 16 },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  imagePickerSub:  { fontSize: 12, color: '#94a3b8' },

  // ── My tickets ──────────────────────────────────────
  ticketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },

  emptyTickets: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText:    { fontSize: 14, color: '#64748b' },

  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 8 },
  catPill: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catPillText: { fontSize: 11, color: '#64748b' },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: { fontSize: 12, color: '#94a3b8' },

  adminReply: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  adminReplyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  adminReplyLabel:  { fontSize: 12, fontWeight: 'bold', color: '#2E7D32' },
  adminReplyText:   { fontSize: 13, color: '#1e40af', lineHeight: 18 },
});
