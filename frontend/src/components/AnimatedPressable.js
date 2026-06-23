import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';

let Haptics;
try { Haptics = require('expo-haptics'); } catch (_) {}

/**
 * Animated press wrapper.
 *
 * Structure:
 *   Animated.View ← gets `style` (layout, background, borderRadius, etc.)
 *     TouchableOpacity (absoluteFillObject) ← invisible, covers entire area
 *     {children} ← rendered above the touchable, taps pass through to it
 *
 * Why: if style contains `width: '100%'`, applying it to a child of a
 * width-less TouchableOpacity creates a circular dependency → width = 0.
 * Putting style on the outer Animated.View resolves this correctly.
 */
export default function AnimatedPressable({
  children,
  style,
  onPress,
  onLongPress,
  scaleTo = 0.96,
  haptic = 'light',
  disabled = false,
  activeOpacity = 0.85,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
    if (haptic && Haptics) {
      try {
        const hapticStyle = {
          light:  Haptics.ImpactFeedbackStyle?.Light,
          medium: Haptics.ImpactFeedbackStyle?.Medium,
          heavy:  Haptics.ImpactFeedbackStyle?.Heavy,
        }[haptic];
        Haptics.impactAsync(hapticStyle);
      } catch (_) {}
    }
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {/* Invisible touchable that covers the whole area */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={activeOpacity}
        disabled={disabled}
        {...rest}
      />
      {/* Children render on top — inner touchables (e.g. card buttons) still work */}
      {children}
    </Animated.View>
  );
}
