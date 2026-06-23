import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, ActivityIndicator, Alert, RefreshControl,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import api, { getImageUri } from '../../config/api';
import AppHeader from '../../components/AppHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import TrackingProgressBar from '../../components/TrackingProgressBar';
import GreenButton from '../../components/GreenButton';
import InputField from '../../components/InputField';
import EmptyState from '../../components/EmptyState';
import { shadows } from '../../theme/styles';

const TABS = ['All', 'In Transit', 'Delivered'];

const STATUS_OPTIONS = [
  { label: 'Order Placed',     icon: 'bag-handle-outline',      color: '#3b82f6' },
  { label: 'Processing',       icon: 'business-outline',        color: '#f59e0b' },
  { label: 'Out for Delivery', icon: 'bicycle-outline',         color: '#f97316' },
  { label: 'Delivered',        icon: 'checkmark-circle-outline', color: '#2E7D32' },
];

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtTs = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function AdminTrackingScreen() {
  const [records, setRecords]       = useState([]);
  const [tab, setTab]               = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]           = useState(false);
  const [selected, setSelected]     = useState(null);
  const [status, setStatus]         = useState('');
  const [location, setLocation]     = useState('');
  const [note, setNote]             = useState('');
  const [image, setImage]           = useState(null);
  const [saving, setSaving]         = useState(false);

  const fetchRecords = async () => {
    try { const { data } = await api.get('/tracking'); setRecords(data); }
    catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchRecords(); }, []));

  const visible = records.filter(r => {
    if (tab === 'Delivered')  return r.currentStatus === 'Delivered';
    if (tab === 'In Transit') return r.currentStatus !== 'Delivered';
    return true;
  });

  const inTransitCount = records.filter(r => r.currentStatus !== 'Delivered').length;
  const deliveredCount = records.filter(r => r.currentStatus === 'Delivered').length;

  const openUpdate = (rec) => {
    setSelected(rec);
    setStatus(rec.currentStatus);
    setLocation(rec.currentLocation || '');
    setNote('');
    setImage(null);
    setModal(true);
  };

  const handleUpdate = async () => {
    if (!status || !location) { Alert.alert('Required', 'Status and location are required'); return; }
    setSaving(true);
    try {
      const payload = { status, location, note };
      if (image && status === 'Delivered') {
        const mime = image.mimeType || 'image/jpeg';
        payload.confirmationImageBase64 = `data:${mime};base64,${image.base64}`;
      }
      await api.put(`/tracking/${selected.orderId?._id || selected.orderId}/status`, payload);
      setModal(false);
      fetchRecords();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update tracking');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this tracking record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/tracking/${id}`);
          fetchRecords();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete tracking');
        }
      }}
    ]);
  };

  const renderRecord = ({ item }) => {
    const orderId      = item.orderId?._id?.slice(-6).toUpperCase() || item._id.slice(-6).toUpperCase();
    const customerName = item.customerId?.name || 'Customer';

    return (
      <View style={[S.card, shadows.small]}>
        {/* Header */}
        <View style={S.cardTop}>
          <View style={S.cardTopLeft}>
            <Text style={S.orderId}>#{orderId}</Text>
            <Text style={S.customerName}>{customerName}</Text>
          </View>
          <StatusBadge status={(item.currentStatus || '').toLowerCase().replace(/ /g, '')} />
        </View>

        {/* Progress bar (compact) */}
        <View style={S.progressWrap}>
          <TrackingProgressBar currentStatus={item.currentStatus} />
        </View>

        {/* Location + timestamp */}
        {item.currentLocation ? (
          <View style={S.infoRow}>
            <Ionicons name="location-outline" size={13} color="#2E7D32" />
            <Text style={S.locationText}>{item.currentLocation}</Text>
          </View>
        ) : null}
        <Text style={S.updatedText}>Last updated: {fmtTs(item.updatedAt)}</Text>

        {item.confirmationImage ? (
          <View style={{ marginTop: 10, marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '700', marginBottom: 4 }}>Confirmation Image</Text>
            <Image source={{ uri: getImageUri(item.confirmationImage) }} style={{ width: '100%', height: 120, borderRadius: 8 }} />
          </View>
        ) : null}

        {/* Actions */}
        <View style={S.actionRow}>
          <TouchableOpacity style={S.updateBtn} onPress={() => openUpdate(item)} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color="#ffffff" />
            <Text style={S.updateBtnText}>Update Status</Text>
          </TouchableOpacity>
          {item.currentStatus === 'Delivered' && (
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
      <AppHeader isAdmin title="Delivery Tracking" subtitle="Monitor all deliveries" />

      {/* Stats */}
      <View style={S.statsRow}>
        <StatCard title="Total"      value={records.length} icon="navigate-outline"         color="#1B5E20" />
        <StatCard title="In Transit" value={inTransitCount} icon="bicycle-outline"          color="#f97316" />
        <StatCard title="Delivered"  value={deliveredCount} icon="checkmark-circle-outline" color="#2E7D32" />
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
        <EmptyState icon="navigate-outline" title="No Records" subtitle={`No ${tab.toLowerCase()} deliveries`} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={i => i._id}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecords(); }} colors={['#1B5E20']} />}
          renderItem={renderRecord}
        />
      )}

      {/* Update tracking modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={S.overlay}
        >
          <View style={S.modalCard}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Update Tracking</Text>
              <TouchableOpacity onPress={() => setModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={S.modalLabel}>Select Status</Text>
              <View style={S.statusGrid}>
                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[S.statusCard, status === opt.label && S.statusCardActive]}
                    onPress={() => setStatus(opt.label)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={status === opt.label ? '#1B5E20' : opt.color}
                    />
                    <Text style={[S.statusCardLabel, status === opt.label && S.statusCardLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <InputField
                label="Current Location"
                placeholder="e.g. Warehouse, City Name"
                value={location}
                onChangeText={setLocation}
                leftIcon="location-outline"
              />
              <InputField
                label="Note (optional)"
                placeholder="e.g. Attempted delivery, left at door..."
                value={note}
                onChangeText={setNote}
                leftIcon="document-text-outline"
                multiline
                numberOfLines={3}
              />
              
              {status === 'Delivered' && (
                <View style={S.imagePickerSection}>
                  <Text style={S.modalLabel}>confirmation</Text>
                  {image?.uri ? (
                    <TouchableOpacity style={S.imagePreviewWrap} onPress={async () => {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
                      });
                      if (!result.canceled) setImage(result.assets[0]);
                    }} activeOpacity={0.85}>
                      <Image source={{ uri: image.uri }} style={S.imagePreview} />
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
                      if (!result.canceled) setImage(result.assets[0]);
                    }} activeOpacity={0.8}>
                      <Ionicons name="camera-outline" size={32} color="#94a3b8" />
                      <Text style={S.imagePickerText}>Add Photo</Text>
                      <Text style={S.imagePickerSub}>Tap to select from gallery</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <GreenButton title="Update Tracking" onPress={handleUpdate} loading={saving} fullWidth isAdmin />
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

  // ── Tracking card ───────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTopLeft:   {},
  orderId:       { fontSize: 13, fontWeight: 'bold', color: '#0f172a', letterSpacing: 0.5 },
  customerName:  { fontSize: 12, color: '#64748b', marginTop: 2 },
  progressWrap:  { marginVertical: 4, marginHorizontal: -6 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  locationText:  { fontSize: 13, color: '#0f172a', fontWeight: '600', flex: 1 },
  updatedText:   { fontSize: 11, color: '#94a3b8', marginBottom: 10 },
  actionRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  updateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1B5E20', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  updateBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statusCard: {
    width: '47%',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  statusCardActive:      { borderColor: '#1B5E20', backgroundColor: '#ffffff' },
  statusCardLabel:       { fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' },
  statusCardLabelActive: { color: '#1B5E20' },

  imagePickerSection: { marginBottom: 16 },
  imagePreviewWrap: {
    height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8,
  },
  imageOverlayText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  imagePicker: {
    height: 120, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff', gap: 6,
  },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  imagePickerSub:  { fontSize: 12, color: '#94a3b8' },
});
