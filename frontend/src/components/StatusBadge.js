import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { statusColors } from '../theme/colors';

const STATUS_MAP = {
  'pending':           statusColors.pending,
  'pending confirmation': { background: '#fef3c7', text: '#92400e' },
  'successful':        statusColors.successful,
  'failed':            statusColors.failed,
  'refunded':          statusColors.refunded,
  'open':              statusColors.open,
  'in progress':       statusColors.inProgress,
  'resolved':          statusColors.resolved,
  'cancelled':         statusColors.cancelled,
  'delivered':         statusColors.delivered,
  'out for delivery':  statusColors.outForDelivery,
  'order placed':      { background: '#E8F5E9', text: '#1B5E20' },
  'sent to facility':  { background: '#fef3c7', text: '#92400e' },
};

export default function StatusBadge({ status }) {
  if (!status) return null;

  const key = status.toLowerCase();
  const colors = STATUS_MAP[key] || { background: '#f8f8f8', text: '#64748b' };

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
