import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ICONS = {
  success: { name: 'checkmark-circle',  color: '#ffffff', bg: '#2E7D32' },
  error:   { name: 'alert-circle',       color: '#ffffff', bg: '#ef4444' },
  info:    { name: 'information-circle', color: '#ffffff', bg: '#3b82f6' },
};

export default function Toast({ visible, message, type = 'success' }) {
  const anim = useRef(new Animated.Value(0)).current;
  const config = ICONS[type] || ICONS.success;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[S.container, { backgroundColor: config.bg, transform: [{ translateY }], opacity }]}
    >
      <Ionicons name={config.name} size={20} color={config.color} />
      <Text style={S.text}>{message}</Text>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
