import React, { useContext } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
  Platform, StyleSheet, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);

export default function AppHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  onBack,
  isAdmin = false,
  rightIconScale,
  rightIconBadge,
}) {
  const { logout } = useContext(AuthContext);

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const rightIconEl = rightIconScale ? (
    <Animated.View style={{ transform: [{ scale: rightIconScale }] }}>
      <Ionicons name={rightIcon} size={22} color="#1a1a1a" />
    </Animated.View>
  ) : (
    <Ionicons name={rightIcon} size={22} color="#1a1a1a" />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.inner}>

        {/* Left — back button OR title */}
        {onBack ? (
          <View style={styles.backRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
            </TouchableOpacity>
            <View style={styles.backTitles}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
          </View>
        ) : (
          <View style={styles.left}>
            {isAdmin && (
              <View style={styles.adminTag}>
                <Text style={styles.adminTagText}>ADMIN</Text>
              </View>
            )}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        )}

        {/* Right — icons */}
        <View style={styles.rightGroup}>
          <TouchableOpacity style={styles.iconBtn} onPress={confirmLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#64748b" />
          </TouchableOpacity>
          {rightIcon ? (
            <TouchableOpacity
              style={[styles.iconBtn, styles.iconBtnRelative]}
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              {rightIconEl}
              {rightIconBadge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{rightIconBadge > 9 ? '9+' : rightIconBadge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  backRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  backTitles: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  adminTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnRelative: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f1f1',
  },
});
