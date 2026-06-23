import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STAGES = ['Order Placed', 'Processing', 'Out for Delivery', 'Delivered'];

const getStageIndex = (status) => {
  if (!status) return 0;
  const normalized = status.toLowerCase();
  const idx = STAGES.findIndex(s => s.toLowerCase() === normalized);
  return idx === -1 ? 0 : idx;
};

// Current stage circle: outer ring pulses scale, inner dot pulses opacity
function CurrentCircle() {
  const outerScale  = useRef(new Animated.Value(1)).current;
  const dotOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(outerScale, { toValue: 1.14, duration: 750, useNativeDriver: true }),
        Animated.timing(outerScale, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.15, duration: 650, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.circle, styles.circleCurrent, { transform: [{ scale: outerScale }] }]}>
      <Animated.View style={[styles.pulsingDot, { opacity: dotOpacity }]} />
    </Animated.View>
  );
}

// Animated connector line: cross-fades from gray → green when completed
function ConnectorLine({ isDone, index }) {
  const progress = useRef(new Animated.Value(isDone ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isDone ? 1 : 0,
      duration: 500,
      delay: index * 120,
      useNativeDriver: false, // opacity on a view with absolute positioning
    }).start();
  }, [isDone]);

  return (
    <View style={[styles.line, styles.lineUpcoming]}>
      <Animated.View
        style={[
          styles.lineFill,
          { opacity: progress },
        ]}
      />
    </View>
  );
}

export default function TrackingProgressBar({ currentStatus }) {
  const currentIndex = getStageIndex(currentStatus);

  return (
    <View style={styles.container}>
      {STAGES.map((stage, index) => {
        const isDone    = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture  = index > currentIndex;

        return (
          <React.Fragment key={stage}>
            <View style={styles.stageColumn}>
              {/* Circle */}
              {isCurrent ? (
                <CurrentCircle />
              ) : (
                <View style={[
                  styles.circle,
                  isDone   && styles.circleDone,
                  isFuture && styles.circleFuture,
                ]}>
                  {isDone
                    ? <Ionicons name="checkmark" size={16} color="#ffffff" />
                    : <Text style={styles.circleNumber}>{index + 1}</Text>
                  }
                </View>
              )}

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isDone    && styles.labelDone,
                  isCurrent && styles.labelCurrent,
                  isFuture  && styles.labelFuture,
                ]}
                numberOfLines={2}
              >
                {stage}
              </Text>
            </View>

            {/* Connector line */}
            {index < STAGES.length - 1 ? (
              <ConnectorLine isDone={isDone} index={index} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  stageColumn: {
    alignItems: 'center',
    width: 68,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: '#2E7D32',
  },
  circleCurrent: {
    backgroundColor: '#E8F5E9',
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  circleFuture: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  circleNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  line: {
    flex: 1,
    height: 3,
    marginTop: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  lineUpcoming: {
    backgroundColor: '#e2e8f0',
  },
  lineFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2E7D32',
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  labelDone:    { color: '#2E7D32', fontWeight: 'bold' },
  labelCurrent: { color: '#0f172a', fontWeight: 'bold' },
  labelFuture:  { color: '#94a3b8' },
});
