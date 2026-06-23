import React from 'react';
import { Text, ActivityIndicator, StyleSheet } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import { customerColors } from '../theme/colors';
import { shadows } from '../theme/styles';

export default function GreenButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  isAdmin = false,
}) {
  const containerStyle = [
    styles.base,
    variant === 'outline' ? styles.outline
      : variant === 'danger' ? styles.danger
      : isAdmin ? styles.adminPrimary
      : styles.primary,
    variant === 'primary' || isAdmin ? shadows.medium : null,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ];

  const textStyle = variant === 'outline' ? styles.outlineText : styles.whiteText;
  const spinnerColor = variant === 'outline' ? customerColors.primary : '#ffffff';

  return (
    <AnimatedPressable
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      haptic="medium"
    >
      {loading
        ? <ActivityIndicator color={spinnerColor} size="small" />
        : <Text style={textStyle}>{title}</Text>
      }
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  primary: {
    backgroundColor: '#2E7D32',
  },
  adminPrimary: {
    backgroundColor: '#1B5E20',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: customerColors.primary,
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  whiteText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  outlineText: {
    color: customerColors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
