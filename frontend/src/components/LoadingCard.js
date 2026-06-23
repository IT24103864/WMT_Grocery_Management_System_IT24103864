import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { shadows } from '../theme/styles';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

function Bone({ width, height, borderRadius = 6, style }) {
  return (
    <View style={[{ width, height, borderRadius, backgroundColor: '#e2e8f0' }, style]} />
  );
}

export default function LoadingCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, shadows.medium, { opacity }]}>
      {/* Image area */}
      <Bone width="100%" height={140} borderRadius={0} />

      <View style={styles.content}>
        {/* Category pill */}
        <Bone width={60} height={16} borderRadius={999} />
        {/* Name lines */}
        <Bone width="90%" height={14} style={styles.mt8} />
        <Bone width="65%" height={14} style={styles.mt4} />
        {/* Price */}
        <Bone width={56} height={16} style={styles.mt8} />
        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <Bone width={48} height={12} />
          <Bone width={28} height={28} borderRadius={14} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  content: {
    padding: 12,
  },
  mt8: {
    marginTop: 8,
  },
  mt4: {
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
