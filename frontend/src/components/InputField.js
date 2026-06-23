import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerColors } from '../theme/colors';
import { shadows } from '../theme/styles';

export default function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  leftIcon,
  rightIcon,
  onRightPress,
  multiline = false,
  numberOfLines = 1,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[
        styles.inputContainer,
        shadows.small,
        focused && styles.focusedBorder,
        error && styles.errorBorder,
        multiline && styles.multilineContainer,
      ]}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? customerColors.primary : '#94a3b8'}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
        />

        {rightIcon ? (
          onRightPress ? (
            <TouchableOpacity onPress={onRightPress} style={styles.rightIcon} activeOpacity={0.6}>
              <Ionicons name={rightIcon} size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : (
            <Ionicons name={rightIcon} size={18} color="#94a3b8" style={styles.rightIcon} />
          )
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  multilineContainer: {
    height: undefined,
    minHeight: 50,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  focusedBorder: {
    borderColor: customerColors.primary,
  },
  errorBorder: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
});
