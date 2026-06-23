import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api, { getImageUri } from '../../config/api';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import TrackingProgressBar from '../../components/TrackingProgressBar';
import { shadows } from '../../theme/styles';

const fmtTs = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function TrackingScreen({ route }) {
  const [records, setRecords]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestedOrderId = route.params?.orderId;

  const fetchTracking = async () => {
    try {
      const { data } = await api.get('/tracking/my');
      setRecords(data);
      const requestedRecord = requestedOrderId
        ? data.find(record => record.orderId?._id === requestedOrderId || record.orderId === requestedOrderId)
        : null;
      setSelected(currentSelected => {
        if (requestedRecord) return requestedRecord;
        if (data.length > 0 && !currentSelected) return data[0];
        return currentSelected;
      });
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchTracking(); }, [requestedOrderId]));

  const activeRecord = records.find(r => r._id === selected?._id) || selected;
  const history = [...(activeRecord?.trackingHistory || [])].reverse();

  if (!loading && records.length === 0) {
    return (
      <View style={S.flex}>
        <AppHeader title="Track My Order" />
        <EmptyState
          icon="navigate-outline"
          title="No Active Deliveries"
          subtitle="Your tracking information will appear here once an order is shipped"
        />
      </View>
    );
  }

  return (
    <View style={S.flex}>
      <AppHeader title="Track My Order" />

      {loading ? (
        <View style={S.center}>
          <Ionicons name="navigate-outline" size={48} color="#C8E6C9" />
          <Text style={S.loadingText}>Loading tracking info...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTracking(); }}
              colors={['#2E7D32']}
            />
          }
        >
          {/* Order selector pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.pillRow}
          >
            {records.map(rec => {
              const isSelected = selected?._id === rec._id;
              const id = rec.orderId?._id?.slice(-6).toUpperCase() || rec._id.slice(-6).toUpperCase();
              return (
                <TouchableOpacity
                  key={rec._id}
                  style={[S.pill, isSelected && S.pillActive]}
                  onPress={() => setSelected(rec)}
                  activeOpacity={0.75}
                >
                  <Text style={[S.pillText, isSelected && S.pillTextActive]}>#{id}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activeRecord && (
            <View style={S.content}>
              {/* Main tracking card */}
              <View style={[S.card, shadows.medium]}>
                <View style={S.cardHeaderRow}>
                  <Text style={S.cardTitle}>Current Status</Text>
                  <StatusBadge status={activeRecord.currentStatus} />
                </View>

                {activeRecord.currentLocation ? (
                  <View style={S.infoRow}>
                    <View style={S.infoIconWrap}>
                      <Ionicons name="location" size={16} color="#2E7D32" />
                    </View>
                    <View>
                      <Text style={S.infoLabel}>Current Location</Text>
                      <Text style={S.infoValue}>{activeRecord.currentLocation}</Text>
                    </View>
                  </View>
                ) : null}

                {activeRecord.estimatedDelivery ? (
                  <View style={S.infoRow}>
                    <View style={S.infoIconWrap}>
                      <Ionicons name="calendar-outline" size={16} color="#2E7D32" />
                    </View>
                    <View>
                      <Text style={S.infoLabel}>Estimated Delivery</Text>
                      <Text style={S.infoValue}>{fmtDate(activeRecord.estimatedDelivery)}</Text>
                    </View>
                  </View>
                ) : null}

                {activeRecord.confirmationImage ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[S.infoLabel, { marginBottom: 6 }]}>Delivery Confirmation</Text>
                    <Image source={{ uri: getImageUri(activeRecord.confirmationImage) }} style={{ width: '100%', height: 160, borderRadius: 8 }} />
                  </View>
                ) : null}

                {/* Progress bar */}
                <View style={S.progressWrap}>
                  <TrackingProgressBar currentStatus={activeRecord.currentStatus} />
                </View>
              </View>

              {/* Tracking history */}
              {history.length > 0 && (
                <View style={[S.card, shadows.medium]}>
                  <Text style={S.cardTitle}>Tracking History</Text>
                  <View style={S.timeline}>
                    {history.map((entry, idx) => (
                      <View key={idx} style={S.timelineItem}>
                        {/* Vertical line */}
                        {idx < history.length - 1 && <View style={S.timelineLine} />}
                        {/* Dot */}
                        <View style={[S.dot, idx === 0 && S.dotActive]} />
                        {/* Content */}
                        <View style={S.timelineContent}>
                          <Text style={[S.entryStatus, idx === 0 && S.entryStatusActive]}>
                            {entry.status}
                          </Text>
                          {entry.location ? (
                            <Text style={S.entryLocation}>{entry.location}</Text>
                          ) : null}
                          {entry.note ? (
                            <Text style={S.entryNote}>"{entry.note}"</Text>
                          ) : null}
                          <Text style={S.entryTime}>{fmtTs(entry.timestamp)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 24 }} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: '#ffffff' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748b' },
  content:     { paddingHorizontal: 16, paddingBottom: 100 },

  // ── Order pills ─────────────────────────────────────
  pillRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  pill: {
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  pillActive:     { backgroundColor: '#2E7D32' },
  pillText:       { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  pillTextActive: { color: '#ffffff' },

  // ── Cards ───────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },

  progressWrap: { marginTop: 4 },

  // ── Timeline ────────────────────────────────────────
  timeline:     { paddingLeft: 8 },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 16,
    bottom: -20,
    width: 2,
    backgroundColor: '#E8F5E9',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C8E6C9',
    marginTop: 2,
    flexShrink: 0,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  dotActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#1B5E20',
  },
  timelineContent: { flex: 1, paddingLeft: 14 },
  entryStatus:       { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  entryStatusActive: { color: '#0f172a' },
  entryLocation:     { fontSize: 13, color: '#64748b', marginTop: 2 },
  entryNote:         { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 },
  entryTime:         { fontSize: 11, color: '#94a3b8', marginTop: 4 },
});
