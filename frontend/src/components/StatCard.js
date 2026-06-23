import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../theme/styles';

export default function StatCard({ title, value, icon, color = '#2E7D32' }) {
  // Append '20' to produce an 8-digit hex with ~12% opacity for the icon background
  const iconBg = `${color}20`;

  return (
    <View style={[styles.card, shadows.medium]}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      <View style={[styles.bottomAccent, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  bottomAccent: {
    height: 3,
    marginHorizontal: -16,
  },
});
